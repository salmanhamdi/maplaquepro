// SP-1 — comparaison des résultats : node spikes/determinisme-sp1/compare.mjs
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "results");
const runs = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ name: f.replace(/\.json$/, ""), data: JSON.parse(readFileSync(path.join(dir, f), "utf8")) }));
const ref = runs.find((r) => r.name === "node");
if (!ref) throw new Error("results/node.json manquant (référence de comparaison)");

let diffs = 0;
for (const run of runs) {
  const mismatched = ref.data.results.filter((r, i) => run.data.results[i]?.id !== r.id || run.data.results[i]?.sha256 !== r.sha256);
  const same = run.data.globalSha256 === ref.data.globalSha256 && run.data.matrixSha256 === ref.data.matrixSha256 && mismatched.length === 0;
  diffs += same ? 0 : 1;
  console.log(`${run.name.padEnd(8)} ${run.data.count} configs  global ${run.data.globalSha256}  ${same ? "IDENTIQUE" : `ÉCART (${mismatched.map((m) => m.id).join(", ")})`}`);
}
process.exitCode = diffs ? 1 : 0;
