# Apollo Bloodborne patch data

These two `.savepatch` files come from **bucanero/apollo-patches**, snapshot
`0b364df6211f508ebda83b5a86fb68c103258730`, retrieved 2026-09-27:

- https://github.com/bucanero/apollo-patches/blob/0b364df6211f508ebda83b5a86fb68c103258730/PS4/CUSA00207.savepatch
- https://github.com/bucanero/apollo-patches/blob/0b364df6211f508ebda83b5a86fb68c103258730/PS4/CUSA00900.savepatch

Original credits: xdgmods, officialahmed0, krustytoe and XGamerManX (Hackinformer).
Apollo project: Damián Parrino / Bucanero, GPL v3 or later. The full GPL v3 text
is included in the project's root LICENSE. Original headers and code sequences
are retained; identical repeated code sections are deduplicated at runtime.

Reference UI: https://github.com/bucanero/apollo-patcher
Reference code semantics: https://github.com/bucanero/apollo-lib/blob/190e8f1718bd34fb5b081e05ecb982323510dcf8/source/patches.c

This editor does **not** embed the general-purpose Apollo C/WASM library. Its
Rust interpreter implements only the instructions present in these immutable
Bloodborne catalogs: absolute search 80, pointer-relative writes 08/18/28,
pointer addition 92 and conditional tests D8 (including multi-line search data).
No external `.savepatch`, Python, BSD script or arbitrary raw-code execution is
exposed. Unknown instructions, invalid titles/selections and out-of-range access
fail closed. PS4 writes are little-endian; search bytes retain their written
order and D8 tests use the explicit endianness encoded in the instruction.

Compatibility is intentionally limited to **catalog availability**, not a claim
that either CUSA is proven in-game. The source labels the codes untested, targets
`userdata00*`, and specifies no game version. The decrypted character format is
validated independently (0x140000 bytes, recognized sections and target fields).
CUSA and game version are user declarations; no region/version inference,
region conversion, decryption or signing is performed.

Differences from general Apollo behavior: ambiguous patterns are rejected;
missing mandatory searches abort the whole candidate, except the independent
second material occurrence which can be skipped and is disclosed in the review.
Every write is checked against independently parsed Bloodborne fields. Candidate
re-parsing must preserve size, record counts and item/equipment/rune references.
Some raw upstream codes (notably one-sided Pebble conversion) are therefore
refused instead of being silently "fixed" or written to the active save.
