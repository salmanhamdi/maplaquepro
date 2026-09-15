// Schéma de TEST (non applicatif) : sert uniquement à prouver la compatibilité Drizzle ↔ MariaDB 11.8.
// Ce n'est pas une table métier ; il n'est pas référencé par `drizzle.config.ts`.
import { char, datetime, index, json, mysqlTable, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

export const s1CompatEssai = mysqlTable(
  "s1_compat_essai",
  {
    id: char("id", { length: 26 }).primaryKey(),
    cle: varchar("cle", { length: 64 }).notNull(),
    groupe: varchar("groupe", { length: 64 }).notNull(),
    donnees: json("donnees").$type<Record<string, unknown>>().notNull(),
    creeLe: datetime("cree_le", { mode: "date", fsp: 3 }).notNull(),
  },
  (t) => [uniqueIndex("s1_compat_essai_cle_uq").on(t.cle), index("s1_compat_essai_groupe_idx").on(t.groupe)],
);
