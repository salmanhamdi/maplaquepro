"use server";
// Server Actions du compte client : POST uniquement (Next vérifie l'origine), aucune mutation par GET.
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NOM_COOKIE_SESSION, OPTIONS_SUPPRESSION_COOKIE, optionsCookieSession } from "@/server/auth/cookie-session";
import { clientConnecte, dependancesAuth, ipCliente, jetonSessionCourant } from "@/server/auth/requete";
import {
  changerMotDePasse,
  connecter,
  deconnecter,
  demanderReinitialisation,
  inscrire,
  reinitialiserMotDePasse,
  renvoyerVerification,
  type SessionOuverte,
  verifierEmail,
} from "@/server/auth/service";
import { cheminRetourSur } from "@/server/auth/validation";

// `email` permet de réafficher la saisie après une erreur ; le mot de passe n'est jamais renvoyé.
export type EtatFormulaire = { statut: "initial" | "erreur" | "succes"; message?: string; email?: string };

const MESSAGES: Record<string, string> = {
  email_invalide: "Saisissez une adresse email valide.",
  trop_court: "Le mot de passe doit contenir au moins 10 caractères.",
  trop_long: "Le mot de passe est trop long.",
  limite: "Trop de tentatives. Réessayez un peu plus tard.",
  identifiants_invalides: "Adresse email ou mot de passe incorrect.",
  email_non_verifie: "Confirmez d'abord votre adresse email.",
  jeton_invalide: "Ce lien n'est plus valide. Faites une nouvelle demande.",
  mot_de_passe_actuel_invalide: "Le mot de passe actuel est incorrect.",
};

const erreur = (code: string, donnees?: FormData): EtatFormulaire => {
  const email = donnees?.get("email");
  return { statut: "erreur", message: MESSAGES[code] ?? "Une erreur est survenue.", ...(typeof email === "string" ? { email: email.slice(0, 254) } : {}) };
};

async function poserCookieSession(session: SessionOuverte) {
  (await cookies()).set(NOM_COOKIE_SESSION, session.jetonSession, optionsCookieSession(session.expiresAt));
}

export async function actionInscription(_: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const r = await inscrire(dependancesAuth(), { email: donnees.get("email"), motDePasse: donnees.get("motDePasse"), ip: await ipCliente() });
  if (!r.ok) return erreur(r.erreur, donnees);
  return { statut: "succes", message: "Si cette adresse peut être utilisée, un email vient de vous être envoyé. Vous pouvez ensuite vous connecter." };
}

export async function actionConnexion(_: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const r = await connecter(dependancesAuth(), { email: donnees.get("email"), motDePasse: donnees.get("motDePasse"), ip: await ipCliente() });
  if (!r.ok) return erreur(r.erreur, donnees);
  await poserCookieSession(r);
  redirect(cheminRetourSur(donnees.get("suite")));
}

export async function actionDeconnexion(): Promise<void> {
  const jeton = await jetonSessionCourant();
  if (jeton) await deconnecter(dependancesAuth(), jeton);
  (await cookies()).set(NOM_COOKIE_SESSION, "", OPTIONS_SUPPRESSION_COOKIE);
  redirect("/");
}

export async function actionMotDePasseOublie(_: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const r = await demanderReinitialisation(dependancesAuth(), { email: donnees.get("email"), ip: await ipCliente() });
  if (!r.ok) return erreur(r.erreur, donnees);
  return { statut: "succes", message: "Si un compte existe pour cette adresse, un email de réinitialisation vient d'être envoyé." };
}

export async function actionReinitialisation(_: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const r = await reinitialiserMotDePasse(dependancesAuth(), { jeton: donnees.get("jeton"), motDePasse: donnees.get("motDePasse") });
  if (!r.ok) return erreur(r.erreur);
  return { statut: "succes", message: "Votre mot de passe a été modifié. Vous pouvez vous connecter." };
}

export async function actionVerificationEmail(_: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const r = await verifierEmail(dependancesAuth(), donnees.get("jeton"));
  if (!r.ok) return erreur(r.erreur);
  return { statut: "succes", message: "Votre adresse email est confirmée." };
}

export async function actionRenvoiVerification(_: EtatFormulaire): Promise<EtatFormulaire> {
  const client = await clientConnecte();
  if (!client) redirect("/compte/connexion");
  const r = await renvoyerVerification(dependancesAuth(), client.customerId);
  if (!r.ok) return erreur(r.erreur);
  return { statut: "succes", message: "Un nouvel email de confirmation vient d'être envoyé." };
}

export async function actionChangementMotDePasse(_: EtatFormulaire, donnees: FormData): Promise<EtatFormulaire> {
  const client = await clientConnecte();
  if (!client) redirect("/compte/connexion");
  const r = await changerMotDePasse(dependancesAuth(), { client, actuel: donnees.get("actuel"), nouveau: donnees.get("nouveau") });
  if (!r.ok) return erreur(r.erreur);
  await poserCookieSession(r);
  return { statut: "succes", message: "Votre mot de passe a été modifié. Vos autres sessions ont été fermées." };
}
