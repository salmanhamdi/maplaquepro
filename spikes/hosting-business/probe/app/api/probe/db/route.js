// C3 — connexion à la base de test (identifiants saisis uniquement dans la plateforme).
import mysql from "mysql2/promise";
import { denied, json } from "../../../../lib/probe.js";

export async function GET(request) {
  const refused = denied(request);
  if (refused) return refused;
  const t0 = performance.now();
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000,
    });
    const [[row]] = await connection.query("SELECT 1 AS un, VERSION() AS version");
    return json({ ok: true, un: row.un, version: row.version, durationMs: performance.now() - t0 });
  } catch (e) {
    return json({ ok: false, code: e.code ?? null, errno: e.errno ?? null, durationMs: performance.now() - t0 }, { status: 500 });
  } finally {
    await connection?.end().catch(() => {});
  }
}
