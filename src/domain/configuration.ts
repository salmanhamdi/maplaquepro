// Configuration client v4 : seuls les champs autorisés (§6, P13). Rejet typé ; aucune correction silencieuse.
import { z } from "zod";
import { artworkPlacementSchema } from "./artwork";
import type { Catalog } from "./catalog";
import { formatSpecSchema } from "./dimensions";
import { mountingPatternSchema } from "./mounting";
import { CONFIGURATION_VERSION, thicknessIdSchema } from "./referentiels";
import { type DomainViolation, violation } from "./violation";

/** Structure du texte uniquement : polices (VR-08) et composition non décidées ; aucun shaping implicite. */
export const textSpecSchema = z.strictObject({
  lines: z.array(z.string()).min(1),
  fontId: z.string().min(1),
  layoutId: z.string().min(1),
  alignment: z.enum(["left", "center"]),
});
export type TextSpec = z.infer<typeof textSpecSchema>;

export const configurationSchema = z.strictObject({
  configurationVersion: z.literal(CONFIGURATION_VERSION),
  productId: z.string().min(1),
  materialVariantId: z.string().min(1),
  thicknessId: thicknessIdSchema,
  format: formatSpecSchema,
  design: z.strictObject({
    text: textSpecSchema.nullable(),
    artwork: artworkPlacementSchema.nullable(),
  }),
  mounting: mountingPatternSchema,
  quantity: z.number().int().positive(),
});
export type Configuration = z.infer<typeof configurationSchema>;

/** Champs interdits au client (§6, P13) : propriétés résolues serveur. */
export const FORBIDDEN_CLIENT_FIELDS = [
  "price",
  "prix",
  "geometry",
  "geometrie",
  "workflow",
  "workflowId",
  "operations",
  "orientationDePose",
  "zoneMachine",
  "encre",
  "modeCouleur",
  "artifacts",
  "resolvedSpec",
] as const;

export type ConfigurationResult =
  | { ok: true; value: Configuration }
  | { ok: false; violations: DomainViolation[] };

export function parseConfiguration(input: unknown): ConfigurationResult {
  const result = configurationSchema.safeParse(input);
  if (result.success) return { ok: true, value: result.data };
  const violations: DomainViolation[] = [];
  for (const issue of result.error.issues) {
    const path = issue.path.map(String).join(".") || "(racine)";
    if (issue.code === "unrecognized_keys") {
      for (const key of issue.keys) {
        const full = path === "(racine)" ? key : `${path}.${key}`;
        const forbidden = (FORBIDDEN_CLIENT_FIELDS as readonly string[]).includes(key);
        violations.push(
          violation(
            forbidden ? "FORBIDDEN_CLIENT_FIELD" : "UNKNOWN_FIELD",
            full,
            forbidden ? "champ résolu serveur, interdit au client (P13)" : "champ non autorisé (P13)",
          ),
        );
      }
    } else {
      violations.push(violation("INVALID_VALUE", path, issue.message));
    }
  }
  return { ok: false, violations };
}

/** Cohérence d'une configuration avec le catalogue (références actives uniquement). Aucune valeur n'est corrigée. */
export function validateConfigurationAgainstCatalog(config: Configuration, catalog: Catalog): DomainViolation[] {
  const out: DomainViolation[] = [];
  const product = catalog.products.find((p) => p.id === config.productId);
  if (!product || product.statut !== "active") {
    out.push(violation("PRODUCT_NOT_AVAILABLE", "productId", "produit inconnu ou inactif"));
  }
  const reference = catalog.references.find((r) => r.id === config.materialVariantId);
  if (!reference || reference.statut !== "active") {
    out.push(violation("REFERENCE_NOT_AVAILABLE", "materialVariantId", "référence inconnue ou inactive"));
  } else {
    if (product && !product.allowedVariantIds.includes(reference.id)) {
      out.push(violation("REFERENCE_NOT_ALLOWED_FOR_PRODUCT", "materialVariantId", "référence non proposée pour ce produit"));
    }
    if (!reference.thicknessIds.includes(config.thicknessId)) {
      out.push(violation("THICKNESS_NOT_AVAILABLE_FOR_REFERENCE", "thicknessId", "épaisseur non disponible pour la référence"));
    }
  }
  if (config.format.mode === "standard") {
    const formatId = config.format.formatId;
    const format = catalog.formats.find((f) => f.id === formatId);
    if (!format || format.statut !== "active" || (product && !product.allowedFormats.includes(formatId))) {
      out.push(violation("FORMAT_NOT_AVAILABLE", "format.formatId", "format standard indisponible"));
    }
  }
  if (product) {
    const rules = catalog.mountingRules.find((m) => m.id === product.mountingRulesId);
    if (!rules || !rules.allowedCounts.includes(config.mounting.count)) {
      out.push(violation("MOUNTING_COUNT_NOT_ALLOWED", "mounting.count", "nombre de trous non autorisé"));
    }
    const text = config.design.text;
    if (text && !product.allowedFonts.includes(text.fontId)) {
      out.push(violation("FONT_NOT_ALLOWED", "design.text.fontId", "police non autorisée"));
    }
    if (text && !product.allowedLayouts.includes(text.layoutId)) {
      out.push(violation("LAYOUT_NOT_ALLOWED", "design.text.layoutId", "composition non autorisée"));
    }
  }
  return out;
}
