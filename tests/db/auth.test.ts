// S2 — intégration RÉELLE du compte client contre MariaDB 11.8 (aucun mock de base).
// Garde-fou : les tables S2 sont vidées entre les tests, uniquement sur une base locale ou CI.
import argon2 from "argon2";
import { eq, sql } from "drizzle-orm";
import type mysql from "mysql2/promise";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { EntreeAudit } from "../../src/server/auth/audit";
import { PROPOSITIONS } from "../../src/server/auth/parametres";
import { empreinte } from "../../src/server/auth/secrets";
import {
  changerMotDePasse,
  connecter,
  deconnecter,
  type DependancesAuth,
  demanderReinitialisation,
  inscrire,
  lireSession,
  reinitialiserMotDePasse,
  renvoyerVerification,
  verifierEmail,
} from "../../src/server/auth/service";
import { creerDb, creerPool } from "../../src/server/db/client";
import { appliquerMigrations } from "../../src/server/db/migrate";
import { authAttempts, customers, customerSessions, customerTokens } from "../../src/server/db/schema";
import { EnvoyeurMemoire } from "../../src/server/email/envoi";

const MDP = "valeur-de-test-S2-initiale";
const MDP_NOUVEAU = "valeur-de-test-S2-nouvelle";
const IP = "203.0.113.10";

let pool: mysql.Pool;
let db: ReturnType<typeof creerDb>;
let horloge: Date;
let envoyeur: EnvoyeurMemoire;
let journal: EntreeAudit[];

const deps = (): DependancesAuth => ({ db, envoyeur, journal: (e) => journal.push(e), maintenant: () => new Date(horloge), urlBase: "http://localhost:3000" });
const avancer = (ms: number) => {
  horloge = new Date(horloge.getTime() + ms);
};
const jetonDans = (texte: string) => {
  const m = texte.match(/[?&]jeton=([A-Za-z0-9_-]{43})/);
  if (!m?.[1]) throw new Error("jeton absent de l'email");
  return m[1];
};
const dernierEmail = () => {
  const m = envoyeur.envoyes.at(-1);
  if (!m) throw new Error("aucun email");
  return m;
};

async function inscrireEtVerifier(email = "client@exemple.fr") {
  expect(await inscrire(deps(), { email, motDePasse: MDP, ip: IP })).toEqual({ ok: true });
  expect(await verifierEmail(deps(), jetonDans(dernierEmail().texte))).toEqual({ ok: true });
  const [c] = await db.select().from(customers).where(eq(customers.email, email));
  return c!;
}

async function connexion(email = "client@exemple.fr", motDePasse = MDP) {
  const r = await connecter(deps(), { email, motDePasse, ip: IP });
  if (!r.ok) throw new Error(r.erreur);
  return r;
}

beforeAll(async () => {
  pool = creerPool();
  db = creerDb(pool);
  const [rows] = await pool.query<mysql.RowDataPacket[]>("SELECT DATABASE() AS b");
  const base = String(rows[0]?.b);
  if (!/(_ci|_local|_test)$/.test(base)) throw new Error("Tests d'authentification refusés : base non locale / CI");
  await appliquerMigrations();
});

beforeEach(async () => {
  await db.delete(customers);
  await db.delete(authAttempts);
  horloge = new Date("2026-09-15T10:00:00.000Z");
  envoyeur = new EnvoyeurMemoire();
  journal = [];
});

afterAll(async () => {
  if (pool) {
    await db.delete(customers);
    await db.delete(authAttempts);
    await pool.end();
  }
});

