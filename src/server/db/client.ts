// S1 — connexion MariaDB (Drizzle → mysql2). Côté serveur uniquement ; aucune table métier.
// `DATABASE_URL` est lue exclusivement depuis l'environnement et n'est jamais journalisée.
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

export class DatabaseConfigError extends Error {
  override readonly name = "DatabaseConfigError";
}

/** Lit `DATABASE_URL` sans jamais inclure sa valeur dans un message d'erreur. */
export function lireDatabaseUrl(env: Record<string, string | undefined> = process.env): string {
  const url = env.DATABASE_URL;
  if (!url) throw new DatabaseConfigError("DATABASE_URL absente de l'environnement");
  if (!/^mysql:\/\//.test(url)) throw new DatabaseConfigError("DATABASE_URL doit utiliser le schéma mysql://");
  return url;
}

// UTC : le pilote sérialise et lit les dates en UTC ("Z") et la session MariaDB est fixée à +00:00,
// indépendamment du fuseau du processus Node et de celui du serveur.
const OPTIONS_UTC = { timezone: "Z", dateStrings: false } as const;
const SESSION_UTC = "SET time_zone = '+00:00'";

/** Pool applicatif (requêtes paramétrées via Drizzle). */
export function creerPool(url: string = lireDatabaseUrl()) {
  const pool = mysql.createPool({ uri: url, ...OPTIONS_UTC });
  pool.on("connection", (conn) => {
    conn.query(SESSION_UTC);
  });
  return pool;
}

/** Connexion unique (recommandation Drizzle pour les migrations). */
export async function creerConnexionUnique(url: string = lireDatabaseUrl()) {
  const conn = await mysql.createConnection({ uri: url, ...OPTIONS_UTC });
  await conn.query(SESSION_UTC);
  return conn;
}

export function creerDb(client: mysql.Pool | mysql.Connection) {
  return drizzle({ client });
}
