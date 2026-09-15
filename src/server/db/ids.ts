// Décision Supervisor (S1) : identifiants ULID générés côté serveur par l'application ;
// aucun AUTO_INCREMENT métier, aucune génération par MariaDB.
// Stockage technique retenu en S1 : CHAR(26) (représentation canonique Crockford base32).
import { monotonicFactory } from "ulid";

const genererUlid = monotonicFactory();
const ULID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

export const LONGUEUR_ULID = 26;

export function nouvelId(): string {
  return genererUlid();
}

export function estUlid(valeur: string): boolean {
  return ULID.test(valeur);
}
