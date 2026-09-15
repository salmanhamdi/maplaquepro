# Plan SP-3 — Polices réelles et `TextGlyphPaths` déterministes

**Statut : plan d'exécution proposé du spike technique autorisé par T1 (décision 9).** Un spike produit des preuves de faisabilité ; il ne crée aucune règle produit (ADR-0005, partie C). Aucune intégration à `src/` n'est prévue par ce plan.

## 1. Objectif

Démontrer, avec de vraies polices, la génération déterministe de `TextGlyphPaths` compatibles avec le domaine (`CaractereTrace` : un élément par caractère, contours M / L / C / Z en mm, repère plaque vue face) et leur contrôle par les exigences VR-08 déjà arbitrées (boîte englobante ≥ 1 mm, zone utile sans safe zone, aucune transformation après conversion).

## 2. Acquis réutilisés (sans valeur de décision)

- SP-1 / SP-2 PASS (ADR-0005) : 5 environnements (Node de référence, Chrome, Firefox, Safari iOS réel, Edge), conventions expérimentales A.3 (arrondi 0,001, JSON canonique, SHA-256).
- Constats SP-2 avec opentype.js 2.0.0 : `ccmp` non supporté (erreur « substitutionType 62 ») ; crénage à 0 sans initialisation des tables ; glyphes absents détectables (index 0).
- Domaine : `evaluateFabricability` accepte `glyphesDisponibles` et `texteTrace` ; `buildCanonicalGeometry` écrit la couche texte ; `productionSvg` écrit les tracés tels quels.

## 3. Périmètre à démontrer

| Axe | Démonstration attendue |
|---|---|
| Glyphes | Couverture, glyphes absents ⇒ `UNSUPPORTED_GLYPHS`, aucun repli sur une police système |
| Shaping | Comportement réel de la bibliothèque candidate ; écarts documentés |
| `ccmp` | Composition / décomposition (accents) avec et sans support |
| Ligatures | Présence ou absence, sur des polices qui en contiennent |
| Crénage | GPOS `kern` effectivement appliqué ou non, mesuré |
| Déterminisme | Tracés et empreintes identiques sur les 5 environnements |
| `fontHash` | Candidats de définition comparés (ex. empreinte des octets du fichier de police, avec ou sans version de bibliothèque) — **aucune définition retenue par le spike** |
| Taille effective | Comportement mesuré de stratégies candidates ; **A7 reste OPEN** |
| Composition | Lignes, alignement, interligne testés comme paramètres expérimentaux ; **A7 reste OPEN** |
| Tracés | Conversion en `CaractereTrace` en mm, `roundMm`, validation par `canonicalGeometrySchema` |
| Fabricabilité | Passage des tracés dans `evaluateFabricability` (catalogue de test) : `BELOW_LEGIBILITY`, `TEXT_TOO_LONG` ; trait minimal : mesures exploratoires éventuelles **sans code ni sévérité** (S1, S2 OPEN) |

## 4. Protocole

1. **Branche dédiée** `spike/sp3-polices-reelles`, depuis `main` ; aucune fusion sans verdict.
2. **Bibliothèques candidates** comparées, sans choix : opentype.js 2.x (référence SP-2) et au moins une solution de shaping complète (par exemple un moteur de shaping compilé en WebAssembly) ; versions et empreintes des distributions consignées.
3. **Polices de fixture** à licence ouverte, choisies pour couvrir accents, ligatures, crénage et glyphes absents ; étiquetées **fixtures uniquement** (jamais police produit).
4. **Matrice gelée** (≥ 60 configurations) : familles simples, accents / NFC, ligatures, crénage, ponctuation et signes isolés, glyphes absents, textes longs, 1 à 4 lignes, alignements gauche / centre, plaques et trous variés ; empreinte de matrice publiée avant exécution.
5. **Exécution** sur les 5 environnements ; comparaison stricte JSON + SHA-256 ; Safari iOS réel obligatoire (B-D8).
6. **Contrôle domaine** : tracés injectés dans `evaluateFabricability` / `buildCanonicalGeometry` d'une copie de travail du domaine, sans modification de `src/`.
7. **Critères** proposés PASS / INCOMPLETE / NO-GO par axe ; **décision Supervisor**.
8. **Livrable** : compte rendu CR-SP3 (résultats, écarts par bibliothèque, candidats `fontHash`, limites) et proposition de révision de l'ADR-0005 soumise à arbitrage.

## 5. Autorisations nécessaires avant exécution

1. **Installation / vendorisation** de bibliothèques et de polices de fixture dans la branche de spike.
2. **Classement des fichiers du spike** dans le lint des termes interdits (zone ou exclusion explicite, P2 D3) : sans classement, la CI échoue sur les fichiers non classés.
3. **Environnements** : disponibilité d'un appareil iOS réel et versions de référence (B-O11 à arbitrer).
4. **Liste des bibliothèques candidates** à comparer.

## 6. Hors périmètre

Choix de bibliothèque définitive ; police produit ; liste de polices commerciales ; licences ; S1, S2, S3, A7 ; `designRulesVersion` ; intégration au BAT (`buildBatDraft` refuse toujours le texte) ; interface ; persistance.
