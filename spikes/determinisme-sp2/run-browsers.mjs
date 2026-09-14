// SP-2 — runner navigateurs de bureau, headless, via 127.0.0.1 (contexte sécurisé). NE PAS EXÉCUTER avant arbitrage.
// Usage : node spikes/determinisme-sp2/run-browsers.mjs <dossier-sortie> chrome=<exe> firefox=<exe> edge=<exe>
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { servedFile } from "./serveur-fichiers.mjs";

const [outDir, ...targets] = process.argv.slice(2);
if (!outDir || targets.length === 0) throw new Error("usage : <dossier-sortie> env=<exécutable> ...");
mkdirSync(outDir, { recursive: true });
const pending = new Map();

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (req.method === "POST" && url.pathname === "/result") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      res.end("ok");
      pending.get(url.searchParams.get("env"))?.(Buffer.concat(chunks));
    });
    return;
  }
  const file = req.method === "GET" ? servedFile(url.pathname) : null;
  if (!file) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": file.type, "cache-control": "no-store" }).end(file.body);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const { port } = server.address();

for (const target of targets) {
  const [env, exe] = target.split("=");
  const outFile = path.join(outDir, `${env}.json`);
  if (existsSync(outFile)) throw new Error(`${outFile} existe déjà : aucune réécriture`);
  const profile = mkdtempSync(path.join(os.tmpdir(), `sp2-${env}-`));
  const url = `http://127.0.0.1:${port}/index.html?env=${env}`;
  const args = /firefox/i.test(exe)
    ? ["-headless", "-no-remote", "-profile", profile, url]
    : ["--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`, url];
  const received = new Promise((resolve, reject) => {
    pending.set(env, resolve);
    setTimeout(() => reject(new Error(`${env} : délai dépassé`)), 180000);
  });
  const child = spawn(exe, args, { stdio: "ignore" });
  try {
    const body = await received;
    const output = JSON.parse(body.toString("utf8"));
    output.environment.executable = exe;
    writeFileSync(outFile, `${JSON.stringify(output, null, 2)}\n`);
    console.log(output.error ? `${env} — ERREUR ${output.error}` : `${env} — ${output.count} configurations — global ${output.globalSha256}`);
  } finally {
    child.kill();
    await new Promise((r) => setTimeout(r, 1500));
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    } catch {
      console.warn(`profil temporaire non supprimé : ${profile}`);
    }
  }
}
server.close();
