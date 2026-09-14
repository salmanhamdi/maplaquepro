// Structure tarifaire (§7.5). Aucun tarif décidé : montants À VALIDER (VR-07, GATE 6). Montants en centimes entiers (§27).
import { z } from "zod";
import { etatSchema } from "./etat";
import { statutSchema } from "./referentiels";

const centimes = etatSchema(z.number().int().nonnegative());

/** Modèle non défini (VR-07) : jamais DEFINIE, uniquement A_VALIDER ou SANS_OBJET (décision Supervisor I-6). */
const nonDefini = z.discriminatedUnion("etat", [
  z.strictObject({ etat: z.literal("A_VALIDER") }),
  z.strictObject({ etat: z.literal("SANS_OBJET") }),
]);

export const priceRulesSchema = z.strictObject({
  id: z.string().min(1),
  base: centimes,
  byVariant: z.record(z.string().min(1), centimes),
  byThickness: z.record(z.string().min(1), centimes),
  byFormat: z.record(z.string().min(1), centimes),
  /** Modèle de tarification sur mesure non défini (VR-07). */
  customDimensionPricing: nonDefini,
  byWorkflow: z.record(z.string().min(1), centimes),
  byMounting: z.record(z.string().min(1), centimes),
  artworkProcessingFee: centimes,
  /** Paliers non définis (VR-07). */
  quantityTiers: nonDefini,
  vatRate: etatSchema(z.number().min(0).max(1)),
  pricingStatus: statutSchema,
});
export type PriceRules = z.infer<typeof priceRulesSchema>;
