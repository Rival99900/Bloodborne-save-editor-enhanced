"""Read-only aligned comparison, with opt-in experimental rollback of a known pair.

The compared 30,000-byte region follows the editor's current comparator. Its
contents are not all proven NPC flags. No event ID or NPC death flag is inferred.
"""
import argparse
import hashlib
import json
from pathlib import Path

SIZE = 0x140000
LENGTH = 30_000
KNOWN_A = '05a4be09b6ca59f1c5ab35f1176e34b965b204a42b25e2de9832397d084d8f2e'
KNOWN_B = '4de4e767f3f811a86feaff5b3d013dbc35ae711c1d2a9a44707e63acbb21dd89'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def layout(data):
    if len(data) != SIZE:
        raise ValueError('Expected a complete 0x140000-byte decrypted character save')
    face = data.find(b'FACE', 0xF000)
    if face < 0:
        raise ValueError('Missing FACE marker')
    username = face - 34028 - 469
    anchor = username + 68545
    if username < 0 or anchor + LENGTH > len(data):
        raise ValueError('Invalid section boundaries')
    return username, anchor

def compare(a, b):
    ua, sa = layout(a)
    ub, sb = layout(b)
    if a[ua:ua + 34] != b[ub:ub + 34]:
        raise ValueError('Character name fields differ; cannot assume matching characters')
    changes = []
    for rel in range(LENGTH):
        old, new = a[sa + rel], b[sb + rel]
        if old != new:
            changes.append(dict(relative_offset=rel, absolute_a=sa+rel, absolute_b=sb+rel,
                                alive_save_value=old, dead_save_value=new, xor_mask=old ^ new))
    return dict(sha256_a=sha(a), sha256_b=sha(b), anchor_a=sa, anchor_b=sb,
                raw_changed_bytes=sum(x != y for x,y in zip(a,b)),
                aligned_changed_bytes=len(changes), differences=changes,
                status='Unverified candidates; not confirmed NPC/event flags')

def rollback_known_pair(a, b, report):
    if sha(a) != KNOWN_A or sha(b) != KNOWN_B:
        raise ValueError('Experimental rollback only supports the exact reviewed save pair')
    if report != compare(a, b):
        raise ValueError('Comparison report does not match the inputs')
    patched = bytearray(b)
    for change in report['differences']:
        patched[change['absolute_b']] = change['alive_save_value']
    expected = {x['absolute_b'] for x in report['differences']}
    actual = {i for i,(x,y) in enumerate(zip(b,patched)) if x != y}
    assert len(patched) == len(b) and actual == expected
    return bytes(patched)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('alive', type=Path)
    parser.add_argument('dead', type=Path)
    parser.add_argument('--experimental-output', type=Path)
    args = parser.parse_args()
    a, b = args.alive.read_bytes(), args.dead.read_bytes()
    report = compare(a,b)
    if args.experimental_output:
        patched = rollback_known_pair(a,b,report)
        # Never overwrite originals or an earlier result, including symlink targets.
        with args.experimental_output.open('xb') as out:
            out.write(patched)
        report['experimental_sha256'] = sha(patched)
    print(json.dumps(report, indent=2))

if __name__ == '__main__':
    main()
