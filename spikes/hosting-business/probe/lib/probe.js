// Utilitaires de la sonde : authentification par jeton, identifiant de build, empreintes.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

export function buildId() {
  try {
    return readFileSync(path.join(process.cwd(), ".next", "BUILD_ID"), "utf8").trim();
  } catch {
    return null;
  }
}

export function startedAt() {
  globalThis.__probeStartedAt ??= new Date().toISOString();
  return globalThis.__probeStartedAt;
}

// Refuse tout si PROBE_TOKEN n'est pas défini sur la plateforme, ou si l'en-tête ne correspond pas.
export function denied(request) {
  const expected = process.env.PROBE_TOKEN;
  if (!expected) return Response.json({ error: "PROBE_TOKEN non défini" }, { status: 503 });
  if (request.headers.get("x-probe-token") !== expected) return Response.json({ error: "refusé" }, { status: 401 });
  return null;
}

export function json(body, init) {
  return Response.json({ buildId: buildId(), processStartedAt: startedAt(), at: new Date().toISOString(), ...body }, init);
}
