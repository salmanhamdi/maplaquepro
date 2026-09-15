"use server";
// Action serveur du configurateur : délègue à la vérification serveur (fabricabilité + aperçu serveur T4-a).
// Reçoit uniquement l'état de saisie ; aucune version de moteur, aucun champ résolu serveur ne vient du client.
import type { SaisieInvalide, Verdict } from "@/components/configurateur/interpretation";
import type { Preparation } from "@/components/configurateur/preparation";
import { construirePreparationBat } from "@/server/preparation-bat";
import { verifierEntree } from "@/server/verification";

/** L'entrée n'est pas typée à l'exécution : elle est revalidée côté serveur avant la vérification. */
export async function verifierConfiguration(entree: unknown): Promise<Verdict | SaisieInvalide> {
  return verifierEntree(entree);
}

/** BAT-PREP : préparation éphémère, non persistée, sans identifiant ni empreinte. L'entrée est revalidée côté serveur. */
export async function preparerLeBat(entree: unknown): Promise<Preparation> {
  try {
    return construirePreparationBat(entree);
  } catch {
    return { etat: "impossible" };
  }
}
