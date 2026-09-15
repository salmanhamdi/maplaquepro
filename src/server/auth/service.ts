// Cas d'usage du compte client (S2). Indépendants de Next.js : la base, l'envoi d'email, le journal et
// l'horloge sont injectés, ce qui permet de les tester contre une MariaDB réelle.
import { and, eq, gt, isNull, ne } from "drizzle-orm";
import type { creerDb } from "../db/client";
import { nouvelId } from "../db/ids";
import { customers, customerSessions, customerTokens, type TokenPurpose } from "../db/schema";
import type { EnvoyeurEmail } from "../email/envoi";
import { emailCompteExistant, emailMotDePasseChange, emailReinitialisation, emailVerification } from "../email/modeles";
import { type JournalAudit, tracer } from "./audit";
import { consommerTentative } from "./limites";
import { doitEtreRehache, type ErreurPolitique, hacherMotDePasse, verificationFactice, verifierMotDePasse, verifierPolitique } from "./mot-de-passe";
import { type Limite, PARAMETRES_AUTH } from "./parametres";
import { empreinte, formatSecretValide, nouveauSecret } from "./secrets";
import { normaliserEmail } from "./validation";

type Db = ReturnType<typeof creerDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type DependancesAuth = {
  db: Db;
  envoyeur: EnvoyeurEmail;
  journal: JournalAudit;
  maintenant: () => Date;
  urlBase: string;
};

export type Echec<E extends string> = { ok: false; erreur: E };
type Succes<T = object> = { ok: true } & T;

export type SessionOuverte = { jetonSession: string; expiresAt: Date; customerId: string };
export type ClientConnecte = { sessionId: string; customerId: string; email: string; emailVerifiedAt: Date | null };

const lien = (deps: DependancesAuth, chemin: string, jeton?: string) => {
  const url = new URL(chemin, deps.urlBase);
  if (jeton) url.searchParams.set("jeton", jeton);
  return url.toString();
};

async function limiter(deps: DependancesAuth, action: string, cle: string, limite: Limite, customerId?: string): Promise<boolean> {
  const maintenant = deps.maintenant();
  const autorise = await consommerTentative(deps.db, action, cle, limite, maintenant);
  if (!autorise) tracer(deps.journal, maintenant, "limite_atteinte", { customerId, detail: action });
  return autorise;
}

async function creerJeton(tx: Tx | Db, customerId: string, purpose: TokenPurpose, dureeMs: number, maintenant: Date): Promise<string> {
  await tx
    .update(customerTokens)
    .set({ consumedAt: maintenant })
    .where(and(eq(customerTokens.customerId, customerId), eq(customerTokens.purpose, purpose), isNull(customerTokens.consumedAt)));
  const jeton = nouveauSecret();
  await tx.insert(customerTokens).values({
    id: nouvelId(),
    customerId,
    purpose,
    tokenHash: empreinte(jeton),
    createdAt: maintenant,
    expiresAt: new Date(maintenant.getTime() + dureeMs),
  });
  return jeton;
}

// Consommation atomique : verrou de ligne, finalité vérifiée, usage unique, expiration.
async function consommerJeton(tx: Tx, jeton: unknown, purpose: TokenPurpose, maintenant: Date): Promise<string | null> {
  if (!formatSecretValide(jeton)) return null;
  const [ligne] = await tx
    .select({ id: customerTokens.id, customerId: customerTokens.customerId, purpose: customerTokens.purpose, expiresAt: customerTokens.expiresAt, consumedAt: customerTokens.consumedAt })
    .from(customerTokens)
    .where(eq(customerTokens.tokenHash, empreinte(jeton)))
    .for("update");
  if (!ligne || ligne.purpose !== purpose || ligne.consumedAt || ligne.expiresAt.getTime() <= maintenant.getTime()) return null;
  await tx.update(customerTokens).set({ consumedAt: maintenant }).where(eq(customerTokens.id, ligne.id));
  return ligne.customerId;
}

async function ouvrirSession(tx: Tx | Db, customerId: string, maintenant: Date): Promise<SessionOuverte> {
  const jetonSession = nouveauSecret();
  const expiresAt = new Date(maintenant.getTime() + PARAMETRES_AUTH.dureeSessionMs);
  await tx.insert(customerSessions).values({
    id: nouvelId(),
    customerId,
    tokenHash: empreinte(jetonSession),
    createdAt: maintenant,
    expiresAt,
    lastSeenAt: maintenant,
  });
  return { jetonSession, expiresAt, customerId };
}

