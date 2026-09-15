// SP-3 — inspection RÉELLE des polices de fixture (ESSAI — NON NORMATIF), avant gel de la matrice.
// Aucune capacité n'est supposée : tables, fonctionnalités et comportements sont observés avec les deux moteurs.
// Usage : node spikes/sp3-polices-reelles/inspecter-polices.mjs  → écrit CAPACITES.json (refuse de réécrire).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as hb from "./vendor/harfbuzzjs-1.6.1/package/dist/index.mjs";
import * as ot from "./vendor/opentype.js-2.0.0/opentype.mjs";
import { POLICES } from "./polices.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const sortie = path.join(dir, "CAPACITES.json");
if (existsSync(sortie)) throw new Error("CAPACITES.json existe déjà : aucune réécriture");

const sha256 = (b) => createHash("sha256").update(b).digest("hex");
const cp = (s) => [...s].map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"));

// Caractères candidats (observation de couverture uniquement).
const CANDIDATS = [
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
  ..."àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇœŒæÆ",
  ..."«»‹›’‘“”…–—·•.,;:!?()[]&@#%/\\-'\"",
  " ", " ",
  "̀", "́", "̂", "̃", "̈", "̧", "̨", "ı",
  "ﬁ", "ﬂ",
  "漢", "", "ༀ", "ᚠ", "\u{1D504}", "☃", "\u{1F600}",
];

// Sondes de comportement : même texte, fonctionnalité activée (défaut) contre désactivée.
const SONDES = {
  liga: ["fi", "fl", "ff", "ffi", "ffl", "fj", "office", "affluent"],
  kern: ["AV", "To", "Wa", "LT", "Ty", "AVAY", "P.", "r,"],
  ccmp: ["é", "í", "ï", "q̃", "ı́", "É", "ą"],
  mark: ["q̃", "x́", "ņ", "b̈"],
};

function hbFont(bytes) {
  const face = new hb.Face(new hb.Blob(bytes));
  return { face, font: new hb.Font(face) };
}

function shapeHb(font, texte, features = []) {
  const buf = new hb.Buffer();
  buf.addText(texte);
  buf.guessSegmentProperties();
  hb.shape(font, buf, features.map((f) => hb.Feature.fromString(f)));
  return buf.getGlyphInfosAndPositions().map((g) => ({ gid: g.codepoint, cl: g.cluster, ax: g.xAdvance, dx: g.xOffset, dy: g.yOffset }));
}

const tables = (face) =>
  Object.fromEntries(["GSUB", "GPOS", "GDEF", "kern", "glyf", "CFF ", "fvar", "gvar", "avar", "STAT", "name", "OS/2"].map((t) => [t.trim(), face.referenceTable(t) !== undefined]));

const numGlyphs = (face) => {
  const maxp = face.referenceTable("maxp");
  return maxp ? new DataView(maxp.buffer, maxp.byteOffset, maxp.byteLength).getUint16(4) : null;
};

function sondesHb(font) {
  const out = {};
  for (const [tag, textes] of Object.entries(SONDES)) {
    out[tag] = textes.map((t) => {
      const avec = shapeHb(font, t);
      const sans = shapeHb(font, t, [`-${tag}`]);
      const gidsDiff = JSON.stringify(avec.map((g) => g.gid)) !== JSON.stringify(sans.map((g) => g.gid));
      const posDiff = JSON.stringify(avec.map((g) => [g.ax, g.dx, g.dy])) !== JSON.stringify(sans.map((g) => [g.ax, g.dx, g.dy]));
      return { texte: t, points: cp(t), glyphesAvec: avec.length, glyphesSans: sans.length, gidsModifies: gidsDiff, positionsModifiees: posDiff, notdef: avec.some((g) => g.gid === 0) };
    });
  }
  return out;
}

