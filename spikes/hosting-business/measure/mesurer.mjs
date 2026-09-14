// Mesures du spike d'hébergement depuis le poste de l'opérateur (Node ≥ 20, sans paquet).
// Variables : PROBE_URL (ex. https://sonde.example), PROBE_TOKEN (jamais affiché ni écrit).
// Usage : node spikes/hosting-business/measure/mesurer.mjs <dossier-preuves> <commande> [options]
// Commandes : runtime | env | db | raw | c6 | c7-write <label> <dir> <count> <sizeKb> | c7-read <label> <dir>
//             | c7-delete <label> <dir> | c8 | c9 <mpx> | limits <sleepMs>
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const [outDir, command, ...args] = process.argv.slice(2);
const BASE = process.env.PROBE_URL?.replace(/\/+$/, "");
const TOKEN = process.env.PROBE_TOKEN;
if (!outDir || !command || !BASE || !TOKEN) throw new Error("usage : PROBE_URL et PROBE_TOKEN requis ; <dossier-preuves> <commande>");
mkdirSync(outDir, { recursive: true });

const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");
const headers = { "x-probe-token": TOKEN };

function save(name, data) {
  const file = path.join(outDir, `${stamp()}_${name}.json`);
  if (existsSync(file)) throw new Error("fichier existant");
  writeFileSync(file, `${JSON.stringify({ command: [command, ...args], baseUrl: BASE, measuredAt: new Date().toISOString(), ...data }, null, 2)}\n`);
  console.log(`→ ${file}`);
}

async function call(method, route, body) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}${route}`, { method, headers, body });
  const ttfbMs = performance.now() - t0;
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { nonJson: text.slice(0, 500) }; }
  return { status: res.status, ttfbMs, totalMs: performance.now() - t0, headers: Object.fromEntries([...res.headers].filter(([k]) => !/cookie/i.test(k))), body: parsed };
}

const percentile = (values, p) => {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)];
};

async function ssrSeries(count, concurrency, route = "/ssr") {
  const samples = [];
  let next = 0;
  async function worker() {
    while (next < count) {
      next++;
      const t0 = performance.now();
      const res = await fetch(`${BASE}${route}`, { cache: "no-store" });
      const ttfbMs = performance.now() - t0;
      const html = await res.text();
      const work = html.match(/id="server-work-ms">([\d.]+)</)?.[1];
      const dbOk = html.match(/id="db-ok">(true|false)</)?.[1];
      const dbMs = html.match(/id="db-ms">([\d.]+)</)?.[1];
      samples.push({ status: res.status, ttfbMs, totalMs: performance.now() - t0, serverWorkMs: work ? Number(work) : null, dbOk: dbOk ? dbOk === "true" : null, dbMs: dbMs ? Number(dbMs) : null, at: new Date().toISOString() });
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  const ok = samples.filter((s) => s.status === 200).map((s) => s.ttfbMs);
  return { count, concurrency, errors: samples.length - ok.length, p50: percentile(ok, 50), p95: percentile(ok, 95), p99: percentile(ok, 99), samples };
}

switch (command) {
  case "runtime": save("runtime", await call("GET", "/api/probe/runtime")); break;
  case "env": save("env", await call("GET", "/api/probe/env")); break;
  case "db": save("db", await call("GET", "/api/probe/db")); break;
  case "raw": {
    const results = [];
    for (const size of [1024, 1024 * 1024, 5 * 1024 * 1024]) {
      const payload = randomBytes(size);
      const sent = createHash("sha256").update(payload).digest("hex");
      const r = await call("POST", "/api/probe/raw", payload);
      results.push({ sentBytes: size, sentSha256: sent, identical: r.body.sha256 === sent && r.body.bytes === size, response: r });
    }
    save("raw", { results });
    break;
  }
  case "c6": {
    const page = await fetch(`${BASE}/image`, { cache: "no-store" });
    const html = await page.text();
    const optimizedSrc = html.match(/src="(\/_next\/image\?[^"]+)"/)?.[1]?.replace(/&amp;/g, "&");
    const optimized = optimizedSrc ? await fetch(`${BASE}${optimizedSrc}`) : null;
    const direct = await fetch(`${BASE}/probe.png`);
    save("c6", {
      pageStatus: page.status,
      optimizedSrc: optimizedSrc ?? null,
      optimized: optimized && { status: optimized.status, contentType: optimized.headers.get("content-type"), bytes: (await optimized.arrayBuffer()).byteLength },
      unoptimized: { status: direct.status, contentType: direct.headers.get("content-type"), bytes: (await direct.arrayBuffer()).byteLength },
    });
    break;
  }
  case "c7-write": {
    const [label, dir = "cwd", count = "4", sizeKb = "256"] = args;
    save(`c7-write-${label}-${dir}`, await call("POST", `/api/probe/c7?label=${label}&dir=${dir}&count=${count}&sizeKb=${sizeKb}`));
    break;
  }
  case "c7-read": {
    const [label, dir = "cwd"] = args;
    save(`c7-read-${label}-${dir}`, await call("GET", `/api/probe/c7?label=${label}&dir=${dir}`));
    break;
  }
  case "c7-delete": {
    const [label, dir = "cwd"] = args;
    save(`c7-delete-${label}-${dir}`, await call("DELETE", `/api/probe/c7?label=${label}&dir=${dir}`));
    break;
  }
  case "c8": {
    const cold = await ssrSeries(1, 1);
    const warmup = await ssrSeries(20, 1);
    const sequential = await ssrSeries(200, 1);
    const concurrent = await ssrSeries(200, 5);
    save("c8", { firstRequest: cold, warmup: { count: warmup.count, p95: warmup.p95 }, sequential, concurrent });
    break;
  }
  case "c8-parcours": {
    const route = "/parcours?w=300&h=200";
    const first = await ssrSeries(1, 1, route);
    const warmup = await ssrSeries(20, 1, route);
    const sequential = await ssrSeries(200, 1, route);
    const concurrent = await ssrSeries(200, 5, route);
    save("c8-parcours", { route, firstRequest: first, warmup: { count: warmup.count, p95: warmup.p95 }, sequential, concurrent });
    break;
  }
  case "c9": {
    const [mpx] = args;
    save(`c9-${mpx}mpx`, await call("POST", `/api/probe/c9?mpx=${mpx}`));
    break;
  }
  case "limits": {
    const [sleepMs = "30000"] = args;
    save(`limits-${sleepMs}`, await call("GET", `/api/probe/limits?sleepMs=${sleepMs}`));
    break;
  }
  default:
    throw new Error(`commande inconnue : ${command}`);
}
