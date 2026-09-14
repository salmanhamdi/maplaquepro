// Catalogue déclaratif versionné (§7). Aucune référence commerciale n'est inventée : le catalogue initial
// ne contient que les référentiels décidés ; tout le reste est À VALIDER ou absent.
import { z } from "zod";
import { ARTWORK_RULES, artworkRulesSchema, ENGRAVE_ONLY_WORKFLOWS } from "./artwork";
import { statutContratSchema } from "./contrats";
import { dimensionRulesSchema, formatSchema } from "./dimensions";
import { aValider } from "./etat";
import { MACHINE_CAPABILITIES, machineCapabilitySchema } from "./machine";
import { mountingRulesSchema, DEFAULT_EDGE_DISTANCE_TARGET_MM } from "./mounting";
import { priceRulesSchema } from "./pricing";
import { productSchema } from "./product";
import { materialVariantSchema, type MaterialVariant, validateReference } from "./reference";
import { MAX_PIXELS_MVP, THICKNESS_IDS, WORKFLOW_IDS } from "./referentiels";
import { THICKNESSES, thicknessSchema } from "./thickness";
import { type DomainViolation, violation } from "./violation";
import { PRODUCTION_WORKFLOWS, productionWorkflowSchema, validateWorkflow } from "./workflow";

export const catalogSchema = z.strictObject({
  catalogVersion: z.string().min(1),
  thicknesses: z.array(thicknessSchema),
  machines: z.array(machineCapabilitySchema),
  workflows: z.array(productionWorkflowSchema),
  artworkRules: z.array(artworkRulesSchema),
  mountingRules: z.array(mountingRulesSchema),
  dimensionRules: z.array(dimensionRulesSchema),
  formats: z.array(formatSchema),
  references: z.array(materialVariantSchema),
  products: z.array(productSchema),
  priceRules: z.array(priceRulesSchema),
  productionContracts: z.array(statutContratSchema),
});
export type Catalog = z.infer<typeof catalogSchema>;

const doublons = (ids: string[]) => ids.filter((id, i) => ids.indexOf(id) !== i);

