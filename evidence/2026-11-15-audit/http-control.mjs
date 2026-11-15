import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';

const repo = '/tmp/domicile-code-fresh-20261115';
const out = '/tmp/domicile-code-worker-http-no-isolation-20261115';
assert.equal((await readFile('/proc/1/comm','utf8')).trim(), 'bwrap');
assert((await readFile('/proc/self/mountinfo','utf8')).split('\n').some(line => line.includes(' /run/user ') && line.includes(' - tmpfs ')));
await mkdir(out, { mode: 0o700 });
const root = resolve(repo,'repros/isolation');
const files = new Map();
for (const [url,name] of [['/','index.html'],['/shell/probe.js','shell/probe.js'],['/shell/worker.js','shell/worker.js']]) {
  const bytes = await readFile(resolve(root,name));
  files.set(url,{name,bytes,mime:name.endsWith('.html')?'text/html':'text/javascript'});
}
const requests = [];
const server = createServer((request,response) => {
  const pathname = new URL(request.url,'http://127.0.0.1:5187').pathname;
  const file = files.get(pathname);
  if (request.headers.host !== '127.0.0.1:5187' || request.method !== 'GET' || !file) {response.writeHead(404);response.end();return;}
  const headers={'Content-Type':file.mime,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  requests.push({path:pathname,headers});
  response.writeHead(200,headers);response.end(file.bytes);
});
const receipt={at:new Date().toISOString(),result:'fail',source:'same checked fixture bytes, HTTP without COOP/COEP',port:5187,sourceFiles:[...files.values()].map(file=>({file:file.name,sha256:createHash('sha256').update(file.bytes).digest('hex')})),requests};
let child;
try {
  await new Promise((accept,reject)=>{server.once('error',reject);server.listen(5187,'127.0.0.1',accept);});
  const args=['scripts/check-isolation.mjs','--url','http://127.0.0.1:5187/','--chromium','/nix/store/kcyyd65nz8kqyxbmh5yql6frd7mh0v18-chromium-151.0.7922.71/bin/chromium','--expect','unavailable','--worker-expect','message','--out',out+'/check','--revision','Code cb023b02243ad34f8702153656dc134fbcec003b; non-isolated HTTP control'];
  receipt.command={executable:process.execPath,args};
  child=spawn(process.execPath,args,{cwd:repo,stdio:['ignore','pipe','pipe']});
  let stdout='',stderr='';child.stdout.on('data',bytes=>stdout+=bytes);child.stderr.on('data',bytes=>stderr+=bytes);
  const timer=setTimeout(()=>child.kill('SIGTERM'),40000);
  const status=await new Promise((accept,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>accept({code,signal}));});clearTimeout(timer);
  await writeFile(out+'/stdout.txt',stdout);await writeFile(out+'/stderr.txt',stderr);
  receipt.child=status;assert.equal(status.code,0);
  const probe=JSON.parse(await readFile(out+'/check/receipt.json','utf8'));
  assert.equal(probe.capability.crossOriginIsolated,false);assert.equal(probe.capability.sharedArrayBufferType,'undefined');
  assert.deepEqual(probe.capability.workers.map(worker=>worker.result),['message','message']);
  assert(probe.capability.workers.every(worker=>worker.worker.receivedSharedBuffer===false));
  receipt.result='pass';receipt.capability=probe.capability;
} catch(error) {receipt.error=String(error.stack??error);process.exitCode=1;}
finally {if(child&&child.exitCode===null)child.kill('SIGTERM');await new Promise(accept=>server.close(accept));server.closeAllConnections();await writeFile(out+'/receipt.json',JSON.stringify(receipt,null,2)+'\n');console.log(JSON.stringify({result:receipt.result,out,error:receipt.error}));}
