'use strict';
const https = require('node:https');
const clientId = '0120e057bd645470c1ed'; // Git Credential Manager's public device-flow client.
const targetRepo = 'qiangluis/cfor-bugs';

function request(url, body, token, method) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {'User-Agent':'CFOR-BugDesk', Accept:'application/json'};
    if (payload) Object.assign(headers, {'Content-Type':'application/json', 'Content-Length':Buffer.byteLength(payload)});
    if (token) headers.Authorization = 'Bearer ' + token;
    const req = https.request(url, {method:method || (payload?'POST':'GET'), headers}, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        clearTimeout(deadline);
        if (res.statusCode >= 400) return reject(new Error('GitHub 请求失败（' + res.statusCode + '）'));
        if (res.statusCode === 204) return resolve({});
        try { resolve(JSON.parse(data)); }
        catch { reject(new Error('GitHub 返回了无效内容')); }
      });
    });
    const deadline = setTimeout(() => req.destroy(new Error('GitHub 连接超时，请稍后重试')), 20000);
    deadline.unref?.();
    req.on('error', () => { clearTimeout(deadline); reject(new Error('暂时无法连接 GitHub，请检查网络')); });
    req.end(payload);
  });
}

module.exports = function createAuth(send = request) {
  let accessToken = '', candidate = '', device = null, invitation = null, timer, closed = false;
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
  async function findInvitation(login) {
    for (let page=1;page<=10;page++) {
      const invitations = await send('https://api.github.com/user/repository_invitations?per_page=100&page='+page, null, candidate);
      if (!Array.isArray(invitations)) return null;
      const found = invitations.find(i => i.repository?.full_name?.toLowerCase()===targetRepo && i.invitee?.login?.toLowerCase()===login.toLowerCase());
      if (found) return found;
      if (invitations.length<100) return null;
    }
    return null;
  }
  async function verify() {
    if (!candidate) return publicState();
    const user = await send('https://api.github.com/user', null, candidate);
    const repo = await send('https://api.github.com/repos/'+targetRepo, null, candidate);
    if (closed) return publicState();
    if (repo.permissions?.push) {
      accessToken=candidate;invitation=null;
      state={state:'ready',login:user.login,message:'已连接 GitHub：'+user.login+'，已确认仓库写入权限。'};
    } else {
      accessToken='';
      invitation=await findInvitation(user.login);
      state=invitation
        ? {state:'invited',login:user.login,repository:targetRepo,message:'找到发给 '+user.login+' 的仓库协作者邀请，可点击“接受仓库邀请”。'}
        : {state:'denied',login:user.login,message:'账号 '+user.login+' 暂无仓库写入权限，也未找到待接受邀请。请确认所有者邀请的账号后重新检查。'};
    }
    return publicState();
  }
  async function start() {
    if (state.state==='pending') return publicState();
    if (candidate) return verify();
    const d=await send('https://github.com/login/device/code',{client_id:clientId,scope:'repo'});
    return resume(d);
  }
  async function poll() {
    if (!device || closed) return;
    if (Date.now()>=device.expiresAt && !candidate) {
      device=null;state={state:'expired',message:'验证码已过期，请重新登录 GitHub。'};return;
    }
    try {
      if (!candidate) {
        const result=await send('https://github.com/login/oauth/access_token',{client_id:clientId,device_code:device.device_code,grant_type:'urn:ietf:params:oauth:grant-type:device_code'});
        if (result.access_token) candidate=result.access_token;
        else if (result.error==='slow_down') device.interval+=5;
        else if (result.error!=='authorization_pending') {
          device=null;state={state:'denied',message:'GitHub 授权未完成，请重新登录。'};return;
        }
      }
      if (candidate) { await verify();device=null;return; }
    } catch {
      state.message='正在等待 GitHub 授权；网络暂时中断时会自动重试。';
    }
    if(device)schedule(device.interval);
  }
  async function acceptInvitation() {
    if (!candidate) throw new Error('请先连接 GitHub 账号');
    await verify();
    if (state.state==='ready') return publicState();
    if (!invitation) throw new Error('没有找到 '+targetRepo+' 的待接受邀请，请确认所有者邀请的账号。');
    await send('https://api.github.com/user/repository_invitations/'+encodeURIComponent(invitation.id), null, candidate, 'PATCH');
    return verify();
  }
  function gitEnv(base) {
    if(!accessToken)return {...base};
    const env={...base},offset=Number(env.GIT_CONFIG_COUNT||0);
    const config=[
      ['credential.helper',''],
      ['http.https://github.com/.extraheader','AUTHORIZATION: basic '+Buffer.from('x-access-token:'+accessToken).toString('base64')]
    ];
    config.forEach(([key,value],i)=>{env['GIT_CONFIG_KEY_'+(offset+i)]=key;env['GIT_CONFIG_VALUE_'+(offset+i)]=value});
    env.GIT_CONFIG_COUNT=String(offset+config.length);return env;
  }
  return {state:publicState,start,resume,gitEnv,verify,acceptInvitation,close:()=>{closed=true;clearTimeout(timer);accessToken='';candidate='';device=null;invitation=null;}};
};
