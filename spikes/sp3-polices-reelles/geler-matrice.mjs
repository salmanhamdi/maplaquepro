// SP-3 — gel de la matrice (ESSAI — NON NORMATIF). Enregistre l'empreinte et les absences OBSERVÉES par police,
// sans fabriquer d'attente positive. Refuse de réécrire le gel.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as hb from "./vendor/harfbuzzjs-1.6.1/package/dist/index.mjs";
import { canonicalJson, normaliser } from "./core.mjs";
import { HYPOTHESES, MATRICE } from "./matrix.mjs";
import { POLICES } from "./polices.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const sortie = path.join(dir, "matrix.lock.json");
if (existsSync(sortie)) throw new Error("matrix.lock.json existe déjà : gel non réécrit");

const fonts = Object.fromEntries(
  POLICES.map((p) => [p.id, new hb.Font(new hb.Face(new hb.Blob(new Uint8Array(readFileSync(path.join(dir, p.fichier))))))]),
);
const ids = new Set();
const observations = MATRICE.map((c) => {
  if (ids.has(c.id)) throw new Error(`identifiant en double : ${c.id}`);
  ids.add(c.id);
  const cps = [...c.lignes.map(normaliser).join("")].map((ch) => ch.codePointAt(0));
  const absents = [...new Set(cps.filter((cp) => (fonts[c.police].nominalGlyph(cp) ?? 0) === 0))].map((cp) => "U+" + cp.toString(16).toUpperCase().padStart(4, "0"));
  return { id: c.id, famille: c.famille, police: c.police, absentsObserves: absents };
});

const familles = {};
for (const o of observations) familles[o.famille] = (familles[o.famille] ?? 0) + 1;
const avertissements = observations
  .filter((o) => (o.famille === "ABS") === (o.absentsObserves.length === 0))
  .map((o) => (o.famille === "ABS" ? `${o.id} : aucun glyphe absent observé (cas ABS sans absence pour cette police)` : `${o.id} : glyphes absents hors famille ABS ${o.absentsObserves.join(" ")}`));

const empreinte = createHash("sha256").update(canonicalJson(MATRICE)).digest("hex");
writeFileSync(
  sortie,
  `${JSON.stringify({ avertissement: "ESSAI SP-3 — NON NORMATIF", empreinte, configurations: MATRICE.length, familles, hypotheses: HYPOTHESES, avertissements, observations, matrice: MATRICE }, null, 2)}\n`,
);
console.log(`matrice gelée : ${MATRICE.length} configurations — ${empreinte}`);
console.log(JSON.stringify(familles));
for (const a of avertissements) console.log(`  observation : ${a}`);
