# SP-2 — Protocole expérimental : géométrie textuelle

**ESSAI — NON NORMATIF.** Préparation uniquement : la matrice **n'a pas été exécutée**.
**Branche** : `spike/sp2-text-geometry`, créée depuis `main` @ `7c29590`.
**Sources des décisions** : arbitrages Supervisor SP2-01, SP2-03, SP2-06, ARB-SP2-v2 (A2-00 = L2, A2-01 à A2-17).
**Ce protocole ne valide pas** :
- fabricabilité ;
- artwork ;
- SVG de production ;
- fichiers machine ;
- orientation ;
- zone utile ;
- keep-out ;
- `TEXT_TOO_LONG` ;
- BAT ;
- fabrication ;
- règles commerciales ;
- choix client ;
- police commerciale.

VR-08 et R-1 restent OPEN.

## 1. Artefacts (détail : `ARTEFACTS.json`)

| Artefact | Version | Source officielle | SHA-256 du fichier servi |
|---|---|---|---|
| opentype.js `dist/opentype.mjs` | 2.0.0 | Registre npm (`npm pack`) ; SHA-512 de l'archive = `dist.integrity` npm | `e139522ac432bb38fb4878d772012f0ad351993c36d7815d65a9890fb3fe68fb` |
| Licence opentype.js (MIT) | 2.0.0 | idem | `a5b87c9bc191e7f9c06b07bd7cbbed3ed846dfdb50e859484b2c245aa1ab2e61` |
| DejaVu Sans Regular `DejaVuSans.ttf` | 2.37 | Release GitHub `version_2_37` (zip de 5 522 795 octets, taille conforme à l'API GitHub) | `7da195a74c55bef988d0d48f9508bd5d849425c1770dba5d7bfc6ce9ed848954` |
| Licence DejaVu | 2.37 | idem | `7a083b136e64d064794c3419751e5c7dd10d2f64c108fe5ba161eae5e5958a93` |

- Les fichiers ne sont pas modifiés. `.gitattributes` (`* -text`) empêche toute conversion de fin de ligne.
- opentype.js **n'est pas** installé dans le projet produit : `package.json` et `package-lock.json` sont inchangés.

## 2. Matrice gelée (`matrix.mjs`, `matrix.lock.json`)

- **60 configurations** = 6 familles × 10 :
  - F1 lettres et chiffres simples ;
  - F2 paires de crénage ;
  - F3 accents français ;
  - F4 NFC et espaces ;
  - F5 ponctuation ;
  - F6 caractères absents de la police.
- **Empreinte de la matrice gelée** : `86ad5374925a50bb84bf56a16dc8f18bcb8e3a8bdd94c3d4c0c9d370bd6a07d1`.
- **Figé par configuration** : identifiant, famille, texte, points de code Unicode bruts, points de code après normalisation, police, paramètres.
- **Paramètres d'essai** :
  - taille de 4 à 33,3333 mm ;
  - interligne d'essai de 4,8 à 40 mm ;
  - origine x = 0 ;
  - crénage activé (désactivé pour SP2-F1-03 et SP2-F1-08) ;
  - script `latn`.
- **Caractères F6**, vérifiés absents de la police (glyphe 0) :
  - U+6F22 ;
  - U+E000 ;
  - U+0F00 ;
  - U+16A0 ;
  - U+1D504.
- **Vérifications** : F1 à F5 entièrement présents dans la police ; au moins un caractère absent par configuration F6.
- **Règle** : aucun caractère ajouté ni modifié sans arbitrage Supervisor. `geler-matrice.mjs` refuse de réécrire le gel.

## 3. Géométrie collectée (L2)

Par configuration :
- **police** : `unitsPerEm`, `ascender`, `descender` ;
- **paramètres** ;
- **par ligne** : points de code normalisés, ligne de base (mm), largeur (mm), boîte englobante (mm) ;
- **par glyphe** : point de code, index de glyphe, position x (mm), avance (mm), crénage avec le suivant (mm), boîte englobante, **contour** (commandes `M`, `L`, `Q`, `C`, `Z` en mm) ;
- **erreurs expérimentales**.

**Méthode (instrument, non normative)** :
- **normalisation** `EXPERIMENTAL_NORM_V1` : suppression des `Cc`, réduction des suites d'U+0020, trim des U+0020, NFC ;
- **glyphes** : `charToGlyph` par point de code, sans substitution OpenType ;
- **crénage** : lookups GPOS `kern` du script `latn` ;
- **contours** : `glyph.getPath(x, ligneDeBase, tailleMm)`, repère y vers le bas.

**Constats d'instrument** : avec opentype.js 2.0.0 et DejaVu Sans 2.37, `stringToGlyphs` / `getAdvanceWidth` lèvent une erreur (lookup GSUB non supporté), et `Font.getKerningValue` renvoie 0. Ils sont donc écartés au profit des appels explicites ci-dessus.

## 4. Canonisation et empreintes

- **Canonisation** : arrondi et JSON canonique identiques à SP-1 (conventions expérimentales).
- **Empreintes** :
  - SHA-256 par configuration ;
  - empreinte globale ;
  - empreinte de la matrice ;
  - SHA-256 de la police et d'opentype.js calculés **par chaque environnement** sur les octets effectivement chargés.

## 5. Environnements et runners (non exécutés)

| Environnement | Statut | Runner |
|---|---|---|
| Node **v24.18.0** | Obligatoire (référence) | `node spikes/determinisme-sp2/run-node.mjs <sortie>` |
| Chrome | Obligatoire | `run-browsers.mjs <sortie> chrome=<exe>` |
| Firefox | Obligatoire | `run-browsers.mjs <sortie> firefox=<exe>` |
| Safari iOS réel | Obligatoire (preuve principale) | `https/generer-certificat.sh` (nouveaux certificats, hors dépôt) + `https/serveur-https.mjs` |
| Edge | Complémentaire | `run-browsers.mjs <sortie> edge=<exe>` |

**Garde-fous** :
- liste blanche des fichiers servis (`serveur-fichiers.mjs`) ;
- aucune réécriture d'un résultat existant ;
- réception iOS unique ;
- contrôle du commit attendu et d'un spike non modifié ;
- aucun ancien certificat SP-1 ; aucun certificat généré à ce stade.

## 6. Critères (A2-11) — `verdict.mjs`

| Statut | Conditions implémentées |
|---|---|
| **PASS** | Matrice complète ; aucune donnée manquante ; JSON canonique et SHA-256 identiques à Node pour chaque configuration, sur tous les environnements obligatoires ; aucune divergence |
| **INCOMPLETE** | Environnement obligatoire non testé ; résultat ou donnée manquant ; erreur d'exécution ; `EXPERIMENTAL_RUNTIME_ERROR` ; contexte iOS non sécurisé ; divergence non encore reproduite (réexécution requise) |
| **NO-GO** | Divergence reproduite (même configuration, même environnement obligatoire, ≥ 2 exécutions) ; corruption de preuve (SHA-256 incohérent avec le JSON) ; entrées non identiques (matrice, police ou opentype.js) |

- Le script produit une **proposition** ; la décision appartient au Supervisor.
- Le « contournement du protocole » n'est pas détectable automatiquement : il relève de la revue.
- `verifier-preparation.mjs` teste ces règles sur des données **synthétiques** en mémoire, jamais écrites.

## 7. Erreurs expérimentales (A2-12)

- `EXPERIMENTAL_UNSUPPORTED_GLYPH` : caractère sans glyphe (index 0). C'est un résultat haché et comparé, pas un arrêt.
- `EXPERIMENTAL_RUNTIME_ERROR` : exception inattendue → INCOMPLETE.

Aucun code produit créé (`UNSUPPORTED_GLYPHS` et `TEXT_TOO_LONG` restent hors SP-2).

## 8. Chemins lint (zone existante `strict-product`, chemins exacts — À CONFIRMER)

| Chemin | Justification | Statut |
|---|---|---|
| `.gitattributes` | Octets des fixtures préservés | Ajouté |
| `PROTOCOLE-SP2.md` | Protocole | Ajouté |
| `ADR-0005-preparation-SP2.md` | Préparation ADR (A / B) | Ajouté |
| `ARTEFACTS.json` | Traçabilité des artefacts | Ajouté |
| `matrix.lock.json` | Gel de la matrice | Ajouté |
| `core.mjs` | Noyau expérimental | Ajouté |
| `matrix.mjs` | Matrice | Ajouté |
| `geler-matrice.mjs` | Outil de gel | Ajouté |
| `serveur-fichiers.mjs` | Liste blanche servie | Ajouté |
| `run-node.mjs` | Runner Node | Ajouté |
| `run-browsers.mjs` | Runner navigateurs | Ajouté |
| `index.html` | Page navigateur | Ajouté |
| `verdict.mjs` | Critères | Ajouté |
| `verifier-preparation.mjs` | Contrôles de préparation | Ajouté |
| `https/generer-certificat.sh` | Outillage iOS | Ajouté |
| `https/serveur-https.mjs` | Outillage iOS | Ajouté |
| `vendor/opentype.js-2.0.0/opentype.mjs` | Instrument tiers (contrôlé : aucun motif interdit) | Ajouté |
| `vendor/opentype.js-2.0.0/LICENSE` | Licence | Ajouté |
| `vendor/dejavu-fonts-ttf-2.37/DejaVuSans.ttf` | Fixture binaire (non analysée par le lint) | Ajouté |
| `vendor/dejavu-fonts-ttf-2.37/LICENSE` | Licence | Ajouté |

Tous les chemins sont relatifs à `spikes/determinisme-sp2/`.
- Aucune nouvelle zone, aucune exclusion.
- **Résultats futurs** : les sorties d'exécution sont prévues **hors dépôt** (dossier de preuves). Aucun chemin supplémentaire n'est nécessaire, sauf décision de verser les résultats dans le dépôt.

## 9. Limites déclarées (A2-13)

- Une police TrueType (contours quadratiques), une version d'opentype.js.
- Tailles et interlignes d'essai ; aucune composition réelle.
- Aucune zone utile, aucun keep-out, aucun SVG, aucun miroir.
- Aucune substitution OpenType ; crénage GPOS `latn` uniquement.
- Un seul appareil iOS.

Un PASS éventuel ne vaudrait ni pour les polices commerciales (SP-3), ni pour l'application future.
