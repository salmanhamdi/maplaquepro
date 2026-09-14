// Moteur de fabricabilité (Annexe B, étapes 0 à 7). Fonction pure, autorité côté serveur (§16bis).
// L'étape 8 (artwork et texte) n'est pas couverte : elle dépend de VR-08, VR-27 et ART1-DOC (ouverts).
// Aucune valeur n'est présumée : une propriété À VALIDER rencontrée ⇒ VALIDATION_REQUIRED.
import type { Catalog } from "./catalog";
import { type Configuration, parseConfiguration, validateConfigurationAgainstCatalog } from "./configuration";
import { evaluerDimensions, evaluerPoses, type PoseOperation } from "./fabricabilite-machine";
import type { PlaqueMm } from "./geometry";
import { generateHoles, type Hole, resolveMountingRules } from "./holes";
import { type ResolvedOperation, resolveWorkflow } from "./production";
import { type DomainViolation, violation } from "./violation";

export type Fabricable = {
  ok: true;
  configuration: Configuration;
  plaque: PlaqueMm & { thicknessMm: number; formatMode: "standard" | "custom"; formatId?: string };
  operations: ResolvedOperation[];
  posesParOperation: PoseOperation[];
  holes: Hole[];
};

export type NonFabricable = {
  ok: false;
  /** `request` : requête non conforme (P13) ; `catalog` : résolution impossible ; `fabrication` : contraintes non satisfaites. */
  stage: "request" | "catalog" | "fabrication";
  violations: DomainViolation[];
};

export type FabricabilityResult = Fabricable | NonFabricable;

export function evaluateFabricability(input: unknown, catalog: Catalog): FabricabilityResult {
  // 0. Contrat de requête (P13) : rejet typé, rien n'est ignoré ni recalculé
  const parsed = parseConfiguration(input);
  if (!parsed.ok) return { ok: false, stage: "request", violations: parsed.violations };
  const config = parsed.value;

  // 1. Catalogue
  const catalogue = validateConfigurationAgainstCatalog(config, catalog);
  if (catalogue.length > 0) return { ok: false, stage: "catalog", violations: catalogue };
  const reference = catalog.references.find((r) => r.id === config.materialVariantId)!;
  const thickness = catalog.thicknesses.find((t) => t.id === config.thicknessId);
  const workflow = catalog.workflows.find((w) => w.id === reference.productionWorkflowId);
  if (!thickness || !workflow) {
    return { ok: false, stage: "catalog", violations: [violation("CATALOG_RESOLUTION_FAILED", "catalog", "épaisseur ou workflow introuvable")] };
  }
  const dimensionRules = catalog.dimensionRules.find((d) => reference.dimensionRulesIds.includes(d.id) && d.variantId === reference.id && d.thicknessId === config.thicknessId);
  const mountingRules = catalog.mountingRules.find((m) => m.id === reference.mountingRulesId);

  // 2. Workflow (encre dérivée, INVALID_INK_POLICY)
  const resolu = resolveWorkflow(workflow, reference);
  if (!resolu.ok) return { ok: false, stage: "fabrication", violations: resolu.violations };

  // 3. Géométrie de la plaque : valeurs reçues, jamais modifiées
  let plaque: Fabricable["plaque"];
  if (config.format.mode === "standard") {
    const formatId = config.format.formatId;
    const format = catalog.formats.find((f) => f.id === formatId)!;
    plaque = { widthMm: format.widthMm, heightMm: format.heightMm, cornerRadiusMm: format.cornerRadiusMm, thicknessMm: thickness.mm, formatMode: "standard", formatId };
  } else {
    // MVP = rectangle (§7.4) : rayon non fourni ⇒ coins droits.
    const { widthMm, heightMm, cornerRadiusMm = 0 } = config.format;
    plaque = { widthMm, heightMm, cornerRadiusMm, thicknessMm: thickness.mm, formatMode: "custom" };
  }

  const violations: DomainViolation[] = [];

  // 4-5. Opérations et orientation de pose, sur tout le workflow
  const poses = evaluerPoses(workflow, catalog.machines, plaque.widthMm, plaque.heightMm);
  if (!poses.ok) violations.push(...poses.violations);

  // 6. Dimensions (référence × épaisseur)
  if (!dimensionRules) {
    violations.push(violation("VALIDATION_REQUIRED", `references.${reference.id}.dimensionRulesIds`, "aucune règle de dimensions pour cette épaisseur (VR-25)"));
  } else {
    violations.push(...evaluerDimensions(dimensionRules, plaque));
  }

  // 7. Trous : valeurs reçues validées, jamais adaptées (G.5)
  let holes: Hole[] = [];
  if (config.mounting.count > 0) {
    if (!mountingRules) {
      violations.push(violation("MOUNTING_RULES_MISSING", `references.${reference.id}.mountingRulesId`, "règles de trous introuvables"));
    } else {
      const regles = resolveMountingRules(mountingRules, { variantId: reference.id, thicknessId: config.thicknessId });
      if (!regles.ok) {
        violations.push(...regles.violations);
      } else {
        const generes = generateHoles(config.mounting, plaque, regles.value);
        if (generes.ok) holes = generes.value;
        else violations.push(...generes.violations);
      }
    }
  }

  if (violations.length > 0 || !poses.ok) return { ok: false, stage: "fabrication", violations };
  return { ok: true, configuration: config, plaque, operations: resolu.operations, posesParOperation: poses.poses, holes };
}
