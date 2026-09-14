// C5 / M0 / M10 — runtime réellement exécuté et contraintes observables (aucune valeur d'environnement exposée).
import { readFileSync } from "node:fs";
import os from "node:os";
import { denied, json } from "../../../../lib/probe.js";

const readable = (file) => {
  try {
    return readFileSync(file, "utf8").trim().slice(0, 200);
  } catch {
    return null;
  }
};

export async function GET(request) {
  const refused = denied(request);
  if (refused) return refused;
  return json({
    node: process.version,
    versions: process.versions,
    platform: process.platform,
    arch: process.arch,
    osRelease: os.release(),
    cpus: os.cpus().length,
    totalMemBytes: os.totalmem(),
    freeMemBytes: os.freemem(),
    memoryUsage: process.memoryUsage(),
    uptimeSec: process.uptime(),
    cwd: process.cwd(),
    tmpdir: os.tmpdir(),
    cgroup: {
      memoryMax: readable("/sys/fs/cgroup/memory.max"),
      memoryLimitV1: readable("/sys/fs/cgroup/memory/memory.limit_in_bytes"),
      cpuMax: readable("/sys/fs/cgroup/cpu.max"),
    },
    nodeEnv: process.env.NODE_ENV ?? null,
    envVarCount: Object.keys(process.env).length,
  });
}
