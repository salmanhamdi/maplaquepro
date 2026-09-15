// SP-3 — runner Node (ESSAI — NON NORMATIF) : node spikes/sp3-polices-reelles/run-node.mjs <passe>
// Passe 1 : sorties détaillées (TextGlyphPaths complets) ; autres passes : empreintes seulement. Aucune réécriture.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as hb from "./vendor/harfbuzzjs-1.6.1/package/dist/index.mjs";
import * as ot from "./vendor/opentype.js-2.0.0/opentype.mjs";
import { executer } from "./core.mjs";
import { MATRICE } from "./matrix.mjs";
import { POLICES } from "./polices.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const passe = Number(process.argv[2]);
if (!Number.isInteger(passe) || passe < 1) throw new Error("numéro de passe requis (1, 2…)");
const outDir = path.join(dir, "resultats", "node");
const outFile = path.join(outDir, `passe-${passe}.json`);
if (existsSync(outFile)) throw new Error(`${outFile} existe déjà : aucune réécriture`);

const lire = (f) => new Uint8Array(readFileSync(path.join(dir, f)));
const debut = performance.now();
const r = await executer({
  hb,
  ot,
  polices: Object.fromEntries(POLICES.map((p) => [p.id, lire(p.fichier)])),
  bibliotheques: {
    "opentype.mjs": lire("vendor/opentype.js-2.0.0/opentype.mjs"),
    "harfbuzz.wasm": lire("vendor/harfbuzzjs-1.6.1/package/dist/harfbuzz.wasm"),
    "harfbuzz.js": lire("vendor/harfbuzzjs-1.6.1/package/dist/harfbuzz.js"),
  },
  sha256Hex: async (octets) => createHash("sha256").update(octets).digest("hex"),
  matrice: MATRICE,
  details: passe === 1,
});
mkdirSync(outDir, { recursive: true });
writeFileSync(
  outFile,
  `${JSON.stringify({ environnement: { runtime: "node", version: process.version, plateforme: `${os.type()} ${os.release()} ${process.arch}`, hash: "node:crypto", passe, dureeMs: Math.round(performance.now() - debut) }, ...r })}\n`,
);
console.log(`node ${process.version} passe ${passe} — ${r.configurations} configurations × 3 modes`);
for (const [m, g] of Object.entries(r.globales)) console.log(`  ${m} ${g}`);