async function revoquerSessions(tx: Tx | Db, customerId: string, maintenant: Date, saufSessionId?: string) {
  const conditions = [eq(customerSessions.customerId, customerId), isNull(customerSessions.revokedAt)];
  if (saufSessionId) conditions.push(ne(customerSessions.id, saufSessionId));
  await tx.update(customerSessions).set({ revokedAt: maintenant }).where(and(...conditions));
}

const estDoublon = (e: unknown) => (e as { cause?: { code?: string } })?.cause?.code === "ER_DUP_ENTRY";

// ---------- Inscription ----------

export async function inscrire(
  deps: DependancesAuth,
  entree: { email: unknown; motDePasse: unknown; ip: string },
): Promise<Succes | Echec<"email_invalide" | ErreurPolitique | "limite">> {
  const email = normaliserEmail(entree.email);
  if (!email) return { ok: false, erreur: "email_invalide" };
  if (typeof entree.motDePasse !== "string") return { ok: false, erreur: "trop_court" };
  const politique = verifierPolitique(entree.motDePasse);
  if (politique) return { ok: false, erreur: politique };
  if (!(await limiter(deps, "inscription_ip", entree.ip, PARAMETRES_AUTH.limites.inscriptionParIp))) return { ok: false, erreur: "limite" };

  // Le hachage est calculé dans tous les cas : la durée ne distingue pas un email déjà inscrit.
  const passwordHash = await hacherMotDePasse(entree.motDePasse);
  const maintenant = deps.maintenant();
  const customerId = nouvelId();
  let jeton: string;
  try {
    jeton = await deps.db.transaction(async (tx) => {
      await tx.insert(customers).values({ id: customerId, email, passwordHash, createdAt: maintenant, updatedAt: maintenant });
      return creerJeton(tx, customerId, "email_verification", PARAMETRES_AUTH.dureeJetonVerificationEmailMs, maintenant);
    });
  } catch (e) {
    if (!estDoublon(e)) throw e;
    await deps.envoyeur.envoyer(emailCompteExistant(email, lien(deps, "/compte/connexion"), lien(deps, "/compte/mot-de-passe-oublie")));
    return { ok: true };
  }
  tracer(deps.journal, maintenant, "compte_cree", { customerId });
  await deps.envoyeur.envoyer(emailVerification(email, lien(deps, "/compte/verifier-email", jeton)));
  return { ok: true };
}

// ---------- Vérification de l'email ----------

export async function verifierEmail(deps: DependancesAuth, jeton: unknown): Promise<Succes | Echec<"jeton_invalide">> {
  const maintenant = deps.maintenant();
  const customerId = await deps.db.transaction(async (tx) => {
    const id = await consommerJeton(tx, jeton, "email_verification", maintenant);
    if (id) await tx.update(customers).set({ emailVerifiedAt: maintenant, updatedAt: maintenant }).where(and(eq(customers.id, id), isNull(customers.emailVerifiedAt)));
    return id;
  });
  if (!customerId) return { ok: false, erreur: "jeton_invalide" };
  tracer(deps.journal, maintenant, "email_verifie", { customerId });
  return { ok: true };
}

export async function renvoyerVerification(deps: DependancesAuth, customerId: string): Promise<Succes | Echec<"limite">> {
  const [client] = await deps.db.select({ email: customers.email, emailVerifiedAt: customers.emailVerifiedAt }).from(customers).where(eq(customers.id, customerId));
  if (!client || client.emailVerifiedAt) return { ok: true };
  if (!(await limiter(deps, "renvoi_verification", customerId, PARAMETRES_AUTH.limites.renvoiVerificationParCompte, customerId))) return { ok: false, erreur: "limite" };
  const jeton = await creerJeton(deps.db, customerId, "email_verification", PARAMETRES_AUTH.dureeJetonVerificationEmailMs, deps.maintenant());
  await deps.envoyeur.envoyer(emailVerification(client.email, lien(deps, "/compte/verifier-email", jeton)));
  return { ok: true };
}

// ---------- Connexion / session ----------

