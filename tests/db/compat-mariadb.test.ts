// S1 — preuve de compatibilité RÉELLE Drizzle → mysql2 → MariaDB 11.8 (aucun mock).
// Nécessite DATABASE_URL (MariaDB 11.8 locale Docker ou service CI éphémère).
// Aucune table métier : seules une table de test (`s1_compat_essai`) et une table de suivi de
// migrations de test (`__s1_compat_migrations`) sont créées, puis supprimées.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { eq, sql } from "drizzle-orm";
import type mysql from "mysql2/promise";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { creerConnexionUnique, creerDb, creerPool, DatabaseConfigError, lireDatabaseUrl } from "../../src/server/db/client";
import { estUlid, nouvelId } from "../../src/server/db/ids";
import { appliquerMigrations } from "../../src/server/db/migrate";
import { s1CompatEssai } from "./compat-schema";

const TABLE_MIGRATIONS_TEST = "__s1_compat_migrations";
const racine = path.resolve(__dirname, "../..");
let pool: mysql.Pool;
let db: ReturnType<typeof creerDb>;
let dossierMigrations: string;

async function nettoyer(conn: mysql.Pool | mysql.Connection) {
  await conn.query("DROP TABLE IF EXISTS `s1_compat_essai`");
  await conn.query(`DROP TABLE IF EXISTS \`${TABLE_MIGRATIONS_TEST}\``);
}

beforeAll(async () => {
  lireDatabaseUrl();
  pool = creerPool();
  db = creerDb(pool);
  await nettoyer(pool);
  dossierMigrations = mkdtempSync(path.join(tmpdir(), "s1-compat-"));
});

afterAll(async () => {
  if (pool) {
    await nettoyer(pool);
    await pool.end();
  }
  if (dossierMigrations) rmSync(dossierMigrations, { recursive: true, force: true });
});

