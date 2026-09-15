# ADR-0005 — Déterminisme de la géométrie canonique : preuves expérimentales et règles produit

- **Statut** : **FINALISÉ (documentaire)**, sur décision du Supervisor après SP-1 PASS et SP-2 PASS.
- **Date** : 14/09/2026.
- **Emplacement cible** : `docs/ADR/0005-determinisme-geometrie.md`. **Intégration au dépôt : autorisée par le Supervisor (14/09/2026)**, branche documentaire `docs/adr-0005-determinisme`, non fusionnée dans `main` sans validation.
- **Références** : Master Plan v1.5 §5.4, §6, §10, §12, §32 (ARCH-PREVIEW), §34 R01 ; OD-17, VR-31, VR-32 ; registre v1.5 (SP-1, SP-2) ; CR-SP1-v3, CR-SP2-v1 ; ARB-SP2-v2.

> **Structure obligatoire** : la partie A (protocole expérimental) et la partie B (règles produit) sont **strictement séparées**. Aucun élément de la partie A n'est une règle produit.

---

## PARTIE A — PROTOCOLE EXPÉRIMENTAL

### A.1 SP-1 — géométrie indépendante du texte — **PASS** (décision Supervisor)

| Élément | Valeur effectivement utilisée / obtenue |
|---|---|
| Périmètre | `plate` (largeur, hauteur, rayon, épaisseur), `safeZoneMm`, `holes` count 0 et 4 (§11.3), sémantiques `edge_to_center` / `edge_to_rim` ; valeurs d'essai non atelier |
| Exclus | Validation P11, 2 trous (VR-24), keep-out, zone utile, admissibilité, orientation, couches, SVG, performance |
| Matrice | 60 configurations (4 workflows × 15), `c77670a91cd14827b8ca5c71a6e9b1084af889454a3eced956b9a4840c546272` |
| Noyau | `sp1-geometry-0.1.0` — branche `spike/sp1-determinisme` @ `2f560b8` |
| Environnements | Node v24.18.0 (référence) ; Chrome 152.0.7977.83 ; Firefox 155.0.1 ; Safari iOS réel (iPhone 16 Pro Max, iOS 26.6.2, UA `Version/26.6.1`) ; Edge 153.0.4234.32 (complémentaire) |
| Résultat | 60/60 identiques sur chaque environnement ; empreinte globale `ba0d62b0361ddaf97c9c8956c6a7c7c24954fafb442f9ba5f82bca0557968d59` |
| Preuves | `preuves-SP1/` (hors dépôt) |
| Historique | CR-SP1-DETERMINISME-v1 (INCOMPLET) → CR-SP1-CLOTURE-v1 (PASS annulé) → CR-SP1-v2 (INCOMPLET) → CR-SP1-v3 (PASS) |

### A.2 SP-2 — géométrie textuelle (L2) — **PASS** (décision Supervisor)

| Élément | Valeur effectivement utilisée / obtenue |
|---|---|
| Périmètre | Métriques de police, positions, boîtes englobantes, **contours glyphiques** ; 6 familles (simples, crénage, accents, NFC et espaces, ponctuation, absents) |
| Exclus | Shaping OpenType, ligatures, substitutions, SVG de production, fichiers machine, artwork, fabrication, zone utile, keep-out, `TEXT_TOO_LONG`, règles commerciales, police commerciale |
| Matrice | 60 configurations, `86ad5374925a50bb84bf56a16dc8f18bcb8e3a8bdd94c3d4c0c9d370bd6a07d1` |
| Noyau | `sp2-text-geometry-0.1.0` — branche `spike/sp2-text-geometry` @ `1d1cc96` |
| Instrument | opentype.js **2.0.0** (`dist/opentype.mjs` `e139522a…68fb`), **instrument expérimental uniquement** |
| Fixture | DejaVu Sans Regular **2.37** (`7da195a7…8954`), **fixture uniquement** |
| Méthode | Normalisation `EXPERIMENTAL_NORM_V1` (suppression des `Cc`, réduction et trim des U+0020, NFC) ; `charToGlyph` par point de code, **sans substitution OpenType** ; crénage GPOS `kern` du script `latn` lu explicitement ; contours `getPath` en mm, repère y vers le bas |
| Erreurs | `EXPERIMENTAL_UNSUPPORTED_GLYPH` (10 configurations F6, absents explicites, sans fallback) ; `EXPERIMENTAL_RUNTIME_ERROR` : 0 |
| Environnements | Mêmes 5 que SP-1 |
| Résultat | 300 comparaisons, 0 divergence ; empreinte globale `ce335c3262b0b7b023fb91258aea70084b7ac8c46785a4166b417ae407288dba` |
| Preuves | `preuves-SP2/` (hors dépôt) |

