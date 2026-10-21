'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const {execFile} = require('node:child_process');
const {randomUUID, randomBytes} = require('node:crypto');

const argv = process.argv.slice(2);
function option(key, fallback) { const i = argv.indexOf(key); return i < 0 ? fallback : argv[i + 1]; }
const repo = path.resolve(option('--repo', path.join(__dirname, '..', '..')));
const port = Number(option('--port', '3212'));
const bundledGit = path.resolve(path.dirname(process.execPath), '..', '..', 'native', 'git', 'cmd', 'git.exe');
const gitExe = process.env.BUGDESK_GIT || (fs.existsSync(bundledGit) ? bundledGit : 'git');
const stateDir = path.join(repo, '.git', 'bugdesk');
const csrf = randomBytes(24).toString('hex');
let busy = false;
let activeChildren = new Set();

function git(args, timeout = 90000) {
  return new Promise(resolve => {
    const child = execFile(gitExe, ['-c', 'http.sslBackend=openssl', '-c', 'http.lowSpeedLimit=1', '-c', 'http.lowSpeedTime=30', '-C', repo, ...args], {
      windowsHide: true, timeout, maxBuffer: 8 * 1024 * 1024,
      env: {...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never'}
    }, (error, stdout, stderr) => {
      activeChildren.delete(child);
      resolve({ok: !error, output: [stdout, stderr].filter(Boolean).join('\n').trim(), code: error?.code || 0});
    });
    activeChildren.add(child);
  });
}
function respond(res, status, data) {
  res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
  res.end(JSON.stringify(data));
}
function fail(message) { throw new Error(message); }
function ensure(result, action) { if (!result.ok) fail(action + '失败：\n' + result.output); return result.output; }
function body(req) {
  return new Promise((resolve, reject) => {
    let chunks = [], size = 0;
    req.on('data', c => { size += c.length; if (size > 30 * 1024 * 1024) { reject(new Error('截图总大小请控制在 20 MB 内')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch { reject(new Error('请求内容无效')); } });
    req.on('error', reject);
  });
}
const exists = p => fs.existsSync(p);
function readState(id) {
  if (!/^[a-f0-9-]{36}$/.test(id || '')) fail('报告标识无效');
  const f = path.join(stateDir, id + '.json');
  return exists(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
function writeState(s) {
  fs.mkdirSync(stateDir, {recursive: true});
  fs.writeFileSync(path.join(stateDir, s.id + '.json'), JSON.stringify(s, null, 2), 'utf8');
}
async function head() { return ensure(await git(['rev-parse', '--verify', 'HEAD']), '读取提交'); }
async function checkRepo() {
  ensure(await git(['rev-parse', '--is-inside-work-tree']), '读取仓库');
  const branch = ensure(await git(['branch', '--show-current']), '读取分支');
  if (branch !== 'main') fail('当前分支是 ' + (branch || '游离状态') + '。请先切换到 main 再操作。');
  for (const name of ['MERGE_HEAD', 'rebase-merge', 'rebase-apply']) {
    if (exists(path.join(repo, '.git', name))) fail('仓库存在未完成的合并或变基，请先处理后再继续。');
  }
}
async function requireClean() {
  const s = await git(['status', '--porcelain']);
  ensure(s, '检查工作区');
  if (s.output) fail('仓库里还有未提交的修改，请先处理后再继续。\n' + s.output);
}
function text(value, max = 50000) { return String(value || '').trim().slice(0, max); }
function reportData(d) {
  const title = text(d.title, 180).replace(/[\r\n]/g, ' ');
  if (!title) fail('请填写 Bug 标题');
  if (!text(d.description) && !text(d.steps)) fail('请填写问题描述或复现步骤');
  const priority = ['P1', 'P2', 'P3'].includes(d.priority) ? d.priority : 'P2';
  const date = new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false}).format(new Date());
  const id = /^[a-f0-9-]{36}$/.test(d.id || '') ? d.id : randomUUID();
  const stem = 'BUG-local-' + date.replace(/[^0-9]/g, '') + '-' + id.slice(0,8);
  const report = stem + '.md';
  const images = Array.isArray(d.images) ? d.images : [];
  if (images.length > 12) fail('每份报告最多添加 12 张截图');
  let bytes = 0;
  const attachments = images.map((im, i) => {
    const match = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(im.data || '');
    if (!match) fail('请使用 PNG、JPG、WebP 或 GIF 图片');
    const buffer = Buffer.from(match[2], 'base64'); bytes += buffer.length;
    if (bytes > 20 * 1024 * 1024) fail('截图总大小不能超过 20 MB');
    const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
    return {file: 'evidence/' + stem + '/screenshot-' + (i+1) + '.' + ext, buffer};
  });
  const lines = ['# ' + title, '', '- **优先级**：' + priority, '- **模块 / 页面**：' + text(d.module,500), '- **测试环境**：' + text(d.env,500), '- **提交时间**：' + date + '（北京时间）', '- **状态**：待修复', '', '## 问题描述', text(d.description), '', '## 复现步骤', text(d.steps), '', '## 实际结果', text(d.actual), '', '## 预期结果', text(d.expected), '', '## 截图', ...attachments.map((im,i) => '![截图 ' + (i+1) + '](' + im.file + ')'), ''];
  return {id, title, date, report, attachments, markdown: lines.join('\n'), data:d};
}
async function saveReport(d) {
  const r = reportData(d);
  await checkRepo(); await requireClean();
  // Block another report until its failed transaction is committed or pushed.
  if (exists(stateDir)) for (const f of fs.readdirSync(stateDir)) {
    const pending = JSON.parse(fs.readFileSync(path.join(stateDir,f),'utf8'));
    if (!pending.pushed && pending.id !== r.id) fail('还有一份报告等待推送，请先点击“重试待推送报告”。');
  }
  const before = await head();
  const list = path.join(repo, 'BUG-LIST.md');
  const old = exists(list) ? fs.readFileSync(list,'utf8') : '# Bug 清单\n';
  const single = v => text(v).replace(/\r?\n/g, '；');
  const entry = '\n\n---\n\n### ' + r.title + '\n- **编号**：' + r.report.slice(0,-3) + '\n- **模块**：' + single(d.module) + '\n- **优先级**：' + r.data.priority + '\n- **描述**：' + single(d.description) + '\n- **复现步骤**：' + single(d.steps) + '\n- **实际结果**：' + single(d.actual) + '\n- **预期结果**：' + single(d.expected) + '\n- **报告**：[' + r.report + '](' + r.report + ')\n- **证据**：' + (r.attachments.map(a=>'['+path.basename(a.file)+']('+a.file+')').join('、') || '无截图') + '\n- **提交时间**：' + r.date + '（北京时间）\n- **状态**：待修复\n';
  const s = {id:r.id, title:r.title, report:r.report, files:[r.report,'BUG-LIST.md',...r.attachments.map(a=>a.file)], base:before, committed:false, pushed:false};
  for (const im of r.attachments) { fs.mkdirSync(path.dirname(path.join(repo,im.file)),{recursive:true}); fs.writeFileSync(path.join(repo,im.file),im.buffer); }
  fs.writeFileSync(path.join(repo,r.report),r.markdown,'utf8');
  fs.writeFileSync(list,old+entry,'utf8');
  writeState(s);
  return s;
}
async function commitAndPush(s) {
  await checkRepo();
  if (s.pushed) return {ok:true, message:'这份报告已经推送，无需重复提交。', report:s.report};
  if (!s.committed) {
    // Recover a successful commit if the process stopped just before saving state.
    const current = await head();
    const subject = await git(['log','-1','--format=%s']);
    if (current !== s.base && subject.output === '报告 Bug：' + s.title) { s.committed=true; s.commit=current; writeState(s); }
    else {
      if (current !== s.base) fail('仓库提交已变化，请检查本地报告后再提交。报告文件：' + s.report);
      const staged = await git(['diff','--cached','--name-only']);
      ensure(staged,'检查暂存区');
      const allowed = new Set(s.files);
      if (staged.output.split(/\r?\n/).filter(Boolean).some(f=>!allowed.has(f))) fail('暂存区存在其他文件，请先处理。报告已保存在本地。');
      ensure(await git(['add','--sparse','--',...s.files]),'暂存报告');
      const commit = await git(['-c','user.name=CFOR BugDesk','-c','user.email=bugdesk@localhost','commit','-m','报告 Bug：' + s.title,'--',...s.files]);
      ensure(commit,'提交报告'); s.committed=true; s.commit=await head(); writeState(s);
    }
  }
  await requireClean();
  const pushed = await git(['push','origin','HEAD:refs/heads/main']);
  if (!pushed.ok) {
    let hint = '报告和截图已保存在本地。可点击“重试待推送报告”，不会重复创建报告。';
    if (/non-fast-forward|fetch first|rejected/.test(pushed.output)) hint += '\n远端有更新：请先拉取，再重试推送。';
    if (/Authentication|could not read|credential|403|Permission|401/i.test(pushed.output)) hint += '\n需要先登录具有仓库写权限的 GitHub 账号。';
    return {ok:false, saved:true, message:hint, detail:pushed.output, report:s.report};
  }
  s.pushed=true; writeState(s);
  return {ok:true, message:'报告、截图和 Bug 清单已提交并推送到 GitHub。', report:s.report, commit:s.commit, detail:pushed.output};
}
async function api(req,res,url) {
  if (req.method==='GET' && url.pathname==='/api/status') {
    const [s,b] = await Promise.all([git(['status','--short','--branch']),git(['branch','--show-current'])]);
    const pending = exists(stateDir) ? fs.readdirSync(stateDir).filter(f=>f.endsWith('.json')).map(f=>JSON.parse(fs.readFileSync(path.join(stateDir,f),'utf8'))).filter(s=>!s.pushed).map(s=>({id:s.id,title:s.title,report:s.report,committed:s.committed})) : [];
    return respond(res,200,{repo,branch:b.output,status:s.output,ok:s.ok,pending});
  }
  if(req.method==='GET' && url.pathname==='/api/files') {
    return respond(res,200,{files:fs.readdirSync(repo).filter(n=>n.endsWith('.md')).sort()});
  }
  if(req.method==='GET' && url.pathname==='/api/read') {
    const name=url.searchParams.get('file');
    if (!name || path.basename(name)!==name || !name.endsWith('.md')) fail('文件路径无效');
    return respond(res,200,{name,markdown:fs.readFileSync(path.join(repo,name),'utf8')});
  }
  if (req.method!=='POST') return respond(res,404,{ok:false,message:'找不到这个操作'});
  if (req.headers['x-bugdesk-token']!==csrf) return respond(res,403,{ok:false,message:'请刷新页面后再操作'});
  if (busy) return respond(res,409,{ok:false,message:'正在同步，请等待当前操作完成'});
  busy=true;
  try {
    if (url.pathname==='/api/pull') {
      await checkRepo(); await requireClean();
      ensure(await git(['pull','--rebase','origin','main']), '拉取');
      return respond(res,200,{ok:true,message:'已拉取远端最新内容。'});
    }
    if (url.pathname==='/api/submit') {
      const d=await body(req);
      const s=d.id ? readState(d.id) : null;
      return respond(res,200,await commitAndPush(s || await saveReport(d)));
    }
    if (url.pathname==='/api/retry') {
      const d=await body(req),s=readState(d.id);
      if(!s) fail('没有找到待推送报告');
      return respond(res,200,await commitAndPush(s));
    }
    return respond(res,404,{ok:false,message:'找不到这个操作'});
  } finally { busy=false; }
}
const server=http.createServer(async(req,res)=>{
  try {
    const host=req.headers.host || '';
    if(!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host)) return respond(res,403,{ok:false,message:'仅支持本地访问'});
    if(req.headers.origin && req.headers.origin!=='http://'+host) return respond(res,403,{ok:false,message:'来源无效'});
    const url=new URL(req.url,'http://'+host);
    if(url.pathname.startsWith('/api/')) return await api(req,res,url);
    if(url.pathname==='/' || url.pathname==='/index.html') {
      const html=fs.readFileSync(path.join(__dirname,'public','index.html'),'utf8').replace('__TOKEN__',csrf);
      res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
      return res.end(html);
    }
    res.writeHead(404);res.end('Not found');
  } catch(e) { respond(res,400,{ok:false,message:e.message}); }
});
server.listen(port,'127.0.0.1',()=>console.log('BugDesk: http://127.0.0.1:'+port+'\nRepo: '+repo));
server.on('error',e=>{console.error(e.message);process.exitCode=1});
process.on('SIGTERM',()=>{for(const c of activeChildren)c.kill();server.close(()=>process.exit(0))});
