# Préparation du travail DA-1 (DA Master Plan)

- **Référence normative** : Master Plan v1.5 §2bis, §8, §9.4, §12, §17, §23, §31 (Phase 1), §32 (DA-1), §36.1 (GATE 10), §36.4 (VR-14, VR-15) ; arbitrages P1, P3, P6, P9, P11, ART-1, G-1, G-2.
- **Statut** : document de préparation. **Ce n'est pas la DA.** Aucune palette, typographie ni composant n'est choisi ici.

## 1. Rôle de DA-1 (modèle G-1)

- **DA-1** est un **checkpoint** : il produit la preuve (le DA Master Plan validé).
- **GATE 10** est la règle de blocage : **l'entrée en Phase 4 est bloquée par GATE 10 tant que DA-1 n'est pas validé** (P1 D2, lu selon G-1).
- La DA peut être préparée avant (§2bis).
- Livrable prévu par v1.5 : `docs/da-master-plan.md`, **2 à 3 pistes** (§2bis).

## 2. Point de départ — DA provisoire (statut PROVISIONAL, §2bis)

- Registre : premium, contemporain, atelier français, précision, chaleur, simplicité.
- Distinction obligatoire des identités visuelles existantes de l'atelier et de ses marques sœurs (relevés v1.4 cités au §2bis du Master Plan).
- Piste indicative : ivoire / encre / accent laiton.
- **Non contraignante techniquement** : le code ne porte que des tokens sémantiques à valeurs remplaçables (`--color-surface`, `--color-ink`, `--color-accent`, échelles).
- Les **polices de gravure** ne relèvent pas de la DA mais du catalogue (VR-08).

## 3. Périmètre obligatoire du DA Master Plan (§2bis)

| # | Élément | Contraintes normatives à respecter |
|---|---|---|
| 1 | Identité | Différenciation des identités existantes de l'atelier et des marques sœurs |
| 2 | Palette | Contrastes mesurés |
| 3 | Typographie UI | Licences ; distincte des polices de gravure (VR-08) |
| 4 | Iconographie | — |
| 5 | Photographie | Photos réelles par famille : VR-15 (rattachement de phase À CONFIRMER) |
| 6 | Composants | Tokens sémantiques |
| 7 | Configurateur (mobile / desktop) | Étape matière : **4 familles**, chacune avec **son procédé** (3 procédés), TroLase et TroLase Metallic signalés « même procédé » (P3) ; **aucune étape finition** (P4) ; dimensions standard / sur mesure avec retour par opération ; **orientation de pose jamais affichée** (P6) ; aucun sélecteur d'encre ; trous : défaut 3,0 mm adapté et **signalé avant envoi** (P11) ; upload |
| 8 | Micro-interactions | — |
| 9 | Motion | Respect de reduced motion |
| 10 | Responsive | Mobile d'abord (§2) |
| 11 | Accessibilité | Tests axe prévus (§30) |
| 12 | Ton rédactionnel | Vocabulaire canonique ; « technologie » non normatif (P3 D2) ; libellés de procédé : « gravure laser », « découpe + impression UV », « gravure envers + UV noir » (P3, P9) |
| 13 | Checkout | Prix de la plaque figé au BAT validé, jamais remplacé en silence (G-2) |
| 14 | BAT (écran de vérification) | Rendu serveur de la version normalisée ; avertissement + rendu + **acceptation avant BAT** pour toute transformation visible d'artwork (ART-1) ; procédé rappelé en clair ; modification demandée = nouveau BAT (G-2) |
| 15 | Backoffice | Seulement si le scénario A/B/C l'exige (§21) |

## 4. Messages et états à couvrir par la DA (issus des arbitrages)

| Situation | Exigence | Source |
|---|---|---|
| Promesse couleur Plexiglass | Seulement si une référence couleur est active et validée ; jamais « Plexiglass UV couleur » générique | P9 D3, D4 |
| Bandeaux de procédé (upload) | Trois messages selon le procédé ; message Plexiglass adapté à la politique réelle de la référence | §9.4 |
| Transformation visible d'artwork | Avertissement, rendu normalisé, acceptation explicite | ART1-D1, D6 |
| Rejet `ARTWORK_COLOR_NOT_ALLOWED` | Explication actionnable | ART1-D7, §9.5 |
| Trous indisponibles | Explication compréhensible | P11 D2 |
| Configuration non fabricable | Explication + alternatives uniquement si fabricables | §8, Annexe B |
| Découpe sur mesure | Message §23 : « Votre plaque peut être réalisée aux dimensions dont vous avez besoin, sous réserve des contraintes de fabrication du modèle choisi. » | §23 |

## 5. Critères de contrôle DA-1 (§32)

Identité ; différenciation vis-à-vis des identités existantes ; typographie ; palette ; photographie ; écrans du configurateur (4 familles / 3 procédés) ; non-généricité.

## 6. Entrées nécessaires et points ouverts

| Entrée | Statut |
|---|---|
| DA Master Plan (VR-14) | À PRODUIRE (travail de direction artistique) |
| Photos réelles par famille (VR-15) | À FOURNIR ; rattachement À CONFIRMER |
| Références et apparences réelles (swatches) | À VALIDER (questionnaire atelier, GATE 1) |
| Écrans backoffice | Dépendent du verdict ARCH-BACKOFFICE (GATE 9) |

## 7. Hors périmètre de ce document

Aucun choix de palette, de typographie, de composant ni de maquette. Aucune UI codée. Aucune modification de GATE 10.