describe("S1 — MariaDB 11.8 réelle", () => {
  it("1. connexion mysql2 et version MariaDB 11.8", async () => {
    const [rows] = await pool.query<mysql.RowDataPacket[]>("SELECT VERSION() AS v");
    const version = String(rows[0]?.v);
    console.info(`[S1] VERSION() = ${version}`);
    expect(version).toMatch(/^11\.8\.\d+-MariaDB/);
  });

  it("2. Drizzle ORM exécute une requête", async () => {
    const r = await db.execute(sql`SELECT 1 + 1 AS deux`);
    const rows = r[0] as unknown as Array<{ deux: number }>;
    expect(Number(rows[0]?.deux)).toBe(2);
  });

  it("10. migration générée par drizzle-kit puis appliquée par migrate() (connexion unique), rejouable sans effet", async () => {
    execFileSync(
      process.execPath,
      [path.join(racine, "node_modules/drizzle-kit/bin.cjs"), "generate", "--dialect", "mysql", "--schema", "./tests/db/compat-schema.ts", "--out", dossierMigrations, "--name", "compat"],
      { cwd: racine, stdio: "pipe" },
    );
    const sqlGenere = readdirSync(dossierMigrations).filter((f) => f.endsWith(".sql"));
    expect(sqlGenere).toHaveLength(1);
    const contenu = readFileSync(path.join(dossierMigrations, sqlGenere[0]!), "utf8");
    expect(contenu).toContain("CREATE TABLE `s1_compat_essai`");
    expect(contenu).toMatch(/`donnees` json NOT NULL/);
    expect(contenu).toMatch(/`cree_le` datetime\(3\) NOT NULL/);
    expect(contenu).toContain("CONSTRAINT `s1_compat_essai_cle_uq` UNIQUE(`cle`)");
    expect(contenu).toContain("CREATE INDEX `s1_compat_essai_groupe_idx`");
    expect(contenu).not.toMatch(/AUTO_INCREMENT/i);

    await appliquerMigrations({ migrationsFolder: dossierMigrations, migrationsTable: TABLE_MIGRATIONS_TEST });
    await appliquerMigrations({ migrationsFolder: dossierMigrations, migrationsTable: TABLE_MIGRATIONS_TEST });
    const [suivi] = await pool.query<mysql.RowDataPacket[]>(`SELECT COUNT(*) AS n FROM \`${TABLE_MIGRATIONS_TEST}\``);
    expect(Number(suivi[0]?.n)).toBe(1);
  });

  it("3. table de test créée avec les colonnes attendues", async () => {
    const [cols] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT COLUMN_NAME AS c, DATA_TYPE AS t, EXTRA AS e FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 's1_compat_essai' ORDER BY ORDINAL_POSITION",
    );
    expect(cols.map((c) => c.c)).toEqual(["id", "cle", "groupe", "donnees", "cree_le"]);
    expect(cols.some((c) => /auto_increment/i.test(String(c.e)))).toBe(false);
  });

  it("4. JSON : écriture puis relecture structurée identique", async () => {
    const donnees = { texte: "Éé ✓ \"guillemets\"", n: 12.5, liste: [1, "deux", null], imbrique: { ok: true } };
    const id = nouvelId();
    await db.insert(s1CompatEssai).values({ id, cle: `json-${id}`, groupe: "json", donnees, creeLe: new Date() });
    const [ligne] = await db.select().from(s1CompatEssai).where(eq(s1CompatEssai.id, id));
    expect(ligne?.donnees).toEqual(donnees);
    // Fait observé MariaDB 11.8 : JSON_VALUE rend '1' pour un booléen JSON ; le type est vérifié via JSON_TYPE.
    const [valide] = await pool.query<mysql.RowDataPacket[]>(
      "SELECT JSON_VALID(donnees) AS ok, JSON_TYPE(JSON_EXTRACT(donnees, '$.imbrique.ok')) AS t, JSON_UNQUOTE(JSON_EXTRACT(donnees, '$.texte')) AS texte FROM s1_compat_essai WHERE id = ?",
      [id],
    );
    expect(Number(valide[0]?.ok)).toBe(1);
    expect(valide[0]?.t).toBe("BOOLEAN");
    expect(valide[0]?.texte).toBe(donnees.texte);
    await expect(pool.query("INSERT INTO s1_compat_essai (id, cle, groupe, donnees, cree_le) VALUES (?, ?, 'json', 'pas du json', UTC_TIMESTAMP(3))", [nouvelId(), `bad-${id}`])).rejects.toThrow();
  });

  it("5. index : unique appliqué, index secondaire présent et utilisable", async () => {
    const [idx] = await pool.query<mysql.RowDataPacket[]>("SHOW INDEX FROM s1_compat_essai");
    const noms = new Set(idx.map((i) => i.Key_name));
    expect(noms).toEqual(new Set(["PRIMARY", "s1_compat_essai_cle_uq", "s1_compat_essai_groupe_idx"]));
    await db.insert(s1CompatEssai).values({ id: nouvelId(), cle: "unique-1", groupe: "idx", donnees: {}, creeLe: new Date() });
    await expect(db.insert(s1CompatEssai).values({ id: nouvelId(), cle: "unique-1", groupe: "idx", donnees: {}, creeLe: new Date() })).rejects.toMatchObject({
      cause: { code: "ER_DUP_ENTRY" },
    });
  });

  it("6 + 9. transactions : commit persiste, rollback annule toute l'écriture", async () => {
    const a = nouvelId();
    const b = nouvelId();
    await db.transaction(async (tx) => {
      await tx.insert(s1CompatEssai).values({ id: a, cle: `tx-${a}`, groupe: "tx-ok", donnees: { etape: 1 }, creeLe: new Date() });
      await tx.insert(s1CompatEssai).values({ id: b, cle: `tx-${b}`, groupe: "tx-ok", donnees: { etape: 2 }, creeLe: new Date() });
      const lus = await tx.select().from(s1CompatEssai).where(eq(s1CompatEssai.groupe, "tx-ok"));
      expect(lus).toHaveLength(2);
    });
    expect(await db.select().from(s1CompatEssai).where(eq(s1CompatEssai.groupe, "tx-ok"))).toHaveLength(2);

    await expect(
      db.transaction(async (tx) => {
        await tx.insert(s1CompatEssai).values({ id: nouvelId(), cle: "tx-ko-1", groupe: "tx-ko", donnees: {}, creeLe: new Date() });
        await tx.insert(s1CompatEssai).values({ id: nouvelId(), cle: "tx-ko-1", groupe: "tx-ko", donnees: {}, creeLe: new Date() });
      }),
    ).rejects.toThrow();
    expect(await db.select().from(s1CompatEssai).where(eq(s1CompatEssai.groupe, "tx-ko"))).toHaveLength(0);

    const [engine] = await pool.query<mysql.RowDataPacket[]>("SELECT ENGINE AS e FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 's1_compat_essai'");
    expect(engine[0]?.e).toBe("InnoDB");
  });

  it("7. timestamps UTC : indépendants du fuseau du processus (TZ exotique) et de la session", async () => {
    expect(process.env.TZ).toBe("Pacific/Kiritimati");
    expect(new Date(Date.UTC(2026, 0, 1)).getTimezoneOffset()).not.toBe(0);
    const instant = new Date("2026-03-29T01:30:15.123Z");
    const id = nouvelId();
    await db.insert(s1CompatEssai).values({ id, cle: `utc-${id}`, groupe: "utc", donnees: {}, creeLe: instant });
    const [ligne] = await db.select().from(s1CompatEssai).where(eq(s1CompatEssai.id, id));
    expect(ligne?.creeLe.toISOString()).toBe("2026-03-29T01:30:15.123Z");
    const [brut] = await pool.query<mysql.RowDataPacket[]>("SELECT DATE_FORMAT(cree_le, '%Y-%m-%d %H:%i:%s.%f') AS s, @@session.time_zone AS tz FROM s1_compat_essai WHERE id = ?", [id]);
    expect(brut[0]?.s).toBe("2026-03-29 01:30:15.123000");
    expect(brut[0]?.tz).toBe("+00:00");

    const conn = await creerConnexionUnique();
    try {
      const [s] = await conn.query<mysql.RowDataPacket[]>("SELECT @@session.time_zone AS tz, TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), NOW()) AS ecart");
      expect(s[0]?.tz).toBe("+00:00");
      expect(Number(s[0]?.ecart)).toBe(0);
    } finally {
      await conn.end();
    }
  });

  it("8. ULID généré côté application, stocké en CHAR(26), ordonné", async () => {
    const ids = Array.from({ length: 50 }, () => nouvelId());
    expect(ids.every(estUlid)).toBe(true);
    expect([...ids].sort()).toEqual(ids);
    await db.insert(s1CompatEssai).values(ids.map((id, i) => ({ id, cle: `ulid-${i}`, groupe: "ulid", donnees: { i }, creeLe: new Date() })));
    const lus = await db.select({ id: s1CompatEssai.id }).from(s1CompatEssai).where(eq(s1CompatEssai.groupe, "ulid")).orderBy(s1CompatEssai.id);
    expect(lus.map((l) => l.id)).toEqual(ids);
  });

  it("requêtes paramétrées : une valeur hostile est stockée littéralement", async () => {
    const hostile = "x'); DROP TABLE s1_compat_essai; --";
    const id = nouvelId();
    await db.insert(s1CompatEssai).values({ id, cle: hostile, groupe: "param", donnees: { hostile }, creeLe: new Date() });
    const [ligne] = await db.select().from(s1CompatEssai).where(eq(s1CompatEssai.cle, hostile));
    expect(ligne?.id).toBe(id);
  });

  it("chaîne de migrations de l'application (drizzle/) appliquée et rejouable, sans table métier", async () => {
    await appliquerMigrations();
    await appliquerMigrations();
    const [tables] = await pool.query<mysql.RowDataPacket[]>("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
    const noms = tables.map((t) => String(t.t));
    for (const metier of ["customers", "customer_sessions", "customer_login_tokens", "configurations", "bat_snapshots"]) {
      expect(noms).not.toContain(metier);
    }
    expect(noms).toContain("__drizzle_migrations");
  });

  it("DATABASE_URL : erreurs de configuration sans divulguer la valeur", () => {
    expect(() => lireDatabaseUrl({})).toThrow(DatabaseConfigError);
    const secret = "postgres://u:ne-pas-afficher@h/db";
    let message = "";
    try {
      lireDatabaseUrl({ DATABASE_URL: secret });
    } catch (e) {
      message = (e as Error).message;
    }
    expect(message).not.toBe("");
    expect(message).not.toContain("ne-pas-afficher");
  });
});
