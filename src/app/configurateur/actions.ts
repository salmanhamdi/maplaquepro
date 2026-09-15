"use server";
// Action serveur du configurateur : délègue à la vérification serveur (fabricabilité + aperçu serveur T4-a).
// Reçoit uniquement l'état de saisie ; aucune version de moteur, aucun champ résolu serveur ne vient du client.
import type { EtatConfigurateur, Verdict } from "@/components/configurateur/interpretation";
import { verifier } from "@/server/verification";

export async function verifierConfiguration(etat: EtatConfigurateur): Promise<Verdict> {
  return verifier(etat);
}