function sondesOt(font) {
  const out = {};
  for (const [tag, textes] of Object.entries(SONDES)) {
    out[tag] = textes.map((t) => {
      const r = { texte: t, points: cp(t) };
      try {
        r.glyphes = font.stringToGlyphs(t).map((g) => g.index);
      } catch (e) {
        r.erreurStringToGlyphs = String(e.message);
      }
      try {
        r.avanceAvecKerning = font.getAdvanceWidth(t, font.unitsPerEm, { kerning: true });
        r.avanceSansKerning = font.getAdvanceWidth(t, font.unitsPerEm, { kerning: false });
      } catch (e) {
        r.erreurAvance = String(e.message);
      }
      return r;
    });
  }
  return out;
}

const resultat = {
  avertissement: "ESSAI SP-3 — NON NORMATIF. Polices de fixture uniquement, jamais polices produit.",
  moteurs: { harfbuzzjs: hb.versionString(), opentypejs: "2.0.0" },
  polices: [],
};

for (const p of POLICES) {
  const bytes = readFileSync(path.join(dir, p.fichier));
  const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const { face, font } = hbFont(new Uint8Array(ab));
  const couverture = Object.fromEntries(CANDIDATS.map((c) => [cp(c)[0], (font.nominalGlyph(c.codePointAt(0)) ?? 0) !== 0]));
  const entree = {
    id: p.id,
    fichier: p.fichier,
    octets: bytes.byteLength,
    sha256: sha256(bytes),
    harfbuzz: {
      upem: face.upem,
      glyphes: numGlyphs(face),
      unicodes: face.collectUnicodes().length,
      tables: tables(face),
      axes: face.getAxisInfos(),
      scriptsGSUB: face.getTableScriptTags("GSUB"),
      scriptsGPOS: face.getTableScriptTags("GPOS"),
      fonctionnalitesGSUB: [...new Set(face.getTableFeatureTags("GSUB"))].sort(),
      fonctionnalitesGPOS: [...new Set(face.getTableFeatureTags("GPOS"))].sort(),
      sondes: sondesHb(font),
    },
    couverture: { absents: Object.entries(couverture).filter(([, v]) => !v).map(([k]) => k) },
  };
  try {
    const of = ot.parse(ab);
    entree.opentypejs = {
      upem: of.unitsPerEm,
      glyphes: of.numGlyphs,
      noyauxKerningGPOS: Boolean(of.position?.defaultKerningTables),
      pairesKernLegacy: Object.keys(of.kerningPairs ?? {}).length,
      sondes: sondesOt(of),
    };
  } catch (e) {
    entree.opentypejs = { erreurParse: String(e.message) };
  }
  resultat.polices.push(entree);
}

writeFileSync(sortie, `${JSON.stringify(resultat, null, 2)}\n`);
for (const p of resultat.polices) {
  const h = p.harfbuzz;
  const vu = (tag) => h.sondes[tag].filter((s) => s.gidsModifies || s.positionsModifiees).map((s) => s.texte).join(" ") || "aucun effet observé";
  console.log(`\n${p.id} — ${p.octets} o — upem ${h.upem} — glyphes ${h.glyphes} — axes ${Object.keys(h.axes).join(",") || "aucun"}`);
  console.log(`  GSUB ${h.fonctionnalitesGSUB.join(" ")}\n  GPOS ${h.fonctionnalitesGPOS.join(" ")}\n  tables ${Object.entries(h.tables).filter(([, v]) => v).map(([k]) => k).join(" ")}`);
  for (const tag of Object.keys(SONDES)) console.log(`  [hb] ${tag}: ${vu(tag)}`);
  console.log(`  absents: ${p.couverture.absents.join(" ")}`);
  const errs = (p.opentypejs.sondes ? Object.values(p.opentypejs.sondes).flat() : []).filter((s) => s.erreurStringToGlyphs || s.erreurAvance);
  console.log(`  [ot] parse=${p.opentypejs.erreurParse ? "ERREUR " + p.opentypejs.erreurParse : "ok"} erreurs sondes=${errs.length}${errs[0] ? " (" + (errs[0].erreurStringToGlyphs ?? errs[0].erreurAvance) + ")" : ""}`);
}
