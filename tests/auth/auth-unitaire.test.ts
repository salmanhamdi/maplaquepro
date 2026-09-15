// S2 — tests unitaires de l'authentification (sans base de données).
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import argon2 from "argon2";
import { describe, expect, it } from "vitest";
import { journalConsole, tracer, type EntreeAudit } from "../../src/server/auth/audit";
import { NOM_COOKIE_SESSION, OPTIONS_SUPPRESSION_COOKIE, optionsCookieSession } from "../../src/server/auth/cookie-session";
import { ConfigurationAuthInvalide, lireConfigurationAuth } from "../../src/server/auth/environnement";
import { doitEtreRehache, hacherMotDePasse, verificationFactice, verifierMotDePasse, verifierPolitique } from "../../src/server/auth/mot-de-passe";
import { ARGON2_PARAMETRES } from "../../src/server/auth/parametres";
import { egaliteConstante, empreinte, formatSecretValide, nouveauSecret } from "../../src/server/auth/secrets";
import { cheminRetourSur, masquerEmail, normaliserEmail } from "../../src/server/auth/validation";
import { EmailNonConfigure, EnvoyeurMemoire } from "../../src/server/email/envoi";

const racine = path.resolve(__dirname, "../..");

describe("S2 — mot de passe (Argon2id, argon2@0.45.1)", () => {
  it("paramètres normatifs m=19456, t=2, p=1 et version exacte de la dépendance", () => {
    expect(ARGON2_PARAMETRES).toEqual({ memoryCost: 19456, timeCost: 2, parallelism: 1 });
    const pkg = JSON.parse(readFileSync(path.join(racine, "package.json"), "utf8"));
    expect(pkg.dependencies.argon2).toBe("0.45.1");
    expect(pkg.dependencies["@node-rs/argon2"]).toBeUndefined();
  });

  it("hash PHC Argon2id conservant ses paramètres, sel aléatoire, jamais le clair", async () => {
    const clair = "valeur-de-test-S2-éà";
    const h1 = await hacherMotDePasse(clair);
    const h2 = await hacherMotDePasse(clair);
    expect(h1).toMatch(/^\$argon2id\$v=19\$m=19456,p=1,t=2\$/);
    expect(h1).not.toBe(h2);
    expect(h1).not.toContain(clair);
    expect(await verifierMotDePasse(h1, clair)).toBe(true);
    expect(await verifierMotDePasse(h1, `${clair}x`)).toBe(false);
  });

  it("normalisation Unicode NFC : une même saisie composée ou décomposée est acceptée", async () => {
    const h = await hacherMotDePasse("café-café-café");
    expect(await verifierMotDePasse(h, "café-café-café")).toBe(true);
  });

  it("hash corrompu ou entrée démesurée : refus sans exception", async () => {
    expect(await verifierMotDePasse("pas-un-hash", "quelconque-valeur")).toBe(false);
    const h = await hacherMotDePasse("valeur-de-test-S2");
    expect(await verifierMotDePasse(h, "x".repeat(10_000))).toBe(false);
    expect(await verificationFactice("valeur-de-test-S2")).toBe(false);
  });

  it("re-hachage détecté quand les paramètres stockés sont plus faibles", async () => {
    const faible = await argon2.hash("valeur-de-test-S2", { type: argon2.argon2id, memoryCost: 4096, timeCost: 1, parallelism: 1 });
    expect(doitEtreRehache(faible)).toBe(true);
    expect(doitEtreRehache(await hacherMotDePasse("valeur-de-test-S2"))).toBe(false);
  });

  it("politique proposée : longueur minimale en caractères, maximale en octets", () => {
    expect(verifierPolitique("court")).toBe("trop_court");
    expect(verifierPolitique("dix-caract")).toBeNull();
    expect(verifierPolitique("🔒🔒🔒🔒🔒🔒🔒🔒🔒🔒")).toBeNull();
    expect(verifierPolitique("é".repeat(129))).toBe("trop_long");
  });
});

describe("S2 — secrets opaques (session, jetons)", () => {
  it("256 bits base64url, empreinte SHA-256 hexadécimale, comparaison à durée constante", () => {
    const s = nouveauSecret();
    expect(formatSecretValide(s)).toBe(true);
    expect(nouveauSecret()).not.toBe(s);
    expect(empreinte(s)).toMatch(/^[0-9a-f]{64}$/);
    expect(empreinte(s)).not.toContain(s);
    expect(egaliteConstante(s, s)).toBe(true);
    expect(egaliteConstante(s, `${s}x`)).toBe(false);
    for (const invalide of [undefined, 42, "", "abc", `${s}=`, s.replace(/./, "!")]) expect(formatSecretValide(invalide)).toBe(false);
  });
});

describe("S2 — cookie de session", () => {
  it("__Host-, Secure, HttpOnly, SameSite=Lax, Path=/, aucun Domain", () => {
    expect(NOM_COOKIE_SESSION.startsWith("__Host-")).toBe(true);
    const options = optionsCookieSession(new Date("2030-01-01T00:00:00Z"));
    expect(options).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/" });
    expect(options).not.toHaveProperty("domain");
    expect(OPTIONS_SUPPRESSION_COOKIE).toMatchObject({ secure: true, path: "/", maxAge: 0 });
  });
});