export function validateCatalog(catalog: Catalog): DomainViolation[] {
  const out: DomainViolation[] = [];

  // INV-17 : 4 épaisseurs, 4 workflows exactement
  const thicknessIds = catalog.thicknesses.map((t) => t.id);
  if (thicknessIds.length !== THICKNESS_IDS.length || !THICKNESS_IDS.every((id) => thicknessIds.includes(id))) {
    out.push(violation("THICKNESS_REFERENTIAL_INVALID", "thicknesses", "exactement 4 épaisseurs référentielles attendues"));
  }
  const workflowIds = catalog.workflows.map((w) => w.id);
  if (workflowIds.length !== WORKFLOW_IDS.length || !WORKFLOW_IDS.every((id) => workflowIds.includes(id))) {
    out.push(violation("WORKFLOW_REFERENTIAL_INVALID", "workflows", "exactement 4 workflows attendus"));
  }

  for (const [nom, ids] of [
    ["references", catalog.references.map((r) => r.id)],
    ["products", catalog.products.map((p) => p.id)],
    ["formats", catalog.formats.map((f) => f.id)],
    ["mountingRules", catalog.mountingRules.map((m) => m.id)],
    ["artworkRules", catalog.artworkRules.map((a) => a.id)],
    ["dimensionRules", catalog.dimensionRules.map((d) => d.id)],
  ] as const) {
    for (const id of doublons([...ids])) out.push(violation("DUPLICATE_ID", `${nom}.${id}`, "identifiant en double"));
  }

  for (const workflow of catalog.workflows) {
    out.push(...validateWorkflow(workflow, catalog.machines));
    const rules = catalog.artworkRules.find((a) => a.id === workflow.artworkRulesId);
    if (!rules || rules.workflowId !== workflow.id) {
      out.push(violation("ARTWORK_RULES_MISSING", `workflows.${workflow.id}.artworkRulesId`, "règles d'artwork absentes ou incohérentes"));
    }
  }

  // VR-28 (décision Supervisor) : gravure seule = vectoriel exclusivement, tout raster rejeté
  for (const rules of catalog.artworkRules) {
    if (ENGRAVE_ONLY_WORKFLOWS.includes(rules.workflowId) && !(rules.rasterPolicy.etat === "DEFINIE" && rules.rasterPolicy.valeur === "reject")) {
      out.push(violation("ENGRAVE_WORKFLOW_RASTER_NOT_REJECTED", `artworkRules.${rules.id}.rasterPolicy`, "gravure : raster rejeté (VR-28)"));
    }
  }

  // INV-19
  for (const rules of catalog.artworkRules) {
    if (rules.maxPixels !== MAX_PIXELS_MVP) {
      out.push(violation("MAX_PIXELS_NOT_MVP_VALUE", `artworkRules.${rules.id}.maxPixels`, "maxPixels MVP = 50 000 000"));
    }
  }

  for (const ref of catalog.references) {
    out.push(...validateReference(ref));
    const base = `references.${ref.id}`;
    if (!catalog.mountingRules.some((m) => m.id === ref.mountingRulesId)) {
      out.push(violation("MOUNTING_RULES_MISSING", `${base}.mountingRulesId`, "règles de trous introuvables"));
    }
    if (!catalog.artworkRules.some((a) => a.id === ref.artworkRulesId && a.workflowId === ref.productionWorkflowId)) {
      out.push(violation("ARTWORK_RULES_MISSING", `${base}.artworkRulesId`, "règles d'artwork introuvables pour le workflow"));
    }
    for (const id of ref.dimensionRulesIds) {
      if (!catalog.dimensionRules.some((d) => d.id === id && d.variantId === ref.id)) {
        out.push(violation("DIMENSION_RULES_MISSING", `${base}.dimensionRulesIds`, `règles de dimensions ${id} introuvables`));
      }
    }
  }

  for (const product of catalog.products) {
    const base = `products.${product.id}`;
    for (const id of product.allowedVariantIds) {
      if (!catalog.references.some((r) => r.id === id)) out.push(violation("REFERENCE_MISSING", `${base}.allowedVariantIds`, `référence ${id} introuvable`));
    }
    for (const id of product.allowedFormats) {
      if (!catalog.formats.some((f) => f.id === id)) out.push(violation("FORMAT_MISSING", `${base}.allowedFormats`, `format ${id} introuvable`));
    }
    if (!catalog.mountingRules.some((m) => m.id === product.mountingRulesId)) {
      out.push(violation("MOUNTING_RULES_MISSING", `${base}.mountingRulesId`, "règles de trous introuvables"));
    }
  }

  return out;
}

/** Seules les références actives sont exposées (§7). */
export const activeReferences = (catalog: Catalog): MaterialVariant[] => catalog.references.filter((r) => r.statut === "active");

/** Catalogue initial : référentiels décidés uniquement ; aucune référence, aucun produit, aucun tarif. */
export const INITIAL_CATALOG: Catalog = {
  catalogVersion: "0.1.0",
  thicknesses: [...THICKNESSES],
  machines: [...MACHINE_CAPABILITIES],
  workflows: [...PRODUCTION_WORKFLOWS],
  artworkRules: [...ARTWORK_RULES],
  mountingRules: [
    {
      id: "mounting-default",
      allowedCounts: [0, 2, 4],
      defaultEdgeDistanceTargetMm: DEFAULT_EDGE_DISTANCE_TARGET_MM,
      decimals: 1,
      holeDiameterMm: aValider(),
      minEdgeDistanceMm: aValider(),
      holeKeepOutMarginMm: aValider(),
      edgeDistanceSemantics: aValider(),
      twoHolesDisposition: aValider(),
      cornerRadiusClearanceMm: aValider(),
      statut: "validation_required",
    },
  ],
  dimensionRules: [],
  formats: [],
  references: [],
  products: [],
  priceRules: [],
  productionContracts: [],
};
