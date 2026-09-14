// SP-2 — runner Node (NE PAS EXÉCUTER avant arbitrage) : node spikes/determinisme-sp2/run-node.mjs <dossier-sortie>
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMatrix } from "./core.mjs";
import { MATRIX } from "./matrix.mjs";
import * as ot from "./vendor/opentype.js-2.0.0/opentype.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2];
if (!outDir) throw new Error("dossier de sortie requis");
const outFile = path.join(outDir, "node.json");
if (existsSync(outFile)) throw new Error(`${outFile} existe déjà : aucune réécriture`);

const font = readFileSync(path.join(dir, "vendor/dejavu-fonts-ttf-2.37/DejaVuSans.ttf"));
const lib = readFileSync(path.join(dir, "vendor/opentype.js-2.0.0/opentype.mjs"));
const result = await runMatrix(MATRIX, {
  ot,
  fontBytes: font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength),
  opentypeBytes: new Uint8Array(lib),
  sha256Hex: async (bytes) => createHash("sha256").update(bytes).digest("hex"),
});
mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, `${JSON.stringify({
  environment: { runtime: "node", version: process.version, platform: `${os.type()} ${os.release()} ${process.arch}`, hash: "node:crypto" },
  ...result,
}, null, 2)}\n`);
console.log(`node ${process.version} — ${result.count} configurations — global ${result.globalSha256}`);
