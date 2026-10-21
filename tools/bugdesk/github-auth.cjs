'use strict';
const https = require('node:https');
const clientId = '0120e057bd645470c1ed'; // Git Credential Manager's public device-flow client.

function request(url, body, token) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {'User-Agent':'CFOR-BugDesk', Accept:'application/json'};
    if (payload) Object.assign(headers, {'Content-Type':'application/json', 'Content-Length':Buffer.byteLength(payload)});
    if (token) headers.Authorization = 'Bearer ' + token;
    const req = https.request(url, {method:payload?'POST':'GET', headers}, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const value = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error('GitHub 请求失败（' + res.statusCode + '）'));
          else resolve(value);
        } catch { reject(new Error('GitHub 返回了无效内容')); }
      });
    });
    req.setTimeout(15000, () => req.destroy(new Error('GitHub 连接超时，请稍后重试')));
    req.on('error', () => reject(new Error('暂时无法连接 GitHub，请检查网络')));
    req.end(payload);
  });
}

module.exports = function createAuth(send = request) {
  let accessToken = '', device = null, timer, closed = false;
  let state = {state:'idle', message:'推送前需授权 GitHub，或使用本机已有的 Git 凭据。'};
  function publicState() { return {...state}; }
  function schedule(seconds) {
    clearTimeout(timer);
    if (!closed) { timer = setTimeout(poll, seconds*1000); timer.unref?.(); }
  }
  function resume(d) {
    if (!d.device_code || !d.user_code || !d.expires_in) throw new Error('GitHub 登录信息无效');
    device = {...d, interval:Math.max(5,d.interval||5), expiresAt:Date.now()+d.expires_in*1000};
    state = {state:'pending', message:'请在 GitHub 设备授权页面输入验证码并确认授权。', userCode:d.user_code, verificationUri:'https://github.com/login/device', expiresAt:device.expiresAt};
    schedule(device.interval);
    return publicState();
  }
  async function start() {
    if (state.state === 'pending' || state.state === 'ready') return publicState();
    const d = await send('https://github.com/login/device/code', {client_id:clientId, scope:'repo'});
    return resume(d);
  }
  async function poll() {
    if (!device || closed) return;
    if (Date.now() >= device.expiresAt) {
      device = null; state = {state:'expired', message:'验证码已过期，请重新登录 GitHub。'}; return;
    }
    try {
      const result = await send('https://github.com/login/oauth/access_token', {client_id:clientId, device_code:device.device_code, grant_type:'urn:ietf:params:oauth:grant-type:device_code'});
      if (result.access_token) {
        // Keep access tokens in memory only; never send them to the page or write to disk.
        const user = await send('https://api.github.com/user', null, result.access_token);
        const repo = await send('https://api.github.com/repos/qiangluis/cfor-bugs', null, result.access_token);
        if (!repo.permissions?.push) {
          state = {state:'denied', message:'账号 ' + user.login + ' 没有此仓库的推送权限，请使用具有写权限的账号。'};
        } else {
          accessToken = result.access_token;
          state = {state:'ready', login:user.login, message:'已连接 GitHub：' + user.login + '，已确认仓库写入权限。'};
        }
        device = null; return;
      }
      if (result.error === 'slow_down') device.interval += 5;
      else if (result.error !== 'authorization_pending') {
        device = null; state = {state:'denied', message:'GitHub 授权未完成，请重新登录。'}; return;
      }
    } catch {
      state.message = '正在等待 GitHub 授权；网络暂时中断时会自动重试。';
    }
    if (device) schedule(device.interval);
  }
  function gitEnv(base) {
    if (!accessToken) return {...base};
    const env = {...base}, offset = Number(env.GIT_CONFIG_COUNT || 0);
    const config = [
      ['credential.helper',''],
      ['http.https://github.com/.extraheader', 'AUTHORIZATION: basic ' + Buffer.from('x-access-token:'+accessToken).toString('base64')]
    ];
    config.forEach(([key,value],i) => {
      env['GIT_CONFIG_KEY_' + (offset+i)] = key;
      env['GIT_CONFIG_VALUE_' + (offset+i)] = value;
    });
    env.GIT_CONFIG_COUNT = String(offset+config.length);
    return env;
  }
  return {state:publicState, start, resume, gitEnv, close:()=>{closed=true;clearTimeout(timer);accessToken='';device=null;}};
};