describe("S2 — schéma appliqué", () => {
  it("4 tables S2 en InnoDB, DATETIME(3), aucun AUTO_INCREMENT, clés étrangères en cascade", async () => {
    const [cols] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT TABLE_NAME AS t, COLUMN_NAME AS c, COLUMN_TYPE AS ty, EXTRA AS e FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('customers','customer_sessions','customer_tokens','auth_attempts')",
    );
    expect(new Set(cols.map((c) => c.t))).toEqual(new Set(["customers", "customer_sessions", "customer_tokens", "auth_attempts"]));
    expect(cols.some((c) => /auto_increment/i.test(String(c.e)))).toBe(false);
    for (const c of cols.filter((c) => /_at$|window_start/.test(String(c.c)))) expect(c.ty, `${c.t}.${c.c}`).toBe("datetime(3)");
    const [fks] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT CONSTRAINT_NAME AS n, DELETE_RULE AS d FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()",
    );
    expect(fks.map((f) => [f.n, f.d]).sort()).toEqual([
      ["customer_sessions_customer_fk", "CASCADE"],
      ["customer_tokens_customer_fk", "CASCADE"],
    ]);
    const [tables] = await pool.query<mysql.RowDataPacket[]>("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
    for (const hors of ["orders", "order_lines", "order_events", "production_jobs", "configurations", "bat_snapshots"]) expect(tables.map((t) => t.t)).not.toContain(hors);
  });
});

describe("S2 — inscription et vérification email", () => {
  it("crée le compte : email normalisé, hash Argon2id, jeton de vérification stocké haché uniquement", async () => {
    expect(await inscrire(deps(), { email: " Client@Exemple.FR ", motDePasse: MDP, ip: IP })).toEqual({ ok: true });
    const [c] = await db.select().from(customers);
    expect(c?.email).toBe("client@exemple.fr");
    expect(c?.passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,p=1,t=2\$/);
    expect(c?.emailVerifiedAt).toBeNull();
    const email = dernierEmail();
    expect(email.a).toBe("client@exemple.fr");
    const jeton = jetonDans(email.texte);
    const [t] = await db.select().from(customerTokens);
    expect(t?.purpose).toBe("email_verification");
    expect(t?.tokenHash).toBe(empreinte(jeton));
    expect(t!.expiresAt.getTime() - horloge.getTime()).toBe(PROPOSITIONS.dureeJetonVerificationEmailMs);
    const [dump] = await pool.query<mysql.RowDataPacket[]>("SELECT CONCAT_WS('|', c.email, c.password_hash, t.token_hash) AS tout FROM customers c JOIN customer_tokens t ON t.customer_id = c.id");
    expect(String(dump[0]?.tout)).not.toContain(MDP);
    expect(String(dump[0]?.tout)).not.toContain(jeton);
    expect(journal.map((e) => e.evenement)).toEqual(["compte_cree"]);
  });

  it("anti-énumération : email déjà inscrit (autre casse) → même réponse, aucun doublon, email informatif sans jeton", async () => {
    await inscrire(deps(), { email: "client@exemple.fr", motDePasse: MDP, ip: IP });
    const r = await inscrire(deps(), { email: "CLIENT@exemple.fr", motDePasse: MDP_NOUVEAU, ip: IP });
    expect(r).toEqual({ ok: true });
    expect(await db.select().from(customers)).toHaveLength(1);
    expect(await db.select().from(customerTokens)).toHaveLength(1);
    expect(dernierEmail().sujet).toMatch(/déjà un compte/);
    expect(dernierEmail().texte).not.toMatch(/jeton=/);
  });

  it("refuse email invalide et mot de passe hors politique sans rien écrire", async () => {
    expect(await inscrire(deps(), { email: "invalide", motDePasse: MDP, ip: IP })).toEqual({ ok: false, erreur: "email_invalide" });
    expect(await inscrire(deps(), { email: "client@exemple.fr", motDePasse: "court", ip: IP })).toEqual({ ok: false, erreur: "trop_court" });
    expect(await db.select().from(customers)).toHaveLength(0);
  });

  it("jeton de vérification : usage unique, expiré refusé, format hostile refusé", async () => {
    await inscrire(deps(), { email: "client@exemple.fr", motDePasse: MDP, ip: IP });
    const jeton = jetonDans(dernierEmail().texte);
    for (const hostile of [undefined, "", "' OR 1=1 --", jeton.slice(1)]) expect(await verifierEmail(deps(), hostile)).toEqual({ ok: false, erreur: "jeton_invalide" });

    avancer(PROPOSITIONS.dureeJetonVerificationEmailMs + 1);
    expect(await verifierEmail(deps(), jeton)).toEqual({ ok: false, erreur: "jeton_invalide" });

    horloge = new Date("2026-09-15T10:00:00.000Z");
    expect(await verifierEmail(deps(), jeton)).toEqual({ ok: true });
    expect(await verifierEmail(deps(), jeton)).toEqual({ ok: false, erreur: "jeton_invalide" });
    const [c] = await db.select().from(customers);
    expect(c?.emailVerifiedAt?.toISOString()).toBe("2026-09-15T10:00:00.000Z");
  });

  it("consommation concurrente d'un même jeton : un seul succès", async () => {
    await inscrire(deps(), { email: "client@exemple.fr", motDePasse: MDP, ip: IP });
    const jeton = jetonDans(dernierEmail().texte);
    const resultats = await Promise.all(Array.from({ length: 5 }, () => verifierEmail(deps(), jeton)));
    expect(resultats.filter((r) => r.ok)).toHaveLength(1);
  });

  it("renvoi de vérification : l'ancien jeton est invalidé, le nouveau fonctionne", async () => {
    await inscrire(deps(), { email: "client@exemple.fr", motDePasse: MDP, ip: IP });
    const ancien = jetonDans(dernierEmail().texte);
    const [c] = await db.select().from(customers);
    expect(await renvoyerVerification(deps(), c!.id)).toEqual({ ok: true });
    const nouveau = jetonDans(dernierEmail().texte);
    expect(nouveau).not.toBe(ancien);
    expect(await verifierEmail(deps(), ancien)).toEqual({ ok: false, erreur: "jeton_invalide" });
    expect(await verifierEmail(deps(), nouveau)).toEqual({ ok: true });
  });
});

