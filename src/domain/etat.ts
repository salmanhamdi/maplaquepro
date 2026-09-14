// Trois états normatifs d'une propriété (Master Plan v1.5 §GL, P5 D4, P7 D3).
// Jamais d'absence implicite : une valeur inconnue est A_VALIDER, jamais omise ni devinée.
import { z } from "zod";

export type Etat<T> = { etat: "SANS_OBJET" } | { etat: "DEFINIE"; valeur: T } | { etat: "A_VALIDER" };

export function etatSchema<T extends z.ZodType>(valeur: T) {
  return z.discriminatedUnion("etat", [
    z.strictObject({ etat: z.literal("SANS_OBJET") }),
    z.strictObject({ etat: z.literal("DEFINIE"), valeur }),
    z.strictObject({ etat: z.literal("A_VALIDER") }),
  ]);
}

export const sansObjet = <T>(): Etat<T> => ({ etat: "SANS_OBJET" });
export const aValider = <T>(): Etat<T> => ({ etat: "A_VALIDER" });
export const definie = <T>(valeur: T): Etat<T> => ({ etat: "DEFINIE", valeur });

export const estDefinie = <T>(e: Etat<T>): e is { etat: "DEFINIE"; valeur: T } => e.etat === "DEFINIE";
export const estAValider = <T>(e: Etat<T>): boolean => e.etat === "A_VALIDER";

/** Vrai si l'état est DEFINIE avec la valeur donnée. */
export const vaut = <T>(e: Etat<T>, valeur: T): boolean => e.etat === "DEFINIE" && e.valeur === valeur;
