// SP-3 — runner navigateurs de bureau headless via 127.0.0.1 (contexte sécurisé) — ESSAI, NON NORMATIF.
// Usage : node spikes/sp3-polices-reelles/run-browsers.mjs <passe> chrome=<exe> edge=<exe>
// Chrome et Edge ne remplacent JAMAIS Firefox ni Safari iOS réel.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const [passeArg, ...cibles] = process.argv.slice(2);
const passe = Number(passeArg);
if (!Number.isInteger(passe) || cibles.length === 0) throw new Error("usage : <passe> env=<exécutable> ...");
const TYPES = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript", ".js": "text/javascript", ".wasm": "application/wasm", ".ttf": "font/ttf", ".json": "application/json" };
const attente = new Map();

const serveur = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (req.method === "POST" && url.pathname === "/resultat") {
    const morceaux = [];
    req.on("data", (c) => morceaux.push(c));
    req.on("end", () => {
      res.end("ok");
      attente.get(url.searchParams.get("env"))?.(Buffer.concat(morceaux));
    });
    return;
  }
  const fichier = path.normalize(path.join(dir, decodeURIComponent(url.pathname)));
  if (req.method !== "GET" || !fichier.startsWith(dir + path.sep) || !existsSync(fichier) || !statSync(fichier).isFile()) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[path.extname(fichier)] ?? "application/octet-stream", "cache-control": "no-store" }).end(readFileSync(fichier));
});
await new Promise((r) => serveur.listen(0, "127.0.0.1", r));
const { port } = serveur.address();

for (const cible of cibles) {
  const [env, exe] = cible.split("=");
  const outDir = path.join(dir, "resultats", env);
  const outFile = path.join(outDir, `passe-${passe}.json`);
  if (existsSync(outFile)) throw new Error(`${outFile} existe déjà : aucune réécriture`);
  const profil = mkdtempSync(path.join(os.tmpdir(), `sp3-${env}-`));
  const url = `http://127.0.0.1:${port}/index.html?env=${env}&passe=${passe}`;
  const recu = new Promise((resolve, reject) => {
    attente.set(env, resolve);
    setTimeout(() => reject(new Error(`${env} : délai dépassé`)), 300000);
  });
  const enfant = spawn(exe, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check", `--user-data-dir=${profil}`, url], { stdio: "ignore" });
  try {
    const sortie = JSON.parse((await recu).toString("utf8"));
    sortie.environnement.executable = exe;
    mkdirSync(outDir, { recursive: true });
    writeFileSync(outFile, `${JSON.stringify(sortie)}\n`);
    console.log(sortie.erreur ? `${env} passe ${passe} — ERREUR ${sortie.erreur}` : `${env} passe ${passe} — ${sortie.configurations} configurations`);
    for (const [m, g] of Object.entries(sortie.globales ?? {})) console.log(`  ${m} ${g}`);
  } finally {
    enfant.kill();
    await new Promise((r) => setTimeout(r, 1500));
    try {
      rmSync(profil, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    } catch {
      console.warn(`profil temporaire non supprimé : ${profil}`);
    }
  }
}
serveur.close();
