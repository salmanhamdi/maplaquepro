// SP-2 — matrice expérimentale : 6 familles × 10 = 60 configurations. ESSAI — NON NORMATIF.
// Textes d'essai (aucune donnée client). Caractères non ASCII écrits en échappements \u pour éviter toute
// ambiguïté d'encodage. Gel : matrix.lock.json (points de code, empreinte). Toute modification = arbitrage.

const FONT = "DejaVuSans.ttf 2.37 (fixture expérimentale)";
// Tailles et interlignes d'essai (mm) — sans lien avec VR-08 ni avec l'interligne produit §10.
const SIZES = [4, 6, 8, 10, 12.5, 15, 20, 25, 7.5, 33.3333];
const LINE_ADVANCES = [4.8, 7.2, 9.6, 12, 15, 18, 24, 30, 9, 40];

const FAMILIES = [
  ["F1", "lettres et chiffres simples", [
    ["Martin"], ["DUPONT"], ["12"], ["Famille Bernard"], ["Villa 7"],
    ["ABCDEFGHIJKLM"], ["nopqrstuvwxyz"], ["0123456789"],
    ["Jean Durand", "42"], ["Appartement 3B", "Batiment C"],
  ]],
  ["F2", "paires de crénage", [
    ["AVA"], ["To"], ["Wa"], ["LTA"], ["Yo"], ["Tea"], ["VAV"], ["P."], ["r."], ["AVAT", "Tour"],
  ]],
  ["F3", "accents français", [
    ["Hélène"], ["François"], ["Noël"], ["Chloé Lefèvre"], ["Œuvre"],
    ["Cœur"], ["Île-de-France"], ["ÉCOLE"], ["à côté"], ["Gaëlle", "Rue Émile Zola"],
  ]],
  ["F4", "NFC et espaces", [
    ["été"], ["Ångström"], ["  Rue   de  la   Paix  "], ["Nom	Prénom"], ["ça"],
    ["Öze"], [" Villa Rose "], ["Helène"], ["Niño"], ["  M. et Mme  ", "  Martin  "],
  ]],
  ["F5", "ponctuation", [
    ["L’Atelier"], ["« Bienvenue »"], ["12 – 14"], ["Dupont & Fils"], ["contact@exemple.fr"],
    ["N° 5"], ["Ah…"], ["— Privé —"], ["(Bureau) ; [Cave] !"], ["« Villa »", "N° 12 bis"],
  ]],
  ["F6", "caractères absents de la police", [
    ["Villa 漢"], [""], ["Rue ༀ"], ["ᚠ Nord"], ["𝔄"],
    ["A漢BC"], ["Famille ᚠᚠ"], ["ༀ 12"], ["Nom 𝔄 Prénom"], ["Ligne 1", "漢 Ligne 2"],
  ]],
];

export const MATRIX = FAMILIES.flatMap(([family, label, entries]) =>
  entries.map((lines, i) => ({
    id: `SP2-${family}-${String(i + 1).padStart(2, "0")}`,
    family,
    familyLabel: label,
    font: FONT,
    lines,
    codePoints: lines.map((line) => Array.from(line, (ch) => ch.codePointAt(0))),
    params: {
      fontSizeMm: SIZES[i],
      lineAdvanceMm: LINE_ADVANCES[i],
      originXMm: 0,
      kerning: !(family === "F1" && (i === 2 || i === 7)),
      kerningScript: "latn",
    },
  })),
);
