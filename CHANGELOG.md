# Changelog

Generated from `.github/release-notes` by `npm run changelog`: edit the release notes, not this file.

## v0.7.5

Lamps, more bulk actions, Inventory/Storage export and import, infinite Blood Vials and Quicksilver Bullets, a Gem finder and a full save comparison, in English and the 13 translated languages.

### Additions

- **Lamp control** in **Character**, below Teleport: light or put out the 44 headstone lamps by area or one by one, applied with **Confirm**. Putting a lamp out also clears its lighting request, so it can be lit again in game. Lamp table and lighting requests from [Argagaes](https://github.com/Argagaes) ([Noxde/Bloodborne-save-editor#67](https://github.com/Noxde/Bloodborne-save-editor/pull/67)).
- **Bulk actions**, new tabs:
  - **Gem slots**: open every closed Gem slot of the weapons with the shape of your choice (Radial, Triangle, Waning, Circle or Droplet) and the number of slots per weapon (1 to 5, 3 by default). Open slots and equipped Gems are not touched.
  - **Consumables**: set Blood Vials and Quicksilver Bullets to the game limit (20 carried, 600 in Storage), and turn **infinite Blood Vials and Quicksilver Bullets** on or off (Inventory).
  - **Export / Import**: save the Inventory or the Storage as JSON or CSV, then import it into any save. Choose what to import (everything, items, weapons, armor, Gems or Runes) and whether weapons and armor come back **with their slots and Gems** or plain. Nothing is removed, importing the same file twice adds nothing more, a progress bar follows the import and one undo cancels it.
- **Tools → Gem finder**: search every Gem and Rune by effect, name or shape in the Inventory, the Storage and on equipped weapons, with duplicate detection.
- **Tools → Compare two saves** also lists the changes to stats, character, bosses, Inventory and Storage, above the flag region. The JSON export contains both.
- Windows **MSI** package next to the NSIS installer; the updater manifest lists both with their signatures.
- `CHANGELOG.md` with every release.

### Modifications

- Opening and editing a save is much faster: the game catalogs are read once instead of for every item.
- **Teleport** (Character) is applied with **Confirm**, like the rest of the page.
- Long operations show their progress (**Adding…**, **Comparing…**, **Importing…**) and no longer freeze the window.
- Weapon, armor, Gem and Rune additions are no longer called experimental (they are confirmed in game), and the extra confirmation before adding equipment is gone.
- **Bulk actions → +10** leaves the **Loch Shield** unchanged: a reinforced Loch Shield disappears in game.
- Visible keyboard focus on every control; arrow keys, Page Up/Down, Home and End move the selection in the Inventory/Storage list.

### Fixes

- Minimizing the window while the editor was starting (white screen) closed it: the window now appears once the interface is ready, on a dark background.
- A Droplet Gem added directly was named "?GemName?" in game.
- **Gem Forge → Import presets** reported 0 imported presets.
- Exporting or importing presets and comparisons failed outside the user folder (another drive on Windows).

## v0.7.0

New tools for checking, organising and moving saves, a full interface pass, and fixes found by an audit of every screen, with English and all 13 translated languages.

### Additions

- **Consistency check** in **Stats**: Level recalculated from the six attributes (Level = attributes − 50, maximum 544) and Health from the Vitality table, applied to the draft in one click. The same panel lists values outside the normal game range (level, attributes, HP, Insight, Echoes, item quantities, weapon level, Blood Gem rating). Nothing is changed without Confirm.
- **Bulk actions** in Inventory and Storage:
  - move many Gems or Runes between Inventory and Storage, with filter, sort and selection; the move is all-or-nothing (new `move_upgrades` command) and one undo step;
  - upgrade every weapon below +10 to +10 in one all-or-nothing step (new `upgrade_all_weapons` command); weapons without reinforced versions are left unchanged and counted.
- **Tools** page:
  - **Trophies**: Hunter's Essence (26 hunter weapons, any version), Hunter's Craft (9 special hunter tools) and Weapon Master (+10), counted over Inventory and Storage, with adding of the missing entries;
  - **Compare two saves**: every differing byte of the flag region of two saves of the same character, with the offsets the editor already knows (boss, multiplayer and Flags entries), changed bits and a JSON export. The NPCs page links to it to document NPC flags.
- **File menu** (⋯ next to Open save): recent saves, drag and drop of a save onto the window, keyboard shortcuts (F1).
- **Backup history**: each time a save is opened, a dated copy is kept in `<file>.backups/` next to it (10 most recent, identical copies skipped). A copy can be restored; the replaced version is kept first. The single `.bak` file is unchanged.
- **PS4/PS5 over FTP** (GoldHEN on PS4, port 2121; etaHEN on PS5, port 1337). On PS4, connecting lists every folder where Apollo exported Bloodborne saves (`/data/apollo`, `/data/fakeusb/PS4/APOLLO`, `/mnt/usbX/PS4/APOLLO`, mounted saves) and opens the one used last time. Apollo has no PS5 version, so on PS5 browsing starts from the root (or the last folder). Open a save, edit it and send it back, send the open save into any folder under the name you choose, import a local `userdataNNNN` save (checked before anything is sent) or delete a save after confirmation. Every upload is read back to check that the console really holds the new file (if a server keeps the old one, the file is deleted and written again). Only Bloodborne saves can be changed; every other file (`.elf`, `.js`, `.py`…) is read-only, in the interface and in the backend. A local copy is always kept before a console save is replaced or deleted.
- **Character presets**: export and import as JSON, merged up to the limit of 20.

### Modifications

- One visual system: colour, font and layer tokens; the interface font for every button (the game serif stays on item names and Gem panels); identical page headers on Bosses, NPCs, Patch, Flags and Tools; Gem screens (Back / Change / Edit, editor actions, Add and Replace dialogs) use the standard buttons.
- Gem shape icons are drawn in the empty Shape frame, in the lists and in the Gem editor.
- Item categories have names, tooltips and a pressed state; the playtime fields have labels.
- The version shown in the header is read from `package.json`.
- Localization data moved from `localization.jsx` (21,790 lines, now 1,445) to JSON files in `src/i18n/data/`; the resulting translations are byte-for-byte identical.
- Images converted from PNG to WebP, which reduces the installer size.
- Dependencies: `axios` removed (unused), React Router 7, Tauri plugin patch updates. `npm audit`: 0 vulnerabilities.

### Fixes

- Rune thumbnails carrying a Blood Gem effect could fail silently when their image was missing (`getGemFallbackPath` was not imported).
- The Gem editor and the Gem Forge now close with Escape; with nested dialogs, only the top one reacts.
- Rating and Shape values in the Gem editor are aligned with their labels.
- The catalogue search no longer reads "Search item items" (and its equivalents in every language).
- Empty categories, searches and favourite views show a message instead of an empty list.
- Quantity and Weapon level fields stay empty without a selection instead of showing 0.
- Missing React key in the Gem replacement list; the Flags page no longer nests a second main landmark.
- A weapon whose five slots were opened with a shape but no Gem could not be saved ("Unable to save"). Open empty slots are valid in the game and are now accepted; a Gem in a closed slot is still refused.
- **Bulk actions → Upgrade to +10** failed in Storage: the weapon level change looked for the weapon in the Inventory only. It now uses the right container, matches the exact item when the same weapon appears twice, keeps the Uncanny/Lost variant and skips weapons that have no reinforced versions (NPC-only variants).
- Change log: items without a catalogue name no longer produce empty "Inventory · · Item" rows; they are shown by their id, and rows empty on both sides are dropped.
- Character: the X/Y/Z coordinate fields are right-aligned like the other values.
- Tools: the title is left-aligned and the page uses the Flags/Patch background.
- PS4/PS5 dialog: the file list scrolls inside the dialog, so the status and the safety note stay visible.
- Inventory and Storage: on narrow windows the category strip scrolls instead of covering the side panel.
- Gems with the Droplet shape had no shape icon in the lists and the editor; the icon is added.
- **Adding a Gem or Rune directly** no longer needs an unused record in the save: when none exists, a new record is added after the existing Gems/Runes, in place of a free slot, the same way equipment is added (the following data moves by 32 bytes; the save size does not change).
- An added or converted Rune kept the item id of a Gem, so the game named it "?GemName?". Runes now get the item id of their first rune effect (values checked against the runes of 10 real saves), and changing it updates the record and the Inventory/Storage entry. Gem effects on runes stay allowed (the game accepts them). Gems keep a Gem item id (copied from a Gem of the same shape in the save).
- Effect lists in the Gem/Rune editor were cut by the scrolling effects panel, which had to be scrolled to reach the last options. Lists now open over the page, fit the space left in the window (opening upwards when needed) and scroll on their own.

### Save safety

The editor accepts an already decrypted character save. On a PS4 (GoldHEN), test builds of this version were checked in game: weapons and armor added with Gems and slot shapes, Upgrade to +10 in Inventory and Storage, Gem moves between Inventory and Storage, Gems and Runes added directly (with correct rune names), and saves sent through the FTP bridge. The PS5 bridge was only tested against a local FTP server. Adding equipment, Gems and Runes remains experimental. Keep an untouched copy of every save.

### Release artifacts

| Platform | Artifact |
| --- | --- |
| Windows x64 installer | `Bloodborne_Save_Editor_Enhanced_0.7.0_x64-setup.exe` |
| Windows updater signature | `Bloodborne_Save_Editor_Enhanced_0.7.0_x64-setup.exe.sig` |
| Ubuntu/Linux x64 | `Bloodborne_Save_Editor_Enhanced_0.7.0_amd64.AppImage` |
| Linux updater signature | `Bloodborne_Save_Editor_Enhanced_0.7.0_amd64.AppImage.sig` |
| Automatic updater | `latest.json` |
| Integrity checks | `SHA256SUMS.txt` |

Existing v0.6.x installations can receive v0.7.0 through the built-in updater once publication completes.

### Validation

Native tests cover bulk moves (round trip, reparse, invalid indices), the backup history (rotation, deduplication, restoration, refusal of foreign files) the FTP bridge (local server round trip, save folder detection, import, delete, refusal of non-save files), the weapon level rules (both containers, variants, NPC-only weapons) saving a weapon with open empty slots, direct Gem/Rune additions on 10 saves (reused and new records, reload), rune item ids against the runes of 10 real saves and Gem/Rune conversion (104 native tests). `validate_v070_release.mjs` checks the new strings in 14 languages, the level and HP rules, the trophy lists against the catalogues, preset files and image references. Every screen and new dialog was rendered in a browser with real save data in English, German and Russian. These checks do not establish console compatibility.

### Credits

Base project: [Noxde](https://github.com/Noxde/Bloodborne-save-editor). Equipment insertion: [valentinoamato](https://github.com/valentinoamato). Trophy lists from the PowerPyx Bloodborne guides; HP table from the Bloodborne wiki.

## v0.6.5

Weapon and armor addition aligned with upstream Noxde 0.11.1, multiplayer restored in areas whose boss is defeated, and catalogue and localization fixes, with English and all 13 translated languages.

### Additions

- **Re-enable multiplayer after defeated bosses** in **Flags**. It clears the multiplayer lock the game applies to an area once its boss is defeated, for every area listed in the boss timeline (19 area masks). Boss progress, items and rewards are unchanged.
- **Bosses** now keep the area multiplayer bit consistent: reviving a boss re-enables multiplayer in its area, and the lock is set again only once every boss sharing that area is defeated. Both operations use bit masks (new `apply_mask_or` command) because several areas share the same byte.
- Localized multiplayer strings and update summary in English, French, Italian, German, Spanish, Dutch, Polish, Russian, Danish, Norwegian Bokmål, Finnish, Swedish, Turkish and Portuguese (Portugal).

### Modifications

- Weapon and armor insertion follows Noxde 0.11.1 `add_armor_or_weapon`. The record layout is unchanged (60-byte GA block, durability 200, five closed Gem slots); the operation still runs on a copy and replaces the open save only after a full reparse and the existing load-safety validation.
- The insertion traversal now accepts Gems/Runes placed after an empty GA record and non-canonical empty records, as upstream does. The fixed record count and section boundary are still checked. Patch validation keeps the stricter traversal.
- When the inserted equipment uses the slot that ends the inventory list, the next free slot is numbered, so a second addition no longer reuses index 0.
- Armor catalogue: the two **Student Uniform** entries are no longer swapped, and the default `[CUT] Body`, `[CUT] Arms` and `[CUT] Legs` items are removed from the Add list.
- Weapon catalogue: every weapon carries its default durability, as in upstream 0.11.x.

### Fixes

- **Weapon and armor addition no longer fails in the editor.** The previous version required the last 52 bytes of the file to be zero; real saves keep stale memory there (7 of the 12 bundled test saves), so the addition was refused. These bytes lie after every parsed section and are dropped as upstream does.
- Added equipment exposes five closed Gem slots, which prevents the black screen reported in upstream issue #64 when opening the Gem editor after an addition.
- **English Gem names:** Cursed Gems displayed the raw `vignette.cursedPrefix` key before their name. The English string is now defined, and a release check verifies that every interface key used in the source has an English value.

### Save safety

The editor accepts an already decrypted character save. Weapon/armor insertion shifts the following save data by 52 bytes and remains **experimental**: keep an untouched original, edit a copy and test it in-game. No PS4/in-game validation is claimed for this release. According to upstream testing, Cathedral Ward, Yahar'gul and the DLC areas may stay locked after the multiplayer flag.

### Release artifacts

| Platform | Artifact |
| --- | --- |
| Windows x64 installer | `Bloodborne_Save_Editor_Enhanced_0.6.5_x64-setup.exe` |
| Windows updater signature | `Bloodborne_Save_Editor_Enhanced_0.6.5_x64-setup.exe.sig` |
| Ubuntu/Linux x64 | `Bloodborne_Save_Editor_Enhanced_0.6.5_amd64.AppImage` |
| Linux updater signature | `Bloodborne_Save_Editor_Enhanced_0.6.5_amd64.AppImage.sig` |
| Automatic updater | `latest.json` |
| Integrity checks | `SHA256SUMS.txt` |

Existing v0.6.0 installations can receive v0.6.5 through the built-in updater once publication completes. Manual installers remain available on this release page.

### Validation

Before publication preparation: native tests cover insertion on every bundled test save that passes the load-safety check (right-hand weapon, firearm and armor, in Inventory and Storage), closed Gem slots, file size, slot numbering and stale-tail handling. The new `validate_v065_release.mjs` check covers English key coverage, the new strings in all 14 languages, update summaries, boss multiplayer masks and the catalogue corrections. These checks do not establish console compatibility.

### Credits

Insertion method and multiplayer flags: [Noxde](https://github.com/Noxde/Bloodborne-save-editor) and [valentinoamato](https://github.com/valentinoamato).

## v0.6.0

Bloodborne save patches and a refined editing interface, with English and all 13 translated languages.

### Additions

- **Patch** tab immediately below NPCs, with offline Bloodborne catalogs from Apollo, search, category filters and original-code inspection.
- **118 deduplicated catalog entries:** 41 for CUSA00207 and 77 for CUSA00900. Availability in the catalog does not guarantee that a patch can be applied to a particular save.
- Byte-level before/after previews, prerequisite checks and explicit confirmation before applying a selection of up to 16 patches.
- Patch changes integrated with the existing revision journal and Undo/Redo. Changes remain in memory until **Save changes** writes the file.
- Localized patch controls, messages and item labels in English, French, Italian, German, Spanish, Dutch, Polish, Russian, Danish, Norwegian Bokmål, Finnish, Swedish, Turkish and Portuguese (Portugal).

### Modifications

- Patch uses the same background as NPCs and Bosses. Character details use consistent borderless rows, retaining the Echoes/Insight icons and localized labels.
- Statistics confirmation/reset actions now sit beside the lower stat fields, with character presets kept in their own area.
- Consistent dark/gold buttons and clearer controls across Statistics, Character, Inventory and Storage; scrollable side controls and responsive spacing.
- The application bar allows the save summary to shrink without overlapping its controls when zoomed.
- Signed Windows/Linux packages retain the existing updater endpoint and signing key. The workflow publishes localized v0.6.0 update summaries after both platform builds succeed.

### Fixes

- Updater downloads use permanent `v0.6.0` release URLs instead of temporary `untagged-*` draft URLs. Publication checks both public download links before updating the feed.
- Inventory quantity edits preserve the translated item rendering instead of replacing it with the older manual drawing path.
- Patch previews reject out-of-bounds writes, ambiguous searches, conflicting writes and inconsistent item, equipment or rune references.
- Each preview is bound to the exact original bytes through a single-use ticket. Invalid or stale applications leave the active save unchanged.
- Identical upstream code sections are deduplicated without changing the original patch instructions.
- Release preparation retains the draft-ID handling from the corrected v0.5.0 workflow and keeps release ownership under Rival99900.

### Patch compatibility and save safety

Only **CUSA00207** and **CUSA00900** have bundled patch catalogs. Apollo labels these codes **untested** and supplies **no game version**. CUSA selection and the optional version field are user declarations, not automatic compatibility detection. No compatibility with another CUSA or game version is assumed.

The editor accepts an already decrypted character save. It does not decrypt, resign or convert regions, modify EBOOT, or run console-memory cheats. The Rust interpreter implements only the instructions used by the embedded Bloodborne catalogs; arbitrary external scripts are not supported.

Some upstream codes are deliberately refused when validation finds inconsistent references, including Pebble conversions that update only one copy of an item identifier. Missing secondary material occurrences are disclosed in the preview.

**Keep an untouched original and edit a copy.** Structural validation cannot certify in-game behavior: patches can still corrupt a save. No PS4/in-game validation of these patch catalogs is claimed. Experimental weapon/armor insertion and the earlier NPC limitations remain unchanged.

### Release artifacts

| Platform | Artifact |
| --- | --- |
| Windows x64 installer | `Bloodborne_Save_Editor_Enhanced_0.6.0_x64-setup.exe` |
| Windows updater signature | `Bloodborne_Save_Editor_Enhanced_0.6.0_x64-setup.exe.sig` |
| Ubuntu/Linux x64 | `Bloodborne_Save_Editor_Enhanced_0.6.0_amd64.AppImage` |
| Linux updater signature | `Bloodborne_Save_Editor_Enhanced_0.6.0_amd64.AppImage.sig` |
| Automatic updater | `latest.json` |
| Integrity checks | `SHA256SUMS.txt` |

Existing v0.5.0 installations can receive v0.6.0 through the built-in updater once publication completes. Manual installers remain available on this release page. Local backup archives, conversation notes, screenshots and diagnostic logs are excluded from the repository.

If v0.6.0 is already installed, use the refreshed installer manually to receive the interface fixes: the updater does not propose an update to the same version.

### Validation

Before publication preparation: 83 native data-module tests passed; 67 applicable patch cases across three existing fixtures matched Apollo's reference C executor byte for byte. Frontend builds, translation checks and browser checks covered preview/application/Undo/Redo and several window sizes. These checks do not establish console compatibility.

The release workflow also validates catalogs, localized update summaries, patch translations, presets and UI strings, then runs the full native test suite before building and signing both platform packages.

### Credits

Thanks to [Noxde](https://github.com/Noxde) for the original editor, [Valentino Amato](https://github.com/valentinoamato) for the equipment insertion method and GA-slot correction, and [Bucanero / Damián Parrino](https://github.com/bucanero) for Apollo. Bloodborne patch credits: xdgmods, officialahmed0, krustytoe and XGamerManX. Pinned sources and licensing are recorded in [Apollo provenance](../../src-tauri/resources/patches/NOTICE.md).

### Added

- Character presets for the nine displayed statistics, with up to 20 named presets stored on the device. Preview the values, load the draft, then Confirm before applying an undoable edit.
- Before/after comparisons in the revision panel: one overview against the last opened/saved snapshot, accompanied by the timestamped operation log. Item names and effects reuse the existing translation catalogues.
- Experimental weapon and armor addition in both Inventory and Storage, behind an explicit confirmation.
- English and all 13 existing translations for the new controls and comparison labels; no additional language is introduced.
- Regression coverage for preset validation, storage failures, immutable comparison history, equipment insertion, shifted offsets and rejection without mutation.

### Changed

- Flags feedback now uses the application's dark/gold dialogs with keyboard dismissal and focus management.
- Confirmation dialogs, preset lists and comparison tables wrap long translated text and scroll within their panels.
- Stat confirmation disables repeated submissions, accepts whole numbers and preserves the existing transactional Undo/Redo mechanism.
- README credits now explicitly acknowledge Valentino Amato.
- Release packaging preserves the Windows/Linux naming scheme and publishes only after both signed builds succeed.

### Fixed

- Applied [valentinoamato's GA-slot correction](https://github.com/Noxde/Bloodborne-save-editor/commit/f562c2893a4efdf3b281dc21dc89845c080d8d34) to equipment insertion in both destinations: scan 4096 typed records and replace an 8-byte vacancy with a 60-byte equipment block.
- Rebuild all shifted offsets and parsed views after insertion so subsequent edits do not use stale positions. Reject invalid sections, exhausted/colliding handles, full destinations and insufficient verified zero padding.
- Corrected small-card text measurement to use the actual canvas width and font. Complete item names remain available as accessible labels/tooltips.
- Corrected Chalice filtering in the Add catalogue and removed obsolete instructions that only recommended replacement.
- Fixed dialog overflow and keyboard focus behavior; comparison values remain stable after subsequent edits.

### Removed or deliberately limited

- Removed native-style Flags feedback and obsolete Add instructions.
- Removed the old fixed-region overwrite from the experimental equipment path. The upstream debug prints, developer-specific export path and intentional test panic are not included.
- Character presets do not include equipment, identity, currency or progression. Comparisons cover exposed fields, with a 200-row display limit and an omitted-row count; they are not full binary comparisons.
- NPC resurrection and relocation remain unvalidated and unavailable as write controls.

### Equipment compatibility

Equipment insertion remains experimental. The file size is preserved by consuming 52 bytes of verified zero padding; saves with nonzero tail data or unsupported layouts are refused rather than truncated. Test on a copy and retain the original until in-game verification. Automated parser tests do not prove PS4 compatibility. Existing equipment replacement remains available.

### Release artifacts

| Platform | Artifact |
| --- | --- |
| Windows x64 | `Bloodborne_Save_Editor_Enhanced_0.5.0_x64-setup.exe` |
| Windows updater signature | `Bloodborne_Save_Editor_Enhanced_0.5.0_x64-setup.exe.sig` |
| Ubuntu/Linux x64 | `Bloodborne_Save_Editor_Enhanced_0.5.0_amd64.AppImage` |
| Linux updater signature | `Bloodborne_Save_Editor_Enhanced_0.5.0_amd64.AppImage.sig` |
| Automatic updater | `latest.json` |
| Integrity checks | `SHA256SUMS.txt` |

### Automated validation and updating

The release workflow checks catalogue and localization coverage, preset/comparison regressions, frontend compilation and the native Rust suite before packaging Windows and Linux. Signatures, combined updater metadata and checksums are attached before publication. Existing v0.4.0 installations can update to v0.5.0 using the built-in updater.

### Credits

Thanks to [Noxde](https://github.com/Noxde) for the original editor and [Valentino Amato (valentinoamato)](https://github.com/valentinoamato) for the original equipment insertion method and its subsequent GA-slot fix.

#### Refreshed v0.5.0 packages

- Fixed a missing restart permission in the desktop updater. Installation errors remain visible, with a link to the release for manual installation; a failed restart can be retried without downloading again.
- Fixed character presets overlapping the statistics below them, including narrow layouts.
- The revision journal now displays one aggregate before/after comparison. The timestamped operation log, Undo/Redo, and save generation remain available.
- Removed internal `docs/` reports from tracked source files and source archives.
- Release creation and updater-manifest publication now use the repository owner's release token.

**Already running v0.5.0?** Reinstall the refreshed package manually once. Automatic update checks do not offer another build with the same version number. Older installed clients retain their previous updater code until replaced.

## v0.4.0

This release focuses on safer decrypted-save handling, clearer progression tracking, storage visibility, and complete localization coverage for the new interface. It preserves the backup-first workflow and signed automatic updates for Windows and Linux.

> Use only decrypted copies of your saves. Keep the automatic `.bak` and an independent backup until the edited character has loaded successfully in-game.

### Added

- Extended validation for runtime Gem/Rune names and notes, empty translations, and known English fragments across all 13 translated locales.
- Maintainable translated labels for 3,662 distinct Gem/Rune effects across 68 source families, with checks preserving source signs, numeric values, percentages and internal levels.

- Multilingual Inventory and Storage search using the same localized names, descriptions, and Gem/Rune effects as the item cards, while retaining English search aliases. Searches ignore case and accents and handle Turkish dotted/dotless I.
- Localized labels for all 11 character/stat fields, 43 teleport destinations, and six teleport categories across the existing 13 translated languages and English. No additional language is introduced in this release.
- Localized NPC-comparison errors for unreadable saves, mismatched characters, invalid progression regions, and excessive differences.
- Editable update-dialog summaries, with a shared default and optional per-version translations. The manifest carries localized notes while preserving plain English notes for older clients.
- Targeted regression checks for localized item/effect search, rune aliases, teleport coverage, and update summaries.

- Live free-slot counters for Inventory and Storage.
- A chronological progression screen covering all 22 base-game and DLC bosses.
- Main-path, optional, and DLC markers, plus a defeated/total progress counter.
- Fully localized boss names, progression phases, capacity labels, and compatibility messages for French, Italian, German, Spanish, Dutch, Polish, Russian, Danish, Norwegian Bokmål, Finnish, Swedish, Turkish, and Portuguese (Portugal), with English included as the base language.
- A read-only NPC research workspace with localized names for the Plain Doll, Eileen, Alfred, Djura, Arianna, Adella, the Chapel Dweller, Iosefka, Gilbert, Patches, Valtr, and Simon.
- Backend paired-save comparison validation remains available for research; the comparison form has been removed from the NPC interface.
- Automatic recognition of the exact LF-to-CRLF binary expansion found in some decrypted save transfers.
- An explicit compatibility dialog when an affected save is repaired in memory.
- Catalog and localization audit tooling for 578 canonical names, 278 available descriptions, and 3,905 Gem/Rune effect strings across all 13 translated locales.
- Automated tagged-source validation in GitHub Actions before release packaging.
- Automated `SHA256SUMS.txt` generation for the Windows installer and Linux AppImage.

### Changed

- Inventory and Storage free-slot counts use matching compact search headers, with controls aligned near Favorites. Gem/Rune capacity panels have been removed from navigation to restore direct access to the tabs.
- Teleport menus use non-selectable category headings followed by their destinations; repeated category/area text is removed from each destination. Keyboard navigation selects destinations only.
- The NPC page is simplified by removing its comparison form and redundant backup-first footer.
- Statistics Reset and Confirm buttons occupy the right-hand column beside the last statistic, with a stacked layout at narrow widths.
- The Flags workspace uses the same styled background as the NPC and Boss workspaces.
- Localized inventory search text is indexed when the inventory or language changes, avoiding repeated translation work on every keystroke.

- Version metadata and application branding are updated to v0.4.0.
- Bosses are displayed in progression phases instead of a flat two-column list.
- Long translated boss names, badges, counters, and controls now wrap or reflow without overflowing their panels.
- The sidebar no longer contains the Gem/Rune capacity panel or redundant backup guidance that forced unnecessary scrolling.
- Save parsing now rejects empty, malformed, truncated, or structurally unsupported files with controlled errors instead of allowing legacy bounds failures to reach the interface.
- Composite edits are applied through revision checkpoints so failed multi-step operations can roll back cleanly.
- Save output is staged and synchronized before replacement, with a Windows rollback path if destination replacement fails.
- Equipment, upgrade, slot, quantity, statistic, username, playtime, position, and appearance operations now perform stricter range and reference validation.
- Direct equipment and Gem/Rune allocation reuse only verified orphaned records and never grow or shift the opaque save layout.
- The automatic `.bak` is created only after a file has passed parsing and structural validation.
- A repaired CRLF-expanded save keeps the exact imported source in `.bak`; normalization affects only the in-memory working copy until the user explicitly saves.
- Danish, Finnish, and Dutch Gem/Rune effect translations were completed where audit gaps remained.
- Rune preset validation now maps Anti-Clockwise Metamorphosis Tier 2 to Stamina rather than HP.
- GitHub Actions continue to produce signed Windows NSIS and Ubuntu/Linux AppImage bundles using the established asset-name pattern.
- The combined updater manifest continues to publish Windows and Linux URLs with their embedded signature contents.

### Fixed

- Corrected weapon names, uncanny/lost/bloody variants, mixed English item/armor/chalice terminology, and inconsistent names between numbered tiers in all 13 translated locales.
- Corrected residual English effect abbreviations, malformed hidden-effect labels and duplicate signs such as `++` and `--`; effect values and save identifiers remain canonical.
- Description localization now substitutes explicitly quoted rune names only, preventing short English names from corrupting substrings in already translated words.

- Inventory and Storage searches now find the translated text displayed on item cards instead of requiring English names.
- The corrupted-save dialog no longer appends a duplicate raw English error to the translated message; diagnostic details remain in the console.
- NPC comparison failures and file-picker errors use translated messages instead of displaying raw backend errors.
- The update popup translates the previous generic English release-guidance sentence in all 13 translated languages.
- Statistic labels and teleport destinations no longer expose untranslated internal display names.
- Search and favorites buttons no longer accidentally change the selected inventory category.
- The four Rust helpers used only by unit tests (`get_slot_mut`, `get_article_mut`, `get_equipped_upgrade_mut`, and `get_upgrade_mut`) are compiled under `#[cfg(test)]`, removing their production `dead_code` warnings without suppressing unrelated warnings.

### Removed or deliberately disabled

- Duplicate Inventory/Storage capacity entries in the scrolling sidebar.
- Repeated category text in teleport options and the unused English-only search helper.

- Unchecked write paths that could continue after an invalid offset, missing equipment block, missing upgrade reference, or failed composite edit.
- Silent fallback behavior for unsupported binary save layouts.
- Individual NPC alive/dead write controls remain disabled. An isolated old-woman test loaded successfully but did not revive the NPC; the death quest state returned after the game test. NPC resurrection and relocation are not validated features of this release.

Localization coverage is verified against the project catalogs. This does not certify every lore paragraph as identical to the official game translations. The 25 chalices without source descriptions remain without invented lore text.

### Save-transfer compatibility

One supplied affected save was exactly 2,807 bytes larger than the canonical `0x140000`-byte character file. Every added byte matched a text-mode LF-to-CRLF expansion. v0.4.0 repairs only this complete, mathematically consistent pattern; unrelated oversized or malformed files are rejected rather than guessed.

This evidence points to a text-mode transfer or export stage, not by itself to a CUSA00207/CUSA03173 data-layout difference. FTP clients should transfer decrypted save files in binary mode.

### Release artifacts

| Platform | Artifact |
| --- | --- |
| Windows x64 | `Bloodborne_Save_Editor_Enhanced_0.4.0_x64-setup.exe` |
| Windows updater signature | `Bloodborne_Save_Editor_Enhanced_0.4.0_x64-setup.exe.sig` |
| Ubuntu/Linux x64 | `Bloodborne_Save_Editor_Enhanced_0.4.0_amd64.AppImage` |
| Linux updater signature | `Bloodborne_Save_Editor_Enhanced_0.4.0_amd64.AppImage.sig` |
| Automatic updater | `latest.json` |
| Integrity checks | `SHA256SUMS.txt` |

### Automated validation

The release workflow validates catalog/localization coverage, builds the production frontend, and runs the native Rust test suite before starting either signed platform build. The updater manifest and final release notes are refreshed after both Windows/Linux packaging jobs succeed. Targeted multilingual search and update-summary checks run alongside the catalog audit.

### Updating an existing installation

This publication replaces the earlier v0.4.0 packages with the corrected build while retaining version 0.4.0 and the established asset names. Installations older than v0.4.0 can use the built-in updater. If v0.4.0 is already installed, download and reinstall the refreshed Windows installer or replace the Linux AppImage: the updater does not treat the same version number as a newer release.
