"""Read-only NPC research diagnostic for local v0.4.0.

The low common-flag mapping is inferred from the reviewed pair and checked
against event-script transitions. It is NOT a general event-ID address resolver.
Never use this diagnostic to write NPC state or to map high event IDs.
"""
import argparse
import json
from pathlib import Path
from compare_npc_saves import layout, compare, sha

COMMON_RELATIVE_BASE = 0x36D
RANGES = {'chapel_dweller': 1100, 'skeptical_man': 1160, 'old_woman': 1180,
          'arianna': 1220, 'adella': 1300}

def low_flag(data, anchor, flag):
    if not 1100 <= flag <= 1319:
        raise ValueError('Only the researched low NPC flag range is supported')
    offset = anchor + COMMON_RELATIVE_BASE + flag // 8
    mask = 0x80 >> (flag % 8)
    return bool(data[offset] & mask)

def inspect(data):
    _, anchor = layout(data)
    states = {name: [flag for flag in range(start, start+20) if low_flag(data, anchor, flag)]
              for name, start in RANGES.items()}
    return {'sha256': sha(data), 'anchor': anchor, 'active_states': states,
            'mapping_status': 'inferred for this save layout; read-only; no health/localization guarantee',
            'state_warnings': [name for name, flags in states.items() if len(flags) != 1]}

def diagnose(a, b):
    report = compare(a, b)  # validates size, markers, matching name fields
    sa, sb = report['anchor_a'], report['anchor_b']
    end = 120_000
    if min(len(a)-sa, len(b)-sb) < end:
        raise ValueError('Not enough bytes for the extended observation window')
    extended = [{'relative_offset': rel, 'absolute_a': sa+rel, 'absolute_b': sb+rel,
                 'a_value': a[sa+rel], 'b_value': b[sb+rel]}
                for rel in range(30_000, end) if a[sa+rel] != b[sb+rel]]
    return {'a': inspect(a), 'b': inspect(b),
            'previous_window_changed_bytes': report['aligned_changed_bytes'],
            'additional_changed_bytes': len(extended),
            'additional_changes_unclassified': extended,
            'warning': 'Shared alignment beyond the original window is observational, not a validated section parser.'}

def compare_test_run(alive, dead, prepared, exported):
    """Classify the fate of edits in the previous 30,000-byte experiment.

    Observes before/after values only; does not attribute writes to any particular
    engine subsystem or prove the imported file's provenance.
    """
    original_changes = compare(dead, prepared)
    before_after = diagnose(prepared, exported)
    baseline_after = diagnose(alive, exported)
    _, post_anchor = layout(exported)
    counts = {'returned_to_dead_value': 0, 'retained_prepared_value': 0, 'other_value': 0}
    changes = []
    for entry in original_changes['differences']:
        rel = entry['relative_offset']
        old, edit = entry['alive_save_value'], entry['dead_save_value']
        post = exported[post_anchor + rel]
        outcome = ('returned_to_dead_value' if post == old else
                   'retained_prepared_value' if post == edit else 'other_value')
        counts[outcome] += 1
        changes.append({'relative_offset': rel, 'dead_value': old,
                        'prepared_value': edit, 'exported_value': post, 'outcome': outcome})
    return {'alive': inspect(alive), 'dead': inspect(dead), 'prepared': inspect(prepared),
            'exported': inspect(exported), 'edit_outcomes': counts, 'edits': changes,
            'prepared_vs_exported': before_after, 'alive_vs_exported': baseline_after,
            'dead_vs_exported': diagnose(dead, exported)}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('alive', type=Path)
    parser.add_argument('comparison', type=Path)
    parser.add_argument('--dead', type=Path, help='Original dead-NPC save for test-run comparison')
    parser.add_argument('--prepared', type=Path, help='Experimental copy before the game test')
    args = parser.parse_args()
    if bool(args.dead) != bool(args.prepared):
        parser.error('--dead and --prepared must be supplied together')
    if args.dead:
        result = compare_test_run(args.alive.read_bytes(), args.dead.read_bytes(),
                                  args.prepared.read_bytes(), args.comparison.read_bytes())
    else:
        result = diagnose(args.alive.read_bytes(), args.comparison.read_bytes())
    print(json.dumps(result, indent=2))

if __name__ == '__main__':
    main()