describe("S2 — validation des entrées", () => {
  it("email normalisé (casse, espaces) ou refusé", () => {
    expect(normaliserEmail("  Client@Exemple.FR ")).toBe("client@exemple.fr");
    for (const invalide of ["", "sans-arobase", "a@", 12, null, `${"a".repeat(250)}@exemple.fr`]) expect(normaliserEmail(invalide)).toBeNull();
    expect(masquerEmail("client@exemple.fr")).toBe("c***@exemple.fr");
  });

  it("redirection après connexion : chemins internes uniquement", () => {
    expect(cheminRetourSur("/configurateur")).toBe("/configurateur");
    expect(cheminRetourSur("/compte")).toBe("/compte");
    for (const hostile of ["//evil.example", "/\\evil.example", "https://evil.example", "javascript:alert(1)", "/compte/../x", "compte", "/a?b=c", undefined, ["/compte"]]) {
      expect(cheminRetourSur(hostile), String(hostile)).toBe("/compte");
    }
  });
});

describe("S2 — configuration d'environnement", () => {
  it("absente ou invalide : erreur sans valeur divulguée", () => {
    expect(() => lireConfigurationAuth({})).toThrow(ConfigurationAuthInvalide);
    try {
      lireConfigurationAuth({ APP_URL: "ftp://secret-hote", EMAIL_TRANSPORT: "memoire" });
    } catch (e) {
      expect((e as Error).message).not.toContain("secret-hote");
    }
  });

  it("production : aucun envoi simulé tant qu'aucun fournisseur n'est arbitré", () => {
    expect(() => lireConfigurationAuth({ APP_URL: "https://exemple.fr", EMAIL_TRANSPORT: "memoire", NODE_ENV: "production" })).toThrow(EmailNonConfigure);
  });

  it("développement : origine extraite d'APP_URL, envoyeur en mémoire", () => {
    const c = lireConfigurationAuth({ APP_URL: "http://localhost:3000/chemin", EMAIL_TRANSPORT: "memoire" });
    expect(c.urlBase).toBe("http://localhost:3000");
    expect(c.envoyeur).toBeInstanceOf(EnvoyeurMemoire);
  });
});

describe("S2 — journal d'audit", () => {
  it("entrée structurée : type, horodatage ISO, customerId ; aucun champ libre de secret", () => {
    const entrees: EntreeAudit[] = [];
    tracer((e) => entrees.push(e), new Date("2026-09-15T10:00:00.000Z"), "connexion_reussie", { customerId: "01J00000000000000000000000" });
    expect(entrees).toEqual([{ evenement: "connexion_reussie", horodatage: "2026-09-15T10:00:00.000Z", customerId: "01J00000000000000000000000" }]);
    expect(typeof journalConsole).toBe("function");
  });
});

describe("S2 — frontières et surface HTTP", () => {
  const fichiers = (dir: string): string[] =>
    readdirSync(dir).flatMap((f) => {
      const p = path.join(dir, f);
      return statSync(p).isDirectory() ? fichiers(p) : [p];
    });

  it("aucune route GET (route handler) dans /compte : mutations par Server Actions POST uniquement", () => {
    const compte = fichiers(path.join(racine, "src/app/compte"));
    expect(compte.some((f) => /route\.(t|j)sx?$/.test(f))).toBe(false);
    expect(readFileSync(path.join(racine, "src/app/compte/actions.ts"), "utf8").startsWith('"use server";')).toBe(true);
  });

  it("aucune table ni notion de commande, checkout ou suivi invité dans le périmètre S2", () => {
    const sources = [...fichiers(path.join(racine, "src/server/auth")), path.join(racine, "src/server/db/schema.ts"), ...fichiers(path.join(racine, "src/app/compte"))];
    const sansCommentaires = (code: string) => code.replace(/^\s*\/\/.*$/gm, "");
    for (const f of sources) expect(sansCommentaires(readFileSync(f, "utf8")), f).not.toMatch(/\borders?\b|order_|checkout|guest|suivi[_ -]invit/i);
  });

  it("le domaine métier n'importe rien du compte client", () => {
    for (const f of fichiers(path.join(racine, "src/domain"))) expect(readFileSync(f, "utf8"), f).not.toMatch(/server\/auth|server\/db|argon2/);
  });

  it("les journaux d'audit ne reçoivent jamais de mot de passe, jeton, cookie ni email", () => {
    const service = readFileSync(path.join(racine, "src/server/auth/service.ts"), "utf8");
    const appels = service.match(/tracer\([^;]*\);/g) ?? [];
    expect(appels.length).toBeGreaterThan(8);
    for (const appel of appels) expect(appel).not.toMatch(/motDePasse|jeton|passwordHash|email[^_]|cookie|nouveau|actuel/i);
  });
});
