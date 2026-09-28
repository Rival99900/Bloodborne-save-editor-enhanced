"""Linux/macOS/Windows: python scripts/test_native_patches.py [test-name].
Builds the real Rust data modules without Tauri system dependencies, then runs
in src-tauri, where the repository's existing tests expect their fixtures.
"""
import json
import subprocess
import sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
manifest = root / 'scripts/patch-native-tests/Cargo.toml'
build = subprocess.run(['cargo', 'test', '--release', '--manifest-path', str(manifest), '--lib', '--no-run', '--message-format=json'], cwd=root, text=True, stdout=subprocess.PIPE)
if build.returncode:
    sys.exit(build.returncode)
executables = []
for line in build.stdout.splitlines():
    try:
        message = json.loads(line)
    except ValueError:
        continue
    if message.get('reason') == 'compiler-artifact' and message.get('profile', {}).get('test') and message.get('executable'):
        executables.append(message['executable'])
if not executables:
    raise RuntimeError('Cargo did not return a native test executable')
for executable in executables:
    result = subprocess.run([executable, *sys.argv[1:], '--test-threads=1'], cwd=root / 'src-tauri')
    if result.returncode:
        sys.exit(result.returncode)
