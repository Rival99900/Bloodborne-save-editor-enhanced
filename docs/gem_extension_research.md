# Recherche — extensions de gemmes et objets

## Sources consultées

- Projet de référence : https://github.com/Noxde/Bloodborne-save-editor
- Blood Gems, Bloodborne Wiki : https://bloodborne.fandom.com/wiki/Blood_Gems
- Archive d’identifiants de gemmes et runes : https://playersquared.com/threads/bloodborne-gems-rune-and-armor-hex-ids-archive.426/

## Constat sur le projet

Le backend lit les effets de gemmes depuis `src-tauri/resources/upgrades.json` et les rend au frontend via `return_gem_effects`. Les effets sont écrits par `edit_effect` sous forme d’identifiants `u32`; le format ne doit donc recevoir que des identifiants documentés. Les ressources `weapons.json`, `armors.json` et `items.json` alimentent déjà les catalogues d’objets.

## Contraintes vérifiées

- Les formes prises en charge sont Radial (1), Triangle (2), Waning (4), Circle (8) et Droplet (64).
- Une gemme Droplet est universelle pour les emplacements d’armes, tandis que les autres formes doivent correspondre au type d’emplacement.
- Les effets et formes à ajouter doivent provenir de tables documentées et ne doivent pas utiliser de valeurs arbitraires ou inconnues.
- Les modifications de gemmes doivent rester accompagnées de l’avertissement d’usage hors ligne et d’une sauvegarde de secours.

## Pistes d’extension sûres

1. Ajout de préréglages de gemmes d’attaque à partir d’identifiants déjà documentés : physique, sang, arcane, feu, foudre, charge, visée, dégâts contre bêtes / kin, régénération, durabilité et coût d’endurance.
2. Ajout d’un assistant de création de gemme : choix de forme compatible, effet principal, effets secondaires documentés, et avertissement explicite pour les combinaisons inhabituelles.
3. Ajout de filtres et de recherche par catégorie d’effet dans l’éditeur de gemmes.
4. Ajout de catégories d’objets et de favoris fondés sur les bases déjà embarquées, sans introduire d’identifiants non validés.

## Choix de sécurité

Une demande de "gemme abusée" sera couverte par des préréglages très puissants composés d’effets existants et documentés, sans prétendre créer de nouvelles statistiques internes ni des identifiants fictifs. Cela préserve la structure de la sauvegarde tout en donnant accès à des combinaisons hors normes.
