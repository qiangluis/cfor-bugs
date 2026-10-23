'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const net = require('node:net');
const {execFileSync,spawn} = require('node:child_process');
const {randomUUID} = require('node:crypto');
const {localAddresses} = require('./lan-access.cjs');
const root = path.resolve('work/lan-test-' + Date.now());
const repo = path.join(root,'repo');
const remote = path.join(root,'remote.git');
const gitExe = path.resolve(path.dirname(process.execPath),'../../native/git/cmd/git.exe');
const address = localAddresses()[0]?.address;
assert(address,'A LAN interface is required for this integration test');
function git(args,cwd=repo) { return execFileSync(gitExe,args,{cwd,encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024}).trim(); }
function freePort(host) { return new Promise((resolve,reject) => { const s=net.createServer();s.once('error',reject);s.listen(0,host,()=>{const p=s.address().port;s.close(()=>resolve(p));}); }); }
const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=';
let backend,gateway,browser,stderr='';
async function main() {
  fs.mkdirSync(repo,{recursive:true});
  git(['init','--bare',remote],root);git(['init','-b','main']);
  git(['config','user.name','LAN Test']);git(['config','user.email','lan-test@localhost']);
  fs.writeFileSync(path.join(repo,'BUG-LIST.md'),'# Test Bugs\n');
  git(['add','.']);git(['commit','-m','initial']);git(['remote','add','origin',remote]);git(['push','-u','origin','main']);
  const port=await freePort(address);
  backend=spawn(process.execPath,[path.join(__dirname,'lan-access.cjs'),'--start-backend','--address',address,'--repo',repo,'--port',String(port)],{windowsHide:true,env:{...process.env,BUGDESK_GIT:gitExe},stdio:['ignore','pipe','pipe']});
  backend.stderr.on('data',c=>stderr+=c);
  await new Promise((resolve,reject)=>{let output='';backend.stdout.on('data',c=>{output+=c;if(output.includes('BugDesk LAN:'))resolve();});backend.once('error',reject);backend.once('exit',code=>reject(new Error('backend exited '+code)));});
  const base='http://'+address+':'+port;
  const html=await(await fetch(base)).text();
  const token=html.match(/name="bugdesk-token" content="([^"]+)"/)[1];
  async function request(route,data,headers={}) {
    const response=await fetch(base+route,data===undefined?{headers}:{method:'POST',headers:{'Content-Type':'application/json','X-Bugdesk-Token':token,Origin:base,...headers},body:JSON.stringify(data)});
    return {status:response.status,...await response.json()};
  }
  assert.equal((await request('/api/status')).ok,true);
  const badHost=await new Promise((resolve,reject)=>{const r=http.get({host:address,port,path:'/',headers:{Host:'untrusted.example:'+port}},res=>{res.resume();resolve(res.statusCode)});r.once('error',reject);});
  assert.equal(badHost,403);
  assert.equal((await request('/api/check-push',{}, {Origin:'http://untrusted.example'})).status,403);
  assert.equal((await request('/api/check-push',{}, {'X-Bugdesk-Token':'invalid'})).status,403);
  assert.equal((await request('/api/check-push',{}, {'Sec-Fetch-Site':'cross-site'})).status,403);
  const payload={id:randomUUID(),title:'局域网提交与截图测试',priority:'P2',description:'同一局域网通过入口提交',images:[{data:image}]};
  const submitted=await request('/api/submit',payload);assert.equal(submitted.ok,true,JSON.stringify(submitted));
  const state=JSON.parse(fs.readFileSync(path.join(repo,'.git/bugdesk',payload.id+'.json'),'utf8'));
  assert.deepEqual(fs.readFileSync(path.join(repo,state.files[2])),Buffer.from(image.split(',')[1],'base64'));
  const head=git(['rev-parse','HEAD']);assert.equal(git(['rev-parse','main'],remote),head);
  assert.equal((await request('/api/submit',payload)).ok,true);assert.equal(git(['rev-parse','HEAD']),head);
  const two=[{...payload,id:randomUUID(),title:'并发甲'},{...payload,id:randomUUID(),title:'并发乙'}];
  const simultaneous=await Promise.all(two.map(p=>request('/api/submit',p)));
  assert.equal(simultaneous.filter(r=>r.ok).length,1);
  const blocked=simultaneous.findIndex(r=>r.status===409);assert(blocked>=0);
  assert.equal((await request('/api/submit',two[blocked])).ok,true);
  assert.equal((await request('/api/status')).pending.length,0);
  console.log('PASS: LAN HTTP, Host/Origin/CSRF checks, screenshot bytes, local remote push, deduplication and concurrent submit retry.');
  const {chromium}=require(path.resolve(path.dirname(process.execPath),'../node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core'));
  browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  const a=await browser.newContext(),b=await browser.newContext();
  const page=await a.newPage(),other=await b.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));other.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await other.goto(base);
  assert.equal(await page.evaluate(()=>isSecureContext),false);
  assert.equal(await page.evaluate(()=>typeof crypto.randomUUID),'undefined');
  await page.locator('#title').fill('同事甲的草稿');await page.locator('#description').fill('HTTP 下可填写、贴图、预览并提交');
  await page.locator('#files').setInputFiles({name:'screenshot.png',mimeType:'image/png',buffer:Buffer.from(image.split(',')[1],'base64')});
  await page.waitForFunction(()=>document.getElementById('draft').textContent.includes('已自动保存'));
  await other.locator('#title').fill('同事乙的草稿');await other.locator('#description').fill('草稿独立保存');
  await other.waitForFunction(()=>document.getElementById('draft').textContent.includes('已自动保存'));
  await page.reload();await other.reload();
  await page.waitForFunction(()=>document.getElementById('title').value==='同事甲的草稿');
  await other.waitForFunction(()=>document.getElementById('title').value==='同事乙的草稿');
  assert.equal(await page.locator('#images img').count(),1);assert.equal(await other.locator('#images img').count(),0);
  await page.locator('#preview').click();assert((await page.locator('#markdown').textContent()).includes('同事甲的草稿'));await page.locator('#close-preview').click();
  await page.locator('#submit').click();await page.waitForFunction(()=>document.getElementById('result').textContent.includes('已提交并推送'));
  assert.equal(await page.locator('#title').inputValue(),'');assert.equal(await other.locator('#title').inputValue(),'同事乙的草稿');
  await page.locator('#history-tab').click();await page.locator('.file').first().waitFor();
  assert.deepEqual(errors,[]);assert.equal(git(['status','--porcelain']),'');assert.equal(git(['rev-parse','HEAD']),git(['rev-parse','main'],remote));
  console.log('PASS: Real LAN browser in insecure HTTP context, UUID fallback, independent drafts, image, preview, submit, reset and document list.');
  await page.locator('#new-tab').click();
  await page.locator('#title').fill('网络中断后自动重试');await page.locator('#description').fill('同一报告不重复创建');
  let requests=[];
  await page.route('**/api/submit',async route=>{
    requests.push(route.request().postDataJSON());
    if(requests.length===1)return route.fulfill({json:{ok:false,saved:true,message:'报告已保存',detail:'fatal: unable to access GitHub: Recv failure: Connection was reset'}});
    return route.continue();
  });
  let commits=Number(git(['rev-list','--count','HEAD']));
  await page.locator('#submit').click();await page.waitForFunction(()=>document.getElementById('result').textContent.includes('自动重试'));await page.waitForFunction(()=>document.getElementById('result').textContent.includes('已提交并推送'));
  assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1]);assert.equal(Number(git(['rev-list','--count','HEAD'])),commits+1);
  await page.unroute('**/api/submit');requests=[];
  await page.locator('#title').fill('推送成功但响应丢失');await page.locator('#description').fill('重试后仅保留一次提交');
  await page.route('**/api/submit',async route=>{
    requests.push(route.request().postDataJSON());
    if(requests.length===1){const response=await route.fetch();assert.equal((await response.json()).ok,true);return route.abort('connectionreset');}
    return route.continue();
  });
  commits=Number(git(['rev-list','--count','HEAD']));
  await page.locator('#submit').click();await page.waitForFunction(()=>document.getElementById('result').textContent.includes('自动重试'));await page.waitForFunction(()=>document.getElementById('result').textContent.includes('已经推送'));
  assert.equal(requests.length,2);assert.deepEqual(requests[0],requests[1]);assert.equal(Number(git(['rev-list','--count','HEAD'])),commits+1);
  await page.unroute('**/api/submit');requests=[];
  await page.locator('#title').fill('保留失败草稿');await page.locator('#description').fill('重试耗尽时不清空草稿');
  await page.route('**/api/submit',route=>{requests.push(route.request().postDataJSON());return route.fulfill({json:{ok:false,message:'网络连接失败',detail:'Failed to connect to github.com port 443'}});});
  await page.locator('#submit').click();await page.waitForFunction(()=>document.getElementById('result').textContent==='网络连接失败');await page.waitForFunction(()=>!document.getElementById('submit').disabled);
  assert.equal(requests.length,3);assert(requests.every(p=>JSON.stringify(p)===JSON.stringify(requests[0])));assert.equal(await page.locator('#title').inputValue(),'保留失败草稿');
  await page.unroute('**/api/submit');
  for(const detail of ['Authentication failed: HTTP 401','rejected (fetch first); RPC failed: Connection was reset','仓库里还有未提交的修改']){
    requests=[];await page.route('**/api/submit',route=>{requests.push(route.request().postDataJSON());return route.fulfill({json:{ok:false,message:'操作失败',detail}});});
    await page.locator('#submit').click();await page.waitForFunction(expected=>document.getElementById('detail').textContent===expected,detail);await page.waitForFunction(()=>!document.getElementById('submit').disabled);assert.equal(requests.length,1);await page.unroute('**/api/submit');
  }
  assert.deepEqual(errors,[]);assert.equal(git(['status','--porcelain']),'');
  console.log('PASS: Transient retry, lost response deduplication, bounded attempts, failed draft retention, and no retries for auth, remote updates or dirty repository.');
}
main().catch(e=>{console.error(e,stderr);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();if(gateway){gateway.close();gateway.closeAllConnections();}if(backend)backend.kill();});
