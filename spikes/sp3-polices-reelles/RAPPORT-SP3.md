# SP-3 — Rapport : polices réelles et `TextGlyphPaths`

**ESSAI — NON NORMATIF.** Branche `spike/sp3-polices-reelles` (depuis `main` @ `5923df5`). Protocole : `PROTOCOLE-SP3.md`.
Aucun résultat ci-dessous n'est une règle produit. Aucune bibliothèque ni police n'est retenue. VR-08 S1, S2, S3, A7, `designRulesVersion`, `fontHash`, B-O5, B-O6 et licences produit restent OPEN.

## A. Environnement

| Environnement | Version | Statut |
|---|---|---|
| Node (référence) | v24.18.0, Windows_NT x64 | Exécuté (2 passes, processus distincts) |
| Chrome | 152.0.7977.83, headless, 127.0.0.1 | Exécuté (2 passes) |
| Edge | 153.0.4234.32, headless, 127.0.0.1 | Exécuté (2 passes) |
| Firefox | — | **INCOMPLETE** (non installé ; installation refusée) |
| Safari iOS réel | — | **INCOMPLETE** (non pilotable) |

## B. Dépendances

Vendorisées sous `vendor/`, hors `package.json` / `package-lock.json`. Détail : `ARTEFACTS.json`.

| Bibliothèque | Version | Licence | Intégrité |
|---|---|---|---|
| opentype.js | 2.0.0 | MIT | SHA-256 `e139522a…68fb` identique à SP-2 |
| harfbuzzjs | 1.6.1 | MIT | SHA-512 archive = `dist.integrity` npm ; `harfbuzz.wasm` `37777ced…ce71` |

## C. Polices (fixtures uniquement)

| Police | Octets | SHA-256 | Licence |
|---|---|---|---|
| DejaVu Sans 2.37 | 757 076 | `7da195a7…8954` | DejaVu |
| Gentium Plus Regular | 822 956 | `845e06bb…6f0b` | OFL 1.1 |
| Libre Baskerville `wght` (variable, instance par défaut) | 171 900 | `05a95421…6c5d` | OFL 1.1 |

## D. Capacités observées (`CAPACITES.json`)

| Police | upem | Glyphes | GSUB (extrait) | GPOS | Absents confirmés (candidats) |
|---|---|---|---|---|---|
| DejaVu | 2048 | 6 253 | `ccmp`, `liga`, `dlig`, `locl`… | `kern`, `mark`, `mkmk` | U+6F22, U+E000, U+0F00, U+16A0, U+1D504 |
| Gentium Plus | 2048 | 4 307 | `ccmp`, `liga`, `smcp`, `cv*`, `ss*`… | `kern`, `mark`, `mkmk` | + U+2603, U+1F600 |
| Libre Baskerville | 1000 | 861 | `ccmp`, `liga`, `dlig`, `frac`… ; axe `wght` | `kern`, `mark`, `mkmk` | + U+202F |

Sondes harfbuzzjs (fonctionnalité activée contre désactivée) : ligatures fi / fl / ff / ffi / ffl effectives dans les 3 polices ; « fj » sans effet ; crénage effectif ; positionnement des marques effectif ; **`ccmp` déclaré mais sans effet sur les sondes simples**.
Sondes opentype.js : `stringToGlyphs` en erreur sur toutes les sondes de DejaVu et Gentium, et sur 2 sondes de Libre Baskerville.

## E. Matrice gelée (`matrix.lock.json`)

105 configurations = 11 familles (ACC, NFD, ABS, LIG, CCMP, KERN, PONCT, TROUS, TAILLE : 9 chacune ; LIGNES, LIMITES : 12) × 3 polices.
Empreinte : `b9788fed50fa56299d09465925fd6116806f25d366c7298843a770ea47dde79b`.
Observation consignée : `SP3-ABS-03-D` — « ☃ » présent dans DejaVu (aucune absence pour ce cas), non corrigé.

## F. Protocole

Voir `PROTOCOLE-SP3.md`. 3 modes × 105 configurations × 3 environnements × 2 passes = 1 890 exécutions.

## G. Résultats opentype.js 2.0.0

| Mode | OK | Erreurs |
|---|---|---|
| `shaping` (`stringToGlyphs`) | 34 / 105 | 71 : DejaVu 35 (« substitutionType : 62 lookupType: 6 - substFormat: 2 is not yet supported »), Gentium 35 (« substitutionType : 52 lookupType: 5 - substFormat: 2 is not yet supported »), Libre 1 (`SP3-CCMP-01-L`, « Substitution type 11 is not supported in chaining substitution ») |
| `cmap` (méthode SP-2) | 105 / 105 | 0 — sans ligatures, `ccmp` ni positionnement des marques |

