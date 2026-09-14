// SP-1 — exécution navigateurs locaux (headless) via un serveur 127.0.0.1 (contexte sécurisé).
// Usage : node spikes/determinisme-sp1/run-browsers.mjs <env>=<chemin exécutable> [...]
import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const TYPES = { ".html": "text/html; charset=utf-8", ".mjs": "text/javascript; charset=utf-8" };
const pending = new Map();

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  if (req.method === "POST" && url.pathname === "/result") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      res.end("ok");
      pending.get(url.searchParams.get("env"))?.(JSON.parse(body));
    });
    return;
  }
  const name = path.basename(url.pathname) || "index.html";
  if (!TYPES[path.extname(name)]) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": TYPES[path.extname(name)] }).end(readFileSync(path.join(dir, name)));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const { port } = server.address();

for (const arg of process.argv.slice(2)) {
  const [env, exe] = arg.split("=");
  const profile = mkdtempSync(path.join(os.tmpdir(), `sp1-${env}-`));
  const result = new Promise((resolve, reject) => {
    pending.set(env, resolve);
    setTimeout(() => reject(new Error(`${env} : délai dépassé`)), 60000);
  });
  const child = spawn(exe, [
    "--headless=new", "--disable-gpu", "--no-first-run", `--user-data-dir=${profile}`,
    `http://127.0.0.1:${port}/index.html?env=${env}`,
  ], { stdio: "ignore" });
  try {
    const output = await result;
    if (output.error) throw new Error(`${env} : ${output.error}`);
    output.environment.executable = exe;
    output.environment.proof = "principale pour ce navigateur de bureau (headless)";
    writeFileSync(path.join(dir, "results", `${env}.json`), `${JSON.stringify(output, null, 2)}\n`);
    console.log(`${env} — ${output.count} configurations — global ${output.globalSha256}`);
  } finally {
    child.kill();
    await new Promise((r) => setTimeout(r, 1500));
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    } catch {
      console.warn(`profil temporaire non supprimé (verrou navigateur) : ${profile}`);
    }
  }
}
server.close();
