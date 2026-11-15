#!/usr/bin/env python3
"""One fresh isolated minimal-shell Wayland input comparison; retains failures."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import sys
import time

REPO = Path(__file__).resolve().parents[2]
p = argparse.ArgumentParser(description=__doc__)
p.add_argument('--wtype', required=True)
p.add_argument('--revision', required=True)
p.add_argument('--run-dir', required=True)
p.add_argument('--node', required=True)
p.add_argument('--empty-seat-repro', action='store_true', help='Reproduce the historical transient-keyboard failure instead of using upstream’s persistent keyboard setup')
args, forwarded = p.parse_known_args()
if Path('/proc/1/comm').read_text().strip() != 'bwrap' or not any(
        ' /run/user ' in line and ' - tmpfs ' in line
        for line in Path('/proc/self/mountinfo').read_text().splitlines()):
    raise SystemExit('Run this driver through runtime-test --allow-gpu selected-node -- ...')
runtime = Path(os.environ['XDG_RUNTIME_DIR'])
if list(runtime.glob('wayland-*')):
    raise SystemExit('The driver needs a fresh namespace, without earlier compositor sockets')
run = Path(args.run_dir).absolute()
if not run.is_relative_to('/tmp') or run == Path('/tmp') or run.exists():
    raise SystemExit('Use a new explicit /tmp run directory')
if any(value in forwarded for value in ('--inside', '--shell-dir', '--seconds', '--no-fixture', '--capture-repro', '--virtual-keyboard')):
    raise SystemExit('The driver selects the minimal shell and bounded isolated lifecycle')
controller_log = Path(str(run) + '.controller.log')
# Reserve the comparison atomically: an earlier preflight failure may have
# written a receipt without creating the run directory. Never replace it.
comparison_output = Path(str(run) + '.comparison.json').open('x')
receipt = {'revision': args.revision, 'result': 'fail', 'method': 'fresh isolated launcher, no workbench or native application, logical Wayland chords from wtype'}
receipt['keyboardSetup'] = 'initially empty host seat (historical negative control)' if args.empty_seat_repro else 'persistent wtype keyboard before engine startup (upstream PR #1544)'
launcher = None
try:
    with controller_log.open('x') as output:
        keyboard = [] if args.empty_seat_repro else ['--virtual-keyboard', args.wtype]
        launcher = subprocess.Popen([sys.executable, str(REPO / 'tools/run-prototype.py'),
            '--inside', '--no-fixture', '--seconds', '90', '--shell-dir', str(Path(__file__).parent),
            '--run-dir', str(run), '--node', args.node, *keyboard, *forwarded], cwd=REPO, stdout=output, stderr=subprocess.STDOUT)
        deadline = time.monotonic() + 85
        status = None
        while time.monotonic() < deadline and launcher.poll() is None:
            try:
                status = json.loads((run / 'run.json').read_text())
                if status.get('status') == 'ready':
                    break
                if status.get('status') == 'failed':
                    raise RuntimeError('The owned launcher failed; retain its log')
            except (FileNotFoundError, json.JSONDecodeError):
                pass
            time.sleep(0.2)
        if not status or status.get('status') != 'ready' or launcher.poll() is not None:
            raise RuntimeError('The selected owned source did not become ready')
        receipt['source'] = status['source']
        receipt['probeShellSha256'] = status['shellSha256']
        receipt['senderScriptSha256'] = hashlib.sha256((REPO / 'scripts/check-wayland-keys.mjs').read_bytes()).hexdigest()
        # The fresh namespace contains one host and the owned Domicile socket.
        hosts = [path.name for path in runtime.iterdir() if re.fullmatch(r'wayland-[0-9]+', path.name)
                 and path.is_socket() and path.name != status['privateWaylandDisplay']]
        if len(hosts) != 1:
            raise RuntimeError('The private Sway host socket is ambiguous')
        check = subprocess.run([args.node, 'scripts/check-wayland-keys.mjs', '--url', status['viewer'],
            '--endpoint', status['endpoint'], '--target', status['targetId'], '--out', str(run / 'key-check'),
            '--revision', args.revision, '--wtype', args.wtype, '--sway-display', hosts[0]],
            cwd=REPO, capture_output=True, text=True, timeout=45)
        (run / 'key-check.stdout.txt').write_text(check.stdout)
        (run / 'key-check.stderr.txt').write_text(check.stderr)
        receipt['senderReturnCode'] = check.returncode
        receipt['result'] = 'pass' if check.returncode == 0 else 'fail'
except Exception as error:
    receipt['error'] = str(error)
finally:
    if launcher is not None:
        if launcher.poll() is None:
            launcher.send_signal(signal.SIGINT)
        try:
            receipt['launcherReturnCode'] = launcher.wait(timeout=40)
        except subprocess.TimeoutExpired:
            receipt['result'] = 'fail'
            receipt['teardownError'] = 'The owned launcher did not stop; preserve logs and the private namespace boundary'
        if run.exists():
            log = (run / 'domicile.log')
            receipt['fatalLines'] = [line for line in log.read_text(errors='replace').splitlines()
                                    if 'FATAL:ui/ozone/platform/wayland/host/wayland_event_source.cc' in line] if log.exists() else []
    comparison_output.write(json.dumps(receipt, indent=2) + '\n')
    comparison_output.close()
print(json.dumps(receipt))
raise SystemExit(0 if receipt['result'] == 'pass' else 1)
