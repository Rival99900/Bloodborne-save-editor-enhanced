# Local v0.4.0 — NPC comparison and effect labels (2026-09-09)

## NPC comparison

Compared the user-provided all-alive and old-woman-killed saves. Both have the expected 0x140000 size. The FACE-derived comparison anchors are 0x1EA50 and 0x2145C. Aligning these removes the misleading 941,594 raw byte differences and leaves 21 changed bytes in the editor's 30,000-byte comparison window.

These are unverified candidates, not known event IDs or confirmed NPC death flags. The comparison window may include other state. One pair cannot separate causality from incidental progression. No revival control was enabled and no NPC relocation feature was added.

`scripts/compare_npc_saves.py` compares aligned copies without writing by default. Its optional experimental rollback requires SHA-256 matches for this exact reviewed pair and exclusively creates a new output. The test copy restores only the 21 changed bytes to A values at B's corresponding offsets. Originals remain untouched. No checksum update or in-game validation is claimed. The delivered ZIP includes the full comparison manifest, hexadecimal addresses/masks and French test instructions. User saves are not committed to this repository.

## Effects

The earlier coverage audit did not imply linguistic completeness. A renewed review found residual English abbreviations, malformed hidden-effect labels and doubled signs in effect catalogs.

The 3,662 distinct source effects are now generated from 68 explicit source families and translated labels for all 13 locales. Labels specify the property; signed values express increases/decreases. Effects such as stamina-cost reduction explicitly retain their direction in the label. Source magnitudes, signs, percentage markers and unsigned rune levels are preserved exactly. Missing family mappings fail instead of silently falling back to English.

Names, notes and descriptions continue to be checked by the catalog audit; additional residual Bloodtinge fragments were translated. This is a project localization review, not certification against official game translations or native-speaker proofreading of every lore paragraph.

## Validation

- `python scripts/localization/rebuild_effect_labels.py --check`: all 13 catalogs match the reviewed labels, preserve source numeric tokens and pass English-abbreviation/double-sign checks.
- `npm run audit:catalogs`: passed; required names, descriptions, gem/rune notes and effects present and nonempty in all 13 locales.
- `node scripts/validate_v040_localization.mjs`: passed, including multilingual search and rune aliases.
- Production frontend build: passed (existing chunk-size advisory remains).
- Test save length and exact 21-byte change set verified; unrelated bytes preserved.
- `git diff --check`: passed.

All project changes remain local; nothing was pushed or released on GitHub.

## Follow-up: 2026-09-10 test failed to revive the NPC

The user reports that the experimental copy loads but the old woman remains dead after reload/respawn. Do not treat the 21-byte rollback as effective. `NPC_OLD_WOMAN_DIAGNOSIS.md` records the follow-up: the low quest state was restored (1183 to 1186), so further investigation must examine persistent character state or other dependencies. A post-test export is needed to determine whether the game writes 1183 again.
