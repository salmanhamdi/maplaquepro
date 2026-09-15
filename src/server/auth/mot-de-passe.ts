// Hachage des mots de passe : Argon2id (argon2@0.45.1), format PHC conservant les paramètres.
// Le mot de passe en clair n'est jamais persisté, journalisé, placé dans une URL ni renvoyé.
import argon2 from "argon2";
import { ARGON2_PARAMETRES, PROPOSITIONS } from "./parametres";

const OPTIONS = { type: argon2.argon2id, ...ARGON2_PARAMETRES } as const;

export type ErreurPolitique = "trop_court" | "trop_long";

export function verifierPolitique(motDePasse: string): ErreurPolitique | null {
  if (Buffer.byteLength(motDePasse, "utf8") > PROPOSITIONS.motDePasse.octetsMax) return "trop_long";
  if ([...motDePasse].length < PROPOSITIONS.motDePasse.longueurMin) return "trop_court";
  return null;
}

function normaliser(motDePasse: string): string {
  return motDePasse.normalize("NFC");
}

export function hacherMotDePasse(motDePasse: string): Promise<string> {
  return argon2.hash(normaliser(motDePasse), OPTIONS);
}

export async function verifierMotDePasse(hash: string, motDePasse: string): Promise<boolean> {
  if (Buffer.byteLength(motDePasse, "utf8") > PROPOSITIONS.motDePasse.octetsMax) return false;
  try {
    return await argon2.verify(hash, normaliser(motDePasse));
  } catch {
    return false;
  }
}

export function doitEtreRehache(hash: string): boolean {
  return argon2.needsRehash(hash, ARGON2_PARAMETRES);
}

// Hash de référence utilisé quand le compte n'existe pas, pour que la durée de réponse ne révèle pas l'email.
let hashFactice: Promise<string> | undefined;

export async function verificationFactice(motDePasse: string): Promise<false> {
  hashFactice ??= argon2.hash("valeur-factice-non-utilisable", OPTIONS);
  await verifierMotDePasse(await hashFactice, motDePasse);
  return false;
}
