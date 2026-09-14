# ADR-0005 — Préparation, volet SP-2 (NON FINALISÉ)

**Statut** : préparation uniquement. Ce document **n'est pas** l'ADR-0005. Il ne fixe aucune règle produit.

## A. Protocole expérimental (SP-2)

| Sujet | Convention expérimentale |
|---|---|
| Instrument | opentype.js 2.0.0, fichier `dist/opentype.mjs` vendorisé, SHA-256 `e139522a…68fb` |
| Police | DejaVu Sans Regular 2.37, fichier non modifié, SHA-256 `7da195a7…8954` |
| Normalisation | `EXPERIMENTAL_NORM_V1` : suppression des `Cc`, réduction des suites d'U+0020, trim des U+0020, NFC |
| Glyphes | `charToGlyph` par point de code, sans substitution OpenType (`stringToGlyphs` écarté : lève une erreur sur la table GSUB de DejaVu Sans avec opentype.js 2.0.0) |
| Crénage | Lookups GPOS `kern` du script `latn`, via `position.getKerningTables("latn")` ; `Font.getKerningValue` écarté (renvoie 0 sans initialisation des tables par défaut) |
| Positions | Origine `originXMm` ; ligne de base = ascender × échelle + n × `lineAdvanceMm` ; repère y vers le bas (`getPath`) |
| Contours | Commandes `getPath` (M, L, Q, C, Z) en mm, sans aplatissement |
| Arrondi / canonisation | Identiques à SP-1 (`Math.round(x·1000)/1000`, `-0` → 0 ; clés triées, sans espace, UTF-8) |
| Empreintes | SHA-256 par configuration, empreinte globale, empreinte de la matrice, SHA-256 de la police et d'opentype.js |
| Erreurs | `EXPERIMENTAL_UNSUPPORTED_GLYPH`, `EXPERIMENTAL_RUNTIME_ERROR` — **aucun code produit** |
| Critères | PASS / INCOMPLETE / NO-GO arbitrés (A2-11) |

## B. Règles produit (à arbitrer séparément — rien de décidé ici)

- Bibliothèque de mesure texte et version (architecture, §5.4).
- Polices de gravure (VR-08).
- Normalisation produit (§10).
- Stratégie de substitution OpenType et de crénage.
- Contrat `TextGlyphPaths`, mode d'arrondi `roundMm`, format de `geometryJson`.
- `UNSUPPORTED_GLYPHS`, `TEXT_TOO_LONG`, `BELOW_LEGIBILITY`.
- Runtimes de référence (AN-2).

**Règle de séparation** : aucune convention de la partie A ne devient une règle de la partie B sans décision explicite du Supervisor et ADR-0005 validé.
