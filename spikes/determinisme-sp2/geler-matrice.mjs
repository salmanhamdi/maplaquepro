// SP-2 — gel de la matrice : écrit matrix.lock.json (à exécuter une seule fois lors de la préparation).
import { createHash } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson, normalizeExperimental, NORMALIZATION_ID, SP2_ENGINE_VERSION } from "./core.mjs";
import { MATRIX } from "./matrix.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const lockPath = path.join(dir, "matrix.lock.json");
if (existsSync(lockPath) && !process.argv.includes("--force")) throw new Error("matrix.lock.json existe déjà : gel non réécrit");

const sha = (s) => createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");
const lock = {
  statut: "GELÉE — toute modification exige un arbitrage Supervisor",
  engine: SP2_ENGINE_VERSION,
  normalization: NORMALIZATION_ID,
  count: MATRIX.length,
  matrixSha256: sha(canonicalJson(MATRIX)),
  configurations: MATRIX.map((c) => ({
    id: c.id,
    family: c.family,
    params: c.params,
    codePoints: c.codePoints.map((line) => line.map((cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`)),
    normalizedCodePoints: c.lines.map((line) =>
      Array.from(normalizeExperimental(line), (ch) => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`),
    ),
  })),
};
writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
console.log(`matrice gelée : ${lock.count} configurations, ${lock.matrixSha256}`);
