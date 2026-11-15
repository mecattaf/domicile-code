import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import assert from 'node:assert/strict';
import { connectSession, snapshot } from './session.mjs';

const names = ['url', 'endpoint', 'target', 'out', 'revision', 'wtype', 'sway-display'];
const { values } = parseArgs({ options: Object.fromEntries(names.map(name => [name, { type: 'string' }])) });
for (const name of names) assert(values[name], `Required: --${name}`);
assert.equal((await readFile('/proc/1/comm', 'utf8')).trim(), 'bwrap', 'Use a fresh disposable runtime-test namespace');
assert(/^wayland-[0-9]+$/.test(values['sway-display']));
assert((await stat(join(process.env.XDG_RUNTIME_DIR, values['sway-display']))).isSocket());
const url = new URL(values.url);
assert(url.protocol === 'http:' && ['127.0.0.1','localhost'].includes(url.hostname));
const idle = async () => {
  const source = await fetch(new URL('/state',url)).then(response => response.json());
  assert.equal(source.owner,null,'Do not interrupt an input owner');
  assert.equal(source.targetId,values.target);
};
await idle();
const out=resolve(values.out); await mkdir(out);
const receipt={ at:new Date().toISOString(), revision:values.revision, result:'fail', method:'wtype virtual keyboard on the explicitly selected private Sway host; real Wayland delivery into Domicile; no CDP keyboard injection', keys:[] };
const session=await connectSession(values.endpoint,values.target);
const run=promisify(execFile);
const chords=[
  ['Plain A','a',[],'KeyA'],
  ['Ctrl+W','w',['ctrl'],'KeyW'],['Ctrl+N','n',['ctrl'],'KeyN'],['Ctrl+T','t',['ctrl'],'KeyT'],
  ['Ctrl+Tab','Tab',['ctrl'],'Tab'],['Ctrl+Shift+Tab','Tab',['ctrl','shift'],'Tab'],
  ['F11','F11',[],'F11'],['Ctrl+R','r',['ctrl'],'KeyR'],['Alt+Left','Left',['alt'],'ArrowLeft'],
];
try {
  receipt.before=await snapshot(session.page);
  assert.equal(receipt.before.mode, 'key-delivery-repro', 'The sender only operates on the disposable minimal probe');
  await session.page.waitForFunction(()=>window.domicileCodeProof?.snapshot().mode==='key-delivery-repro');
  const scene=(await snapshot(session.page)).sceneId;
  for (const [label,key,modifiers,code] of chords) {
    await idle();
    const start=(await snapshot(session.page)).events.length;
    // wtype synthesizes a keymap; its physical DOM code is not the intended
    // symbol. Qualify logical chords and retain the actual code separately.
    const expectedKey = key === 'Left' ? 'ArrowLeft' : key;
    const args=['-s','500',...modifiers.flatMap(modifier=>['-M',modifier]),'-P',key,'-p',key,...[...modifiers].reverse().flatMap(modifier=>['-m',modifier]),'-s','500'];
    receipt.attempted = { label, args, at: new Date().toISOString() };
    await run(values.wtype,args,{env:{...process.env,WAYLAND_DISPLAY:values['sway-display']},timeout:5000});
    await session.page.waitForFunction(({start,expectedKey})=>window.domicileCodeProof.snapshot().events.slice(start).some(event=>event.key===expectedKey&&event.type==='keyup'),{start,expectedKey},{timeout:5000});
    const state=await snapshot(session.page); assert.equal(state.sceneId,scene,'The chord reloaded the shell');
    const events=state.events.slice(start); const down=events.find(event=>event.key===expectedKey&&event.type==='keydown');
    assert(down?.trusted,'A real trusted Wayland event was not observed');
    for (const modifier of ['ctrl','shift','alt','meta']) assert.equal(down[modifier],modifiers.includes(modifier),`${label} modifier mismatch`);
    receipt.keys.push({label,args,expectedLogicalKey:expectedKey,referencePhysicalCode:code,result:'delivered',events});
  }
  receipt.source={targetId:values.target,sceneId:scene,viewport:await session.page.evaluate(()=>({width:innerWidth,height:innerHeight,devicePixelRatio}))};
  await session.page.screenshot({path:resolve(out,'delivered.png')});
  receipt.result='pass';
} catch(error) {receipt.error=String(error.stack??error);process.exitCode=1;try{receipt.failedProbe=await snapshot(session.page);await session.page.screenshot({path:resolve(out,'failed-probe.png')});}catch(captureError){receipt.failedCaptureError=String(captureError);}}
finally {
  await writeFile(resolve(out, 'receipt.json'), JSON.stringify(receipt, null, 2) + '\n');
  await session.browser.close();
}
console.log(JSON.stringify({ result: receipt.result, keys: receipt.keys.map(item => item.label), error: receipt.error }));
