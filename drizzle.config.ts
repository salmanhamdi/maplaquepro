// Configuration drizzle-kit. `generate` produit des migrations SQL versionnées dans `drizzle/`
// (relues en revue). `push` n'est pas un mécanisme autorisé hors prototype local.
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
});
