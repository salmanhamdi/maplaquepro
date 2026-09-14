// Apparence, capacité de gravure et politique d'impression d'une référence (P4, P5, P7).
import { z } from "zod";
import { etatSchema } from "./etat";
import { coteSchema } from "./referentiels";

export const colorSpecSchema = z.strictObject({
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
export type ColorSpec = z.infer<typeof colorSpecSchema>;

export const apparenceSchema = z.strictObject({
  couleurSurface: etatSchema(colorSpecSchema),
  /** Aspect de surface de la référence (P4) ; aucune valeur présumée. */
  finition: etatSchema(z.string().min(1)),
  /** Propriété de la référence (P5 D2). */
  couleurRevelee: etatSchema(colorSpecSchema),
});
export type ApparenceReference = z.infer<typeof apparenceSchema>;

/** SANS_OBJET ⇔ non gravable ; aucune couleur (P7 D2). */
export const capaciteGravureSchema = z.strictObject({
  cote: etatSchema(coteSchema),
});
export type CapaciteGravure = z.infer<typeof capaciteGravureSchema>;

export const POLITIQUES_IMPRESSION = ["aucune", "noir_uniquement", "couleur"] as const;

export const politiqueImpressionSchema = z
  .strictObject({
    valeur: etatSchema(z.enum(POLITIQUES_IMPRESSION)),
    cote: etatSchema(coteSchema),
  })
  .refine((p) => !(p.valeur.etat === "DEFINIE" && p.valeur.valeur === "aucune") || p.cote.etat === "SANS_OBJET", {
    message: "politique « aucune » : le côté d'impression est SANS_OBJET (P7)",
    path: ["cote"],
  });
export type PolitiqueImpression = z.infer<typeof politiqueImpressionSchema>;
