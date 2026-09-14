// Règles d'artwork par workflow (§7.5, §9). Mode couleur dérivé, jamais saisi (P7 D5).
import { z } from "zod";
import { aValider, etatSchema } from "./etat";
import { MAX_PIXELS_MVP, statutSchema, workflowIdSchema } from "./referentiels";

export const ARTWORK_FORMATS = ["svg", "png", "jpeg"] as const;

export const artworkRulesSchema = z.strictObject({
  id: z.string().min(1),
  workflowId: workflowIdSchema,
  formats: z.array(z.enum(ARTWORK_FORMATS)).min(1),
  /** Limites d'upload : OD-25 (INFERENCE) → À VALIDER. */
  maxBytes: etatSchema(z.number().int().positive()),
  maxPixels: z.number().int().positive(),
  minDpiAtPlacedSize: etatSchema(z.number().positive()),
  minLineWidthMm: etatSchema(z.number().positive()),
  modeCouleur: z.enum(["monochrome", "noir_uniquement", "selon_politique_impression_reference"]),
  rasterPolicy: etatSchema(z.enum(["reject", "accept_bilevel", "accept_grayscale", "accept_color"])),
  statut: statutSchema,
});
export type ArtworkRules = z.infer<typeof artworkRulesSchema>;

export const artworkPlacementSchema = z.strictObject({
  artworkRef: z.string().min(1),
  xMm: z.number(),
  yMm: z.number(),
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
  rotationDeg: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
});
export type ArtworkPlacement = z.infer<typeof artworkPlacementSchema>;

const regle = (workflowId: ArtworkRules["workflowId"], modeCouleur: ArtworkRules["modeCouleur"]): ArtworkRules => ({
  id: `artwork-${workflowId}`,
  workflowId,
  formats: ["svg", "png", "jpeg"],
  maxBytes: aValider(),
  maxPixels: MAX_PIXELS_MVP,
  minDpiAtPlacedSize: aValider(),
  minLineWidthMm: aValider(),
  modeCouleur,
  rasterPolicy: aValider(),
  statut: "validation_required",
});

/** Modes couleur dérivés du workflow (§9.2). */
export const ARTWORK_RULES: readonly ArtworkRules[] = [
  regle("TROLASE_ENGRAVE", "monochrome"),
  regle("TROLASE_METALLIC_ENGRAVE", "monochrome"),
  regle("PLEXIGLASS_UV", "selon_politique_impression_reference"),
  regle("TROGLASS_METALLIC_HYBRID", "noir_uniquement"),
];