describe("S2 — connexion, session, déconnexion", () => {
  it("connexion réussie : session opaque, seul le hash est stocké, lecture de session", async () => {
    const c = await inscrireEtVerifier();
    const s = await connexion();
    const [ligne] = await db.select().from(customerSessions);
    expect(ligne?.tokenHash).toBe(empreinte(s.jetonSession));
    expect(ligne?.tokenHash).not.toContain(s.jetonSession);
    expect(ligne!.expiresAt.getTime() - horloge.getTime()).toBe(PROPOSITIONS.dureeSessionMs);
    expect(await lireSession(deps(), s.jetonSession)).toMatchObject({ customerId: c.id, email: "client@exemple.fr" });
    expect(journal.at(-1)).toEqual({ evenement: "connexion_reussie", horodatage: horloge.toISOString(), customerId: c.id });
  });

  it("anti-énumération : mauvais mot de passe et email inconnu → même erreur", async () => {
    await inscrireEtVerifier();
    const mauvais = await connecter(deps(), { email: "client@exemple.fr", motDePasse: "mauvaise-valeur-test", ip: IP });
    const inconnu = await connecter(deps(), { email: "personne@exemple.fr", motDePasse: MDP, ip: IP });
    expect(mauvais).toEqual({ ok: false, erreur: "identifiants_invalides" });
    expect(inconnu).toEqual(mauvais);
    expect(await db.select().from(customerSessions)).toHaveLength(0);
  });

  it("session expirée, révoquée ou jeton inconnu : refusée", async () => {
    await inscrireEtVerifier();
    const s = await connexion();
    expect(await lireSession(deps(), "x".repeat(43))).toBeNull();
    avancer(PROPOSITIONS.dureeSessionMs + 1);
    expect(await lireSession(deps(), s.jetonSession)).toBeNull();
    horloge = new Date("2026-09-15T10:00:00.000Z");
    await deconnecter(deps(), s.jetonSession);
    expect(await lireSession(deps(), s.jetonSession)).toBeNull();
    expect(journal.at(-1)?.evenement).toBe("deconnexion");
  });

  it("re-hachage transparent d'un hash aux paramètres plus faibles lors de la connexion", async () => {
    const c = await inscrireEtVerifier();
    const faible = await argon2.hash(MDP, { type: argon2.argon2id, memoryCost: 4096, timeCost: 1, parallelism: 1 });
    await db.update(customers).set({ passwordHash: faible }).where(eq(customers.id, c.id));
    await connexion();
    const [apres] = await db.select().from(customers).where(eq(customers.id, c.id));
    expect(apres?.passwordHash).toMatch(/^\$argon2id\$v=19\$m=19456,p=1,t=2\$/);
  });

  it("limitation par email persistée en base : refus au-delà du seuil, visible depuis une autre instance", async () => {
    await inscrireEtVerifier();
    const { max } = PROPOSITIONS.limites.connexionParEmail;
    for (let i = 0; i < max; i++) await connecter(deps(), { email: "client@exemple.fr", motDePasse: "mauvaise-valeur-test", ip: `198.51.100.${i}` });
    const autrePool = creerPool();
    try {
      const autre = { ...deps(), db: creerDb(autrePool) };
      expect(await connecter(autre, { email: "client@exemple.fr", motDePasse: MDP, ip: "198.51.100.200" })).toEqual({ ok: false, erreur: "limite" });
    } finally {
      await autrePool.end();
    }
    expect(journal.some((e) => e.evenement === "limite_atteinte" && e.detail === "connexion_email")).toBe(true);
    const [cle] = await pool.query<mysql.RowDataPacket[]>("SELECT key_hash AS k FROM auth_attempts");
    expect(cle.every((l) => /^[0-9a-f]{64}$/.test(String(l.k)))).toBe(true);
    avancer(PROPOSITIONS.limites.connexionParEmail.fenetreMs);
    expect((await connecter(deps(), { email: "client@exemple.fr", motDePasse: MDP, ip: IP })).ok).toBe(true);
  });
});

