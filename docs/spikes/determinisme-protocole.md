# Protocole — spike de déterminisme (géométrie canonique)

- **Référence normative** : Master Plan v1.5 §6 (géométrie canonique), §10 (design engine, `roundMm`), §11 (trous), §7.4 (dimensionnement, orientation de pose), §12 (niveaux de déterminisme, spike), §32 (checkpoint ARCH-PREVIEW), §36.1 (GATE 3), §34 R01 ; VR-31, VR-32, OD-17.
- **Statut** : protocole documentaire. **Non exécuté. Aucun code de spike n'est autorisé dans cette tranche.**
- **Résultat attendu** : ADR-0005 (numéro réservé par v1.5) et preuve documentaire pour ARCH-PREVIEW.
- **GATE** : ce spike ne crée ni ne modifie aucun GATE. L'objet de GATE 3 reste **À CONFIRMER** (G1-DOC) ; le rapport de spike n'est qu'une preuve documentaire.

## 1. Exigences reprises de v1.5 (§12)

- **Niveau 1 — géométrie canonique : OBLIGATOIRE.** Résultat identique sur Node, Chrome, Safari iOS et Firefox (JSON canonique + SHA-256).
- **Niveau 2 — SVG canonique** : objectif fort, non bloquant (OD-17, VR-32).
- **Niveau 3 — sérialisation brute** : détail.
- **Matrice ≥ 60 configurations**, étendue aux **4 workflows**, aux **dimensions sur mesure** et aux **orientations de pose 347 × 490 telle quelle / 490 × 347 tournée**.
- **Niveau 1 non atteint = NO-GO.**
- Mitigations R01 : `roundMm` (3 décimales, fonction unique, §10), sérialiseur maison, rendu serveur validé.
- Contrôle ARCH-PREVIEW (§32) : niveau 1 à 100 % ; niveau 2 documenté ; attribution des causes ; polices ; performance.

## 2. Runtimes et niveau de preuve

| Runtime | Rôle | Informations à consigner |
|---|---|---|
| Node | Obligatoire | Version exacte (référence projet : Node 24, ADR-0001), système |
| Chrome | Obligatoire | Version, système |
| Firefox | Obligatoire | Version, système |
| **Safari iOS sur appareil réel** | **Obligatoire — PREUVE PRINCIPALE** | Modèle d'appareil, version d'iOS, version de Safari |
| WebKit macOS, simulateur iOS ou environnement émulé | **Preuve COMPLÉMENTAIRE uniquement** ; ne remplace jamais Safari iOS réel | Outil, version |

Un résultat obtenu sur WebKit macOS ou simulateur **ne peut pas** être présenté comme preuve Safari iOS.

## 3. Géométrie indépendante du texte / dépendante du texte

| Catégorie | Contenu (§6, §10, §11) | Exécutable sans décision complémentaire ? |
|---|---|---|
| **A — Géométrie indépendante du texte** | Contour de plaque (largeur, hauteur, rayon), épaisseur, safe zone, trous (centres, diamètres), zones de keep-out, zone utile, intersection des zones machine | Oui, **avec des paramètres d'essai explicitement non atelier** (VR-22 à VR-25, VR-36, VR-08 non validées) |
| **B — Orientation de pose et zone machine retenue** | Choix « telle quelle » / « tournée » par opération ; zone machine enregistrée (§7.4, P6) | **BLOCKED BY R-1** (repère des axes des zones machine non défini) |
| **C — Géométrie dépendante du texte** | Mesure du texte, taille effective, composition, glyphes convertis en tracés (`layers.engrave`) via fichiers de police embarqués et opentype.js (§10) | **Inclus dans le protocole** car le texte intervient dans la géométrie canonique. **Exécution bloquée** : aucune police de gravure n'est définie (VR-08). Aucune police de référence n'est choisie ici |
| **D — Géométrie dépendante de l'artwork** | Tracés vectoriels de la version normalisée (`layers.engrave` / `layers.print`) | Non exigé explicitement par §12 ; inclusion **À CONFIRMER** ; règles de normalisation partiellement ouvertes (ART1-DOC, VR-27, VR-28) |

## 4. Matrice de configurations

### 4.1 Axes (valeurs d'essai non atelier, marquées comme telles)

