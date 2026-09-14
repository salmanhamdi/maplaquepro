// M10 — durée maximale de requête observable : GET ?sleepMs=N.
import { denied, json } from "../../../../lib/probe.js";

export const maxDuration = 300;

export async function GET(request) {
  const refused = denied(request);
  if (refused) return refused;
  const sleepMs = Math.min(Number(new URL(request.url).searchParams.get("sleepMs") ?? 0), 290000);
  const t0 = performance.now();
  await new Promise((r) => setTimeout(r, sleepMs));
  return json({ sleepMs, elapsedMs: performance.now() - t0 });
}
