// Spécification résolue (§6 ResolvedSpec, §15). Calculée serveur à partir d'une configuration fabricable ; figée dans le BAT.
// RÈGLE P7 : aucune propriété À VALIDER ne peut figurer dans une spécification destinée à un BAT validable.
// Hors tranche (dépendances ouvertes, isolées) : safe zone et designRulesVersion (VR-08), artwork normalisé (ART1-DOC), prix (VR-07).
import { z } from "zod";
import { colorSpecSchema } from "./apparence";
import { artworkRulesSchema } from "./artwork";
import type { Catalog } from "./catalog";
import type { Fabricable } from "./fabricabilite";
import { zoneMmSchema } from "./machine";
import {
  contractIdSchema,
  coteSchema,
  machineIdSchema,
  materialFamilySchema,
  operationTypeSchema,
  thicknessIdSchema,
  workflowIdSchema,
} from "./referentiels";
import { type DomainViolation, violation } from "./violation";

/** État résolu : SANS_OBJET ou DEFINIE ; À VALIDER impossible (P7). */
export function etatResoluSchema<T extends z.ZodType>(valeur: T) {
  return z.discriminatedUnion("etat", [
    z.strictObject({ etat: z.literal("SANS_OBJET") }),
    z.strictObject({ etat: z.literal("DEFINIE"), valeur }),
  ]);
}

const mm = z.number().positive();

export const resolvedSpecSchema = z.strictObject({
  product: z.strictObject({ id: z.string().min(1), slug: z.string().min(1), name: z.string().min(1) }),
  reference: z.strictObject({
    id: z.string().min(1),
    manufacturer: z.string().min(1),
    code: z.string().min(1),
    family: materialFamilySchema,
    label: z.string().min(1),
  }),
  thickness: z.strictObject({ id: thicknessIdSchema, mm }),
  plate: z.strictObject({
    widthMm: mm,
    heightMm: mm,
    cornerRadiusMm: z.number().nonnegative(),
    formatMode: z.enum(["standard", "custom"]),
    formatId: z.string().min(1).optional(),
  }),
  apparence: z.strictObject({
    couleurSurface: colorSpecSchema,
    finition: etatResoluSchema(z.string().min(1)),
    couleurRevelee: etatResoluSchema(colorSpecSchema),
  }),
  capaciteGravure: z.strictObject({ cote: etatResoluSchema(coteSchema) }),
  politiqueImpression: z.strictObject({
    valeur: z.enum(["aucune", "noir_uniquement", "couleur"]),
    cote: etatResoluSchema(coteSchema),
  }),
  workflow: z.strictObject({
    id: workflowIdSchema,
    version: z.string().min(1),
    operations: z
      .array(
        z.strictObject({
          sequence: z.number().int().positive(),
          type: operationTypeSchema,
          machineId: machineIdSchema,
          cote: coteSchema,
          encre: z.enum(["noir_uniquement", "couleur"]).nullable(),
          condition: z.enum(["always", "if_geometry_requires"]),
        }),
      )
      .min(1),
  }),
  posesParOperation: z
    .array(
      z.strictObject({
        operationSequence: z.number().int().positive(),
        machineId: machineIdSchema,
        zoneMachine: zoneMmSchema,
        orientationDePose: z.enum(["tel_quel", "tournee"]),
      }),
    )
    .min(1),
  /** null si aucun trou demandé. */
  mountingRules: z
    .strictObject({
      holeDiameterMm: mm,
      minEdgeDistanceMm: mm,
      holeKeepOutMarginMm: z.number().nonnegative(),
      edgeDistanceSemantics: z.enum(["edge_to_center", "edge_to_rim"]),
    })
    .nullable(),
  holes: z.array(z.strictObject({ cxMm: z.number(), cyMm: z.number(), diameterMm: mm })),
  /** null si aucun artwork placé (dépendance ART1-DOC isolée). */
  artworkRules: artworkRulesSchema.nullable(),
  catalogVersion: z.string().min(1),
  productionContractIds: z.array(contractIdSchema).min(1),
});
export type ResolvedSpec = z.infer<typeof resolvedSpecSchema>;

/** Règle P7 : chemins de toute propriété À VALIDER, à n'importe quelle profondeur. */
export function findPendingValues(value: unknown, path = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => findPendingValues(v, path ? `${path}.${i}` : String(i)));
  if (value === null || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  if (record.etat === "A_VALIDER") return [path || "(racine)"];
  return Object.entries(record).flatMap(([k, v]) => findPendingValues(v, path ? `${path}.${k}` : k));
}

export type ResultatSpec = { ok: true; spec: ResolvedSpec } | { ok: false; violations: DomainViolation[] };

const pending = (path: string) => violation("VALIDATION_REQUIRED", path, "propriété À VALIDER : BAT non validable (P7)");