export async function connecter(
  deps: DependancesAuth,
  entree: { email: unknown; motDePasse: unknown; ip: string },
): Promise<Succes<SessionOuverte> | Echec<"identifiants_invalides" | "email_non_verifie" | "limite">> {
  const email = normaliserEmail(entree.email);
  const motDePasse = typeof entree.motDePasse === "string" ? entree.motDePasse : "";
  const autoriseIp = await limiter(deps, "connexion_ip", entree.ip, PARAMETRES_AUTH.limites.connexionParIp);
  const autoriseEmail = await limiter(deps, "connexion_email", email ?? "invalide", PARAMETRES_AUTH.limites.connexionParEmail);
  if (!autoriseIp || !autoriseEmail) return { ok: false, erreur: "limite" };

  const [client] = email ? await deps.db.select().from(customers).where(eq(customers.email, email)) : [];
  const valide = client ? await verifierMotDePasse(client.passwordHash, motDePasse) : await verificationFactice(motDePasse);
  const maintenant = deps.maintenant();
  if (!client || !valide) {
    tracer(deps.journal, maintenant, "connexion_echouee", { customerId: client?.id });
    return { ok: false, erreur: "identifiants_invalides" };
  }
  if (!PARAMETRES_AUTH.connexionAvantVerificationEmail && !client.emailVerifiedAt) return { ok: false, erreur: "email_non_verifie" };

  if (doitEtreRehache(client.passwordHash)) {
    await deps.db.update(customers).set({ passwordHash: await hacherMotDePasse(motDePasse), updatedAt: maintenant }).where(eq(customers.id, client.id));
  }
  const session = await ouvrirSession(deps.db, client.id, maintenant);
  tracer(deps.journal, maintenant, "connexion_reussie", { customerId: client.id });
  return { ok: true, ...session };
}

export async function lireSession(deps: DependancesAuth, jetonSession: unknown): Promise<ClientConnecte | null> {
  if (!formatSecretValide(jetonSession)) return null;
  const maintenant = deps.maintenant();
  const [ligne] = await deps.db
    .select({ sessionId: customerSessions.id, lastSeenAt: customerSessions.lastSeenAt, customerId: customers.id, email: customers.email, emailVerifiedAt: customers.emailVerifiedAt })
    .from(customerSessions)
    .innerJoin(customers, eq(customers.id, customerSessions.customerId))
    .where(and(eq(customerSessions.tokenHash, empreinte(jetonSession)), isNull(customerSessions.revokedAt), gt(customerSessions.expiresAt, maintenant)));
  if (!ligne) return null;
  if (maintenant.getTime() - ligne.lastSeenAt.getTime() > PARAMETRES_AUTH.intervalleDerniereActiviteMs) {
    await deps.db.update(customerSessions).set({ lastSeenAt: maintenant }).where(eq(customerSessions.id, ligne.sessionId));
  }
  return { sessionId: ligne.sessionId, customerId: ligne.customerId, email: ligne.email, emailVerifiedAt: ligne.emailVerifiedAt };
}

export async function deconnecter(deps: DependancesAuth, jetonSession: unknown): Promise<void> {
  if (!formatSecretValide(jetonSession)) return;
  const maintenant = deps.maintenant();
  const [ligne] = await deps.db.select({ id: customerSessions.id, customerId: customerSessions.customerId }).from(customerSessions).where(eq(customerSessions.tokenHash, empreinte(jetonSession)));
  if (!ligne) return;
  await deps.db.update(customerSessions).set({ revokedAt: maintenant }).where(and(eq(customerSessions.id, ligne.id), isNull(customerSessions.revokedAt)));
  tracer(deps.journal, maintenant, "deconnexion", { customerId: ligne.customerId });
}

// ---------- Mot de passe oublié / réinitialisation ----------

export async function demanderReinitialisation(deps: DependancesAuth, entree: { email: unknown; ip: string }): Promise<Succes | Echec<"email_invalide" | "limite">> {
  const email = normaliserEmail(entree.email);
  if (!email) return { ok: false, erreur: "email_invalide" };
  const autoriseIp = await limiter(deps, "reinitialisation_ip", entree.ip, PARAMETRES_AUTH.limites.reinitialisationParIp);
  const autoriseEmail = await limiter(deps, "reinitialisation_email", email, PARAMETRES_AUTH.limites.reinitialisationParEmail);
  if (!autoriseIp || !autoriseEmail) return { ok: false, erreur: "limite" };

  const [client] = await deps.db.select({ id: customers.id }).from(customers).where(eq(customers.email, email));
  const maintenant = deps.maintenant();
  tracer(deps.journal, maintenant, "reinitialisation_demandee", { customerId: client?.id });
  if (client) {
    const jeton = await creerJeton(deps.db, client.id, "password_reset", PARAMETRES_AUTH.dureeJetonReinitialisationMs, maintenant);
    await deps.envoyeur.envoyer(emailReinitialisation(email, lien(deps, "/compte/reinitialiser", jeton)));
  }
  return { ok: true };
}

