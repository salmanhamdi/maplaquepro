# Catalogue conceptuel — valeurs à valider

Référence : Master Plan v1.5 validé (§3, §4, §7, §11, §14, §16, §36.4).
**Document conceptuel.** Aucune référence n'est active. Aucune valeur atelier n'est inventée.
Toute valeur marquée **À VALIDER** reste inactive tant qu'elle n'est pas validée (§GL « états normatifs », GATE 1).
Relecture par l'atelier requise (§7.5).

## 1. Structure décidée

### Familles et procédés (P3)

| Famille | Procédé de fabrication | Workflow | Politique d'impression | Épaisseurs (identifiants) |
|---|---|---|---|---|
| TroLase | Gravure laser | `TROLASE_ENGRAVE` | aucune | th_0_8 / th_1_6 / th_3_0 |
| TroLase Metallic | Gravure laser (même procédé, famille distincte) | `TROLASE_METALLIC_ENGRAVE` | aucune | th_0_8 / th_1_6 / th_3_0 (sous réserve des références) |
| Plexiglass | Découpe + impression UV | `PLEXIGLASS_UV` | noir uniquement **ou** couleur selon la référence ; « aucune » exclue en MVP | th_3_0 / th_5_0 |
| TroGlass Metallic Gold / Silver | Gravure envers + UV noir | `TROGLASS_METALLIC_HYBRID` | noir uniquement | selon références validées |

### Machines (capacités machine)

| Machine | Opérations | Zone machine | Statut |
|---|---|---|---|
| `SPEEDY_400` | gravure laser, découpe laser | 1010 × 610 mm (non universelle) | décidé |
| `ARTISJET_3000U` | impression UV | 347 × 490 mm (printableArea, normative) | décidé |
| `FIBER_50W`, `UV_5W` | — | — | hors MVP |

Repère exact des axes des zones machine : **ouvert (R-1)**.

### Épaisseurs référentielles

`th_0_8` = 0,8 mm · `th_1_6` = 1,6 mm · `th_3_0` = 3,0 mm · `th_5_0` = 5,0 mm (exactement quatre valeurs).

## 2. Valeurs à valider (aucune n'est active)

| Objet | Valeurs attendues | Statut | Identifiants |
|---|---|---|---|
| Références TroLase | codes, apparence (surface, finition, couleur révélée), épaisseurs en stock | À VALIDER | OD-26 / VR-03 |
| Références TroLase Metallic | idem | À VALIDER | OD-27 / VR-37 |
| Références Plexiglass | apparences de support, finition | À VALIDER | OD-28 / VR-38 |
| Politique d'impression de chaque référence Plexiglass | noir uniquement ou couleur | À VALIDER | OD-32 / VR-40 |
| Références TroGlass Gold / Silver | codes, épaisseurs, apparence | À VALIDER | OD-29 / VR-39 |
| Tenue extérieure par référence | extérieur / intérieur | À VALIDER | VR-04 |
| Formats standard, rayons | dimensions | À VALIDER | VR-02 |
| `DimensionRules` par référence × épaisseur | min / max largeur, hauteur, aire ; limites Speedy par matière | À VALIDER | VR-25 |
| Rayons de coin min / max | par référence / épaisseur | À VALIDER | VR-36 |
| Découpe conditionnelle des workflows TroLase (sur mesure) | confirmation | À VALIDER | VR-34 / OD-35 / CR-2 |
| Diamètre de trou | par référence / épaisseur | À VALIDER | VR-22 / OD-03 |
| Distance minimale au bord, marges, safe zone | par référence / épaisseur | À VALIDER | VR-23 / OD-05 |
| Sémantique de la cote, disposition des 2 trous, dégagement d'arrondi | — | À VALIDER | VR-24 / OD-04 / OD-06 |
| Valeur cible de distance au bord | 3,0 mm, retenue seulement si toutes les contraintes sont satisfaites (P11) | décidé (règle) ; valeurs contextuelles futures sur donnée atelier | OD-07 |
| Adhésif | option, référence | À VALIDER | VR-05 |
| Polices de gravure, tailles et traits minimaux | — | À VALIDER | VR-08 |
| DPI minimal raster, `rasterPolicy` | — | À VALIDER | VR-27 / VR-28 |
| Catégorie ART-1 de certaines transformations d'artwork | sanitisation visible, raster bilevel, traits fins | ouvert | ART1-DOC |
| Contrat laser `PRODUCTION_SVG_CONTRACT_v1` | validation atelier | À VALIDER | VR-20 / OD-01 |
| Contrat UV `PRODUCTION_UV_CONTRACT_v1` | format de fichier réel | À VALIDER | VR-33 / OD-31 |
| Convention du fichier côté envers (miroir) | — | À VALIDER | VR-35 / OD-36 / CR-7 |
| Effet d'une orientation de pose tournée sur les fichiers | — | À VALIDER | VR-41 |
| Moment et modalités de la validation atelier des contrats | — | À VALIDER | VR-42 |
| Grille tarifaire, méthode sur mesure, TVA | — | À VALIDER | VR-07 / OD-37 / CR-11 |
| Livraison | — | À VALIDER | VR-09 ; G2-DOC (9) |

## 3. Rappels normatifs appliqués à ce catalogue

- FAMILLE ≠ FINITION ≠ PROCÉDÉ ≠ WORKFLOW (P3, P4).
- Une propriété obligatoire à l'état À VALIDER rend la référence inactive (P5 D4, P7 D3).
- Aucune propriété d'apparence n'est déduite d'une capacité de fabrication (P5).
- Aucune règle de fabrication n'est déduite des capacités supposées d'une machine.
- Une référence utilisée dans une décision validée n'est jamais modifiée rétroactivement (G2-D8).