describe("S2 — mot de passe oublié et réinitialisation", () => {
  it("email inconnu : même réponse, aucun email ; email connu : lien envoyé", async () => {
    await inscrireEtVerifier();
    envoyeur.envoyes.length = 0;
    expect(await demanderReinitialisation(deps(), { email: "personne@exemple.fr", ip: IP })).toEqual({ ok: true });
    expect(envoyeur.envoyes).toHaveLength(0);
    expect(await demanderReinitialisation(deps(), { email: "client@exemple.fr", ip: IP })).toEqual({ ok: true });
    expect(dernierEmail().texte).toMatch(/\/compte\/reinitialiser\?jeton=/);
  });

  it("réinitialisation : mot de passe changé, toutes les sessions révoquées, jeton à usage unique", async () => {
    await inscrireEtVerifier();
    const s1 = await connexion();
    const s2 = await connexion();
    await demanderReinitialisation(deps(), { email: "client@exemple.fr", ip: IP });
    const jeton = jetonDans(dernierEmail().texte);

    expect(await reinitialiserMotDePasse(deps(), { jeton, motDePasse: "court" })).toEqual({ ok: false, erreur: "trop_court" });
    expect(await reinitialiserMotDePasse(deps(), { jeton, motDePasse: MDP_NOUVEAU })).toEqual({ ok: true });
    expect(await reinitialiserMotDePasse(deps(), { jeton, motDePasse: MDP_NOUVEAU })).toEqual({ ok: false, erreur: "jeton_invalide" });

    expect(await lireSession(deps(), s1.jetonSession)).toBeNull();
    expect(await lireSession(deps(), s2.jetonSession)).toBeNull();
    expect((await connecter(deps(), { email: "client@exemple.fr", motDePasse: MDP, ip: IP })).ok).toBe(false);
    expect((await connecter(deps(), { email: "client@exemple.fr", motDePasse: MDP_NOUVEAU, ip: IP })).ok).toBe(true);
    expect(dernierEmail().sujet).toMatch(/a été modifié/);
  });

  it("séparation des finalités : un jeton de vérification n'est pas un jeton de réinitialisation, et inversement", async () => {
    await inscrire(deps(), { email: "client@exemple.fr", motDePasse: MDP, ip: IP });
    const verification = jetonDans(dernierEmail().texte);
    expect(await reinitialiserMotDePasse(deps(), { jeton: verification, motDePasse: MDP_NOUVEAU })).toEqual({ ok: false, erreur: "jeton_invalide" });
    await demanderReinitialisation(deps(), { email: "client@exemple.fr", ip: IP });
    const reinitialisation = jetonDans(dernierEmail().texte);
    expect(await verifierEmail(deps(), reinitialisation)).toEqual({ ok: false, erreur: "jeton_invalide" });
    expect(await verifierEmail(deps(), verification)).toEqual({ ok: true });
  });

  it("une nouvelle demande invalide le lien précédent ; un jeton expiré est refusé", async () => {
    await inscrireEtVerifier();
    await demanderReinitialisation(deps(), { email: "client@exemple.fr", ip: IP });
    const premier = jetonDans(dernierEmail().texte);
    await demanderReinitialisation(deps(), { email: "client@exemple.fr", ip: IP });
    const second = jetonDans(dernierEmail().texte);
    expect(await reinitialiserMotDePasse(deps(), { jeton: premier, motDePasse: MDP_NOUVEAU })).toEqual({ ok: false, erreur: "jeton_invalide" });
    avancer(PROPOSITIONS.dureeJetonReinitialisationMs + 1);
    expect(await reinitialiserMotDePasse(deps(), { jeton: second, motDePasse: MDP_NOUVEAU })).toEqual({ ok: false, erreur: "jeton_invalide" });
  });
});

