"""Observe and drive only the isolated Android emulator's Marketplace test app."""
import json, os, re, subprocess, sys, time, xml.etree.ElementTree as E
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
adb = str(Path(os.environ['LOCALAPPDATA']) / 'Android/Sdk/platform-tools/adb.exe')

def call(*args):
    return subprocess.check_output([adb, '-s', 'emulator-5554', *args], timeout=25)

def tree():
    for attempt in range(3):
        try:
            call('shell', 'uiautomator', 'dump', '/sdcard/marketplace-ui.xml')
            return E.fromstring(call('exec-out', 'cat', '/sdcard/marketplace-ui.xml').decode('utf-8'))
        except (subprocess.CalledProcessError, E.ParseError):
            if attempt == 2:
                raise
            print('RETRY Android accessibility snapshot after automation interruption', file=sys.stderr, flush=True)
            time.sleep(0.5)

def find(label, field=False):
    nodes = [n for n in tree().iter('node') if (n.get('content-desc') == label or n.get('text') == label) and (not field or 'EditText' in n.get('class', '')) and visible(n)]
    nodes.sort(key=lambda n: n.get('clickable') != 'true')
    if not nodes:
        raise RuntimeError('Visible control not found: ' + label)
    return nodes[0]

def visible(n):
    x1, y1, x2, y2 = map(int, re.findall('\\d+', n.get('bounds')))
    return x2 > x1 and y2 > y1

def tap(label, field=False):
    n = find(label, field)
    x1, y1, x2, y2 = map(int, re.findall('\\d+', n.get('bounds')))
    call('shell', 'input', 'tap', str((x1 + x2) // 2), str((y1 + y2) // 2))
    time.sleep(0.4)
if __name__ == '__main__':
    command = sys.argv[1]
    if command == 'tree':
        print(json.dumps([{'label': n.get('content-desc') or n.get('text'), 'bounds': n.get('bounds'), 'class': n.get('class'), 'checked': n.get('checked')} for n in tree().iter('node') if n.get('text') or n.get('content-desc')], ensure_ascii=False))
    elif command == 'tap':
        tap(sys.argv[2])
    elif command == 'input':
        tap(sys.argv[2], True)
        call('shell', 'input', 'keyevent', '123')
        call('shell', 'input', 'keyevent', *['67'] * 90)
        call('shell', 'input', 'text', sys.argv[3].replace(' ', '%s'))
        time.sleep(0.4)
    elif command == 'shot':
        Path(sys.argv[2]).write_bytes(call('exec-out', 'screencap', '-p'))
        print('Captured ' + sys.argv[2])
    elif command == 'back':
        call('shell', 'input', 'keyevent', '4')
        time.sleep(0.5)
    elif command == 'swipe':
        call('shell', 'input', 'swipe', '720', '2300', '720', '1050', '400')
        time.sleep(0.5)
    else:
        raise RuntimeError('Unknown test command')
