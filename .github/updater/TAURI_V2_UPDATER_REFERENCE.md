# Référence technique — Tauri v2 auto-update

Sources officielles consultées le 26 août 2026 :

- [Tauri v2 — GitHub Actions release pipeline](https://v2.tauri.app/distribute/pipelines/github/)
- [Tauri v2 — Updater plugin and signing](https://v2.tauri.app/plugin/updater/)
- [tauri-apps/tauri-action README](https://github.com/tauri-apps/tauri-action)

## Contraintes vérifiées

1. Tauri v2 exige une clé publique dans la configuration de l’application et une clé privée disponible au build sous `TAURI_SIGNING_PRIVATE_KEY`; le mot de passe facultatif/associé est transmis par `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
2. Avec `bundle.createUpdaterArtifacts: true`, Tauri génère des signatures `.sig` pour les bundles de mise à jour : l’installateur NSIS sous Windows et l’AppImage sous Linux.
3. Un manifeste statique doit contenir une version, puis pour chaque plate-forme ciblée une URL de bundle et le **contenu** de sa signature. Les clés utiles ici sont `windows-x86_64` et `linux-x86_64`.
4. L’action officielle `tauri-apps/tauri-action@v1` prend en charge l’upload des signatures avec `uploadUpdaterSignatures: true`; elle peut créer ou mettre à jour une release existante ciblée par `tagName`.
5. Les secrets doivent rester exclusivement dans GitHub Actions. Aucun secret ne doit être versé dans le dépôt, les notes de release, les logs ou les binaires.

Le workflow `build.yml` s’appuie sur ces règles et publie un `latest.json` combiné, à la fois comme asset de release et dans `.github/updater/latest.json` pour audit des métadonnées.
