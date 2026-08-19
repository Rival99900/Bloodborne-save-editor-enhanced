# Bloodborne Save Editor Enhanced

> Un éditeur de sauvegardes **Bloodborne** modernisé, conçu pour rendre les opérations sensibles plus lisibles, plus réversibles et plus fiables.

[![Release](https://img.shields.io/github/v/release/Rival99900/Bloodborne-save-editor-enhanced?display_name=tag&sort=semver&color=9f7a3e)](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases) [![Windows x64](https://img.shields.io/badge/platform-Windows%20x64-2f6f9f)](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases) [![GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-c8b364)](LICENSE)

**Bloodborne Save Editor Enhanced** prolonge le projet original de [Noxde](https://github.com/Noxde/Bloodborne-save-editor) avec une interface responsive, des contrôles de sauvegarde plus sûrs et un éditeur de gemmes enrichi. Il est destiné aux sauvegardes Bloodborne **déjà déchiffrées** et crée une copie de secours `.bak` avant toute écriture.

## Télécharger et commencer

Téléchargez l’installateur **Windows x64** depuis les [releases](https://github.com/Rival99900/Bloodborne-save-editor-enhanced/releases), installez l’application, puis chargez votre sauvegarde déchiffrée avec **Open save** ou `Ctrl+O`.

> **Prudence.** Gardez toujours la copie `.bak`, testez les changements en jeu et ne supprimez votre sauvegarde précédente qu’après vérification. Les modifications de sauvegarde restent sous votre responsabilité.

| Étape | Action recommandée |
|---|---|
| **1. Préparer** | Faites une copie indépendante de votre sauvegarde déchiffrée avant de commencer. |
| **2. Modifier** | Utilisez les catégories de l’éditeur et vérifiez les effets proposés avant confirmation. |
| **3. Enregistrer** | Utilisez `Ctrl+S` ou le bouton de sauvegarde, puis conservez la copie `.bak` créée par l’application. |
| **4. Vérifier** | Chargez la sauvegarde dans le jeu avant de supprimer une version antérieure. |

## Points forts

| Espace | Améliorations apportées |
|---|---|
| **Inventaire** | La fonction **Add** est réservée aux objets, clés et calices. Les armes et armures utilisent **Replace** afin de préserver leurs données d’emplacement. |
| **Statistiques** | Les valeurs peuvent atteindre **2 000 000 000**. |
| **Gem Forge** | Des préréglages validés, un constructeur personnalisé à six emplacements, un aperçu avant confirmation et des préréglages personnels persistants. |
| **Gemmes et runes** | Les catalogues sont séparés et les identifiants d’effets sont validés par le backend afin d’éviter les combinaisons incompatibles. |
| **Flags** | Des cartes explicatives avec impacts, avertissements, détails dépliables et demande de confirmation avant application. |
| **Sauvegarde** | À la fermeture avec des modifications non enregistrées, l’application propose d’enregistrer, de fermer sans enregistrer ou d’annuler. |

## Contrôles rapides

| Action | Raccourci ou contrôle |
|---|---|
| Ouvrir une sauvegarde déchiffrée | `Ctrl+O` |
| Enregistrer les modifications | `Ctrl+S` |
| Fermer une fenêtre **Add** | Croix, `Échap` ou clic en dehors de la fenêtre |
| Ajuster le zoom de l’interface | `Ctrl` + `+`, `Ctrl` + `-`, `Ctrl` + `0` |

Les listes longues, les menus d’effets et les boutons de confirmation sont conçus pour rester disponibles sur les fenêtres étroites. Dans le Gem Forge, un préréglage appliqué est visible immédiatement avant sa confirmation ; une gemme modifiée peut aussi être conservée depuis **Save as preset** et réutilisée dans **My presets**.

## Mises à jour automatiques

L’application vérifie les mises à jour publiées et n’installe qu’un paquet dont la signature correspond à la clé publique embarquée. Après téléchargement, la mise à jour est appliquée puis l’éditeur est relancé.

La page d’une release ne présente que l’installateur Windows. Le manifeste technique nécessaire au contrôle de mise à jour est maintenu séparément afin de garder les téléchargements simples tout en préservant la vérification cryptographique.

## Développement et publication

Le projet utilise **Tauri v2**, React et Vite. Après installation des dépendances, les commandes principales sont les suivantes :

```bash
npm install
npm run build
npm run tauri -- build
```

La publication GitHub Actions nécessite deux **Repository secrets**. Ils ne doivent jamais être ajoutés au code, aux issues, aux releases ou aux logs.

| Secret | Utilisation |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | Le contenu original, complet et non modifié du fichier de clé privée généré par Tauri. |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Le mot de passe associé à cette clé. |

> Une erreur de décodage de clé indique que la clé ou son mot de passe ne correspond pas au fichier généré. Créez ou remplacez les deux **Repository secrets** ensemble, sans modifier ni réencoder le contenu de la clé.

## Crédit et licence

Ce projet est distribué sous licence [GPL-3.0](LICENSE). Il dérive du travail initial de [Noxde](https://github.com/Noxde/Bloodborne-save-editor) et conserve cette licence conformément à son héritage open source.
