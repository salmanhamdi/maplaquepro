// C7 — écriture de fichiers par l'application puis relecture (avant / après redéploiement ou redémarrage).
// POST ?label=X&dir=cwd|tmp|home&count=N&sizeKb=K : écrit N fichiers aléatoires + manifeste.
// GET  ?label=X&dir=... : relit le manifeste et recalcule chaque SHA-256.
// DELETE ?label=X&dir=... : supprime les données de test.
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, statfsSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildId, denied, json, sha256 } from "../../../../lib/probe.js";

export const maxDuration = 300;

const MAX_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;

function target(url) {
  const label = url.searchParams.get("label") ?? "";
  if (!/^[a-z0-9-]{1,40}$/.test(label)) throw new Error("label invalide");
  const bases = { cwd: process.cwd(), tmp: os.tmpdir(), home: os.homedir() };
  const base = bases[url.searchParams.get("dir") ?? "cwd"];
  if (!base) throw new Error("dir invalide");
  return path.join(base, "probe-data", label);
}

function disk(dir) {
  try {
    const s = statfsSync(dir);
    return { blockSize: s.bsize, totalBytes: s.blocks * s.bsize, availableBytes: s.bavail * s.bsize };
  } catch {
    return null;
  }
}

export async function POST(request) {
  const refused = denied(request);
  if (refused) return refused;
  const url = new URL(request.url);
  try {
    const dir = target(url);
    if (existsSync(path.join(dir, "manifest.json"))) return json({ error: "label déjà utilisé" }, { status: 409 });
    const count = Number(url.searchParams.get("count") ?? 4);
    const sizeKb = Number(url.searchParams.get("sizeKb") ?? 256);
    if (!(count >= 1 && sizeKb >= 1) || count * sizeKb * 1024 > MAX_TOTAL_BYTES) return json({ error: "volume refusé" }, { status: 400 });
    mkdirSync(dir, { recursive: true });
    const t0 = performance.now();
    const files = [];
    for (let i = 0; i < count; i++) {
      const data = randomBytes(sizeKb * 1024);
      const name = `f${String(i).padStart(5, "0")}.bin`;
      writeFileSync(path.join(dir, name), data);
      files.push({ name, bytes: data.length, sha256: sha256(data) });
    }
    const manifest = { label: url.searchParams.get("label"), dir, writtenAt: new Date().toISOString(), buildIdAtWrite: buildId(), files };
    writeFileSync(path.join(dir, "manifest.json"), JSON.stringify(manifest, null, 2));
    return json({ written: files.length, totalBytes: count * sizeKb * 1024, durationMs: performance.now() - t0, manifest, disk: disk(dir) });
  } catch (e) {
    return json({ error: e.code ?? e.message }, { status: 500 });
  }
}

export async function GET(request) {
  const refused = denied(request);
  if (refused) return refused;
  const url = new URL(request.url);
  try {
    const dir = target(url);
    const manifestPath = path.join(dir, "manifest.json");
    if (!existsSync(manifestPath)) return json({ dir, manifestPresent: false, disk: disk(path.dirname(dir)) });
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const files = manifest.files.map((f) => {
      const p = path.join(dir, f.name);
      if (!existsSync(p)) return { name: f.name, present: false };
      const actual = sha256(readFileSync(p));
      return { name: f.name, present: true, identical: actual === f.sha256 };
    });
    return json({
      dir,
      manifestPresent: true,
      buildIdAtWrite: manifest.buildIdAtWrite,
      writtenAt: manifest.writtenAt,
      files: files.length,
      present: files.filter((f) => f.present).length,
      identical: files.filter((f) => f.identical).length,
      detail: files.filter((f) => !f.identical),
      disk: disk(dir),
    });
  } catch (e) {
    return json({ error: e.code ?? e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const refused = denied(request);
  if (refused) return refused;
  try {
    const dir = target(new URL(request.url));
    rmSync(dir, { recursive: true, force: true });
    return json({ deleted: dir });
  } catch (e) {
    return json({ error: e.code ?? e.message }, { status: 500 });
  }
}
