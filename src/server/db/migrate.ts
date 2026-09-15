// S1 — PREUVE TECHNIQUE de l'appel programmatique `migrate()` (connexion unique).
// Ce module N'EST PAS la solution de production : le mode d'application des migrations
// sur Hostinger (D-S1-1) reste OUVERT. Il n'est appelé par aucun code applicatif.
import { migrate } from "drizzle-orm/mysql2/migrator";
import { creerConnexionUnique, creerDb } from "./client";

export interface OptionsMigration {
  url?: string;
  migrationsFolder?: string;
  migrationsTable?: string;
}

export async function appliquerMigrations(options: OptionsMigration = {}): Promise<void> {
  const conn = await creerConnexionUnique(options.url);
  try {
    await migrate(creerDb(conn), {
      migrationsFolder: options.migrationsFolder ?? "drizzle",
      ...(options.migrationsTable ? { migrationsTable: options.migrationsTable } : {}),
    });
  } finally {
    await conn.end();
  }
}
