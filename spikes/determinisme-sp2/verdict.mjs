// SP-2 — contrôles de classement PASS / INCOMPLETE / NO-GO (critères A2-11 arbitrés).
// Produit une PROPOSITION de statut ; la décision appartient au Supervisor.
// Usage : node spikes/determinisme-sp2/verdict.mjs <dossier-exécution-1> [<dossier-exécution-2> ...]
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const REQUIRED = ["node", "chrome", "firefox", "safari-ios"];
export const COMPLEMENTARY = ["edge"];
const FILE_TO_ENV = { "node.json": "node", "chrome.json": "chrome", "firefox.json": "firefox", "edge.json": "edge", "safari-ios-brut.json": "safari-ios" };

const sha = (s) => createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex");

// runs : [{ dir, env, data }] ; expected : { matrixSha256, ids: string[], fontSha256, opentypeSha256 }
export function evaluate(runs, expected) {
  const findings = { nogo: [], incomplete: [], divergences: [], environnements: {} };
  const byDir = new Map();
  for (const run of runs) {
    if (!byDir.has(run.dir)) byDir.set(run.dir, new Map());
    byDir.get(run.dir).set(run.env, run.data);
  }

  for (const [dir, envs] of byDir) {
    const ref = envs.get("node");
    for (const env of REQUIRED) if (!envs.has(env)) findings.incomplete.push(`${dir} : environnement obligatoire non testé (${env})`);
    for (const [env, data] of envs) {
      const tag = `${dir} / ${env}`;
      const state = (findings.environnements[tag] = { configurations: 0, identiquesNode: 0 });
      if (data.error) { findings.incomplete.push(`${tag} : erreur d'exécution (${data.error})`); continue; }
      if (data.matrixSha256 !== expected.matrixSha256) findings.nogo.push(`${tag} : entrées non identiques (matrice)`);
      if (data.artefacts?.fontSha256 !== expected.fontSha256) findings.nogo.push(`${tag} : entrées non identiques (police)`);
      if (data.artefacts?.opentypeSha256 !== expected.opentypeSha256) findings.nogo.push(`${tag} : entrées non identiques (opentype.js)`);
      if (env === "safari-ios" && data.environment?.secureContext !== true) findings.incomplete.push(`${tag} : contexte non sécurisé`);
      const ids = (data.results ?? []).map((r) => r.id);
      if (data.count !== expected.ids.length || ids.join() !== expected.ids.join()) findings.incomplete.push(`${tag} : matrice incomplète ou résultat manquant`);
      for (const r of data.results ?? []) {
        state.configurations++;
        if (typeof r.json !== "string" || typeof r.sha256 !== "string") { findings.incomplete.push(`${tag} : donnée manquante (${r.id})`); continue; }
        if (sha(r.json) !== r.sha256) findings.nogo.push(`${tag} : corruption de preuve (${r.id}, SHA-256 incohérent)`);
        if (r.json.includes("EXPERIMENTAL_RUNTIME_ERROR")) findings.incomplete.push(`${tag} : EXPERIMENTAL_RUNTIME_ERROR (${r.id})`);
        const refResult = ref?.results?.find((x) => x.id === r.id);
        if (!refResult) continue;
        if (refResult.json === r.json && refResult.sha256 === r.sha256) state.identiquesNode++;
        else if (env !== "node") findings.divergences.push({ dir, env, id: r.id });
      }
    }
  }

  // Divergence reproductible = même environnement et même configuration divergents dans au moins 2 exécutions.
  const counts = new Map();
  for (const d of findings.divergences) counts.set(`${d.env}|${d.id}`, (counts.get(`${d.env}|${d.id}`) ?? 0) + 1);
  const reproducible = [...counts].filter(([key, n]) => n >= 2 && REQUIRED.includes(key.split("|")[0])).map(([key]) => key);
  const unreproduced = [...counts].filter(([, n]) => n < 2).map(([key]) => key);
  for (const key of reproducible) findings.nogo.push(`divergence reproductible sur environnement obligatoire (${key})`);
  for (const key of unreproduced) findings.incomplete.push(`divergence non encore reproduite ou expliquée (${key}) — réexécution requise`);

  const proposition = findings.nogo.length ? "NO-GO" : findings.incomplete.length ? "INCOMPLETE" : "PASS";
  return { proposition, decision: "RÉSERVÉE AU SUPERVISOR", ...findings, divergencesReproductibles: reproducible };
}

export function loadExpected(spikeDir) {
  const lock = JSON.parse(readFileSync(path.join(spikeDir, "matrix.lock.json"), "utf8"));
  const artefacts = JSON.parse(readFileSync(path.join(spikeDir, "ARTEFACTS.json"), "utf8"));
  return {
    matrixSha256: lock.matrixSha256,
    ids: lock.configurations.map((c) => c.id),
    fontSha256: artefacts.dejavu.files["DejaVuSans.ttf"].sha256,
    opentypeSha256: artefacts.opentype.files["opentype.mjs"].sha256,
  };
}

export function loadRuns(dirs) {
  return dirs.flatMap((dir) =>
    readdirSync(dir)
      .filter((f) => FILE_TO_ENV[f])
      .map((f) => ({ dir, env: FILE_TO_ENV[f], data: JSON.parse(readFileSync(path.join(dir, f), "utf8")) })),
  );
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const dirs = process.argv.slice(2);
  if (!dirs.length || !dirs.every(existsSync)) throw new Error("dossier(s) d'exécution requis");
  const report = evaluate(loadRuns(dirs), loadExpected(path.dirname(fileURLToPath(import.meta.url))));
  console.log(JSON.stringify(report, null, 2));
}
