# Notes de mise à jour Tauri 0.4.0

Source officielle consultée : https://v2.tauri.app/plugin/updater/

- Le mécanisme de mise à jour Tauri exige une signature ; cette vérification ne peut pas être désactivée.
- La clé publique est embarquée dans `src-tauri/tauri.conf.json`. La clé privée doit rester hors des dépôts ; elle sert à signer chaque artefact de mise à jour.
- La configuration `bundle.createUpdaterArtifacts: true` génère sous Windows l’installateur NSIS et son fichier `.sig`.
- Le flux statique `latest.json` doit fournir `version`, `platforms.windows-x86_64.url` et `platforms.windows-x86_64.signature`; la signature est le contenu du fichier `.sig`, pas une URL vers ce fichier.
- Pour Windows, `plugins.updater.windows.installMode: "passive"` permet une installation avec indicateur de progression et sans interaction supplémentaire.
- Après `downloadAndInstall`, l’application doit être relancée afin de démarrer la version remplacée.

Configuration 0.4.0 :

- Dépôt source privé : `Rival99900/Bloodborne-save-editor-enhanced`.
- Dépôt public minimal de diffusion, sans source : `Rival99900/Bloodborne-save-editor-updates`.
- Endpoint : `https://github.com/Rival99900/Bloodborne-save-editor-updates/releases/latest/download/latest.json`.
- La nouvelle clé publique créée est incluse dans le manifeste 0.4.0. Les versions antérieures utilisant la clé sans clé privée disponible ne peuvent pas passer automatiquement à 0.4.0 ; cette première installation 0.4.0 reste manuelle, puis les versions suivantes seront proposées dans l’application.
