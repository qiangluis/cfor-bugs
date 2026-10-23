'use strict';
const http = require('node:http');
const os = require('node:os');
const {isIPv4} = require('node:net');

function privateIPv4(address) {
  if (!isIPv4(address)) return false;
  const [a,b] = address.split('.').map(Number);
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}
function localAddresses() {
  return Object.entries(os.networkInterfaces()).flatMap(([name,items]) => items
    .filter(i => i.family === 'IPv4' && !i.internal && privateIPv4(i.address))
    .map(i => ({name,address:i.address})))
    .sort((a,b) => Number(/virtual|vethernet|vpn|vmware|wsl|docker|tailscale|zerotier/i.test(a.name)) - Number(/virtual|vethernet|vpn|vmware|wsl|docker|tailscale|zerotier/i.test(b.name)));
}
function createGateway({address,port,targetPort=port}) {
  if (!localAddresses().some(i => i.address === address)) throw new Error('请选择本机当前的局域网 IPv4 地址');
  for (const p of [port,targetPort]) if (!Number.isInteger(p) || p < 1 || p > 65535) throw new Error('端口无效');
  const authority = address + ':' + port;
  const origin = 'http://' + authority;
  const upstream = '127.0.0.1:' + targetPort;
  function reject(res,status,message) {
    res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(JSON.stringify({ok:false,message}));
  }
  const server = http.createServer((req,res) => {
    const peer = (req.socket.remoteAddress || '').replace(/^::ffff:/,'');
    if (!privateIPv4(peer) && peer !== '127.0.0.1') return reject(res,403,'仅支持局域网访问');
    if (req.headers.host !== authority) return reject(res,403,'请使用本机局域网地址访问');
    if (req.headers.origin && req.headers.origin !== origin) return reject(res,403,'来源无效');
    if (req.headers['sec-fetch-site'] === 'cross-site') return reject(res,403,'来源无效');
    if (!['GET','POST','HEAD'].includes(req.method)) return reject(res,405,'不支持此请求方法');
    if (!req.url?.startsWith('/') || req.url.startsWith('//')) return reject(res,400,'请求地址无效');
    const headers = {...req.headers,host:upstream};
    delete headers.forwarded;
    delete headers['x-forwarded-host'];
    delete headers['x-forwarded-for'];
    if (headers.origin) headers.origin = 'http://' + upstream;
    const proxy = http.request({hostname:'127.0.0.1',port:targetPort,path:req.url,method:req.method,headers,timeout:120000}, incoming => {
      res.writeHead(incoming.statusCode,incoming.headers);
      incoming.on('error',() => res.destroy());
      incoming.pipe(res);
    });
    proxy.on('timeout',() => proxy.destroy(new Error('upstream timeout')));
    proxy.on('error',() => {
      if (!res.headersSent) reject(res,502,'工作台服务暂时不可用，请在主机上检查启动窗口');
      else res.destroy();
    });
    req.on('aborted',() => proxy.destroy());
    res.on('close',() => { if (!res.writableFinished) proxy.destroy(); });
    req.pipe(proxy);
  });
  return server;
}
if (require.main === module) {
  const args = process.argv.slice(2);
  function option(key,fallback) { const i = args.indexOf(key); return i < 0 ? fallback : args[i+1]; }
  const address = option('--address',localAddresses()[0]?.address);
  if (!address) { console.error('未找到局域网 IPv4 地址，请先连接网络'); process.exit(1); }
  const port = Number(option('--port','3212'));
  const targetPort = Number(option('--target-port',String(port)));
  const startBackend = args.includes('--start-backend');
  const server = createGateway({address,port,targetPort});
  if (startBackend) {
    if (targetPort !== port) throw new Error('启动工作台时两个端口必须一致');
    require('./bugdesk-server.cjs');
    process.on('SIGINT',() => process.emit('SIGTERM'));
  }
  server.on('error',e => { console.error('局域网入口启动失败：' + e.message); process.exitCode = 1; });
  server.listen(port,address,() => console.log('BugDesk LAN: http://' + address + ':' + port + '/'));
  function close() { server.close(() => { if (!startBackend) process.exit(0); }); server.closeIdleConnections(); }
  process.on('SIGTERM',close);
  if (!startBackend) process.on('SIGINT',close);
}
module.exports = {createGateway,localAddresses};