/** Résout la spécification d'une configuration fabricable. Toute valeur À VALIDER rencontrée ⇒ VALIDATION_REQUIRED (P7). */
export function resolveSpec(fab: Fabricable, catalog: Catalog): ResultatSpec {
  const { configuration: config } = fab;
  const product = catalog.products.find((p) => p.id === config.productId);
  const ref = catalog.references.find((r) => r.id === config.materialVariantId);
  const workflow = ref && catalog.workflows.find((w) => w.id === ref.productionWorkflowId);
  if (!product || !ref || !workflow) {
    return { ok: false, violations: [violation("CATALOG_RESOLUTION_FAILED", "catalog", "produit, référence ou workflow introuvable")] };
  }

  const violations: DomainViolation[] = [];
  const base = `references.${ref.id}`;

  const artworkRules = config.design.artwork === null ? null : (catalog.artworkRules.find((a) => a.id === ref.artworkRulesId) ?? null);
  if (config.design.artwork !== null && artworkRules === null) {
    violations.push(violation("ARTWORK_RULES_MISSING", `${base}.artworkRulesId`, "règles d'artwork introuvables"));
  }

  let mountingRules: ResolvedSpec["mountingRules"] = null;
  if (config.mounting.count > 0) {
    const rules = catalog.mountingRules.find((m) => m.id === ref.mountingRulesId);
    const d = fab.holes[0]?.diameterMm;
    const { minEdgeDistanceMm: m, holeKeepOutMarginMm: k, edgeDistanceSemantics: s } = rules ?? {};
    if (d !== undefined && m?.etat === "DEFINIE" && k?.etat === "DEFINIE" && s?.etat === "DEFINIE") {
      mountingRules = { holeDiameterMm: d, minEdgeDistanceMm: m.valeur, holeKeepOutMarginMm: k.valeur, edgeDistanceSemantics: s.valeur };
    } else {
      violations.push(pending(`${base}.mountingRulesId`));
    }
  }

  const { manufacturer, reference: code, apparence, capaciteGravure, politiqueImpression } = ref;
  const brut = {
    manufacturer,
    code,
    couleurSurface: apparence.couleurSurface,
    politique: politiqueImpression.valeur,
    finition: apparence.finition,
    couleurRevelee: apparence.couleurRevelee,
    capaciteGravure: capaciteGravure.cote,
    politiqueCote: politiqueImpression.cote,
  };
  for (const p of findPendingValues(brut)) violations.push(pending(`${base}.${p}`));
  for (const p of findPendingValues(artworkRules)) violations.push(pending(`artworkRules.${artworkRules?.id}.${p}`));
  if (fab.operations.some((o) => o.condition === "A_VALIDER")) violations.push(pending(`workflows.${workflow.id}.operations`));
  if (violations.length > 0) return { ok: false, violations };
  // Propriétés dont la valeur est obligatoire dans la spécification : SANS_OBJET n'est pas résoluble.
  if (manufacturer.etat !== "DEFINIE" || code.etat !== "DEFINIE" || apparence.couleurSurface.etat !== "DEFINIE" || politiqueImpression.valeur.etat !== "DEFINIE") {
    return { ok: false, violations: [violation("RESOLVED_SPEC_INVALID", base, "propriété obligatoire non définie")] };
  }

  const { thicknessMm, formatMode, formatId, widthMm, heightMm, cornerRadiusMm } = fab.plaque;
  const candidat = {
    product: { id: product.id, slug: product.slug, name: product.name },
    reference: { id: ref.id, manufacturer: manufacturer.valeur, code: code.valeur, family: ref.family, label: ref.label },
    thickness: { id: config.thicknessId, mm: thicknessMm },
    plate: { widthMm, heightMm, cornerRadiusMm, formatMode, ...(formatId !== undefined ? { formatId } : {}) },
    apparence: { couleurSurface: apparence.couleurSurface.valeur, finition: apparence.finition, couleurRevelee: apparence.couleurRevelee },
    capaciteGravure: { cote: capaciteGravure.cote },
    politiqueImpression: { valeur: politiqueImpression.valeur.valeur, cote: politiqueImpression.cote },
    workflow: { id: workflow.id, version: workflow.version, operations: fab.operations },
    posesParOperation: fab.posesParOperation,
    mountingRules,
    holes: fab.holes,
    artworkRules,
    catalogVersion: catalog.catalogVersion,
    productionContractIds: workflow.contractIds,
  };

  // Garde finale P7 : le schéma résolu n'admet aucun À VALIDER.
  const parsed = resolvedSpecSchema.safeParse(candidat);
  if (!parsed.success) {
    return { ok: false, violations: parsed.error.issues.map((i) => violation("RESOLVED_SPEC_INVALID", i.path.map(String).join("."), i.message)) };
  }
  return { ok: true, spec: parsed.data };
}
