# Diagnostic local v0.4.0 — vieille dame de Cathedral Ward

## Résultat du test du 10 septembre 2026

L'utilisateur confirme que la copie expérimentale charge, mais que la vieille dame ne revient pas après rechargement de la zone/respawn. La restauration précédente de 21 octets est donc **insuffisante** dans ce cas. L'archive du 9 septembre ne doit pas être considérée comme un correctif de réanimation.

## Ce que les fichiers permettent de vérifier

Une correspondance des petits flags communs a été déduite : repère de comparaison + `0x36D + flag // 8`, masque `0x80 >> (flag % 8)`. Elle est cohérente avec les transitions des scripts et avec un état actif par plage pour les cinq résidents examinés. Il s'agit d'une correspondance de recherche sur ce format de sauvegarde, pas d'un convertisseur universel d'identifiants d'événements.

| Fichier examiné | État actif dans 1180–1199 |
| --- | --- |
| A, tous les PNJ vivants selon l'utilisateur | 1186 |
| B, vieille dame tuée selon l'utilisateur | 1183 |
| Copie expérimentale fournie le 9 septembre, avant passage dans le jeu | 1186 |

Dans B, le flag 1183 correspond à l'adresse `0x2185C`, masque `0x01`. Le flag 1186 correspond à `0x2185D`, masque `0x20`. Le premier essai a bien retiré le premier et remis le second. Il serait donc incorrect de dire que cet essai n'avait simplement pas restauré le flag de quête.

L'association de la plage 1180–1199 à la vieille dame est étayée par le changement isolé signalé par l'utilisateur et par la logique de chaise, de déplacement et de départ/retour des scripts. Les noms humains ne figurent pas explicitement dans ces fonctions décompilées.

## Mort, présence et destination dans les scripts

