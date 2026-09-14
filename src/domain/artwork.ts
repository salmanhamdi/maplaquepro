// Règles d'artwork par workflow (§7.5, §9). Mode couleur dérivé, jamais saisi (P7 D5).
import { z } from "zod";
import { aValider, definie, etatSchema } from "./etat";
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

const RASTER_FORMATS: ReadonlySet<ArtworkRules["formats"][number]> = new Set(["png", "jpeg"]);

/** Workflows de gravure seule (§7.2) : VR-28 décidé — vectoriel exclusivement, tout raster rejeté. */
export const ENGRAVE_ONLY_WORKFLOWS: readonly ArtworkRules["workflowId"][] = ["TROLASE_ENGRAVE", "TROLASE_METALLIC_ENGRAVE"];

/**
 * Un format d'artwork est-il acceptable pour ces règles ? Le vectoriel est accepté ; un raster n'est accepté que si
 * la politique raster est DEFINIE et différente de « reject » (À VALIDER ⇒ non accepté, aucune valeur présumée).
 */
export function acceptsArtworkFormat(rules: ArtworkRules, format: ArtworkRules["formats"][number]): boolean {
  if (!rules.formats.includes(format)) return false;
  if (!RASTER_FORMATS.has(format)) return true;
  return rules.rasterPolicy.etat === "DEFINIE" && rules.rasterPolicy.valeur !== "reject";
}

const regle = (
  workflowId: ArtworkRules["workflowId"],
  modeCouleur: ArtworkRules["modeCouleur"],
  rasterPolicy: ArtworkRules["rasterPolicy"],
): ArtworkRules => ({
  id: `artwork-${workflowId}`,
  workflowId,
  formats: ["svg", "png", "jpeg"],
  maxBytes: aValider(),
  maxPixels: MAX_PIXELS_MVP,
  minDpiAtPlacedSize: aValider(),
  minLineWidthMm: aValider(),
  modeCouleur,
  rasterPolicy,
  statut: "validation_required",
});

/**
 * Modes couleur dérivés du workflow (§9.2).
 * Politique raster : gravure seule = rejet (VR-28, décision Supervisor) ; impression UV (Plexiglass) non généralisée → À VALIDER ;
 * TroGlass (gravure envers + UV noir) : application de VR-28 au workflow hybride non tranchée → À VALIDER.
 */
export const ARTWORK_RULES: readonly ArtworkRules[] = [
  regle("TROLASE_ENGRAVE", "monochrome", definie("reject")),
  regle("TROLASE_METALLIC_ENGRAVE", "monochrome", definie("reject")),
  regle("PLEXIGLASS_UV", "selon_politique_impression_reference", aValider()),
  regle("TROGLASS_METALLIC_HYBRID", "noir_uniquement", aValider()),
];
