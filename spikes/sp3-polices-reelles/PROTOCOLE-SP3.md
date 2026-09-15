# SP-3 — Protocole expérimental : polices réelles et `TextGlyphPaths`

**ESSAI — NON NORMATIF.** Spike technique autorisé par l'arbitrage T1 (décision 9) et le plan `docs/product/plan-sp3.md`.
**Branche** : `spike/sp3-polices-reelles`, créée depuis `main` @ `5923df5`. **Aucune fusion.**
Aucun résultat de ce spike n'est une règle produit (ADR-0005, partie C). Ni opentype.js ni harfbuzzjs ne sont retenus ; aucune police de fixture n'est une police produit ; VR-08 S1, S2, S3, A7, `designRulesVersion`, `fontHash`, B-O5, B-O6 et les licences produit restent OPEN.

## 1. Périmètre

Démontrer, avec de vraies polices, la génération de `TextGlyphPaths` (format `CaractereTrace` du domaine) et mesurer : glyphes, shaping, `ccmp`, ligatures, crénage, accents, ponctuation, glyphes absents, 1 à 4 lignes, déterminisme, géométrie, passage dans le pipeline existant, candidats `fontHash`, candidats taille / composition.

Hors périmètre : intégration dans `src/`, modification du domaine, BAT, choix de bibliothèque ou de police, règles VR-08.

## 2. Artefacts

Détail, provenance, intégrité publiée et SHA-256 : `ARTEFACTS.json` (généré par `artefacts.mjs`).

| Artefact | Rôle | Vérification |
|---|---|---|
| opentype.js 2.0.0 | Moteur A (instrument) | SHA-256 identique à SP-2 |
| harfbuzzjs 1.6.1 | Moteur B (instrument) | SHA-512 recalculé = `dist.integrity` npm |
| DejaVu Sans 2.37 | Fixture | SHA-256 identique à SP-2 |
| Gentium Plus Regular (OFL) | Fixture | Blob Git = API GitHub |
| Libre Baskerville, fonte variable `wght` (OFL) | Fixture, instance par défaut | Blob Git = API GitHub |

`package.json` et `package-lock.json` sont inchangés. `.gitattributes` (`* -text`) empêche toute conversion de fin de ligne.

## 3. Étapes et scripts

| Étape | Script | Sortie |
|---|---|---|
| Inspection réelle des polices (avant gel) | `inspecter-polices.mjs` | `CAPACITES.json` |
| Gel de la matrice | `geler-matrice.mjs` | `matrix.lock.json` |
| Exécution Node (passes 1 et 2, processus distincts) | `run-node.mjs` | `resultats/node/passe-{1,2}.json` |
| Exécution Chrome / Edge headless (passes 1 et 2) | `run-browsers.mjs` + `index.html` | `resultats/{chrome,edge}/passe-{1,2}.json` |
| Comparaisons | `comparer.mjs` | `COMPARAISON.json` |
| Passage dans le domaine existant | `domaine.test.mjs` (`vitest.sp3.config.mjs`, hors CI) | `DOMAINE.json` |
| Candidats `fontHash` | `fontHash.mjs` | `FONTHASH.json` |
| Candidats taille / composition | `taille-composition.mjs` | `TAILLE-COMPOSITION.json` |
| Inventaire des artefacts | `artefacts.mjs` | `ARTEFACTS.json` |

Tous les scripts refusent de réécrire une sortie existante.

## 4. Moteurs et modes

| Mode | Description |
|---|---|
| `harfbuzzjs-1.6.1` | Shaping HarfBuzz complet par défaut (`guessSegmentProperties`), clusters par point de code (`addCodePoints`) ; diagnostics `-ccmp`, `-liga`, `-kern`, `-mark` |
| `opentypejs-2.0.0-shaping` | `stringToGlyphs` (fonctionnalités par défaut d'opentype.js) + crénage GPOS / `kern` ; aucun positionnement des marques ; clusters non exposés |
| `opentypejs-2.0.0-cmap` | Méthode SP-2 : un glyphe par point de code, sans substitution, crénage GPOS / `kern` |

## 5. Hypothèses d'expérience (non normatives)

Reprises de `matrix.mjs` (`HYPOTHESES`) : H-TAILLE, H-INTERLIGNE, H-POSITION, H-NORM, H-CLUSTER, H-NOTDEF, H-VAR, H-TROUS, H-ARRONDI. Conversion exacte des quadratiques en cubiques (le domaine ne représente que M, L, C, Z).

## 6. Environnements

| Environnement | Statut |
|---|---|
| Node 24.18.0 (référence) | Exécuté |
| Chrome 152 (headless, 127.0.0.1) | Exécuté |
| Edge 153 (headless, 127.0.0.1) | Exécuté |
| Firefox | **INCOMPLETE** — non installé ; installation système refusée |
| Safari iOS réel | **INCOMPLETE** — non pilotable depuis le poste |

Chrome et Edge ne remplacent jamais Firefox ni Safari iOS réel (B-D8).

## 7. Mesures

- Déterminisme intra-environnement : passe 1 contre passe 2, par configuration et par mode.
- Déterminisme inter-environnements : Node contre Chrome, Node contre Edge.
- Entre moteurs : empreintes séparées de forme (glyphes, clusters), position, géométrie, résultat complet.
- Sérialisation : `canonicalJson` du domaine contre sérialisation du spike (même SHA-256).
- Pipeline : `evaluerTexteTrace`, `evaluateFabricability`, `resolveSpec`, `buildCanonicalGeometry`, `canonicalGeometrySchema` (catalogue de test repris de `tests/domain/vr08-texte.test.ts`).

## 8. Reproduction

```
node spikes/sp3-polices-reelles/inspecter-polices.mjs
node spikes/sp3-polices-reelles/geler-matrice.mjs
node spikes/sp3-polices-reelles/run-node.mjs 1
node spikes/sp3-polices-reelles/run-node.mjs 2
node spikes/sp3-polices-reelles/run-browsers.mjs 1 chrome=<exe> edge=<exe>
node spikes/sp3-polices-reelles/run-browsers.mjs 2 chrome=<exe> edge=<exe>
node spikes/sp3-polices-reelles/comparer.mjs
npx vitest run --config spikes/sp3-polices-reelles/vitest.sp3.config.mjs
node spikes/sp3-polices-reelles/fontHash.mjs
node spikes/sp3-polices-reelles/taille-composition.mjs
node spikes/sp3-polices-reelles/artefacts.mjs
```

Les sorties existantes doivent être déplacées avant toute réexécution.
