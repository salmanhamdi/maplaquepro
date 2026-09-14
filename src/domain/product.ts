// Produit (§7.1).
import { z } from "zod";
import { statutSchema } from "./referentiels";

export const productSchema = z.strictObject({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  allowedVariantIds: z.array(z.string().min(1)),
  allowedFormats: z.array(z.string().min(1)),
  allowedLayouts: z.array(z.string().min(1)),
  /** Polices : VR-08 ; aucune liste présumée. */
  allowedFonts: z.array(z.string().min(1)),
  mountingRulesId: z.string().min(1),
  statut: statutSchema,
});
export type Product = z.infer<typeof productSchema>;
