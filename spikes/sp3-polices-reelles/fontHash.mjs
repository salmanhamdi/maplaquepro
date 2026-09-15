// SP-3 — exploration de candidats fontHash (ESSAI — NON NORMATIF, aucune définition retenue). Écrit FONTHASH.json.
// Mesure la stabilité de chaque candidat face à des altérations contrôlées (métadonnées, nom, instance variable).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as hb from "./vendor/harfbuzzjs-1.6.1/package/dist/index.mjs";
import { canonicalJson } from "./core.mjs";
import { POLICES } from "./polices.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const sortie = path.join(dir, "FONTHASH.json");
if (existsSync(sortie)) throw new Error("FONTHASH.json existe déjà : aucune réécriture");
const sha = (b) => createHash("sha256").update(b).digest("hex");
const TEXTE_ECHANTILLON = "Cabinet Durand office AVATAR Été";

function repertoire(octets) {
  const dv = new DataView(octets.buffer, octets.byteOffset, octets.byteLength);
  const n = dv.getUint16(4);
  return Array.from({ length: n }, (_, i) => {
    const o = 12 + 16 * i;
    return { tag: String.fromCharCode(...octets.subarray(o, o + 4)), offset: dv.getUint32(o + 8), longueur: dv.getUint32(o + 12) };
  });
}

/** FH1 : octets du fichier. */
const fh1 = (octets) => sha(octets);

/** FH2 : tables triées, sans DSIG ni name, head neutralisé (checkSumAdjustment, created, modified). */
function fh2(octets) {
  const tables = {};
  for (const t of repertoire(octets)) {
    if (t.tag === "DSIG" || t.tag === "name") continue;
    const donnees = new Uint8Array(octets.subarray(t.offset, t.offset + t.longueur));
    if (t.tag === "head") {
      donnees.fill(0, 8, 12);
      donnees.fill(0, 20, 36);
    }
    tables[t.tag] = sha(donnees);
  }
  return sha(canonicalJson(tables));
}

/** FH3 : contenu utilisé (unitsPerEm, coordonnées de variation, glyphes façonnés : avance + contour) pour un texte donné. */
function fh3(octets, variations = []) {
  const face = new hb.Face(new hb.Blob(octets));
  const font = new hb.Font(face);
  if (variations.length) font.setVariations(variations.map((v) => hb.Variation.fromString(v)));
  const buf = new hb.Buffer();
  buf.addText(TEXTE_ECHANTILLON);
  buf.guessSegmentProperties();
  hb.shape(font, buf);
  const gids = [...new Set(buf.getGlyphInfos().map((g) => g.codepoint))].sort((a, b) => a - b);
  return sha(canonicalJson({ upem: face.upem, variations, glyphes: gids.map((gid) => ({ gid, avance: font.glyphHAdvance(gid), contour: font.glyphToJson(gid) })) }));
}

function alterer(octets, tag, modifier) {
  const copie = new Uint8Array(octets);
  const t = repertoire(copie).find((x) => x.tag === tag);
  if (!t) return null;
  modifier(copie, t.offset, t.longueur);
  return copie;
}

const resultat = { avertissement: "ESSAI SP-3 — NON NORMATIF ; aucune définition de fontHash n'est retenue", texteEchantillon: TEXTE_ECHANTILLON, candidats: {
  FH1: "SHA-256 des octets du fichier",
  FH2: "SHA-256 du JSON canonique {tag: SHA-256(table)} hors DSIG et name, head neutralisé (checkSumAdjustment, dates)",
  FH3: "SHA-256 du contenu utilisé : unitsPerEm, variations, avance et contour des glyphes façonnés pour un texte",
}, polices: [] };

for (const p of POLICES) {
  const octets = new Uint8Array(readFileSync(path.join(dir, p.fichier)));
  const variantes = {
    original: octets,
    "head.modified altéré": alterer(octets, "head", (c, o) => c.fill(0x5a, o + 28, o + 36)),
    "name : 1 octet de chaîne altéré": alterer(octets, "name", (c, o) => {
      const dv = new DataView(c.buffer);
      const stockage = o + dv.getUint16(o + 4);
      c[stockage] ^= 0x01;
    }),
  };
  const lignes = {};
  for (const [nom, v] of Object.entries(variantes)) {
    if (!v) continue;
    lignes[nom] = { FH1: fh1(v), FH2: fh2(v), FH3: fh3(v) };
  }
  const axes = new hb.Face(new hb.Blob(octets)).getAxisInfos();
  if (Object.keys(axes).length) {
    const tag = Object.keys(axes)[0];
    lignes[`instance ${tag}=${axes[tag].max}`] = { FH1: fh1(octets), FH2: fh2(octets), FH3: fh3(octets, [`${tag}=${axes[tag].max}`]) };
  }
  const ref = lignes.original;
  const stabilite = Object.fromEntries(Object.entries(lignes).filter(([n]) => n !== "original").map(([n, l]) => [n, Object.fromEntries(["FH1", "FH2", "FH3"].map((k) => [k, l[k] === ref[k] ? "stable" : "modifié"]))]));
  resultat.polices.push({ id: p.id, tables: repertoire(octets).map((t) => t.tag), axes, empreintes: lignes, stabiliteParRapportOriginal: stabilite });
  console.log(`\n${p.id}`);
  for (const [n, s] of Object.entries(stabilite)) console.log(`  ${n.padEnd(34)} FH1 ${s.FH1.padEnd(8)} FH2 ${s.FH2.padEnd(8)} FH3 ${s.FH3}`);
}
writeFileSync(sortie, `${JSON.stringify(resultat, null, 2)}\n`);
