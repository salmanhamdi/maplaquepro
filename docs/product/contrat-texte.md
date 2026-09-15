# Contrat texte — moteur de shaping, `TextGlyphPaths`, contours, `fontHash`

**Statut :** lot documentaire issu du verdict Supervisor sur SP-3. Il distingue strictement :
- **DÉCISION** — arbitrage Supervisor consigné tel quel ;
- **PROPOSITION** — préparée pour arbitrage, non normative ;
- **OPEN** — non tranché.

Aucun code de production n'est modifié. Le Master Plan v1.6, G2-D12 et T1 (`t1-contrats-bat.md`) ne sont pas modifiés.
Preuves : branche `spike/sp3-polices-reelles` @ `ca13261` (`RAPPORT-SP3.md`, `PROTOCOLE-SP3.md`, sorties JSON).

## 0. Verdict SP-3

**DÉCISION** — SP-3 : **PASS TECHNIQUE PARTIELLEMENT ENVIRONNÉ**.

| Environnement | Statut |
|---|---|
| Node 24.18.0 | Démontré (déterminisme intra et inter-environnement) |
| Chrome 152 (headless) | Démontré |
| Edge 153 (headless) | Démontré |
| Firefox | **INCOMPLETE** |
| Safari iOS réel | **INCOMPLETE** |

Le spike n'est **jamais** présenté comme une preuve des 5 environnements (B-D1, B-D8).

## 1. Moteur de shaping

| Point | Statut |
|---|---|
| HarfBuzz est le **moteur de shaping de référence** | DÉCISION |
| opentype.js n'est plus le moteur de shaping principal | DÉCISION |
| Fonctionnalités garanties : `ccmp`, `liga`, `kern`, `mark`, `mkmk` | DÉCISION |
| **Aucune dégradation silencieuse du shaping** | DÉCISION |
| Distribution de production (liaison, version exacte, exécution serveur) | OPEN — la version effective sera tracée par `engineVersions` |
| Rôle éventuel d'opentype.js hors shaping | OPEN — aucun rôle décidé |

**PROPOSITION — sens de « aucune dégradation silencieuse » :**
- une erreur du moteur, ou l'impossibilité d'appliquer une fonctionnalité garantie, bloque la génération avec une violation explicite ;
- aucun repli vers un mode sans shaping (type « cmap », mesuré par SP-3) ;
- à distinguer : une fonctionnalité **absente de la police** (table sans cette fonctionnalité) n'est pas une défaillance du moteur. Traitement à arbitrer : acceptée et tracée, ou police refusée.

Constats SP-3 : HarfBuzz 105 / 105 ; opentype.js 2.0.0 en shaping 34 / 105 (erreurs de lookups non supportés).

## 2. `TextGlyphPaths` fondé sur des clusters

| Point | Statut |
|---|---|
| Relation texte → glyphes fondée sur des **clusters logiques** | DÉCISION |
| Un cluster peut couvrir plusieurs caractères source et produire un ou plusieurs glyphes | DÉCISION |
| « 1 caractère = 1 glyphe » n'est pas imposé | DÉCISION |
| Traçabilité caractère / cluster → glyphe préservée | DÉCISION |

**Écart avec l'existant :** le domaine décrit aujourd'hui `TextGlyphPaths` comme « un élément par caractère » (`CaractereTrace { caractere, contours }`, `geometrie-canonique.ts`). SP-3 a montré qu'une ligature (« ffi ») ou une séquence `ccmp` produit un seul élément pour plusieurs points de code.

**PROPOSITION — structure (conceptuelle, non implémentée) :**

```
TexteTrace
  lignes[] :
    source      : texte original de la ligne (tel que reçu)
    normalise   : texte après normalisation §10 (dont NFC)
    clusters[] :
      index            : rang du cluster dans la ligne
      sourceNormalisee : [début, fin[ en points de code du texte normalisé
      texte            : sous-chaîne normalisée couverte
      glyphes[] :
        glyphId, avanceMm, decalageXMm, decalageYMm
        contours       : segments M / L / C / Z canoniques (§3)
```

