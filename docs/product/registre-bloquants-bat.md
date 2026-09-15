# Registre des bloquants du BAT réel

**Statut : document de travail NON NORMATIF.** Il localise dans le code les points qui empêchent aujourd'hui l'émission d'un BAT réel validé, et prépare les arbitrages. Il ne ferme aucun VR, ne crée aucune décision ni aucun GATE et ne modifie pas le Master Plan v1.6, qui reste la référence.

Base constatée : `main` @ `842dbe6`.

## 1. Chaîne d'émission et point de blocage

```
evaluateFabricability → resolveSpec → buildCanonicalGeometry → construireArtefacts → buildBatDraft (brouillon)
  → validateBat (P7 : aucune valeur À VALIDER) → enregistrerBat (intégrité) → [persistance : absente]
```

- **Brouillon :** `buildBatDraft` (`src/domain/bat-brouillon.ts`) force toujours `expiresAt`, `pricingVersion` et `designRulesVersion` à À VALIDER. Il refuse tout texte (VR-08).
- **Validation :** `batValidationViolations` / `validateBat` (`src/domain/bat.ts`) refusent tout BAT portant une valeur À VALIDER ou un statut de contrat absent (`CONTRACT_STATUS_MISSING`).
- **Conséquence :** aucun BAT réel n'est validable aujourd'hui. Le test `tests/domain/bat.test.ts` (« prix, expiration et version des règles de design À VALIDER ⇒ validation refusée ») le prouve.
- **BAT-PREP** (`src/server/preparation-bat.ts`) n'emprunte pas cette chaîne au-delà de `planArtifacts`. Il ne produit ni identifiant, ni empreinte, ni prix, ni expiration.

## 2. Bloquants localisés

| # | Bloquant | Fichier · symbole | État constaté | Bloque | Référence |
|---|---|---|---|---|---|
| B1 | Prix | `src/domain/pricing.ts` · `priceRulesSchema` ; `src/domain/prix.ts` · `computePrice` | Voir détail B1 | Tout BAT | VR-07, OD-37, VR-09, VR-10, GATE 6 |
| B2 | Version tarifaire | `src/domain/bat-brouillon.ts` · `buildBatDraft` (`pricingVersion: aValider()`) | Toujours À VALIDER | Tout BAT | VR-07 |
| B3 | Expiration commerciale | `src/domain/bat.ts` · `expiresAt` ; `bat-brouillon.ts` (`aValider()`) | Toujours À VALIDER | Tout BAT | G2-D12 |
| B4 | Version des règles de design | `bat-brouillon.ts` (`designRulesVersion: aValider()`) | Toujours À VALIDER | Tout BAT | VR-08 |
| B5 | Texte | Voir détail B5 | — | BAT avec texte | VR-08, SP-3 |
| B6 | Contrat laser | `src/domain/referentiels.ts` · `CONTRACT_IDS` ; `bat.ts` · `CONTRACT_STATUS_MISSING` | Aucun statut au catalogue (`productionContracts: []`) | Tout BAT | VR-20, VR-42, GATE 4 |
| B7 | Contrat UV | `src/domain/production.ts` · `planArtifacts` (`status: "contract_pending"`) | En attente | Plexiglass, TroGlass | VR-33, VR-42, GATE 4 |
| B8 | Hybride TroGlass | `src/domain/artefacts-bat.ts` · `construireArtefacts` (`registration: A_VALIDER`) | Calage À VALIDER ; convention envers | TroGlass | VR-33, VR-35, VR-42, GATE 4 |
| B9 | Perçage | `src/domain/catalog.ts` · `INITIAL_CATALOG.mountingRules` ; `src/domain/mounting.ts` | 6 paramètres À VALIDER | BAT avec trous | VR-22, VR-24, GATE 1 |
| B10 | Références réelles | `src/server/catalogue-demo.ts` · `CATALOGUE_DEMO` | Voir détail B10 | Tout BAT réel | GATE 1 (VR-02 à VR-05, VR-22 à VR-25…) |
| B11 | Sur mesure TroLase | `src/domain/fabricabilite.ts` · `evaluateFabricability` (CR-2) | Non activé | TroLase, TroLase Metallic | CR-2 |
| B12 | Empreinte de contenu | `bat.ts` · `contentHash` ; `preparation-bat.ts` · `identite` | Reçue, jamais calculée ; périmètre non défini | Création et stockage | Q4 (liaison configuration), futur `bat_snapshots` |
| B13 | Stockage du BAT | `src/server/db/schema.ts` | Aucune table BAT | BAT persistant | Rétention BAT, D-S1-1 |

### Détails

- **B1 Prix :** montants À VALIDER. `customDimensionPricing` et `quantityTiers` ne peuvent valoir que À VALIDER ou SANS OBJET, jamais DEFINIE. `catalog.priceRules` est vide.
- **B5 Texte :**
  - `fabricabilite.ts` : police et glyphes non validés (`design.text.fontId`), tracés non fournis (`design.text.effectiveFontSizeMm`, SP-3), trait minimal non mesuré (`design.text.traits`).
  - `bat-brouillon.ts` : bloc texte refusé.
  - `bat.ts` : `text` exige `fontHash` et `effectiveFontSizeMm`.
- **B10 Références réelles :** références `Démonstration`, `DEMO-*`, une épaisseur par famille. Règles de dimensions SANS OBJET, aucun prix, aucun format.

## 3. Propagation des paramètres de perçage

