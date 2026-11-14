#!/usr/bin/env python3
"""Foreground, isolated nested GPU desktop. Does not install or change services."""
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import socket
import stat
import subprocess
import sys
import time
import urllib.request

REPO = Path(__file__).resolve().parent.parent


def arguments():
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('domicile', 'sway', 'node', 'zenity', 'shell-dir', 'run-dir'):
        p.add_argument('--' + name, required=True)
    p.add_argument('--runtime-test', default=str(Path.home() / '.local/bin/runtime-test'))
    p.add_argument('--render-node', default='/dev/dri/renderD128')
    p.add_argument('--debug-port', type=int, default=9239)
    p.add_argument('--viewer-port', type=int, default=8789)
    p.add_argument('--width', type=int, default=1440)
    p.add_argument('--height', type=int, default=900)
    p.add_argument('--seconds', type=int, default=0, help='Stop after this many ready seconds; 0 waits for Ctrl-C')
    p.add_argument('--capture-repro', action='store_true', help='Measure both capture paths on the minimal repro shell')
    p.add_argument('--no-fixture', action='store_true', help='Start without the optional native entry fixture')
    p.add_argument('--display-source', choices=['cli', 'sdk'], default='cli', help='Use sdk explicitly for older runtimes without list-displays')
    p.add_argument('--inside', action='store_true', help=argparse.SUPPRESS)
    return p.parse_args()


