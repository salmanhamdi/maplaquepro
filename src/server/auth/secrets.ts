// Valeurs secrètes opaques (session, jetons) : 256 bits aléatoires, seul le SHA-256 est persisté.
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function nouveauSecret(): string {
  return randomBytes(32).toString("base64url");
}

export function empreinte(valeur: string): string {
  return createHash("sha256").update(valeur, "utf8").digest("hex");
}

export function egaliteConstante(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

const FORMAT_SECRET = /^[A-Za-z0-9_-]{43}$/;

export function formatSecretValide(valeur: unknown): valeur is string {
  return typeof valeur === "string" && FORMAT_SECRET.test(valeur);
}
