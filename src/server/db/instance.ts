// Instance Drizzle partagée par l'application, créée à la première requête (jamais au build).
import { creerDb, creerPool } from "./client";

type Db = ReturnType<typeof creerDb>;
const globalDb = globalThis as unknown as { __maplaqueproDb?: Db };

export function baseDeDonnees(): Db {
  globalDb.__maplaqueproDb ??= creerDb(creerPool());
  return globalDb.__maplaqueproDb;
}