describe("S2 — changement de mot de passe", () => {
  it("mot de passe actuel exigé ; succès : autres sessions révoquées, session courante renouvelée", async () => {
    await inscrireEtVerifier();
    const autre = await connexion();
    const courante = await connexion();
    const client = (await lireSession(deps(), courante.jetonSession))!;

    expect(await changerMotDePasse(deps(), { client, actuel: "mauvaise-valeur-test", nouveau: MDP_NOUVEAU })).toEqual({ ok: false, erreur: "mot_de_passe_actuel_invalide" });
    expect(await changerMotDePasse(deps(), { client, actuel: MDP, nouveau: "court" })).toEqual({ ok: false, erreur: "trop_court" });

    const r = await changerMotDePasse(deps(), { client, actuel: MDP, nouveau: MDP_NOUVEAU });
    if (!r.ok) throw new Error(r.erreur);
    expect(await lireSession(deps(), autre.jetonSession)).toBeNull();
    expect(await lireSession(deps(), courante.jetonSession)).toBeNull();
    expect(await lireSession(deps(), r.jetonSession)).toMatchObject({ customerId: client.customerId });
    expect(journal.map((e) => e.evenement)).toContain("mot_de_passe_change");
  });
});

describe("S2 — intégrité et journal", () => {
  it("suppression d'un client : sessions et jetons supprimés en cascade", async () => {
    const c = await inscrireEtVerifier();
    await connexion();
    await demanderReinitialisation(deps(), { email: "client@exemple.fr", ip: IP });
    await db.delete(customers).where(eq(customers.id, c.id));
    const [n] = await pool.query<mysql.RowDataPacket[]>("SELECT (SELECT COUNT(*) FROM customer_sessions) + (SELECT COUNT(*) FROM customer_tokens) AS n");
    expect(Number(n[0]?.n)).toBe(0);
  });

  it("horodatages UTC indépendants du fuseau du processus", async () => {
    expect(process.env.TZ).toBe("Pacific/Kiritimati");
    await inscrireEtVerifier();
    const [brut] = await db.execute(sql`SELECT DATE_FORMAT(email_verified_at, '%Y-%m-%d %H:%i:%s.%f') AS s FROM customers`);
    expect((brut as unknown as Array<{ s: string }>)[0]?.s).toBe("2026-09-15 10:00:00.000000");
  });

  it("parcours complet : aucun mot de passe, jeton, hash ni email dans le journal d'audit", async () => {
    await inscrireEtVerifier();
    const s = await connexion();
    await connecter(deps(), { email: "client@exemple.fr", motDePasse: "mauvaise-valeur-test", ip: IP });
    await demanderReinitialisation(deps(), { email: "client@exemple.fr", ip: IP });
    const jeton = jetonDans(dernierEmail().texte);
    await reinitialiserMotDePasse(deps(), { jeton, motDePasse: MDP_NOUVEAU });
    await deconnecter(deps(), s.jetonSession);
    const serialise = JSON.stringify(journal);
    for (const interdit of [MDP, MDP_NOUVEAU, "mauvaise-valeur-test", jeton, s.jetonSession, empreinte(s.jetonSession), "client@exemple.fr", "argon2"]) {
      expect(serialise).not.toContain(interdit);
    }
    expect(journal.every((e) => /^\d{4}-\d{2}-\d{2}T.*Z$/.test(e.horodatage))).toBe(true);
  });
});