Sources examinées : [Cathedral Ward](https://github.com/Grimrukh/soulstruct-vanilla/blob/e6de1b79370755152f4f89c4a106a2d67c9ae674/bloodborne/events/m24_00_00_00.evs.py) et [Central Yharnam / clinique](https://github.com/Grimrukh/soulstruct-vanilla/blob/e6de1b79370755152f4f89c4a106a2d67c9ae674/bloodborne/events/m24_01_00_00.evs.py), dépôt Soulstruct Vanilla. Ces sources sont une décompilation publique ; leur identité exacte avec les fichiers de l'installation PS4 de l'utilisateur n'a pas été vérifiée.

- `12400501` attend la mort du personnage `2400730`, efface la plage 1180–1199, active 1183 et demande une sauvegarde. Il ignore déjà les états 1183, 1189 et 1191.
- `12400500`, appelé au préchargement de la carte, reconstruit la présence du personnage. En 1186, il active `2400730`, désactive sa seconde représentation `2400732`, restaure l'objet `2400731`, place le personnage en `2404501` et applique une animation assise. Cette branche ne contient pas d'instruction explicite de restauration de santé/résurrection.
- Le même événement traite plusieurs états : 1185 pour une autre animation, 1187 pour une absence, 1189 pour une seconde représentation située ailleurs avec butin, 1183 pour le traitement de mort à la chapelle. Ces états ne se réduisent pas à un booléen vivant/mort.
- La branche d'envoi à la chapelle passe par 1193 puis 1181. La branche de clinique passe par 1194 puis 1190 (`12410742–12410745`). Le drapeau 1190 participe à l'activation du personnage `2410294` à la clinique (`12410669`, slot 4).
- Dans A, B et la copie test, la branche 1190 n'est pas active. Les données examinées ne montrent donc pas un basculement involontaire vers la clinique.

## Cause probable et limite de preuve

Le flag de quête seul a été restauré, sans réanimation en jeu. Une explication compatible avec le code est qu'une donnée persistante du personnage reste morte/à santé nulle. Le jeu pourrait alors réactiver 1183 via `12400501`. Une autre dépendance de chargement ou d'événement peut également bloquer la présence.

**La réactivation de 1183 après chargement n'est pas encore observée dans un fichier.** Nous n'avons pas l'export post-test. Aucun octet n'a été identifié avec certitude comme la santé ou la mort persistante de `2400730`.

Une comparaison étendue, en gardant le décalage de sections déjà observé, trouve 35 différences supplémentaires entre les positions relatives 30 000 et 120 000, hors de la fenêtre du premier essai. Elles sont toujours présentes dans la copie test. Cette extension n'est pas encore un parseur validé des sections : ces différences ne doivent pas être toutes assimilées à des flags de PNJ ni copiées en bloc.

## PNJ présentant une logique comparable

Le script de la chapelle contient des plages indépendantes et des dépendances croisées. Les associations de noms ci-dessous restent des identifications de recherche, non des contrôles de réanimation validés.

| PNJ | Plage étudiée | Particularité observée |
| --- | --- | --- |
| Vieille dame | 1180–1199 | Plusieurs présences/absences, mort, branche chapelle et branche clinique. |
| Homme méfiant | 1160–1179 | Présence à la chapelle en 1164/1165, mort déclenchant 1161, clinique liée à 1163. |
| Arianna | 1220–1239 | Plusieurs représentations et étapes de quête ; une modification isolée peut contredire la progression. |
| Adella | 1300–1319 | Plusieurs représentations ; `12400900` peut changer simultanément son état et celui de la plage d'Arianna. |
| Résident de la chapelle | 1100–1119 | Son état dépend également des états des autres résidents (`12400705`). |

En pratique, une future réanimation doit distinguer état de quête, état persistant du personnage et présence/destination, puis préserver les dépendances propres à chaque PNJ. Cette recherche ne valide pas un réglage générique pour tous les personnages.

## Travail effectué et prochaine donnée nécessaire

- Ajout de `scripts/diagnose_old_woman.py`, strictement en lecture seule, pour afficher les plages étudiées et les différences supplémentaires.
- Vérification sur A, B et la copie test : états 1186/1183/1186, 35 différences extérieures à l'ancienne fenêtre, rejet des grands identifiants d'événements par le lecteur de petits flags.
- Aucun bouton de réanimation activé et aucune nouvelle sauvegarde modifiée produite dans ce diagnostic.
- Prochaine donnée : exporter avec Apollo le `userdata0001` après avoir chargé la copie expérimentale, constaté l'absence de la vieille dame, puis quitté normalement le jeu. Si 1183 est réactivé, cela étayera une réécriture par le jeu ; s'il reste désactivé, la recherche devra viser l'état persistant/la présence indépendamment de ce flag.

Tout reste en local, sans push ni publication GitHub.

## Réexport reçu et vérifié le 12 septembre 2026

Le ZIP transmis contient un seul fichier de 1 310 720 octets. La vérification CRC de l'archive réussit. SHA-256 du fichier extrait : `908667e48c66b8fe51bcc64237cc0a90f20e565ad9167511ba91a2c6200863e3`. Repère de comparaison : `0x2145C`, identique à B et à la copie expérimentale. Les champs de nom de personnage concordent.

| Fichier | État actif dans 1180–1199 | Flag 1183 | Flag 1186 | Flag 1190 (clinique) |
| --- | --- | --- | --- | --- |
| A, référence vivante | 1186 | 0 | 1 | 0 |
| B, après mort | 1183 | 1 | 0 | 0 |
| Copie expérimentale avant test | 1186 | 0 | 1 | 0 |
| Réexport après test | 1183 | 1 | 0 | 0 |

Le retour à l'état 1183 est maintenant constaté dans le fichier réexporté. Cela est compatible avec une réécriture par le jeu après l'import décrit par l'utilisateur. La comparaison n'observe pas directement l'exécution d'un événement et ne permet pas d'attribuer avec certitude cette écriture à `12400501`, ni de prouver la cause persistante exacte.

Sur les 21 octets modifiés initialement :

- 14 ont dans le réexport leur valeur de B ;
- 6 ont toujours la valeur appliquée dans la copie expérimentale ;
- 1 contient une troisième valeur (`0x23072` : B=`0x18`, copie=`0x00`, réexport=`0x08`).

Dans la fenêtre de 30 000 octets, le réexport diffère de B sur 7 octets et de la copie expérimentale sur 15 octets. Entre les positions relatives 30 000 et 120 000, il est identique à B et à la copie expérimentale : les 35 différences avec A persistent. Leur rôle n'est toujours pas identifié. Ces résultats portent sur les fenêtres indiquées, pas sur l'ensemble du fichier.

L'état actif de la plage du résident de la chapelle est également revenu de 1105 dans la copie expérimentale à 1102 dans le réexport. Les plages examinées de l'homme méfiant (1165), d'Arianna (1235) et d'Adella (1307) sont identiques dans les quatre fichiers. Aucune nouvelle interprétation de santé ou de survie n'est déduite de ces seuls numéros.

Les nombreuses différences brutes sur l'ensemble du fichier ne doivent pas être assimilées à des changements de PNJ : 725 686 octets différents situés après la fenêtre étendue sont nuls dans le réexport, sans que leur section ait été identifiée. La petite taille du ZIP n'est donc pas un indice de troncature du fichier extrait.

### Conclusion du contrôle

La demande d'export post-test de la section précédente est satisfaite. La restauration des petits flags de quête n'a pas tenu dans le réexport et n'a pas produit de réanimation en jeu. La destination clinique n'est pas active. La piste prioritaire reste un état persistant ou une dépendance qui empêche la réanimation, mais aucun octet de santé du personnage n'est encore validé. Une réanimation ne doit pas être activée sur cette seule base.

Ajout de `compare_test_run` et des options `--dead`/`--prepared` au diagnostic en lecture seule. Vérifications réalisées sur les quatre fichiers : états 1186/1183/1186/1183, classification exhaustive 14/6/1, conservation des 35 différences extérieures à la première fenêtre. Aucun fichier de sauvegarde fourni n'a été modifié ; aucune nouvelle copie expérimentale n'a été produite et aucun push n'a été effectué.
