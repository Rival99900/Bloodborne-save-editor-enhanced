# Technical Reference — Tauri v2 Auto-Update

Official sources consulted on August 26, 2026:

* [Tauri v2 — GitHub Actions release pipeline](https://v2.tauri.app/distribute/pipelines/github/)
* [Tauri v2 — Updater plugin and signing](https://v2.tauri.app/plugin/updater/)
* [tauri-apps/tauri-action README](https://github.com/tauri-apps/tauri-action)

## Verified Constraints

1. Tauri v2 requires a public key in the application configuration and a private key available at build time under `TAURI_SIGNING_PRIVATE_KEY`; the optional/associated password is provided via `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
2. With `bundle.createUpdaterArtifacts: true`, Tauri generates `.sig` signatures for update bundles: the NSIS installer on Windows and the AppImage on Linux.
3. A static manifest must contain a version, followed by a bundle URL and the **content** of its signature for each targeted platform. The relevant keys here are `windows-x86_64` and `linux-x86_64`.
4. The official action `tauri-apps/tauri-action@v1` supports uploading signatures with `uploadUpdaterSignatures: true`; it can create or update an existing release targeted by `tagName`.
5. Secrets must remain exclusively within GitHub Actions. No secret should be committed to the repository, release notes, logs, or binaries.

The `build.yml` workflow relies on these rules and publishes a combined `latest.json`, both as a release asset and in `.github/updater/latest.json` for metadata auditing.