- Contrôles VR-08 et zone utile appliqués **au cluster** (boîte de l'union de ses glyphes). Unité exacte : liée à S3 (§6).
- Compatibilité : `CaractereTrace` devient un cluster (`caractere` = texte du cluster), ce qui garde utilisables `evaluerTexteTrace` et la couche texte canonique pendant la transition.
- Traçabilité jusqu'au texte original : §5.

## 3. Canonicalisation des contours

| Point | Statut |
|---|---|
| Point de départ déterministe | DÉCISION (principe) |
| Suppression des segments dégénérés | DÉCISION (principe) |
| Fermeture normalisée | DÉCISION (principe) |
| Aucune altération de la forme ; précision conservée ; sérialisation déterministe | DÉCISION (principe) |
| Algorithme exact | PROPOSITION ci-dessous — non implémenté dans le domaine |

Constat SP-3 motivant la règle : entre moteurs, **mêmes points** mais point de départ différent, segments `L` de longueur nulle et `L` de fermeture explicite (géométrie identique 0 / 105).

**PROPOSITION — algorithme, appliqué à chaque contour d'un glyphe positionné, en mm, repère plaque vue face :**
1. **Représentation** : segments `M`, `L`, `C`, `Z` ; les quadratiques sont converties **exactement** en cubiques (C1 = P0 + ⅔(Q − P0), C2 = P + ⅔(Q − P)).
2. **Précision** : toutes les coordonnées arrondies par `roundMm` (0,001 mm, convention existante ; mode B-O1 OPEN) avant les étapes suivantes ; `-0` → `0`.
3. **Segments dégénérés** supprimés :
   - `L` dont l'extrémité égale le point courant ;
   - `C` dont les deux points de contrôle et l'extrémité égalent le point courant.

   Un `C` qui revient au point courant avec des points de contrôle distincts (boucle) **est conservé**.
4. **Fermeture** : tout contour se termine par `Z`. Un `L` final dont l'extrémité égale le point de départ est retiré (fermeture implicite de `Z`) ; un `C` final revenant au départ est conservé.
5. **Point de départ** : rotation cyclique du contour fermé (sens de parcours **inchangé**, aucune inversion) pour démarrer sur l'extrémité de segment la plus petite selon (y, puis x). Égalité entre plusieurs extrémités : rotation dont la sérialisation est lexicographiquement minimale.
6. **Ordre des contours d'un glyphe** : OPEN — conserver l'ordre du moteur, ou trier (boîte puis sérialisation). Le tri ne modifie pas le remplissage mais doit être arbitré.
7. **Sérialisation** : `canonicalJson` existant.

**Invariants à tester lors de l'implémentation :**
- idempotence ;
- ensemble des extrémités distinctes inchangé ;
- aire signée inchangée à la précision près ;
- sens de parcours inchangé ;
- déterminisme inter-environnements ;
- sur la matrice SP-3, géométrie identique entre moteurs dès que glyphes et positions sont identiques (cible 61 / 61).

**Point à confirmer :** compatibilité avec F11 / S7 (« aucune compensation, simplification, nettoyage après conversion »). La canonicalisation est proposée **au sein de la conversion**, sans changement de forme ; la suppression de segments de longueur nulle doit être confirmée comme non contraire à F11.

## 4. `fontHash`

**DÉCISION — principe :** `fontHash` = identité normalisée de la fonte **réellement utilisée**.
- Métadonnées volatiles / non déterminantes exclues.
- Paramètres d'instance inclus pour les fontes variables.
- Le moteur de shaping n'est **pas** inclus : il est représenté par `engineVersions`.

Constats SP-3 (`FONTHASH.json`) :

| Candidat | Métadonnées altérées | Instance `wght=700` |
|---|---|---|
| Octets du fichier | Modifié | Inchangé |
| Tables normalisées (hors `DSIG`, `name`, dates et somme de `head`) | Stable | Inchangé |
| Contenu des glyphes utilisés | Stable | Modifié |

Tables observées :
- DejaVu Sans : `FFTM GDEF GPOS GSUB MATH OS/2 cmap cvt fpgm gasp glyf head hhea hmtx kern loca maxp name post prep` ;
- Gentium Plus : `GDEF GPOS GSUB OS/2 Silt cmap cvt fpgm gasp glyf head hhea hmtx loca maxp name post prep` ;
- Libre Baskerville : `GDEF GPOS GSUB HVAR OS/2 STAT avar cmap fvar gasp glyf gvar head hhea hmtx loca maxp name post prep`.

**PROPOSITION — payload (format exact à arbitrer) :**

```
{
  schemaVersion: 1,
  conteneur: "sfnt",
  indexCollection: 0,
  tables: { "<tag>": "<SHA-256 hex des octets normalisés de la table>" },
  instance: { "<axe>": <coordonnée utilisateur> }
}
fontHash = SHA-256 hexadécimal minuscule de canonicalJson(payload)
```

- **Source** : tables sfnt décodées (une fonte livrée compressée est décodée avant calcul) ; ordre du répertoire, remplissage et sommes de contrôle du répertoire ignorés.
- **Normalisation de `head`** : `checkSumAdjustment`, `created`, `modified` mis à zéro.
- **Exclusions proposées** (volatiles / non déterminantes pour la géométrie et le shaping) : `DSIG` (signature), `FFTM` (horodatage d'outil), `name` (libellés).
- **À arbitrer** :
  - `post` (noms de glyphes) ;
  - tables de hinting (`cvt`, `fpgm`, `prep`, `gasp`), sans effet sur les contours non hintés ;
  - tables privées (`Silt`) ;
  - `MATH`, `STAT`.

  Inclusion conservatrice proposée : une modification de ces tables produit alors un nouveau `fontHash`, jamais un faux « identique ».
- **Fonte statique** : `instance: {}`.
- **Fonte variable** : **tous** les axes de `fvar`, coordonnées effectivement utilisées, valeurs par défaut écrites explicitement, bornées à l'intervalle de l'axe. Le nom d'instance nommée n'est pas utilisé.
- **Collection** : `indexCollection` de la face utilisée.

**Stabilité attendue :**
- insensible au renommage de fichier, aux dates, à la signature et aux libellés ;
- sensible à toute modification de contours, métriques, `cmap`, tables de shaping ou variations, et aux coordonnées d'instance.

**Risque :** deux fichiers aux contours identiques mais aux tables auxiliaires différentes produisent des `fontHash` différents (sens conservateur, voulu).

## 5. Normalisation et traçabilité

**DÉCISION — pipeline :**

```
texte original → NFC → shaping → clusters → glyphes → contours
```

Le texte original reste traçable.

**Précisions :**
- La normalisation §10 déjà décidée comprend NFC, suppression des caractères de contrôle, réduction des espaces et trim (`normaliserLigne`). NFC y est intégrée : l'ordre interne de §10 n'est pas modifié par ce lot.
- **PROPOSITION** :
  - le BAT conserve le texte original **et** le texte normalisé ; toute modification par normalisation reste signalée (`TexteNormalise.modifie`) ;
  - chaque cluster référence un intervalle du texte normalisé ;
  - la correspondance texte normalisé → texte original est calculée par segments de normalisation (séquences commençant par un caractère de base) et conservée.
- Constat SP-3 : NFC recompose les accents simples avant shaping ; `ccmp` n'agit alors que sur les séquences sans forme précomposée.

## 6. VR-08 — règle de 1 mm

**DÉCISION — constat documenté :** l'application naïve de `hauteurBoiteEnglobante ≥ 1 mm` à **chaque glyphe** n'est pas acceptable.

Mesures SP-3 (à taille nominale, hors cas de petite taille) :

| Cluster | Taille nominale | Hauteur mesurée |
|---|---|---|
| « — » tiret cadratin | 10 mm | 0,56 à 0,83 mm |
| « - » trait d'union | 10 mm | 0,56 à 0,83 mm |
| « - » trait d'union | 8 mm | 0,45 à 0,66 mm |

S3 (portée de « caractère ») **reste OPEN**.

**PROPOSITION S3 (non normative) :**
1. **Unité** : le cluster (§2), pas le glyphe isolé.
2. **Clusters à extension verticale significative** — soumis à la hauteur de boîte englobante ≥ 1 mm (F1, F2) : clusters contenant au moins une lettre (`L*`), un chiffre (`Nd`) ou un symbole (`S*`).
3. **Clusters de ponctuation horizontale** — tirets `Pd`, soulignés `Pc`, points et virgules isolés : non soumis à la hauteur de 1 mm, mais soumis au trait minimal (F3, 1 mm, dont la méthode S2 et le code S1 restent OPEN) et à un seuil de visibilité **à obtenir de l'atelier**.
4. **Espaces** : aucun contrôle de hauteur.
5. **Questions atelier associées** :
   - la règle de 1 mm s'applique-t-elle à la ponctuation ?
   - quelle épaisseur minimale pour un tiret gravé ?
   - un accent peut-il être sous 1 mm si la lettre porteuse le dépasse ?

## 7. A7 — taille et composition

**DÉCISION — principes :**
- taille effective **déterministe** ;
- **calculée côté serveur** ;
- **aucun ajustement silencieux** ;
- **aucune réduction automatique non validée** par le client.

**OPEN :** bornes min / max ; interligne ; composition ; stratégie multi-lignes (taille uniforme ou par ligne) ; bornes exactes.
Constats SP-3 (`TAILLE-COMPOSITION.json`, non normatifs) : la taille maximale obtenue dépend du crénage (6 écarts sur 54 entre moteurs), de l'interligne et de la position verticale supposés ; en stratégie par ligne, la borne supérieure devient déterminante.

## 8. Licences

**DÉCISION :** DejaVu Sans, Gentium Plus et Libre Baskerville restent des **fixtures de spike uniquement**. Aucune police produit n'est choisie ; aucune licence produit n'est arbitrée.

## 9. Points OPEN (récapitulatif)

| Point | Référence |
|---|---|
| Distribution et version de production de HarfBuzz | §1, B-O5 |
| Fonctionnalité garantie absente d'une police | §1 |
| Structure définitive de `TextGlyphPaths` | §2, B-O4 |
| Ordre des contours ; compatibilité F11 / S7 de la canonicalisation | §3 |
| Payload exact de `fontHash` (tables auxiliaires, format) | §4 |
| Correspondance texte normalisé → original | §5 |
| S1, S2, S3 | §6, VR-08 |
| A7 (bornes, interligne, composition, multi-lignes) | §7 |
| `designRulesVersion` | VR-08 |
| Firefox, Safari iOS réel | §0, B-D1, B-D8 |
| Portée de B-D1 si le shaping est exclusivement serveur | §0, ADR-0005 |
| Fontes variables admises en production | §4 |
| Polices produit et licences | §8 |
| Mode exact de `roundMm` | B-O1 |