Paramètres (`mounting.ts` · `mountingParams`) :
- `holeDiameterMm`, `minEdgeDistanceMm`, `holeKeepOutMarginMm` ;
- `edgeDistanceSemantics`, `twoHolesDisposition`, `cornerRadiusClearanceMm`.

Tous sont À VALIDER dans `INITIAL_CATALOG` (`mounting-default`).

```
catalogue (mountingRules, À VALIDER)
  → evaluateFabricability / generateHoles (holes.ts) : MOUNTING_PARAMETER_NOT_VALIDATED / HOLES_UNAVAILABLE
  → resolveSpec (resolved-spec.ts) : spec.mountingRules { holeDiameterMm, minEdgeDistanceMm, holeKeepOutMarginMm, edgeDistanceSemantics } + spec.holes
  → buildCanonicalGeometry (geometrie-canonique.ts) : geometry.holes + keep-out (rayon = diamètre/2 + marge)
  → buildLaserArtifact (artefact-laser.ts) : groupe HOLES si la géométrie contient des trous
  → productionSvg (production-svg.ts) : <g id="HOLES">
```

`twoHolesDisposition` et `cornerRadiusClearanceMm` sont évalués dans `generateHoles`, sans être recopiés dans `spec.mountingRules`.

## 4. Expiration et durées : notions et représentation actuelle

| Notion | Représentation dans le modèle | État |
|---|---|---|
| Validité commerciale du BAT | `bat.expiresAt` (seul champ temporel prévu à cet effet) | À VALIDER (G2-D12) |
| Conservation technique (brouillon, BAT non payé) | Aucun champ | Non représentée |
| Rétention RGPD (BAT orphelin, artwork) | Aucun champ ; durées décrites au Master Plan §9.6 / §25 | Non représentée ; à réconcilier avec les faits atelier |
| Conservation d'une commande payée | Aucune entité commande | Non représentée |

Le modèle actuel ne distingue que la **validité commerciale**. Les autres notions n'ont aucune représentation. Leur séparation relève d'un arbitrage.

## 5. Empreinte de contenu : cartographie

- **Entrée :** `identite.contentHash` reçu par `createBat` / `preparerBat` / `buildBatDraft`. Aucun calcul, et hachage injecté (P7).
- **Stockage dans le BAT :** `bat.contentHash` (`bat.ts`).
- **Sorties et utilisations :**
  - traçabilité des artefacts (`Tracabilite.batHash`, `preparation-bat.ts`, `artefacts-bat.ts`) ;
  - attribut `data-bat-hash` du SVG de production (`production-svg.ts`) ;
  - fiche de production (`fiche-production.ts` · `ficheProduction`) ;
  - intégrité enregistrée (`bat-enregistre.ts`, qui hache le BAT complet, empreinte comprise).
- **Régénération :** `regenererArtefacts` réinjecte `bat.contentHash` dans les artefacts, et `verifierArtefacts` compare.
- **Circularité potentielle :** si l'empreinte devait couvrir `artifacts`, il faudrait la connaître avant de produire les artefacts qui l'embarquent.
- **Tests concernés :**
  - `tests/bat-contract/` : complétude, hybride, miroir UV ;
  - `tests/domain/` : BAT, `createBat`, intégration, BAT validé Phase 5, `preparerBat` ;
  - `tests/fabricability/qa-30-trous-poses.test.ts` ;
  - `tests/preview/preview-14-1.test.ts`.

## 6. Questions atelier préparées

1. **Perçage :** diamètre, distance minimale au bord, marge de sécurité, sémantique de cote (bord-centre ou bord-bord), disposition pour 2 trous, dégagement dans l'arrondi des coins.
2. **Contrat laser :** le SVG actuel (calques gravure / découpe / perçage, attributs de traçabilité) est-il exploitable sur votre chaîne ? Quelle forme de preuve de validation (VR-42) ?
3. **Fichier UV :** format et réglages de l'imprimante UV pour l'impression noir à l'envers (VR-33).
4. **Hybride TroGlass :** convention du fichier côté envers (VR-35), méthode et tolérance de calage entre gravure et impression.
5. **Références réelles :** par famille, fabricant, code fabricant, épaisseurs, apparence (surface, finition, couleur révélée).
6. **Texte :** comment mesurez-vous le trait minimal de 1 mm ? Quelles polices (fichiers) utilisez-vous pour la conversion en tracés ?
7. **« 7 jours » pour un BAT non payé :** s'agit-il d'une validité commerciale ou d'une durée de conservation ?

## 7. Écarts et contradictions à signaler

- **VR-08 :** le registre du Master Plan v1.6 le marque « À VALIDER », alors que les règles de hauteur de caractère, de trait minimal et de conversion en tracés ont été communiquées comme arbitrées. Écart documentaire à traiter par le Supervisor.
- **`minFontSizeMm` :** `evaluerLisibilite` (`texte.ts`) le lit, mais aucune source catalogue (`designRules`) n'existe. Le contrôle actif est la hauteur de 1 mm sur les tracés (`BELOW_LEGIBILITY`).
- **Rétention :**
  - faits atelier : 7 jours pour un BAT non payé d'un client enregistré ; fin de visite pour un anonyme ;
  - Master Plan : 30 jours pour un BAT orphelin ;
  - checkout invité natif, incompatible avec « fin de visite » en cas de paiement différé.
- **Prix sur mesure :** le schéma interdit toute valeur DEFINIE. Fermer VR-07 exigera une évolution du schéma.