### A.3 Conventions expérimentales effectivement utilisées (NON NORMATIVES)

| Convention | Définition |
|---|---|
| Arrondi | `Math.round(x · 1000) / 1000` ; `-0` → `0` |
| JSON canonique | Clés triées par unités de code UTF-16 ; aucun espace ; nombres au format ECMAScript (`JSON.stringify`) ; `undefined`, `NaN` et `Infinity` interdits ; encodage UTF-8 |
| Empreintes | SHA-256 hexadécimal minuscule par configuration ; empreinte globale = SHA-256 du JSON canonique `[{id, sha256}]` ; empreinte de la matrice ; SHA-256 des artefacts (SP-2) calculé par chaque environnement |
| Hash navigateur | WebCrypto `crypto.subtle.digest` en contexte sécurisé (`127.0.0.1` ou HTTPS local avec CA de test temporaire) |
| Comparaison | Égalité stricte du JSON et du SHA-256 ; recalcul indépendant du SHA-256 ; réception iOS unique |
| Critères (SP-2) | PASS / INCOMPLETE / NO-GO arbitrés (A2-11) ; proposition mécanique, décision Supervisor |

### A.4 Faits techniques constatés (sans valeur de décision)

1. **Moteurs** : sur V8, SpiderMonkey et JavaScriptCore, les deux matrices produisent des résultats canoniques identiques avec les conventions A.3.
2. **opentype.js 2.0.0 + DejaVu Sans 2.37** :
   - `stringToGlyphs` / `getAdvanceWidth` lèvent l'erreur « substitutionType : 62 lookupType: 6 - substFormat: 2 is not yet supported » (fonctionnalité `ccmp`) ;
   - `Font.getKerningValue` renvoie 0 sans initialisation des tables de crénage par défaut.
3. **Glyphes absents** : ils sont détectables de façon déterministe (index 0), sans aucun accès aux polices du système.

### A.5 Portée

Preuves de **faisabilité** sur des périmètres expérimentaux. Elles ne constituent **pas** :
- une validation complète du déterminisme §12 ;
- une validation du produit ;
- un choix de police ou de bibliothèque.

---

## PARTIE B — RÈGLES PRODUIT

### B.1 Décisions produit explicitement arbitrées (reprises, non créées)

