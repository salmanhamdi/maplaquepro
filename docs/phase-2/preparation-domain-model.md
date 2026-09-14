# Préparation de la Phase 2 — Domain model

- **Statut** : **PRÉPARATION** autorisée par le Supervisor (14/09/2026). **La Phase 2 n'est pas ouverte** ; aucune implémentation dans `src/domain/` n'est autorisée par ce document.
- **Références normatives** : Master Plan v1.5 §GL, §6, §7, §9, §11, §13–§16bis, §31 (Phase 2), Annexe A (**notation indicative**, statut À ARBITRER A-1), Annexe B ; arbitrages P3 à P13, SCOPE-1, ART-1, G-2 ; ADR-0003 ; ADR-0004 ; ADR-0005.
- **Règle** : aucune valeur atelier n'est introduite. Toute valeur non validée est représentée par l'état `A_VALIDER`. Les noms techniques restent indicatifs (P5 D5, A-1).

---

## 1. Périmètre de la Phase 2 (§31)

Références (apparence, capacité de gravure, politique d'impression, trois états), `Thickness`, `FormatSpec`, `DimensionRules`, `ProductionWorkflow`, `ProductionOperation`, `MachineCapability`, `ArtworkRules`, `MountingRules`, `ProductionContracts`, `Configuration` v4, pricing.

Checkpoint de sortie : **ARCH-2 (partie modèle)**.

**Hors Phase 2** :
- géométrie canonique et moteur de compatibilité (Phase 3) ;
- BAT et artefacts (Phase 5) ;
- configurateur (Phase 4) ;
- shaping (SP-3 bloqué) ;
- orientation de pose calculée (R-1).

## 2. Critères d'entrée non satisfaits (à ne pas contourner)

| Point de la Phase 1 | État |
|---|---|
| ARCH-1-bis | Confirmation formelle nécessaire |
| ARCH-PREVIEW | Partiel : SP-1 PASS, SP-2 PASS ; SP-3 (VR-08) et SP-4 (R-1) bloqués |
| PRODUCT-1 (a) | Questionnaire atelier non envoyé |
| Accès app.glassora | À traiter |
| DA-1 / GATE 10 | Satisfaits |

## 3. Entités du modèle

| Entité | Rôle | Champs clés (Annexe A, indicatif) | Source |
|---|---|---|---|
| `Etat<T>` | Trois états normatifs | `SANS_OBJET` / `DEFINIE(valeur)` / `A_VALIDER` ; jamais d'absence implicite | P5 D4, P7 D3 |
| `Thickness` | Épaisseur référentielle | `id` ∈ {th_0_8, th_1_6, th_3_0, th_5_0}, `mm`, `label`, `statut` ; exactement 4 entrées | §7.5 |
| `MachineCapability` | Capacité d'une machine | `machineId`, `operationTypes`, `workingArea` / `printableArea` (`ZoneMm`), `orientationDePoseTourneeAutorisee`, `statut` | §4.1, §7.3, P7 D1 |
| `ProductionOperation` | Étape d'un workflow | `sequence`, `type`, `machineId`, `cote`, `encre` (dérivée, jamais saisie), `condition` | §7.2, P7 D5, VR-34 |
| `ProductionWorkflow` | Procédé de fabrication | `id`, `procede`, `version`, `operations`, `artworkPolicy`, `contractIds` ; **aucune contrainte machine** | §7.2, P3, R30 |
| `ApparenceReference` | Apparence | `couleurSurface`, `finition`, `couleurRevelee` (états) | P4, P5 |
| `CapaciteGravure` | Côté gravable | `cote: Etat<'face'|'envers'>` ; `SANS_OBJET` ⇔ non gravable | P5, P7 D2 |
| `PolitiqueImpression` | Impression de la référence | `valeur: Etat<'aucune'|'noir_uniquement'|'couleur'>`, `cote` | P7 |
| `MaterialVariant` (référence) | **Unité de vente** | `id`, `manufacturer`, `reference`, `family`, `label`, `thicknessIds`, apparence, capacités, `productionWorkflowId`, règles liées, `outdoorStatus`, `swatch`, `statut` | §7.1 |
| `FormatSpec` | Format demandé | `standard(formatId)` ou `custom(widthMm, heightMm, cornerRadiusMm?)` | §6 |
| `Format` | Format standard | `id`, `label`, `widthMm`, `heightMm`, `cornerRadiusMm`, `statut` | §7.5, VR-02 |
| `DimensionRules` | Bornes par référence × épaisseur | min / max largeur, hauteur, surface, rayon (états), `statut` | §7.4, VR-25, VR-36 |
| `MountingRules` | Règles de trous | `allowedCounts`, cible 3,0 mm (P11), diamètre, distance minimale, marge, sémantique, disposition à 2 trous, dégagement de coin (états), `overrides`, `statut` | §11, P11, VR-22 à VR-24 |
| `MountingPattern` | Choix client de trous | `count 0` / `standard(edgeDistanceMm)` / `advanced(X, Y, symmetry)` | §6, §11 |
| `ArtworkRules` | Règles d'upload par workflow | `formats`, `maxBytes`, **`maxPixels`**, DPI minimal, trait minimal, `modeCouleur` (dérivé), `rasterPolicy`, `statut` | §7.5, §9, ADR-0003 |
| `ArtworkPlacement` | Placement | `artworkRef`, position, taille, `rotationDeg` ∈ {0, 90, 180, 270} | §6 |
| `ProductionContracts` / `StatutContrat` | Contrats de fichiers | `contractId`, `conformite`, `validationAtelier: Etat<'validee'>` | §14, P12, VR-42 |
| `Configuration` v4 | Requête client (champs autorisés uniquement) | `configurationVersion: 4`, `productId`, `materialVariantId`, `thicknessId`, `format`, `design`, `mounting`, `quantity` | §6, P13 |
| `PriceRules` | Structure tarifaire | `base`, `byVariant`, `byThickness`, `byFormat`, `customDimensionPricing`, `byWorkflow`, `byMounting`, `artworkProcessingFee`, `quantityTiers`, `vatRate`, `pricingStatus` ; **aucun tarif** | §7.5, VR-07, GATE 6 |
| `Product` | Produit vendu | `allowedVariantIds`, `allowedFormats`, `allowedLayouts`, `allowedFonts`, `mountingRulesId` | §7.1 |

## 4. Valeurs déjà décidées (reprises, non créées)

| Valeur | Source |
|---|---|
| 4 familles, 3 procédés, 4 workflows (`TROLASE_ENGRAVE`, `TROLASE_METALLIC_ENGRAVE`, `PLEXIGLASS_UV`, `TROGLASS_METALLIC_HYBRID`) | P3, §7.2 |
| 4 épaisseurs référentielles : 0,8 / 1,6 / 3,0 / 5,0 mm | §7.5 |
| Speedy 400 `workingArea` 1010 × 610 ; ArtisJet 3000U `printableArea` 347 × 490 ; rotation autorisée « oui » (ArtisJet : sous conditions non définies) | §4.1, §7.3 |
| Distance au bord cible 3,0 mm, 1 décimale, pas de 0,1 mm | P11, §11.3 |
| `maxPixels = 50_000_000` (MVP) | Décision Supervisor, ADR-0003 |
| Formats d'artwork : SVG / PNG / JPG | OD-08 |
| `configurationVersion = 4` | §6 |
| Orientation de pose par défaut « tel quel » (règle), repère des axes **OPEN** | P6, R-1 |

**Valeurs non décidées → `A_VALIDER`** :
- références, fabricants, couleurs, finitions (GATE 1) ;
- bornes `DimensionRules` (VR-25) ;
- trous (VR-22 à VR-24) ;
- DPI, traits, raster (VR-27, VR-28, VR-08) ;
- `maxBytes` (OD-25 INFERENCE) ;
- formats standard (VR-02) ;
- tarifs (VR-07, GATE 6) ;
- découpe TroLase (VR-34) ;
- validation atelier des contrats (VR-42).

## 5. Invariants (spécification, à tester)

| ID | Invariant | Source |
|---|---|---|
| INV-01 | Aucune absence implicite : toute propriété d'état vaut `SANS_OBJET`, `DEFINIE` ou `A_VALIDER` | P5 D4 |
| INV-02 | `statut = 'active'` impossible si une propriété obligatoire est `A_VALIDER` | §GL, Annexe A |
| INV-03 | `thicknessIds` ⊆ épaisseurs autorisées de la famille (TroLase / Metallic : 0,8 / 1,6 / 3,0 ; Plexiglass : 3,0 / 5,0 ; TroGlass : selon références validées → `A_VALIDER`) | §7.5 |
| INV-04 | trolase / trolase_metallic ⇒ procédé gravure laser ; politique d'impression `DEFINIE('aucune')` ; capacité de gravure `DEFINIE('face')` ; couleur révélée `DEFINIE` pour être active | Annexe A, P5, P7 |
| INV-05 | plexiglass ⇒ `PLEXIGLASS_UV` ; politique ∈ {`noir_uniquement`, `couleur`, `A_VALIDER`}, **jamais `aucune`** en MVP ; couleur révélée `SANS_OBJET` | P7 D4, P9 |
| INV-06 | troglass_metallic ⇒ `TROGLASS_METALLIC_HYBRID` ; politique `DEFINIE('noir_uniquement')` ; côtés gravure et impression `DEFINIE('envers')` ; le noir UV n'est jamais une couleur révélée | P5 D2, P9 |
| INV-07 | Le procédé n'est jamais déduit d'une couleur ou d'une apparence ; le workflow vient de la référence | §6, P3 |
| INV-08 | Aucune propriété d'apparence n'est déduite d'une capacité | P5 |
| INV-09 | Encre d'une opération `uv_print` = dérivée de la politique d'impression ; jamais saisie ; aucune encre sur les opérations laser | P7 D5 |
| INV-10 | `ProductionWorkflow` ne porte aucune contrainte machine (dimensions) : elles viennent de `MachineCapability` | §7.2, R30 |
| INV-11 | `Configuration` n'accepte que ses champs autorisés ; tout champ interdit (prix, géométrie, workflow, opérations, orientation, zone machine, encre, mode couleur, artefacts) ⇒ **rejet typé** | P13, §16bis |
| INV-12 | Aucune valeur invalide n'est corrigée silencieusement côté serveur | P11 × P13 |
| INV-13 | `MountingPattern` avancé : `symmetry: true` obligatoire ; X = Y non imposé | §11, P11 D4 |
| INV-14 | Le diamètre de trou n'est jamais un choix client | §11.1 |
| INV-15 | `modeCouleur` d'`ArtworkRules` est dérivé du workflow et de la politique de la référence, jamais saisi | P7 D5 |
| INV-16 | `validationAtelier` d'un contrat n'est jamais `DEFINIE` sans preuve ; conformité ≠ validation atelier ≠ GATE 4 | P12, VR-42 |
| INV-17 | Exactement 4 épaisseurs référentielles ; 4 familles ; 4 workflows | P3, §7.5 |
| INV-18 | Aucune identité de tenant / marque (`brand_id`, `store_id`…) dans le modèle | §21 |
| INV-19 | `artworkRules.maxPixels` du MVP = 50 000 000 | ADR-0003 |

## 6. Contrats

| Contrat | Entrée / sortie | Règle |
|---|---|---|
| Configuration client (P13) | Requête client → acceptation ou rejet typé | Champs autorisés uniquement ; valeurs dans le domaine résolu ; aucune correction serveur |
| Catalogue déclaratif (§7) | Données TS versionnées (`catalogVersion`) → validées au démarrage | Schéma + invariants INV-01 à INV-17 ; seules les références actives sont exposées |
| Intégration externe (SCOPE-1) | Données externes (Stripe) ≠ requête client | Contrat propre, **hors Phase 2** |
| Contrats de production (§14) | `StatutContrat` | Structure seulement en Phase 2 ; contenu en Phase 5 |

## 7. Matrice des dépendances

| Entité / sujet | Dépend de | Point ouvert | Constructible en Phase 2 ? |
|---|---|---|---|
| `Etat<T>`, `Statut` | — | — | Oui |
| `Thickness` | §7.5 | TroGlass : épaisseurs `A_VALIDER` | Oui |
| `MachineCapability` | §4.1 | R-1 (axes), conditions de rotation ArtisJet | Oui (structure) ; interprétation des axes non figée |
| `ProductionWorkflow` / `Operation` | P3, §7.2 | VR-34 (découpe TroLase) | Oui (`condition: A_VALIDER`) |
| `MaterialVariant` | GATE 1 | OD-26 à OD-29, VR-03, VR-37 à VR-40 | Oui (aucune référence active) |
| `DimensionRules` | VR-25, VR-36 | Bornes | Oui (états `A_VALIDER`) |
| `MountingRules` / `MountingPattern` | P11, VR-22 à VR-24 | Diamètres, sémantique, disposition | Oui (états) |
| `ArtworkRules` | §9, ADR-0003, VR-27, VR-28, VR-08 | `maxBytes`, DPI, raster | Oui (`maxPixels` décidé ; reste `A_VALIDER`) |
| `ProductionContracts` | P12, §14 | VR-20, VR-33, VR-35, VR-41, VR-42 | Oui (structure) |
| `Configuration` v4 | P13 | G2-DOC (versions futures) | Oui |
| `TextSpec` / polices | §10 | **VR-08**, shaping (SP-3) | **Partiel** : structure (`fontId`, `layoutId`, `lines`) sans liste de polices ni règle de shaping |
| `PriceRules` | §7.5 | VR-07, GATE 6 | Oui (structure sans tarif) |
| Orientation de pose résolue | P6 | **R-1** | **Non** (Phase 3, bloquée par R-1) |

## 8. Préparation des schémas (Zod)

- **Dépendance** : `zod` **4.6.5**, version exacte (package.json + lockfile), autorisée par le Supervisor pour les schémas du modèle et du catalogue.
- **Emplacement prévu à l'ouverture** : `src/domain/` (schémas purs, aucune dépendance React / Next / Drizzle / Node), conformément à ADR-0004.
- **Principes** :
  1. un schéma `Etat(schema)` générique produisant l'union discriminée des trois états ;
  2. objets **stricts** (`z.strictObject`) pour la `Configuration` client → rejet de tout champ inconnu (P13) ;
  3. unions discriminées pour `FormatSpec`, `MountingPattern`, `ProductionArtifact` ;
  4. invariants inter-champs dans des fonctions de validation nommées (INV-xx), testées une par une, plutôt que dispersés ;
  5. types TypeScript dérivés des schémas (`z.infer`), aucune duplication ;
  6. codes d'erreur typés et stables, en anglais technique, sans traduction implicite ;
  7. aucune valeur par défaut silencieuse côté serveur (P11 × P13).
- **Esquisse indicative** (non implémentée, noms non normatifs) :

```ts
// À l'ouverture de la Phase 2 uniquement — indicatif
const Etat = <T extends z.ZodType>(valeur: T) =>
  z.discriminatedUnion("etat", [
    z.strictObject({ etat: z.literal("SANS_OBJET") }),
    z.strictObject({ etat: z.literal("DEFINIE"), valeur }),
    z.strictObject({ etat: z.literal("A_VALIDER") }),
  ]);
```

## 9. Stratégie de tests (à l'ouverture)

| Niveau | Contenu | Emplacement |
|---|---|---|
| Schémas | Acceptation et rejet par entité ; champs inconnus rejetés ; unions discriminées | `tests/domain/` |
| Invariants | Un test par INV-xx, cas positifs et négatifs | `tests/domain/invariants/` |
| Catalogue | Le catalogue déclaratif (tout `A_VALIDER`) est valide ; **aucune référence active** ; statut actif refusé si un champ obligatoire est `A_VALIDER` | `tests/domain/catalog/` |
| Configuration P13 | Chaque champ interdit du §6 → rejet typé ; aucune correction silencieuse | `tests/domain/configuration/` |
| Frontières | `check-boundaries` : aucun import interdit dans `src/domain/` | Existant |
| Lint des termes | Aucun terme interdit | Existant |
| Non-régression | CI (typecheck, lint, tests, build) verte | Existant |

Matrice §30.1 (fabricabilité) et Annexe C : **Phase 3**, hors préparation.

## 10. Points ouverts non bloquants pour la préparation

A-1 (statut de la notation Annexe A), G2-DOC, VR-08 (polices / `TextSpec`), R-1 (axes), VR-22 à VR-25, VR-27, VR-28, VR-34, VR-42, OD-25 (`maxBytes`), police et droits du logo, icône et favicon dérivés (À VALIDER).

## 11. Pour ouvrir officiellement la Phase 2

Décision du Supervisor sur les critères d'entrée du §2 : ARCH-1-bis, ARCH-PREVIEW, PRODUCT-1 (a), accès app.glassora.
