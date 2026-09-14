// Disposition des trous (§11, P6, P11). Paramètres non confirmés = À VALIDER (VR-22 à VR-24).
import { z } from "zod";
import { etatSchema } from "./etat";
import { statutSchema, thicknessIdSchema } from "./referentiels";

/** Valeur cible UX globale (P11) : retenue seulement si toutes les contraintes sont satisfaites. */
export const DEFAULT_EDGE_DISTANCE_TARGET_MM = 3.0;

/** Pas de 0,1 mm (§11.3). */
export const aUneDecimaleAuPlus = (v: number) => Math.abs(Math.round(v * 10) - v * 10) < 1e-9;
const edgeDistanceMm = z.number().positive().refine(aUneDecimaleAuPlus, { message: "pas de 0,1 mm (§11.3)" });

const mountingParams = {
  holeDiameterMm: etatSchema(z.number().positive()),
  minEdgeDistanceMm: etatSchema(z.number().positive()),
  holeKeepOutMarginMm: etatSchema(z.number().nonnegative()),
  edgeDistanceSemantics: etatSchema(z.enum(["edge_to_center", "edge_to_rim"])),
  /** INFERENCE à confirmer (VR-24). */
  twoHolesDisposition: etatSchema(z.literal("horizontal_centered")),
  cornerRadiusClearanceMm: etatSchema(z.number().nonnegative()),
};

export const mountingRulesSchema = z.strictObject({
  id: z.string().min(1),
  allowedCounts: z.array(z.union([z.literal(0), z.literal(2), z.literal(4)])).min(1),
  defaultEdgeDistanceTargetMm: z.literal(DEFAULT_EDGE_DISTANCE_TARGET_MM),
  decimals: z.literal(1),
  ...mountingParams,
  /** Surcharges contextuelles : seulement sur donnée atelier validée (P11 D6). */
  overrides: z
    .array(
      z.strictObject({
        variantId: z.string().min(1).optional(),
        thicknessId: thicknessIdSchema.optional(),
        holeDiameterMm: mountingParams.holeDiameterMm.optional(),
        minEdgeDistanceMm: mountingParams.minEdgeDistanceMm.optional(),
        holeKeepOutMarginMm: mountingParams.holeKeepOutMarginMm.optional(),
        edgeDistanceSemantics: mountingParams.edgeDistanceSemantics.optional(),
        twoHolesDisposition: mountingParams.twoHolesDisposition.optional(),
        cornerRadiusClearanceMm: mountingParams.cornerRadiusClearanceMm.optional(),
      }),
    )
    .optional(),
  statut: statutSchema,
});
export type MountingRules = z.infer<typeof mountingRulesSchema>;

/** Choix client (§6, §11.1). Le diamètre n'est jamais un choix client ; symétrie obligatoire en mode avancé. */
export const mountingPatternSchema = z.union([
  z.strictObject({ count: z.literal(0) }),
  z.strictObject({
    count: z.union([z.literal(2), z.literal(4)]),
    mode: z.literal("standard"),
    edgeDistanceMm,
  }),
  z.strictObject({
    count: z.union([z.literal(2), z.literal(4)]),
    mode: z.literal("advanced"),
    edgeDistanceXMm: edgeDistanceMm,
    edgeDistanceYMm: edgeDistanceMm,
    symmetry: z.literal(true),
  }),
]);
export type MountingPattern = z.infer<typeof mountingPatternSchema>;
