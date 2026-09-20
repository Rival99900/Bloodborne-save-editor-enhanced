# v0.4.0 vignette localization review

Historical localization audit, retained with the release documentation. This audit did not change the save format.

## Scope and changes

All 13 translated locales are covered: fr, it, de, es, nl, pl, ru, da, nb, fi, sv, tr, pt-PT.

- Checked every stored name, description and gem/rune effect entry for missing or empty values, plus runtime gem/rune names and notes against the source catalog.
- Corrected 4,965 vignette values and 814 effect-catalog values. These counts include terminology and punctuation changes; they are not counts of individually verified official translations.
- Reworked weapon names and their uncanny/lost/bloody variants, corrected mixed English terminology in item/armor/chalice text, and aligned numbered tiers within an item family.
- Replaced unrestricted runtime name substitution in descriptions with substitution of explicitly quoted rune names. This prevents short names from altering substrings in translated words.
- Strengthened the existing catalog audit and added a regression assertion for quoted rune names and unchanged surrounding words.

## Validation

- `npm run audit:catalogs`: passed; zero missing or empty required translations across the 13 locales, including dynamic gem/rune cards. No remaining occurrences of the specific English phrases covered by the regression check.
- `node scripts/validate_v040_localization.mjs`: passed; translated and English search aliases, rune aliases and existing UI localization checks.
- Production frontend build: passed. Vite still reports the existing large-chunk advisory.
- Translation keys and numeric values, signs and percentages compared against the previous local commit: unchanged in all 26 catalogs.
- `git diff --check`: passed.

## Limits

Coverage checks are exhaustive for catalog keys; linguistic review and terminology corrections do not certify every lore paragraph as an official or native-reviewed translation. The English-fragment regression check covers a specific list, not arbitrary English text. Proper names and valid shared words can remain identical to English.

The 25 chalices have no description in the source catalog; no lore text was invented to fill that source-data absence. No native executable build or in-game verification was performed for this translation-only change.