| ID | Règle | Source |
|---|---|---|
| B-D1 | La géométrie canonique (niveau 1) est **obligatoire** et doit être identique sur Node, Chrome, Safari iOS et Firefox (JSON canonique + SHA-256) | v1.5 §12 |
| B-D2 | Niveau 1 non atteint = **NO-GO** ; niveau 2 (SVG canonique) = objectif fort, non bloquant ; niveau 3 = détail | v1.5 §12, OD-17 |
| B-D3 | Vérité métier = géométrie déterministe + BAT serveur immuable + artefacts contractuels ; le preview client est indicatif | v1.5 §12 |
| B-D4 | Arrondi par une **fonction unique `roundMm` à 3 décimales** (le mode d'arrondi exact reste OPEN, B-O1) | v1.5 §10 |
| B-D5 | La mesure du texte ne s'appuie **jamais sur le DOM** ; elle utilise les fichiers de police embarqués | v1.5 §10 |
| B-D6 | Aucune valeur de fabrication codée en dur ; les valeurs sont résolues serveur et figées dans le BAT | v1.5 §6 |
| B-D7 | DejaVu Sans **n'est pas** une police produit ; opentype.js **n'est pas** un choix d'architecture définitif ; les conventions A.3 **ne sont pas** des règles métier | Décisions Supervisor (SP2-03, SP2-06, clôture SP-2) |
| B-D8 | Safari iOS **réel** est la preuve principale ; un simulateur ou WebKit macOS n'en tient jamais lieu | Directive Supervisor (préparation Phase 1) |

*Note : v1.5 §5.4 et §10 citent opentype.js dans la stack prévue. Conformément à B-D7, ce choix n'est pas confirmé comme architecture définitive → B-O5.*

### B.2 Règles produit OPEN / À VALIDER (aucune décision)

| ID | Sujet | Statut | Dépendance |
|---|---|---|---|
| B-O1 | Mode d'arrondi exact de `roundMm` (demi-valeurs, négatifs) | OPEN | — |
| B-O2 | Format canonique de `geometryJson` (ordre des clés, format numérique, encodage, versionnement du schéma) | OPEN | G2-DOC |
| B-O3 | Algorithme et usages de l'empreinte (BAT, artefacts, `ProductionArtifact.hash`) | OPEN | — |
| B-O4 | Schéma complet `CanonicalGeometry` (keep-out, couches, `TextGlyphPaths`) | OPEN | Keep-out, zone utile |
| B-O5 | Bibliothèque de mesure texte et version | À VALIDER | Architecture, ARB-SHAPING |
| B-O6 | Comportement de shaping garanti | OPEN | ARB-SHAPING-PREPARATION-v1, VR-08 |
| B-O7 | Polices de gravure, tailles et traits minimaux, safe zone | À VALIDER | **VR-08** |
| B-O8 | Normalisation produit du texte | OPEN | §10 |
| B-O9 | Sémantique de `UNSUPPORTED_GLYPHS`, `TEXT_TOO_LONG`, `BELOW_LEGIBILITY` | OPEN | VR-08, zone utile, keep-out |
| B-O10 | Orientation de pose et zone machine dans la géométrie | OPEN | **R-1**, VR-41 |
| B-O11 | Runtimes et versions de référence (Node) | À ARBITRER | AN-2 |
| B-O12 | Contrat du SVG canonique (niveau 2) | OPEN | OD-17, VR-32 |

## C. Règle de séparation

1. Aucune convention de la partie A ne devient une règle de la partie B sans décision explicite du Supervisor, consignée au registre et reportée dans une révision de cet ADR.
2. Les résultats SP-1 et SP-2 ne ferment aucun point ouvert (VR-08, R-1, VR-42 et autres restent OPEN).

## D. Conséquences

- ARCH-PREVIEW dispose de preuves partielles (SP-1, SP-2) ; le niveau 1 complet reste à démontrer sur la géométrie produit réelle.
- SP-4 (orientation, bloqué par R-1) reste non autorisé. SP-3 : voir révision E.
- Toute révision de cet ADR exige un arbitrage du Supervisor.

## E. Révision — arbitrages T1 (contrats du BAT réel)

Arbitrage Supervisor consigné dans `docs/product/t1-contrats-bat.md`. Les parties A à D ne sont pas réécrites ; les points ci-dessous précisent leur statut.

| ID | Statut après T1 |
|---|---|
| B-O2 | **Partiellement arbitré** : sérialisation par le `canonicalJson` existant ; géométrie arrondie à 0,001 mm selon la convention existante ; payload de l'empreinte du BAT versionné `{ schemaVersion: 1, content }`. Aucune autre canonicalisation. |
| B-O3 | **Partiellement arbitré** : `contentHash` = SHA-256 côté serveur, hexadécimal minuscule (64), du contenu métier canonique, indépendant de l'identité et du cycle de vie ; distinct de `integrite`. Usages et définition des empreintes d'artefacts et de `fontHash` : non arbitrés. |
| B-O1 | Inchangé : le mode exact de `roundMm` (demi-valeurs, négatifs) reste OPEN. |
| B-O5, B-O6 | Inchangés (À VALIDER / OPEN) : objets du spike SP-3, sans décision. |
| SP-3 | **Autorisé comme spike technique** (polices réelles, `TextGlyphPaths` déterministes, exigences VR-08). Il ne décide ni de la bibliothèque, ni de la police produit, ni des licences, ni des points VR-08 OPEN. |

## F. Révision — verdict SP-3 et contrat texte

Arbitrage Supervisor consigné dans `docs/product/contrat-texte.md`. Preuves : branche `spike/sp3-polices-reelles` @ `ca13261`. La séparation A / B est maintenue.

### F.1 Constats expérimentaux SP-3 (partie A — non normatifs)

| Élément | Valeur obtenue |
|---|---|
| Matrice | 105 configurations, 11 familles × 3 polices de fixture, `b9788fed50fa56299d09465925fd6116806f25d366c7298843a770ea47dde79b` |
| Instruments | harfbuzzjs 1.6.1 ; opentype.js 2.0.0 (modes shaping et cmap) |
| Fixtures | DejaVu Sans 2.37, Gentium Plus Regular, Libre Baskerville (variable, instance par défaut) |
| Environnements | Node 24.18.0, Chrome 152, Edge 153 : exécutés ; Firefox et Safari iOS réel : **INCOMPLETE** |
| Déterminisme | 315 / 315 par environnement ; 105 / 105 entre Node et Chrome, Node et Edge, pour chaque mode |
| Shaping | harfbuzzjs 105 / 105 ; opentype.js shaping 34 / 105 (lookups non supportés) |
| Géométrie entre moteurs | mêmes points, représentation différente (départ, segments nuls, fermeture) |
| Domaine existant | sérialisation 244 / 244 identique ; géométrie canonique valide au schéma |
| Règle 1 mm | tirets et traits d'union sous 1 mm à 8 et 10 mm nominaux |

### F.2 Statut des règles produit (partie B)

| ID | Statut après SP-3 |
|---|---|
| SP-3 | **PASS TECHNIQUE PARTIELLEMENT ENVIRONNÉ** |
| B-O5 | **Arbitré** : HarfBuzz est le moteur de shaping de référence ; opentype.js n'est plus le moteur de shaping principal. Distribution et version de production : OPEN. |
| B-O6 | **Partiellement arbitré** : fonctionnalités garanties `ccmp`, `liga`, `kern`, `mark`, `mkmk` ; aucune dégradation silencieuse. Traitement d'une fonctionnalité absente d'une police : OPEN. |
| B-O4 | **Partiellement arbitré** : `TextGlyphPaths` fondé sur des clusters logiques (plusieurs caractères source, un ou plusieurs glyphes), traçabilité préservée ; structure définitive OPEN. |
| B-O3 | Précisé : principe de `fontHash` (identité normalisée de la fonte utilisée, sans métadonnées volatiles, avec instance variable, sans moteur) ; payload OPEN. |
| B-O8 | Précisé : texte original → NFC → shaping → clusters → glyphes → contours ; original traçable. |
| B-O9 | Constat : l'application naïve de 1 mm à chaque glyphe n'est pas acceptable ; S3 reste OPEN. |
| B-O7, B-O1, B-O11 | Inchangés. |
| B-D1, B-D8 | Inchangés : aucune preuve Firefox ni Safari iOS réel ; le spike n'est pas une preuve des 5 environnements. |
| B-D7 | Étendu : DejaVu Sans, Gentium Plus et Libre Baskerville ne sont pas des polices produit. |