def main():
    args = arguments()
    for name in ('domicile', 'sway', 'node', 'zenity', 'runtime_test'):
        path = Path(getattr(args, name))
        if not path.is_absolute() or not path.is_file() or not os.access(path, os.X_OK):
            raise RuntimeError(f'{name} must name an existing absolute executable')
    if not re.fullmatch(r'/dev/dri/renderD[0-9]+', args.render_node):
        raise RuntimeError('Select one explicit render node')
    for port in (args.debug_port, args.viewer_port):
        if not 1024 < port < 65536:
            raise RuntimeError('Ports must be unprivileged and valid')
    if args.debug_port == args.viewer_port or not 640 <= args.width <= 3840 or not 480 <= args.height <= 2160:
        raise RuntimeError('Invalid ports or prototype geometry')
    if not 0 <= args.seconds <= 21600:
        raise RuntimeError('Duration must be between zero and six hours')
    if args.no_fixture and args.capture_repro:
        raise RuntimeError('The native capture comparison requires its fixture')
    shell_dir = Path(args.shell_dir).resolve()
    shell = shell_dir / 'shell/shell.js'
    if not shell.is_file():
        raise RuntimeError('Build the shell first: shell-dir must contain shell/shell.js')
    run = Path(args.run_dir).absolute()
    if not run.is_relative_to('/tmp') or run == Path('/tmp'):
        raise RuntimeError('The new run directory must be under /tmp')
    if not args.inside:
        # The declared wrapper masks live runtime sockets and gives this run its
        # own PID/IPC namespaces. Its die-with-parent policy also covers SIGKILL.
        os.execv(args.runtime_test, [args.runtime_test, '--allow-gpu', args.render_node, '--',
                                   sys.executable, str(Path(__file__).resolve()), *sys.argv[1:], '--inside'])
    if Path('/proc/1/comm').read_text().strip() != 'bwrap' or not any(
            ' /run/user ' in line and ' - tmpfs ' in line
            for line in Path('/proc/self/mountinfo').read_text().splitlines()):
        raise RuntimeError('The internal entry requires the declared runtime-test isolation')
    runtime = Path(os.environ['XDG_RUNTIME_DIR'])
    if not runtime.is_relative_to('/run/user'):
        raise RuntimeError('Unexpected private runtime path')
    # These bind checks provide early errors; the owned browser UUID below is
    # still required because a port check alone cannot establish ownership.
    for port in (args.debug_port, args.viewer_port):
        with socket.socket() as probe:
            # A recently closed test connection may leave TIME_WAIT behind.
            # Match the servers' reuse policy while still refusing a listener.
            probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            probe.bind(('127.0.0.1', port))
    run.mkdir(mode=0o700, parents=False, exist_ok=False)
    env = os.environ.copy()
    for key in ('DOMICILE_SOCK', 'WAYLAND_DISPLAY', 'SWAYSOCK', 'DISPLAY', 'DBUS_SESSION_BUS_ADDRESS'):
        env.pop(key, None)
    for key, dirname in [('XDG_STATE_HOME', 'state'), ('XDG_CACHE_HOME', 'cache'), ('XDG_CONFIG_HOME', 'config')]:
        (run / dirname).mkdir()
        env[key] = str(run / dirname)
    env.update(WLR_BACKENDS='headless', WLR_LIBINPUT_NO_DEVICES='1', WLR_RENDERER='gles2',
               WLR_RENDER_DRM_DEVICE=args.render_node)
    children, logs = [], []
    status = {'status': 'starting', 'runDir': str(run), 'startedAt': dt.datetime.now(dt.timezone.utc).isoformat(),
              'shellSha256': hashlib.sha256(shell.read_bytes()).hexdigest(), 'children': {}}

    def save():
        temp = run / 'run.json.tmp'
        temp.write_text(json.dumps(status, indent=2) + '\n')
        temp.replace(run / 'run.json')

    def spawn(name, command, child_env, critical=True, stdout_name=None):
        stream = (run / (stdout_name or name + '.log')).open('wb')
        logs.append(stream)
        stderr = stream
        if stdout_name:
            stderr = (run / (name + '.log')).open('wb')
            logs.append(stderr)
        child = subprocess.Popen(command, env=child_env, cwd=REPO, stdout=stream, stderr=stderr, start_new_session=True)
        children.append((name, child, critical))
        status['children'][name] = {'pidInPrivateNamespace': child.pid, 'critical': critical}
        save()
        return child

    def check_children():
        for name, child, critical in children:
            if critical and child.poll() is not None:
                raise RuntimeError(f'{name} exited unexpectedly with rc={child.returncode}; retain {name}.log')

    def wait_for(label, operation, seconds=90):
        end = time.monotonic() + seconds
        last = None
        while time.monotonic() < end:
            check_children()
            try:
                result = operation()
                if result:
                    return result
            except (OSError, ValueError) as error:
                last = str(error)
            time.sleep(0.2)
        raise RuntimeError(f'Timed out waiting for {label}: {last}')

    def read_json(url):
        with urllib.request.urlopen(url, timeout=2) as response:
            return json.load(response)

    def one_match(pattern, text):
        matches = set(re.findall(pattern, text, flags=re.MULTILINE))
        if len(matches) > 1:
            raise RuntimeError(f'Ambiguous readiness record for {pattern}')
        return next(iter(matches), None)

    def stop(signum, frame):
        raise KeyboardInterrupt

    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGINT, stop)
    try:
        config = run / 'sway.conf'
        config.write_text(f'xwayland disable\ndefault_border none\ndefault_floating_border none\noutput * mode {args.width}x{args.height}\nseat seat0 fallback true\n')
        spawn('sway', [args.sway, '--config', str(config), '--unsupported-gpu'], env)

        def sway_socket():
            candidates = [p for p in runtime.glob('wayland-*') if stat.S_ISSOCK(p.stat().st_mode)]
            if len(candidates) > 1:
                raise RuntimeError('More than one host Wayland socket in the private runtime')
            return candidates[0].name if candidates else None

        env['WAYLAND_DISPLAY'] = wait_for('private Sway socket', sway_socket)
        empty = run / 'config/empty.json'
        empty.write_text('{}\n')
        env.update(OZONE='wayland', DOMICILE_SHELLS=str(shell_dir),
                   DOMICILE_ENGINE_ARGS=f'--remote-debugging-port={args.debug_port} --remote-debugging-address=127.0.0.1 --no-sandbox')
        spawn('domicile', [args.domicile, '@domicile-desktop/shell', '--config', str(empty)], env)
        endpoint = f'http://127.0.0.1:{args.debug_port}'

        def owned_browser():
            text = (run / 'domicile.log').read_text(errors='replace')
            owned = one_match(r'^DevTools listening on (ws://127\.0\.0\.1:' + str(args.debug_port) + r'/devtools/browser/[a-f0-9-]+)$', text)
            if not owned:
                return None
            remote = read_json(endpoint + '/json/version')['webSocketDebuggerUrl']
            if remote != owned:
                raise RuntimeError('The HTTP debugger belongs to another browser')
            return owned

        status['browserWebSocket'] = wait_for('owned browser UUID', owned_browser)

        def shell_target():
            pages = [p for p in read_json(endpoint + '/json/list') if p.get('type') == 'page' and p.get('url') == 'domicile://shell/']
            if len(pages) > 1:
                raise RuntimeError('The owned browser has ambiguous shell targets')
            return pages[0]['id'] if pages else None

        target = wait_for('unique shell target', shell_target)
        runtime_log = (run / 'domicile.log').read_text(errors='replace')
        ipc = one_match(r'^DOMICILE_SOCK=(/run/user/[0-9]+/domicile-ipc\.[0-9]+\.sock)$', runtime_log)
        display = one_match(r' INFO domicile_compositor: domicile-compositor: apps connect here \(WAYLAND_DISPLAY\) display="(wayland-[0-9]+)"$', runtime_log)
        if not ipc or not display or not stat.S_ISSOCK(Path(ipc).stat().st_mode) or not stat.S_ISSOCK((runtime / display).stat().st_mode):
            raise RuntimeError('The owned compositor did not identify its private IPC and Wayland sockets')
        app_env = {**env, 'DOMICILE_SOCK': ipc, 'WAYLAND_DISPLAY': display, 'GDK_BACKEND': 'wayland', 'GSK_RENDERER': 'cairo'}
        probe = subprocess.run([args.node, 'scripts/inspect-runtime.mjs', '--endpoint', endpoint, '--target', target,
                                '--out', str(run / 'runtime-inspection.json')], cwd=REPO, env=env, capture_output=True, text=True, timeout=60)
        (run / 'inspection.log').write_text(probe.stdout + probe.stderr)
        if probe.returncode:
            raise RuntimeError('Runtime inspection failed; retain inspection.log')
        inspection = json.loads((run / 'runtime-inspection.json').read_text())
        view = inspection['viewport']
        sdk = inspection['state']['outputs']
        if len(sdk) != 1 or [sdk[0]['x'], sdk[0]['y']] != [0, 0] or [sdk[0]['width'], sdk[0]['height']] != [view['width'], view['height']]:
            raise RuntimeError('The SDK output list does not match the observed viewport')
        if args.display_source == 'cli':
            displays = subprocess.run([args.domicile, 'list-displays', '--json'], env=app_env, capture_output=True, text=True, timeout=10)
            (run / 'displays.stdout.txt').write_text(displays.stdout)
            (run / 'displays.stderr.txt').write_text(displays.stderr)
            if displays.returncode:
                raise RuntimeError('list-displays failed; retain displays.stderr.txt. Older runtimes require explicit --display-source sdk')
            outputs = json.loads(displays.stdout)
            if len(outputs) != 1 or not outputs[0]['lit'] or outputs[0]['position'] != [0, 0] or outputs[0]['size'] != [view['width'], view['height']]:
                raise RuntimeError('The single CLI output does not match the observed viewport')
            if outputs[0]['name'] != sdk[0]['name']:
                raise RuntimeError('The CLI and SDK name different outputs')
        elif args.display_source == 'sdk':
            # No invented power state: older SDKs do not expose the CLI's lit field.
            outputs = [{'name': sdk[0]['name'], 'position': [sdk[0]['x'], sdk[0]['y']], 'size': [sdk[0]['width'], sdk[0]['height']]}]
        if len(outputs) != 1:
            raise RuntimeError('The single desktop output does not match the observed viewport')
        status['outputValidationSource'] = args.display_source
        (run / 'displays.json').write_text(json.dumps(outputs, indent=2) + '\n')
        if not args.no_fixture:
            spawn('native-fixture', [args.zenity, '--entry', '--title=Domicile Code native fixture', '--text=A real Wayland text field', '--entry-text=Native pixels'],
                  app_env, critical=False, stdout_name='native-result.txt')
        spawn('viewer', [args.node, 'tools/viewer/server.mjs', '--endpoint', endpoint, '--target', target, '--output', outputs[0]['name'],
                          '--port', str(args.viewer_port), '--log', str(run / 'viewer-events.jsonl')], env)
        viewer_url = f'http://127.0.0.1:{args.viewer_port}'

        def ready_viewer():
            state = read_json(viewer_url + '/state')
            if state.get('targetId') != target or state.get('sceneId') != inspection['state']['sceneId'] or state.get('viewport') != view:
                raise RuntimeError('Viewer source identity does not match the owned desktop')
            return state

        source = wait_for('matching viewer', ready_viewer, 30)
        status.update(status='ready', readyAt=dt.datetime.now(dt.timezone.utc).isoformat(), endpoint=endpoint,
                      targetId=target, viewer=viewer_url, source=source, privateWaylandDisplay=display, privateCompositorSocket=ipc)
        save()
        print(json.dumps({'result': 'ready', 'run': str(run / 'run.json'), 'viewer': viewer_url, 'source': source}), flush=True)
        if args.capture_repro:
            capture = subprocess.run([args.node, 'scripts/check-capture.mjs', '--endpoint', endpoint, '--target', target,
                                      '--domicile', args.domicile, '--out', str(run / 'capture')], cwd=REPO,
                                     env=app_env, capture_output=True, text=True, timeout=45)
            (run / 'capture-check.log').write_text(capture.stdout + capture.stderr)
            if capture.returncode:
                raise RuntimeError('Capture measurement could not finish; retain capture-check.log')
        end = time.monotonic() + args.seconds if args.seconds else float('inf')
        while time.monotonic() < end:
            check_children()
            time.sleep(0.2)
        status['status'] = 'stopped-after-duration'
    except KeyboardInterrupt:
        status['status'] = 'stopped-by-signal'
    except Exception as error:
        status.update(status='failed', error=str(error))
        raise
    finally:
        # Only groups started above are signalled, within the private namespace.
        # Keep every log and receipt. Never clean the host runtime or user manager.
        signal.signal(signal.SIGINT, signal.SIG_IGN)
        signal.signal(signal.SIGTERM, signal.SIG_IGN)
        for name, child, critical in reversed(children):
            # Close the viewer while its source is still alive, then the native
            # fixture, compositor and nested host. Simultaneous termination
            # strands the viewer's in-flight CDP cleanup against a dead source.
            try:
                os.killpg(child.pid, signal.SIGTERM)
            except ProcessLookupError:
                pass
            try:
                child.wait(timeout=8)
            except subprocess.TimeoutExpired:
                try:
                    os.killpg(child.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
                child.wait(timeout=5)
            status['children'][name]['finalRc'] = child.returncode
        status['endedAt'] = dt.datetime.now(dt.timezone.utc).isoformat()
        status['retainedDumps'] = [str(p.relative_to(run)) for p in run.rglob('*.dmp')]
        if status['retainedDumps']:
            status['teardownWarning'] = 'Minidumps were retained. Inspect them before claiming clean teardown; do not publish raw dumps.'
        save()
        for stream in logs:
            stream.close()
        print(json.dumps({'result': status['status'], 'run': str(run / 'run.json'), 'teardownWarning': status.get('teardownWarning')}), flush=True)


if __name__ == '__main__':
    main()