En mode `shaping`, les clusters ne sont pas exposés : 4 configurations (ligatures de Libre Baskerville) produisent des éléments `TextGlyphPaths` non attribuables à un caractère.

## H. Résultats harfbuzzjs 1.6.1

105 / 105 sans erreur. Désactiver une fonctionnalité modifie le résultat pour : `-ccmp` 5 configurations ; `-liga` 12 ; `-kern` 58 ; `-mark` 12.

## I. Shaping (entre moteurs, Node passe 1)

| Paire | Les deux OK | Glyphes / clusters identiques | Positions identiques | Géométrie identique |
|---|---|---|---|---|
| harfbuzzjs ↔ opentype.js `shaping` | 34 | 27 | 28 | 0 |
| harfbuzzjs ↔ opentype.js `cmap` | 105 | 81 | 61 | 0 |
| opentype.js `shaping` ↔ `cmap` | 34 | 29 | 30 | 29 |

Glyphes différents entre harfbuzzjs et `cmap` : LIG 9, CCMP 9, NFD 3, LIMITES 3 (« fin » : ligature fi).

## J. `ccmp`

Déclaré dans les 3 polices. Effet mesuré (harfbuzzjs) sur 5 configurations seulement : `SP3-CCMP-01-{D,G,L}` (i + ogonek + aigu, j + aigu) et `SP3-CCMP-03-{G,L}` (E + aigu + cédille, a + ogonek + grave). Aucun effet sur les accents simples : la normalisation NFC (H-NORM) les recompose avant shaping. opentype.js : non appliqué (mode `cmap`) ou en erreur (mode `shaping`).

## K. Ligatures

harfbuzzjs : appliquées par défaut dans les 3 polices (12 configurations modifiées). opentype.js : appliquées seulement avec Libre Baskerville en mode `shaping`, clusters perdus. Une ligature produit **un seul contour pour plusieurs caractères** (ex. « ffi »).

## L. Crénage

harfbuzzjs : 58 configurations modifiées par `-kern`. opentype.js `cmap` : le crénage GPOS n'est pas appliqué de la même façon (ex. `SP3-KERN-01-D` « AVATAR » : avance de A 6,201 mm avec harfbuzzjs contre 6,841 mm) — positions identiques dans 61 / 105 configurations seulement.

## M. Accents

ACC : glyphes identiques entre harfbuzzjs et `cmap` (9 / 9), positions différentes 2 / 9 (crénage). Marques combinantes sans forme précomposée (`q̃`, `x́`, `ņ`) : positionnées par harfbuzzjs (`mark`), non positionnées par opentype.js.

## N. Glyphes absents

`UNSUPPORTED_GLYPHS` dans le domaine pour 8 configurations (ABS hors `SP3-ABS-03-D`). Détection déterministe (glyphe 0), aucun repli, aucun tracé de glyphe absent (H-NOTDEF).

## O. `TextGlyphPaths`

- Conversion vers `CaractereTrace` (M / L / C / Z en mm, repère plaque vue face ; quadratiques converties exactement en cubiques).
- Sérialisation : `canonicalJson` du domaine ≡ sérialisation du spike, **244 / 244** SHA-256 identiques.
- Pipeline (catalogue de test) : `evaluateFabricability` → `resolveSpec` → `buildCanonicalGeometry` → `canonicalGeometrySchema` **valide** pour 75 configurations (harfbuzzjs et `cmap`) et 23 (`shaping`) ; 1 couche texte chacune.
- Gravure (TroLase de test) : `VALIDATION_REQUIRED@design.text.traits` toujours émis (S1, S2 OPEN).
- Granularité : une ligature ou une séquence `ccmp` donne un élément couvrant plusieurs points de code (H-CLUSTER), alors que le domaine décrit « un élément par caractère ».

## P. Déterminisme

| Mesure | Résultat |
|---|---|
| Intra-environnement (passe 1 ↔ 2) | Node 315 / 315 ; Chrome 315 / 315 ; Edge 315 / 315 |
| Node ↔ Chrome | 105 / 105 par mode |
| Node ↔ Edge | 105 / 105 par mode |
| Empreintes globales (identiques partout) | harfbuzzjs `33f701f3…4f75eb` ; opentype.js `shaping` `53813ce3…f3cf` ; `cmap` `4a9932e0…fba1` |

Firefox et Safari iOS réel : **non mesurés**.

