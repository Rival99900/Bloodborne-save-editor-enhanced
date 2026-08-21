# Bloodborne Save Editor Enhanced

> A passion-driven modernisation of the original Bloodborne save editor, designed to make advanced save editing clearer, safer, and more comfortable to use.

[![Release](https://img.shields.io/github/v/release/Rival99900/Bloodborne-save-editor-enhanced?display_name=tag&sort=semver&color=37B700)](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases) [![Pre-release](https://img.shields.io/github/v/release/Rival99900/Bloodborne-save-editor-enhanced?display_name=tag&sort=semver&include_prereleases&label=pre-release&color=dea607 )](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases )
 [![Windows x64](https://img.shields.io/badge/platform-Windows%20x64-2f6f9f)](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases) [![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-c8b364)](LICENSE)

**Bloodborne Save Editor Enhanced** expands the work of the original [Bloodborne Save Editor by Noxde](https://github.com/Noxde/Bloodborne-save-editor). This project was made with passion and respect for that foundation, with the aim of providing a cleaner interface, safer save workflows, more complete Gem and Rune editing, and practical quality-of-life improvements for the Bloodborne community.

> **Credits.** Huge thanks and congratulations to [Noxde](https://github.com/Noxde) for the original project. This enhanced edition exists because of that valuable open-source work.

## Download

Download the latest **Windows x64 installer** from the [Releases page](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases). Each public release contains only the `.exe` installer.

### Current pre-release

| Field | Details |
| --- | --- |
| **Name** | **Bloodborne Save Editor Enhanced v0.2.0 Beta 5** |
| **Version** | `v0.2.0-beta.5` |
| **Status** | Pre-release — test on a copied, decrypted save and retain the automatic `.bak` backup. |
| **Download** | [Windows x64 installer](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases/download/v0.2.0-beta.5/Bloodborne_Save_Editor_Enhanced_0.2.0-beta.5_x64-setup.exe) |

| Step | What to do |
| --- | --- |
| **1. Prepare your save** | Use an already decrypted Bloodborne save and make an independent copy before editing. |
| **2. Install** | Run the Windows x64 installer from the Releases page. |
| **3. Open** | Select **Open save** or press `Ctrl+O`. |
| **4. Edit carefully** | Review every change in the editor before selecting **Confirm**. |
| **5. Save and test** | Press `Ctrl+S`, keep the automatic `.bak` backup, and test the save in-game. |

> **Important:** This application edits save data. Always preserve the `.bak` backup and an independent copy of your decrypted save until you have verified the result in-game. You remain responsible for every modification made to your save.

## Highlights

| Area | What is included |
| --- | --- |
| **Responsive editor** | Reference-aligned Gem and Rune editing panels, bounded effect lists, stable scrolling, and controls that remain visible in normal and narrow windows. |
| **Stats** | Editable values up to **2,000,000,000**. |
| **Inventory** | Compatible items, keys, and chalices can be added; weapon and armor replacement preserves their slot data. |
| **Gem Forge** | Validated built-in presets, a six-effect custom builder, complete preview drafts, and confirmation-based save writing. |
| **Rune Forge** | Dedicated Caryll Rune presets, a six-effect custom builder, reliable rune previews, and Type selection. |
| **Shared personal presets** | Save a preset once in Gem Forge or Rune Forge, then load it from either forge through the shared **My presets** library. |
| **Effect compatibility** | The editor recognises compatible rune-origin effects found in gem slots, keeping their descriptions and previews available instead of silently dropping them. |
| **Flags** | Clearer explanations, impact details, warnings, confirmation before applying, and smoother large-list scrolling. |
| **Safe closing** | When there are unsaved changes, choose to save, close without saving, or cancel. The discard-and-close action exits correctly. |

## Gem Forge and Rune Forge

Both Forge tools update the visible draft first. Nothing is written to the save until you select **Confirm** in the editor.

### Built-in and custom sets

Gem Forge provides validated effect presets and an expanded custom six-slot builder. Rune Forge provides Caryll Rune presets and the same six-slot workflow. Empty entries remain as **No Effect**, so a saved or applied set always contains the expected six positions.

### Shared My presets library

Use **Save as preset** below the Gem or Rune preview to store the current draft. The preset is saved locally on your device and appears in **My presets** in both Gem Forge and Rune Forge. Older personal Gem and Rune preset collections are automatically included in this shared library.

When loading a preset in the other editor type, its effects are applied to the draft while the destination keeps a valid local **Shape** for a gem or **Type** for a rune.

## Keyboard shortcuts and controls

| Action | Shortcut or control |
| --- | --- |
| Open a decrypted save | `Ctrl+O` |
| Save changes | `Ctrl+S` |
| Close the Add window | Close button, `Escape`, or click outside the window |
| Zoom the interface | `Ctrl` + `+`, `Ctrl` + `-`, or `Ctrl` + `0` |
| Discard edited changes and exit | **Close without saving** in the unsaved-changes dialog |

## Save safety

The editor creates a `.bak` backup as part of its normal save workflow. Confirmations, error messages, and the unsaved-changes dialog are designed to prevent accidental writes or silent loss of work.

> Use experimental save modifications responsibly. Avoid editing saves intended for online play, and do not delete backups until the edited save has been verified.

## Automatic updates

The Windows updater verifies downloaded packages against the application’s embedded public signing key before installation. Release assets remain simple: the GitHub release contains only the installer, while the signed update metadata is stored separately for the updater.

## Development

This project uses **Tauri v2**, **React**, and **Vite**.

```bash
npm install
npm run build
npm run tauri -- build
```

To publish a signed Windows release, the repository workflow requires the following GitHub repository secrets:

| Secret | Purpose |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | The complete, unmodified Tauri private signing key. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | The password associated with the signing key. |
| `RELEASE_TOKEN` | A fine-grained personal token with repository Contents read/write access, used to publish releases under the repository owner account. |

Never place private keys, passwords, or access tokens in source code, issues, release notes, or logs.

## Credits and license

This project is distributed under the [GPL-3.0](LICENSE). It is derived from the original work by [Noxde](https://github.com/Noxde/Bloodborne-save-editor) and continues under the same open-source license.