| Axe | Valeurs | Source / statut |
|---|---|---|
| Workflow | `TROLASE_ENGRAVE`, `TROLASE_METALLIC_ENGRAVE`, `PLEXIGLASS_UV`, `TROGLASS_METALLIC_HYBRID` | DÉCIDÉ (§7.2) |
| Mode de format | standard (dimensions d'essai, formats réels VR-02 non validés) ; **sur mesure** | DÉCIDÉ (mode) ; valeurs d'essai |
| Dimensions | Petites, moyennes, grandes ; valeurs limites **347 × 490**, **490 × 347**, **347,1 × 490**, **347 × 490,1** ; dépassement Speedy 1010 × 610 | Zones DÉCIDÉES (§4.1) ; autres valeurs d'essai |
| Rayon de coin | 0 et valeurs d'essai | VR-36 non validée |
| Trous | 0, 2, 4 ; mode standard / avancé | Paramètres d'essai (VR-22 à VR-24 non validées) |
| Orientation de pose | telle quelle / tournée | **BLOCKED BY R-1** |
| Texte | absent / présent | Présent : **BLOCKED BY VR-08** (polices) |

### 4.2 Composition minimale

| Sous-matrice | Contenu | Nombre minimal | Statut d'exécution |
|---|---|---|---|
| M-A | 4 workflows × 15 combinaisons (dimensions standard d'essai et sur mesure, dont limites ; rayon ; trous 0 / 2 / 4) de géométrie indépendante du texte | **60** | Exécutable sur autorisation (paramètres d'essai) |
| M-B | Pour chaque workflow comportant une impression UV (`PLEXIGLASS_UV`, `TROGLASS_METALLIC_HYBRID`) : **347 × 490 telle quelle** et **490 × 347 tournée**, plus valeurs limites dans les deux poses | ≥ 8 | **BLOCKED BY R-1** |
| M-C | Configurations de M-A avec texte (1 et 2 lignes) | ≥ 8 | **BLOCKED BY VR-08** |
| M-D | Configurations avec artwork vectoriel | — | Inclusion **À CONFIRMER** |

Le seuil **≥ 60** est atteint par M-A seule, sans dépendance à R-1 ni à VR-08. **Le spike n'est pas complet au sens du §12 tant que M-B (orientations de pose) n'a pas été exécutée**, et tant que M-C n'a pas été exécutée si le texte est retenu dans la géométrie canonique.

## 5. Sérialisation et empreinte

| Élément | Exigence v1.5 | À définir (ADR-0005) |
|---|---|---|
| Arrondi | `roundMm` : 3 décimales, fonction unique | Mode d'arrondi exact (ex. demi-valeurs) — **À DÉFINIR** |
| JSON canonique | Exigé | Ordre des clés, format des nombres (zéros, notation exponentielle, `-0`), encodage — **À DÉFINIR** (options possibles : ordre lexicographique, schéma inspiré de RFC 8785 ; **aucune décision**) |
| Empreinte | SHA-256 | Encodage de sortie (hexadécimal proposé) — À DÉFINIR |
| Environnement | Indépendance vis-à-vis de la locale, du fuseau horaire, de l'horodatage | Liste des API interdites dans le noyau (ex. formatage dépendant de la locale) — À DÉFINIR |

## 6. Procédure (à exécuter seulement sur autorisation)

1. Figer une version unique de la matrice d'entrée (fichier versionné) et du noyau géométrique.
2. Exécuter le même noyau sur chaque runtime du §2, sans modification.
3. Produire pour chaque configuration : JSON canonique, empreinte SHA-256 ; puis une empreinte globale de l'ensemble.
4. Comparer les empreintes par configuration entre runtimes.
5. Pour toute différence : conserver les deux JSON et attribuer la cause (flottants, locale, métriques de police, API du runtime…).
6. Niveau 2 : produire le SVG canonique et documenter les différences.
7. Relever les temps d'exécution (performance, ARCH-PREVIEW). **Aucun seuil n'est défini par v1.5** → À DÉFINIR.

## 7. Preuves attendues

- Tableau configuration × runtime des empreintes SHA-256.
- Empreintes globales par runtime.
- Versions exactes (Node, navigateurs, appareil iOS, iOS, Safari).
- Pour chaque écart : JSON divergents et cause attribuée.
- Journaux bruts horodatés.
- Mention explicite du statut « preuve principale » ou « preuve complémentaire » pour chaque résultat Safari / WebKit.
- Aucun résultat simulé présenté comme réel.

## 8. Critères de résultat et NO-GO

| Situation | Conséquence |
|---|---|
| Niveau 1 : 100 % des configurations exécutées identiques sur Node, Chrome, Firefox et **Safari iOS réel** | Condition niveau 1 satisfaite pour les sous-matrices exécutées |
| Au moins un écart de niveau 1 non résolu | **NO-GO** (§12) → escalade Supervisor |
| Safari iOS réel non disponible | Niveau 1 **non démontré** (preuve complémentaire insuffisante) → pas de GO |
| M-B non exécutable (R-1) ou M-C non exécutable (VR-08) | Spike **incomplet** → ADR-0005 partiel, sans conclusion sur le §12 complet |
| Écarts de niveau 2 | Documentés, non bloquants (OD-17) |

## 9. Prérequis et autorisations

| Prérequis | Statut |
|---|---|
| Autorisation d'écrire le code du spike et son emplacement / classement lint | NON AUTORISÉ dans cette tranche |
| Outils d'exécution multi-navigateurs (ex. Playwright, §5.4) | Installation non autorisée ; ADR requis |
| **Appareil iOS réel avec Safari** (modèle et version à consigner) | À FOURNIR (propriétaire) |
| Postes avec Chrome et Firefox | À FOURNIR |
| Arbitrage R-1 | OUVERT |
| Polices de gravure (VR-08, licences) | OUVERT |
| Paramètres d'essai non atelier : déclarés dans le spike, jamais repris dans `src/` ni dans `docs/catalog.md` | Règle du protocole |