## Q. Géométrie

- Entre moteurs, géométrie identique 0 / 105, y compris quand glyphes et positions sont identiques. Cause caractérisée : **même ensemble de points**, mais point de départ des contours différent, segments `L` de longueur nulle et `L` de fermeture explicite émis par opentype.js. Différence de représentation, pas de forme.
- Mesures du domaine (harfbuzzjs) : hauteur de boîte englobante minimale observée 0,449 mm.
- `BELOW_LEGIBILITY` à taille nominale (hors famille TAILLE) : **uniquement des tirets** — « — » à 10 mm (0,56 à 0,83 mm), « - » à 10 mm (`[A-B]`) et à 8 mm (« rendez-vous », 0,45 à 0,66 mm).
- `TEXT_TOO_LONG` : TROUS-02 (3 polices, texte sur zone de trou d'essai), TROUS-03-L, TAILLE-03-L (90 mm).

## R. Candidats `fontHash` (`FONTHASH.json`) — aucun retenu

| Candidat | Données | Métadonnées altérées (`head.modified`, `name`) | Instance variable `wght=700` |
|---|---|---|---|
| FH1 | Octets du fichier | Modifié | Inchangé |
| FH2 | Tables triées hors `DSIG` / `name`, `head` neutralisé | Stable | Inchangé |
| FH3 | upem + variations + avance et contour des glyphes utilisés | Stable | Modifié |

Constats : FH1 dépend des métadonnées ; FH2 ignore les métadonnées mais ne distingue pas l'instance variable ; FH3 dépend du moteur de dessin et du texte. Une combinaison du type « FH2 + coordonnées de variation + identifiant de moteur » est techniquement cohérente avec ces mesures — **proposition non arbitrée**.

## S. Candidats taille / composition (`TAILLE-COMPOSITION.json`) — aucun retenu

54 cas (3 polices × 2 plaques × 3 textes × 3 interlignes), bornes d'expérience 1 à 60 mm au pas 0,1 mm.
- C1 (taille fixe) : dépassement signalé sans ajustement.
- C2 (plus grande taille uniforme) : écart entre moteurs dans 6 cas (crénage) ; résultat dépendant de l'interligne et de la position verticale supposées.
- C3 (taille par ligne) : lignes courtes plafonnées à la borne d'expérience (60 mm) — la borne supérieure devient déterminante.
Mesure de hauteur approchée par l'enveloppe des points de contrôle (≠ `boiteEnglobante` du domaine).

## T. Firefox

**INCOMPLETE** — non installé ; aucun substitut.

## U. Safari iOS réel

**INCOMPLETE** — non pilotable ; Chrome et Edge n'en tiennent pas lieu (B-D8).

## V. Limitations

- 3 polices latines de fixture ; aucune écriture complexe ou RTL.
- Fonte variable : instance par défaut seulement.
- opentype.js : crénage via `position.getKerningTables` du script par défaut ; aucune marque positionnée.
- Normalisation NFC avant shaping (H-NORM) : masque une partie des effets de `ccmp`.
- Taille / composition : boîte des points de contrôle, paramètres d'expérience.
- Méthode de mesure du trait (S2) : non explorée.
- Environnement unique Windows ; navigateurs de bureau headless uniquement.
- `resultats/node/passe-1.json` : 6,8 Mo (sorties détaillées de preuve).

## W. Décisions Supervisor nécessaires

1. **B-O5** : bibliothèque de shaping — opentype.js 2.0.0 échoue en shaping sur 2 polices sur 3 ; harfbuzzjs aboutit sur 105 / 105 (aucun choix fait ici).
2. **B-O6** : shaping garanti — ligatures, `ccmp`, positionnement des marques et crénage activés ou non pour la gravure.
3. **Granularité de `TextGlyphPaths`** : « un élément par caractère » contre un élément par cluster (ligatures, séquences `ccmp`).
4. **Représentation canonique des contours** (point de départ, segments dégénérés, fermeture) si l'empreinte de géométrie doit être indépendante du moteur.
5. **`fontHash`** : définition (données, métadonnées, instance variable, moteur).
6. **S3** : portée de « caractère » — tirets et traits d'union sous 1 mm de hauteur à taille nominale.
7. **A7** : composition, interligne, position, bornes et stratégie de taille effective.
8. **Environnements manquants** : exécution Firefox et Safari iOS réel pour clore le déterminisme.
9. **Polices variables** : admises ou non, et instance à figer.
10. **Normalisation avant shaping** (NFC) : confirmée ou non comme étape du moteur de polices.
