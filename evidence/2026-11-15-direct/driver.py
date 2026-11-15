#!/usr/bin/env python3
"""One owned direct headless Domicile, always inside runtime-test."""
import datetime, json, os, pathlib, re, signal, socket, subprocess, sys, time, urllib.request

repo, binary, shell_dir, run_name, mode, port = sys.argv[1:]
run = pathlib.Path(run_name)
node = '/nix/store/j1j9b0w3mhpccdli73ycj5w7nf6fkzqz-nodejs-24.21.0/bin/node'
assert pathlib.Path('/proc/1/comm').read_text().strip() == 'bwrap'
assert any(' /run/user ' in x and ' - tmpfs ' in x for x in pathlib.Path('/proc/self/mountinfo').read_text().splitlines())
assert run.is_relative_to('/tmp') and run != pathlib.Path('/tmp')
run.mkdir(mode=0o700)
env = os.environ.copy()
for key in ('WAYLAND_DISPLAY','DISPLAY','SWAYSOCK','DOMICILE_SOCK','DBUS_SESSION_BUS_ADDRESS'):
    env.pop(key,None)
for key,name in [('XDG_CONFIG_HOME','config'),('XDG_CACHE_HOME','cache'),('XDG_STATE_HOME','state')]:
    (run/name).mkdir(); env[key]=str(run/name)
