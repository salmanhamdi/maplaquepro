// C4 (partiel, sans Stripe) et M10 — le corps POST brut reçu est-il intact ? Taille et SHA-256.
import { denied, json, sha256 } from "../../../../lib/probe.js";

export async function POST(request) {
  const refused = denied(request);
  if (refused) return refused;
  const body = Buffer.from(await request.arrayBuffer());
  return json({ bytes: body.length, sha256: sha256(body), contentType: request.headers.get("content-type") });
}
