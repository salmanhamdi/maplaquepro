// C2 — présence d'une variable d'environnement de test (valeur jamais renvoyée).
import { denied, json } from "../../../../lib/probe.js";

export async function GET(request) {
  const refused = denied(request);
  if (refused) return refused;
  return json({ PROBE_ENV_TEST: process.env.PROBE_ENV_TEST ? "présente" : "absente" });
}