export async function reinitialiserMotDePasse(deps: DependancesAuth, entree: { jeton: unknown; motDePasse: unknown }): Promise<Succes | Echec<"jeton_invalide" | ErreurPolitique>> {
  if (typeof entree.motDePasse !== "string") return { ok: false, erreur: "trop_court" };
  const politique = verifierPolitique(entree.motDePasse);
  if (politique) return { ok: false, erreur: politique };
  const passwordHash = await hacherMotDePasse(entree.motDePasse);
  const maintenant = deps.maintenant();
  const client = await deps.db.transaction(async (tx) => {
    const id = await consommerJeton(tx, entree.jeton, "password_reset", maintenant);
    if (!id) return null;
    await tx.update(customers).set({ passwordHash, updatedAt: maintenant }).where(eq(customers.id, id));
    await revoquerSessions(tx, id, maintenant);
    await tx.update(customerTokens).set({ consumedAt: maintenant }).where(and(eq(customerTokens.customerId, id), eq(customerTokens.purpose, "password_reset"), isNull(customerTokens.consumedAt)));
    const [c] = await tx.select({ id: customers.id, email: customers.email }).from(customers).where(eq(customers.id, id));
    return c ?? null;
  });
  if (!client) return { ok: false, erreur: "jeton_invalide" };
  tracer(deps.journal, maintenant, "reinitialisation_effectuee", { customerId: client.id });
  tracer(deps.journal, maintenant, "sessions_revoquees", { customerId: client.id, detail: "reinitialisation" });
  await deps.envoyeur.envoyer(emailMotDePasseChange(client.email));
  return { ok: true };
}

// ---------- Changement de mot de passe (connecté) ----------

export async function changerMotDePasse(
  deps: DependancesAuth,
  entree: { client: ClientConnecte; actuel: unknown; nouveau: unknown },
): Promise<Succes<SessionOuverte> | Echec<"mot_de_passe_actuel_invalide" | ErreurPolitique | "limite">> {
  const { client } = entree;
  if (!(await limiter(deps, "changement_mot_de_passe", client.customerId, PARAMETRES_AUTH.limites.changementMotDePasseParCompte, client.customerId))) return { ok: false, erreur: "limite" };
  const [ligne] = await deps.db.select({ passwordHash: customers.passwordHash }).from(customers).where(eq(customers.id, client.customerId));
  if (!ligne || typeof entree.actuel !== "string" || !(await verifierMotDePasse(ligne.passwordHash, entree.actuel))) {
    return { ok: false, erreur: "mot_de_passe_actuel_invalide" };
  }
  if (typeof entree.nouveau !== "string") return { ok: false, erreur: "trop_court" };
  const politique = verifierPolitique(entree.nouveau);
  if (politique) return { ok: false, erreur: politique };

  const passwordHash = await hacherMotDePasse(entree.nouveau);
  const maintenant = deps.maintenant();
  const session = await deps.db.transaction(async (tx) => {
    await tx.update(customers).set({ passwordHash, updatedAt: maintenant }).where(eq(customers.id, client.customerId));
    if (PARAMETRES_AUTH.revoquerAutresSessionsApresChangement) await revoquerSessions(tx, client.customerId, maintenant);
    else await tx.update(customerSessions).set({ revokedAt: maintenant }).where(eq(customerSessions.id, client.sessionId));
    return ouvrirSession(tx, client.customerId, maintenant);
  });
  tracer(deps.journal, maintenant, "mot_de_passe_change", { customerId: client.customerId });
  tracer(deps.journal, maintenant, "sessions_revoquees", { customerId: client.customerId, detail: "changement_mot_de_passe" });
  await deps.envoyeur.envoyer(emailMotDePasseChange(client.email));
  return { ok: true, ...session };
}
