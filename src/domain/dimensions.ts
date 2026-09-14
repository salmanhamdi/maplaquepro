// Formats et règles de dimensions (§6, §7.4, §7.5). Bornes non validées = À VALIDER (VR-25, VR-36).
import { z } from "zod";
import { etatSchema } from "./etat";
import { statutSchema, thicknessIdSchema } from "./referentiels";

export const formatSpecSchema = z.discriminatedUnion("mode", [
  z.strictObject({ mode: z.literal("standard"), formatId: z.string().min(1) }),
  z.strictObject({
    mode: z.literal("custom"),
    widthMm: z.number().positive(),
    heightMm: z.number().positive(),
    cornerRadiusMm: z.number().nonnegative().optional(),
  }),
]);
export type FormatSpec = z.infer<typeof formatSpecSchema>;

export const formatSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1),
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  cornerRadiusMm: z.number().nonnegative(),
  statut: statutSchema,
});
export type Format = z.infer<typeof formatSchema>;

const mm = z.number().positive();

type Borne = { etat: "SANS_OBJET" } | { etat: "DEFINIE"; valeur: number } | { etat: "A_VALIDER" };
const bornesCoherentes = (min?: Borne, max?: Borne) =>
  !(min?.etat === "DEFINIE" && max?.etat === "DEFINIE" && min.valeur > max.valeur);

export const dimensionRulesSchema = z
  .strictObject({
    id: z.string().min(1),
    variantId: z.string().min(1),
    thicknessId: thicknessIdSchema,
    minWidthMm: etatSchema(mm),
    maxWidthMm: etatSchema(mm),
    minHeightMm: etatSchema(mm),
    maxHeightMm: etatSchema(mm),
    minAreaMm2: etatSchema(mm).optional(),
    maxAreaMm2: etatSchema(mm).optional(),
    minCornerRadiusMm: etatSchema(z.number().nonnegative()).optional(),
    maxCornerRadiusMm: etatSchema(z.number().nonnegative()).optional(),
    statut: statutSchema,
  })
  .refine(
    (r) =>
      bornesCoherentes(r.minWidthMm, r.maxWidthMm) &&
      bornesCoherentes(r.minHeightMm, r.maxHeightMm) &&
      bornesCoherentes(r.minAreaMm2, r.maxAreaMm2) &&
      bornesCoherentes(r.minCornerRadiusMm, r.maxCornerRadiusMm),
    { message: "borne minimale supérieure à la borne maximale" },
  );
export type DimensionRules = z.infer<typeof dimensionRulesSchema>;