env.update(OZONE='headless',DOMICILE_SHELLS=shell_dir,DOMICILE_ENGINE_ARGS=f'--remote-debugging-port={port} --remote-debugging-address=127.0.0.1 --no-sandbox')
empty = run/'config/empty.json'; empty.write_text('{}\n')
children=[]; streams=[]
receipt={'startedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'backend':'OZONE=headless','hostCompositor':None,'composition':'software by upstream headless design','mode':mode,'status':'starting'}
def save(): (run/'run.json').write_text(json.dumps(receipt,indent=2)+'\n')
def spawn(name,args,child_env):
    stream=(run/(name+'.log')).open('wb'); streams.append(stream)
    p=subprocess.Popen(args,env=child_env,cwd=repo,stdout=stream,stderr=stream,start_new_session=True); children.append(p); return p
def get(url):
    with urllib.request.urlopen(url,timeout=2) as r: return json.load(r)
def wait(fn,seconds=60):
    end=time.monotonic()+seconds
    while time.monotonic()<end:
        if desk.poll() is not None: raise RuntimeError('Domicile exited '+str(desk.returncode))
        try:
            value=fn()
            if value:return value
        except (OSError,ValueError,KeyError):pass
        time.sleep(.2)
    raise RuntimeError('Readiness timeout')
def check(name,args,child_env):
    r=subprocess.run(args,cwd=repo,env=child_env,capture_output=True,text=True,timeout=70)
    (run/(name+'.stdout.txt')).write_text(r.stdout); (run/(name+'.stderr.txt')).write_text(r.stderr)
    receipt[name]={'returncode':r.returncode}; save()
    return r
def stop(*_): raise KeyboardInterrupt
signal.signal(signal.SIGTERM,stop); signal.signal(signal.SIGINT,stop)
save()
try:
    desk=spawn('domicile',[binary,'@domicile-desktop/shell','--config',str(empty)],env)
    endpoint=f'http://127.0.0.1:{port}'
    def owned():
        matches=re.findall(r'^DevTools listening on (ws://127\.0\.0\.1:'+port+r'/devtools/browser/[a-f0-9-]+)$',(run/'domicile.log').read_text(errors='replace'),re.M)
        if len(set(matches))!=1:return None
        remote=get(endpoint+'/json/version')['webSocketDebuggerUrl']
        if remote!=matches[0]:raise RuntimeError('Debugger ownership mismatch')
        return remote
    receipt['browserWebSocket']=wait(owned)
    def target():
        matches=[p['id'] for p in get(endpoint+'/json/list') if p.get('type')=='page' and p.get('url')=='domicile://shell/']
        return matches[0] if len(matches)==1 else None
    target_id=wait(target)
    text=(run/'domicile.log').read_text(errors='replace')
    ipc=re.findall(r'^DOMICILE_SOCK=(/run/user/[0-9]+/domicile-ipc\.[0-9]+\.sock)$',text,re.M)
    display=re.findall(r' INFO domicile_compositor: domicile-compositor: apps connect here \(WAYLAND_DISPLAY\) display="(wayland-[0-9]+)"$',text,re.M)
    assert len(set(ipc))==len(set(display))==1
    app_env={**env,'DOMICILE_SOCK':ipc[0],'WAYLAND_DISPLAY':display[0],'GDK_BACKEND':'wayland','GSK_RENDERER':'cairo'}
    receipt.update(endpoint=endpoint,targetId=target_id,status='ready');save()
    print(json.dumps(receipt),flush=True)
    common=['--endpoint',endpoint,'--target',target_id]
    if mode=='capture':
        spawn('native',['/nix/store/798pfsmmkgpzggn1a8j1apq1p9jj9zq4-zenity-4.2.2/bin/zenity','--entry','--title=Domicile direct native fixture','--text=Direct Domicile, no Sway','--entry-text=Native pixels'],app_env)
        check('capture',[node,'scripts/check-capture.mjs',*common,'--domicile',binary,'--out',str(run/'capture')],app_env)
    elif mode=='isolation':
        check('isolation',[node,'scripts/check-isolation.mjs',*common,'--out',str(run/'isolation'),'--revision','1557378783d6bf7c94a5c093f3fe42804652a540','--expect','unavailable','--worker-expect','error','--reload'],app_env)
    else:
        mlog=(run/'monitor.log').open('wb'); streams.append(mlog)
        monitor=subprocess.Popen([binary,'monitor','code-test','1440x900'],env=app_env,cwd=repo,stdin=subprocess.PIPE,stdout=mlog,stderr=mlog,start_new_session=True);children.append(monitor)
        time.sleep(3)
        target_id=wait(target)
        common=['--endpoint',endpoint,'--target',target_id]
        receipt['targetId']=target_id;receipt['targetReacquiredAfterMonitor']=True;save()
        spawn('native',['/nix/store/798pfsmmkgpzggn1a8j1apq1p9jj9zq4-zenity-4.2.2/bin/zenity','--entry','--title=Domicile Code native fixture','--text=A real Wayland text field','--entry-text=Native pixels'],app_env)
        outputs=json.loads(check('displays',[binary,'list-displays','--json'],app_env).stdout)
        assert len(outputs)==1
        spawn('viewer',[node,'tools/viewer/server.mjs',*common,'--output',outputs[0]['name'],'--port','8799','--log',str(run/'viewer-events.jsonl')],env)
        wait(lambda:get('http://127.0.0.1:8799/state'))
        revision='1557378783d6bf7c94a5c093f3fe42804652a540'
        check('query',[node,'scripts/check-state-query-live.mjs',*common,'--url','http://127.0.0.1:8799','--domicile',binary,'--socket',ipc[0],'--out',str(run/'query'),'--revision',revision],app_env)
        check('floating',[node,'scripts/check-floating.mjs',*common,'--url','http://127.0.0.1:8799','--out',str(run/'floating'),'--revision',revision],app_env)
        check('observe',[node,'scripts/observe-session.mjs',*common,'--out',str(run/'observe'),'--revision',revision],app_env)
        check('shell-screenshot',[binary,'screenshot',str(run/'shell-native.png')],app_env)
        load_env={**app_env,'DOMICILE_BUILDER':'/nonexistent/domicile-code-builder'}
        for filename in ['shell.js','control.js']:
            check('classification-'+filename,[binary,'load-shell',str(pathlib.Path(repo)/'repros/import-classification'/filename)],load_env)
    check('displays',[binary,'list-displays','--json'],app_env)
    receipt['status']='measured'
except BaseException as e:
    receipt.update(status='error',error=repr(e));print(repr(e),flush=True)
finally:
    for p in reversed(children):
        if p.poll() is None:
            try: os.killpg(p.pid,signal.SIGTERM);p.wait(timeout=8)
            except ProcessLookupError:pass
            except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()
    receipt['childrenExitCodes']=[p.returncode for p in children]
    receipt['endedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat()
    receipt['retainedDumps']=[str(p.relative_to(run)) for p in run.rglob('*.dmp')]
    save()
    for s in streams:s.close()
    print(json.dumps(receipt),flush=True)
