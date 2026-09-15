// SP-3 — matrice expérimentale (ESSAI — NON NORMATIF). Tous les paramètres ci-dessous sont des HYPOTHÈSES de spike :
// ils ne constituent ni une règle VR-08 (A7 OPEN : composition, interligne, taille effective), ni une règle de perçage.
import { POLICES } from "./polices.mjs";

export const HYPOTHESES = {
  "H-TAILLE": "tailleMm = taille nominale du em en mm (échelle = tailleMm / unitsPerEm)",
  "H-INTERLIGNE": "avance verticale entre lignes = interligne × tailleMm",
  "H-POSITION": "ligne i : ligne de base = origine.yMm + ascendant × échelle + i × avance ; gauche : x = origine.xMm ; centre : centré sur la largeur de plaque",
  "H-NORM": "normalisation identique à normaliserLigne du domaine (NFC, suppression Cc, espaces réduits, trim) ; lignes vides conservées",
  "H-CLUSTER": "un élément TextGlyphPaths par cluster de shaping ; caractere = sous-chaîne des points de code du cluster",
  "H-NOTDEF": "glyphe 0 (absent) : aucun tracé, aucun repli",
  "H-VAR": "fonte variable : instance par défaut uniquement",
  "H-TROUS": "zones de trous d'essai (cercles) pour le contrôle domaine uniquement ; aucun paramètre de perçage réel",
  "H-ARRONDI": "arrondi 0,001 mm (Math.round(x·1000)/1000, -0 → 0) ; mode exact B-O1 OPEN",
};

const DEFAUT = { plaque: { widthMm: 300, heightMm: 200 }, origine: { xMm: 10, yMm: 10 }, tailleMm: 10, interligne: 1.2, alignement: "left", trous: [] };
const TROUS_ESSAI = [
  { cxMm: 10, cyMm: 10, rMm: 3.5 },
  { cxMm: 190, cyMm: 10, rMm: 3.5 },
  { cxMm: 10, cyMm: 90, rMm: 3.5 },
  { cxMm: 190, cyMm: 90, rMm: 3.5 },
];

// [famille, [ [lignes, paramètres particuliers] ... ]]
const FAMILLES = [
  ["ACC", [[["Été à l'île"]], [["Noël, cœur et œuvre"]], [["ÀÂÉÈÊËÎÏÔÖÙÛÜŸÇ"]]]],
  ["NFD", [[["été Ça"]], [["ïle è"]], [["q̃ x́ ņ"]]]],
  ["ABS", [[["Plaque 漢"]], [["Nom ᚠ ok"]], [["Maison ☃"]]]],
  ["LIG", [[["office affluent"]], [["fi fl ffi ffl"]], [["fjord Suffixe"]]]],
  ["CCMP", [[["į́ j́"]], [["ı́ ı̈"]], [["Ȩ́ ą̀"]]]],
  ["KERN", [[["AVATAR"]], [["To Wa Ty"]], [["LTAVAY P. r,"]]]],
  ["PONCT", [[["« Bonjour » ; d’accord !"]], [["Prix : 20 % — voir…"]], [["(n° 12) [A-B] / C & D"]]]],
  [
    "LIGNES",
    [
      [["Cabinet Durand"]],
      [["Cabinet Durand", "Avocats associés"], { alignement: "center" }],
      [["Cabinet Durand", "Avocats associés", "2e étage"]],
      [["Cabinet Durand", "Avocats associés", "2e étage", "Sur rendez-vous"], { alignement: "center", tailleMm: 8 }],
    ],
  ],
  [
    "TROUS",
    [
      [["Au centre"], { plaque: { widthMm: 200, heightMm: 100 }, trous: TROUS_ESSAI, alignement: "center", origine: { xMm: 0, yMm: 40 } }],
      [["Coin gauche"], { plaque: { widthMm: 200, heightMm: 100 }, trous: TROUS_ESSAI, origine: { xMm: 4, yMm: 4 } }],
      [["Bord droit très long texte"], { plaque: { widthMm: 200, heightMm: 100 }, trous: TROUS_ESSAI, origine: { xMm: 60, yMm: 80 } }],
    ],
  ],
  ["TAILLE", [[["Petit texte"], { tailleMm: 1.2 }], [["Moyen"], { tailleMm: 3 }], [["Grand"], { tailleMm: 90 }]]],
  [
    "LIMITES",
    [
      [["A    B\tC"]],
      [["Ligne", "", "Après vide"]],
      [["AB : fin"]],
      [["Texte long texte long texte long texte long texte long"], { tailleMm: 8 }],
    ],
  ],
];

export const MATRICE = FAMILLES.flatMap(([famille, cas]) =>
  cas.flatMap(([lignes, particulier = {}], n) =>
    POLICES.map((p, k) => ({
      id: `SP3-${famille}-${String(n + 1).padStart(2, "0")}-${["D", "G", "L"][k]}`,
      famille,
      police: p.id,
      ...structuredClone(DEFAUT),
      ...structuredClone(particulier),
      lignes,
    })),
  ),
);
