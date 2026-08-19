# Bloodborne Save Editor — Enhanced

> **An offline desktop editor for decrypted Bloodborne character saves, derived from [Noxde’s Bloodborne Save Editor](https://github.com/Noxde/Bloodborne-save-editor).**

This project retains the upstream editor’s save-editing capabilities while improving the application shell, file-operation safety and interface clarity. It is intended for **offline, personal save management**. Do not use altered save files to cheat, grief or affect other players in online play.

## Improvements in this version

| Area | Improvement |
| --- | --- |
| File handling | Opening states the decrypted-save requirement; cancelling a dialog cannot trigger a write; every save requires confirmation; and write errors are shown clearly. |
| Backup awareness | The interface explains that opening a save creates a `.bak` copy and repeatedly prompts users to retain it until the result is verified in-game. |
| Navigation | The active section is visibly marked, all available editors use one navigation model, and sections are locked until a save is loaded. |
| Interface | The layout is a responsive workspace with file status, an explanatory welcome screen, visible keyboard focus and reduced-motion support. |
| Reliability | Global event listeners are released correctly, keyboard zoom starts from a valid value and is constrained, and native saving rejects absent destinations or missing active saves. |

## Editor capabilities

The editor supports inventory and storage management, item quantities, item transformation, character attributes, Blood Echoes, insight, appearance-related data, gems and runes, gem slots, boss state, flags and lantern teleportation. The underlying file-format logic and feature behavior originate from the upstream project and remain subject to its save-format constraints.

## Prepare the save safely

This application accepts **decrypted character saves**. A PlayStation save exported directly from a console cannot be opened until it has been decrypted. Consult the upstream [decryption guide](https://github.com/Noxde/Bloodborne-save-editor/wiki/How-to-decrypt-a-save) before proceeding.

Before editing, copy the original save to a separate location. The editor creates a backup when it opens a file; retain that backup until the edited file has been loaded and verified in-game. Save to a deliberate destination instead of replacing an original file blindly.

> This tool is designed for local, offline editing. The user is solely responsible for maintaining backups and for any use of edited save data.

## Development

The project is a Tauri 2 desktop application with a React and Vite frontend. Install Node.js dependencies and a Rust toolchain, then run the development mode:

```bash
npm install
npm run tauri dev
```

To validate the web interface without starting the desktop shell:

```bash
npm run build
```

To create a desktop release package:

```bash
npm run tauri build
```

The exact system packages required by Tauri vary by operating system; refer to the [Tauri prerequisites](https://tauri.app/start/prerequisites/).

## Attribution and license

This is a derivative work of [Noxde/Bloodborne-save-editor](https://github.com/Noxde/Bloodborne-save-editor), which is licensed under the GNU General Public License version 3.0. The complete GPL-3.0 license and the original project materials are retained in this repository. Any distribution of this derivative must comply with the GPL-3.0 terms.

The upstream author credits **Meph** and the [Bloodborne Wiki](https://www.bloodborne-wiki.com/) for weapon statistics, game assets and UI inspiration; **foxyhooligan** for gem-effect IDs, New Game+ data and flags; [PlayingUnfairly](https://www.youtube.com/@PlayingUnfairly) for detailed editing tutorials; **xtrin** for gem-image behavior information; and **n3r4_** for a boss-flag spreadsheet. Those contributions are gratefully acknowledged here.

## Repository policy

The project intentionally uses one working branch: `main`.

## References

[1] [Noxde/Bloodborne-save-editor — upstream source](https://github.com/Noxde/Bloodborne-save-editor)

[2] [GNU General Public License v3.0](https://www.gnu.org/licenses/gpl-3.0.html)

[3] [Tauri prerequisites](https://tauri.app/start/prerequisites/)
