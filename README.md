# Bloodborne Save Editor Enhanced

> A modernized **Bloodborne** save editor designed to make sensitive save operations clearer, more reversible, and more reliable.

[![Release](https://img.shields.io/github/v/release/Rival99900/Bloodborne-save-editor-enhanced?display_name=tag&sort=semver&color=9f7a3e)](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases) [![Windows x64](https://img.shields.io/badge/platform-Windows%20x64-2f6f9f)](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases) [![GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-c8b364)](LICENSE)

**Bloodborne Save Editor Enhanced** extends the original [Noxde Bloodborne Save Editor](https://github.com/Noxde/Bloodborne-save-editor) with a responsive interface, safer save controls, and an expanded gem editor. It is intended for **already decrypted** Bloodborne saves and creates a `.bak` backup before writing changes.

## Download and get started

Download the **Windows x64** installer from [Releases](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases), install the application, and load your decrypted save with **Open save** or `Ctrl+O`.

> **Important.** Always keep the `.bak` backup, test changes in-game, and do not remove an older save until it has been verified. You remain responsible for every change made to a save file.

| Step | Recommended action |
|---|---|
| **1. Prepare** | Make an independent copy of the decrypted save before you begin. |
| **2. Edit** | Use the editor categories and review proposed effects before confirming. |
| **3. Save** | Use `Ctrl+S` or the Save button, then keep the `.bak` file created by the application. |
| **4. Verify** | Load the save in-game before deleting an earlier version. |

## Highlights

| Area | Improvements |
|---|---|
| **Inventory** | **Add** is reserved for items, keys, and chalices. Weapons and armor use **Replace** to preserve their slot data. |
| **Stats** | Values can be raised up to **2,000,000,000**. |
| **Gem Forge** | Validated presets, a six-slot custom builder, a preview before confirmation, and persistent personal presets. |
| **Gems and runes** | Separate catalogs and backend validation for effect IDs help prevent incompatible combinations. |
| **Flags** | Explanation cards with impact, warnings, expandable details, and confirmation before applying a change. |
| **Save protection** | When closing with unsaved changes, the editor lets you save, close without saving, or cancel. |

## Quick controls

| Action | Shortcut or control |
|---|---|
| Open a decrypted save | `Ctrl+O` |
| Save changes | `Ctrl+S` |
| Close the **Add** window | Close button, `Escape`, or click outside the window |
| Change interface zoom | `Ctrl` + `+`, `Ctrl` + `-`, `Ctrl` + `0` |

Long lists, effect menus, and confirmation controls are designed to remain usable in narrow windows. In Gem Forge, an applied preset is immediately visible before confirmation. A modified gem can also be saved through **Save as preset** and reused in **My presets**.

## Automatic updates

The application checks published updates and only installs a package whose signature matches the embedded public key. After downloading the package, the update is applied and the editor is restarted.

A release page contains only the Windows installer. The technical manifest used for update checks is kept separately so downloads remain simple while cryptographic verification is retained.

## Development and publishing

The project uses **Tauri v2**, React, and Vite. After installing dependencies, use the following commands:

```bash
npm install
npm run build
npm run tauri -- build
```

The GitHub Actions publishing workflow requires two **Repository secrets**. They must never be added to source code, issues, releases, or logs.

| Secret | Purpose |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | The original, complete, unmodified content of the Tauri private signing-key file. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | The password associated with that key. |

> A key-decoding error means that the key or password does not match the generated file. Create or replace both **Repository secrets** together, without modifying or re-encoding the key content.

## Credits and license

This project is distributed under the [GPL-3.0](LICENSE). It is derived from the original work by [Noxde](https://github.com/Noxde/Bloodborne-save-editor) and retains that license in accordance with its open-source heritage.
