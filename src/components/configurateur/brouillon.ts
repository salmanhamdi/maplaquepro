// Brouillon local du configurateur (Master Plan §8 : `mpp.draft.v4.<productId>`).
// Il conserve l'ÉTAT DE SAISIE pour le restaurer après un rechargement. Ce n'est ni une configuration
// canonique, ni une source de vérité : le serveur revérifie toujours. Aucun verdict, aperçu ou prix n'y est stocké.
import { z } from "zod";
import type { EtatConfigurateur } from "./interpretation";

/** Produit du catalogue de démonstration utilisé par le configurateur (identique à PRODUIT_DEMO côté serveur). */
export const PRODUIT_CONFIGURATEUR = "plaque-demonstration";
export const cleBrouillon = (productId: string) => `mpp.draft.v4.${productId}`;
export const CLE_BROUILLON = cleBrouillon(PRODUIT_CONFIGURATEUR);

const VERSION_BROUILLON = 1;
const saisieMm = z.string().max(16);

const schemaEtat = z.strictObject({
  famille: z.enum(["trolase", "trolase_metallic", "plexiglass", "troglass_metallic"]),
  largeur: saisieMm,
  hauteur: saisieMm,
  lignes: z.array(z.string().max(80)).min(1).max(4),
  alignement: z.enum(["left", "center"]),
  trous: z.union([z.literal(0), z.literal(2), z.literal(4)]),
  retrait: saisieMm,
});

const schemaBrouillon = z.strictObject({
  version: z.literal(VERSION_BROUILLON),
  productId: z.literal(PRODUIT_CONFIGURATEUR),
  enregistreLe: z.iso.datetime(),
  etat: schemaEtat,
});

/** Garde de frontière : un état de saisie reçu (client, brouillon) n'est accepté que s'il respecte strictement le schéma. */
export function lireEtatSaisie(valeur: unknown): EtatConfigurateur | null {
  const r = schemaEtat.safeParse(valeur);
  return r.success ? r.data : null;
}

export type LectureBrouillon ={ statut: "absent" } | { statut: "invalide" } | { statut: "restaure"; etat: EtatConfigurateur; enregistreLe: string };

export function serialiserBrouillon(etat: EtatConfigurateur, maintenant: Date = new Date()): string {
  return JSON.stringify({ version: VERSION_BROUILLON, productId: PRODUIT_CONFIGURATEUR, enregistreLe: maintenant.toISOString(), etat });
}

/** Lecture stricte : tout brouillon illisible, d'une autre version ou d'un autre produit est « invalide ». */
export function lireBrouillon(brut: string | null): LectureBrouillon {
  if (brut === null) return { statut: "absent" };
  let donnees: unknown;
  try {
    donnees = JSON.parse(brut);
  } catch {
    return { statut: "invalide" };
  }
  const r = schemaBrouillon.safeParse(donnees);
  return r.success ? { statut: "restaure", etat: r.data.etat, enregistreLe: r.data.enregistreLe } : { statut: "invalide" };
}

export type Stockage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Stockage du navigateur, ou null s'il est indisponible (navigation privée stricte, rendu serveur). */
export function stockageNavigateur(): Stockage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Charge le brouillon ; un brouillon invalide est effacé pour ne pas être relu indéfiniment. */
export function chargerBrouillon(stockage: Stockage | null): LectureBrouillon {
  if (!stockage) return { statut: "absent" };
  try {
    const lecture = lireBrouillon(stockage.getItem(CLE_BROUILLON));
    if (lecture.statut === "invalide") stockage.removeItem(CLE_BROUILLON);
    return lecture;
  } catch {
    return { statut: "absent" };
  }
}

export function enregistrerBrouillon(stockage: Stockage | null, etat: EtatConfigurateur): void {
  try {
    stockage?.setItem(CLE_BROUILLON, serialiserBrouillon(etat));
  } catch {
    // Quota ou stockage refusé : la configuration reste utilisable, elle ne sera simplement pas restaurée.
  }
}

export function effacerBrouillon(stockage: Stockage | null): void {
  try {
    stockage?.removeItem(CLE_BROUILLON);
  } catch {
    // Rien à faire : l'absence de stockage équivaut à un brouillon absent.
  }
}
