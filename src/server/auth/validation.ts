// Validation des entrées : email, chemin de retour après connexion.
import { z } from "zod";

const schemaEmail = z.email().max(254);

export function normaliserEmail(saisie: unknown): string | null {
  if (typeof saisie !== "string") return null;
  const email = saisie.normalize("NFC").trim().toLowerCase();
  return schemaEmail.safeParse(email).success ? email : null;
}

export function masquerEmail(email: string): string {
  const [local = "", domaine = ""] = email.split("@");
  return `${local.slice(0, 1)}***@${domaine}`;
}

const CHEMIN_INTERNE = /^\/(?![/\\])[A-Za-z0-9\-_/]*$/;
export const RETOUR_PAR_DEFAUT = "/compte";

// Seuls les chemins internes relatifs sont acceptés : aucune redirection ouverte.
export function cheminRetourSur(valeur: unknown): string {
  if (typeof valeur !== "string" || valeur.length > 200 || !CHEMIN_INTERNE.test(valeur)) return RETOUR_PAR_DEFAUT;
  if (valeur.split("/").includes("..")) return RETOUR_PAR_DEFAUT;
  return valeur;
}
