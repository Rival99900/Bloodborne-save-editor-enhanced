# Bloodborne Save Editor Enhanced

> A passion-driven modernisation of the original Bloodborne save editor, designed to make advanced save editing clearer, safer, and more comfortable to use.

[![Release](https://img.shields.io/github/v/release/Rival99900/Bloodborne-save-editor-enhanced?display_name=tag&sort=semver&color=37B700)](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases)
[![Build and signed release](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/actions/workflows/build.yml/badge.svg)](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/actions/workflows/build.yml)
[![Windows x64](https://img.shields.io/badge/platform-Windows%20x64-2f6f9f)](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases) [![Ubuntu Linux x64](https://img.shields.io/badge/platform-Ubuntu%2FLinux%20x64-f28c28)](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases) [![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-c8b364)](LICENSE)

**Bloodborne Save Editor Enhanced** expands the work of the original [Bloodborne Save Editor by Noxde](https://github.com/Noxde/Bloodborne-save-editor). This project was made with passion and respect for that foundation, with the aim of providing a cleaner interface, safer save workflows, more complete Gem and Rune editing, and practical quality-of-life improvements for the Bloodborne community.

> **Credits.** Huge thanks and congratulations to [Noxde](https://github.com/Noxde) for the original project. This enhanced edition exists because of that valuable open-source work.

## Download

Download the latest package from the [Releases page](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases). The stable distribution provides a **Windows x64 installer**, an **Ubuntu/Linux x64 AppImage**, signed updater metadata and a SHA-256 checksum manifest.

### Current stable release

| Field | Details |
| --- | --- |
| **Name** | **Bloodborne Save Editor Enhanced v0.3.0** |
| **Version** | `v0.3.0` |
| **Status** | Stable release — test first with a copied, decrypted save and retain the automatic `.bak` backup. |
| **Downloads** | [Windows x64 installer](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases/download/v0.3.0/Bloodborne_Save_Editor_Enhanced_0.3.0_x64-setup.exe) · [Ubuntu/Linux x64 AppImage](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases/download/v0.3.0/Bloodborne_Save_Editor_Enhanced_0.3.0_x64.AppImage) · [SHA-256 checksums](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases/download/v0.3.0/SHA256SUMS.txt) |

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
| **Revision control** | A local change log, real backend-synchronised Undo/Redo, rollback on failed composite edits, and a summary since the last checkpoint. |
| **Inventory tools** | Text/effect search, locally stored favorites, and responsive compact/comfortable density preferences. |
| **Preset library** | Duplicate personal presets and exchange validated Gem/Rune Forge collections through explicit JSON import/export. |
| **Languages** | The supported game-language selector includes English, French, Italian, German, Spanish, Dutch, Polish, Russian, Danish, Norwegian Bokmål, Finnish, Swedish, Turkish and Portuguese (Portugal). |

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
| Undo / Redo an in-memory change | `Ctrl+Z` / `Ctrl+Y` or `Ctrl+Shift+Z` |
| Review recent in-memory changes | **Change log** in the header |
| Close the Add window | Close button, `Escape`, or click outside the window |
| Zoom the interface | `Ctrl` + `+`, `Ctrl` + `-`, or `Ctrl` + `0` |
| Discard edited changes and exit | **Close without saving** in the unsaved-changes dialog |

## Save safety

The editor creates a `.bak` backup as part of its normal save workflow. Confirmations, error messages, and the unsaved-changes dialog are designed to prevent accidental writes or silent loss of work.

> Use experimental save modifications responsibly. Avoid editing saves intended for online play, and do not delete backups until the edited save has been verified.

## Automatic updates

The desktop application checks the signed `latest.json` manifest maintained in the repository’s `main` branch when it starts in the native Tauri window. The same manifest is also uploaded to every release for download and audit. When a newer version is available, the application presents an update dialog, downloads the platform package, verifies its embedded Tauri signature with the public key packaged in the application, installs it and restarts.

The release workflow generates and uploads the Windows NSIS installer, Ubuntu/Linux AppImage, their corresponding `.sig` files and a combined `latest.json` updater manifest. The manifest contains the **signature content**, not only a path to a signature file. This is required for Tauri v2 update verification. `SHA256SUMS.txt` is also published for manual integrity checks.

> **Security rule:** Never put `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` or `RELEASE_TOKEN` in the source tree, an issue, a release note or an application build. They are read only inside the GitHub Actions runner.

## Development

This project uses **Tauri v2**, **React**, and **Vite**.

```bash
npm install
npm run build
npm run tauri -- build
```

To publish a signed desktop release, the repository workflow requires the following GitHub repository secrets:

| Secret | Purpose |
| --- | --- |
| `TAURI_SIGNING_PRIVATE_KEY` | The complete, unmodified Tauri private signing key. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | The password associated with the signing key. |
| `RELEASE_TOKEN` | A fine-grained personal token with repository Contents read/write access, used to publish releases under the repository owner account. |

### Release procedure

1. Update the version in `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` and `package.json` together.
2. Validate locally with `npm run build`, `cargo test --all-targets`, `cargo fmt --check` and `cargo clippy --all-targets -- -D warnings`.
3. Commit the versioned source, create the matching tag (for example `v0.3.1`) and push both the `main` commit and the tag.
4. The **Publish signed desktop release** workflow creates or updates the release, signs the Windows and Ubuntu/Linux assets with the repository secrets, uploads `.sig` files and publishes the updater manifest.
5. If a tag already exists, run the workflow manually from the Actions tab and enter that exact tag. This is the recovery route used to repair a release without changing the application version.

Never place private keys, passwords, or access tokens in source code, issues, release notes or logs.

## Credits and license

This project is distributed under the [GPL-3.0](LICENSE). It is derived from the original work by [Noxde](https://github.com/Noxde/Bloodborne-save-editor) and continues under the same open-source license.
