// Statut d'un contrat de production (P12). Conformité ≠ validation atelier ≠ GATE 4.
import { z } from "zod";
import { etatSchema } from "./etat";
import { contractIdSchema } from "./referentiels";

export const statutContratSchema = z
  .strictObject({
    contractId: contractIdSchema,
    conformite: z.enum(["conforme", "non_conforme"]),
    /** GATE 4, contrat par contrat ; modalités VR-42 ; jamais DEFINIE sans preuve. */
    validationAtelier: etatSchema(z.literal("validee")),
    preuveValidationAtelier: z.string().min(1).optional(),
  })
  .refine((s) => s.validationAtelier.etat !== "DEFINIE" || s.preuveValidationAtelier !== undefined, {
    message: "validation atelier sans preuve (P12)",
    path: ["preuveValidationAtelier"],
  });
export type StatutContrat = z.infer<typeof statutContratSchema>;
