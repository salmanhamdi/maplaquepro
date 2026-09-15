// Schéma Drizzle de l'application.
// S2 — comptes clients : customers, customer_sessions, customer_tokens, auth_attempts.
// Horodatages DATETIME(3) en UTC ; identifiants ULID CHAR(26) générés par l'application ; aucun AUTO_INCREMENT.
// Les tables commandes / suivi invité relèvent d'une tranche ultérieure et ne sont pas créées ici.
import { char, datetime, foreignKey, index, int, mysqlEnum, mysqlTable, primaryKey, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

const horodatage = (nom: string) => datetime(nom, { mode: "date", fsp: 3 });

export const customers = mysqlTable(
  "customers",
  {
    id: char("id", { length: 26 }).primaryKey(),
    email: varchar("email", { length: 254 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    emailVerifiedAt: horodatage("email_verified_at"),
    createdAt: horodatage("created_at").notNull(),
    updatedAt: horodatage("updated_at").notNull(),
  },
  (t) => [uniqueIndex("customers_email_uq").on(t.email)],
);

export const customerSessions = mysqlTable(
  "customer_sessions",
  {
    id: char("id", { length: 26 }).primaryKey(),
    customerId: char("customer_id", { length: 26 }).notNull(),
    tokenHash: char("token_hash", { length: 64 }).notNull(),
    createdAt: horodatage("created_at").notNull(),
    expiresAt: horodatage("expires_at").notNull(),
    lastSeenAt: horodatage("last_seen_at").notNull(),
    revokedAt: horodatage("revoked_at"),
  },
  (t) => [
    uniqueIndex("customer_sessions_token_hash_uq").on(t.tokenHash),
    index("customer_sessions_customer_idx").on(t.customerId),
    foreignKey({ name: "customer_sessions_customer_fk", columns: [t.customerId], foreignColumns: [customers.id] }).onDelete("cascade"),
  ],
);

export const TOKEN_PURPOSES = ["email_verification", "password_reset"] as const;
export type TokenPurpose = (typeof TOKEN_PURPOSES)[number];

export const customerTokens = mysqlTable(
  "customer_tokens",
  {
    id: char("id", { length: 26 }).primaryKey(),
    customerId: char("customer_id", { length: 26 }).notNull(),
    purpose: mysqlEnum("purpose", TOKEN_PURPOSES).notNull(),
    tokenHash: char("token_hash", { length: 64 }).notNull(),
    createdAt: horodatage("created_at").notNull(),
    expiresAt: horodatage("expires_at").notNull(),
    consumedAt: horodatage("consumed_at"),
  },
  (t) => [
    uniqueIndex("customer_tokens_token_hash_uq").on(t.tokenHash),
    index("customer_tokens_customer_purpose_idx").on(t.customerId, t.purpose),
    foreignKey({ name: "customer_tokens_customer_fk", columns: [t.customerId], foreignColumns: [customers.id] }).onDelete("cascade"),
  ],
);

// Compteurs de tentatives par fenêtre fixe. La clé (IP, email, compte) est stockée hachée, jamais en clair.
export const authAttempts = mysqlTable(
  "auth_attempts",
  {
    keyHash: char("key_hash", { length: 64 }).notNull(),
    action: varchar("action", { length: 32 }).notNull(),
    windowStart: horodatage("window_start").notNull(),
    count: int("count").notNull(),
  },
  (t) => [primaryKey({ name: "auth_attempts_pk", columns: [t.keyHash, t.action, t.windowStart] }), index("auth_attempts_window_idx").on(t.windowStart)],
);
