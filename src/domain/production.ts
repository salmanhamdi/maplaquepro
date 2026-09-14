// Résolution du workflow (Annexe B, étape 2) et plan des artefacts de production (§13, §14).
// Les artefacts sont sélectionnés à partir du workflow, jamais de la couleur. Le contenu UV reste À VALIDER (VR-33) :
// l'artefact UV est `contract_pending`. Aucune transformation de fichier n'est déduite de l'orientation de pose (VR-41).
import { z } from "zod";
import { etatSchema } from "./etat";
import type { MaterialVariant } from "./reference";
import { coteSchema, type Cote, type ProductionWorkflowId } from "./referentiels";
import { type DomainViolation, violation } from "./violation";
import type { ProductionOperation, ProductionWorkflow } from "./workflow";

export type Encre = "noir_uniquement" | "couleur";

export type ResolvedOperation = Omit<ProductionOperation, "encre"> & { encre: Encre | null };

export type ResultatWorkflow = { ok: true; operations: ResolvedOperation[] } | { ok: false; violations: DomainViolation[] };

/**
 * Encre de chaque impression UV dérivée de la politique d'impression de la référence (P7 D5) ; aucune encre sur les
 * opérations laser. Politique À VALIDER ⇒ VALIDATION_REQUIRED ; politique « aucune » avec une impression UV ⇒ rejet.
 */
export function resolveWorkflow(workflow: ProductionWorkflow, reference: MaterialVariant): ResultatWorkflow {
  const violations: DomainViolation[] = [];
  if (reference.productionWorkflowId !== workflow.id) {
    violations.push(violation("WORKFLOW_REFERENCE_MISMATCH", "productionWorkflowId", "le workflow vient de la référence (§6)"));
  }
  const politique = reference.politiqueImpression.valeur;
  const operations = [...workflow.operations]
    .sort((a, b) => a.sequence - b.sequence)
    .map((op): ResolvedOperation => {
      const { encre: _derivee, ...reste } = op;
      if (op.type !== "uv_print") return { ...reste, encre: null };
      if (politique.etat !== "DEFINIE") {
        violations.push(violation("VALIDATION_REQUIRED", `references.${reference.id}.politiqueImpression.valeur`, "politique d'impression non validée"));
        return { ...reste, encre: null };
      }
      if (politique.valeur === "aucune") {
        violations.push(violation("PRINT_OPERATION_WITHOUT_PRINT_POLICY", `workflows.${workflow.id}.operations.${op.sequence}`, "impression UV avec politique « aucune »"));
        return { ...reste, encre: null };
      }
      return { ...reste, encre: politique.valeur };
    });
  if (reference.family === "troglass_metallic" && operations.some((o) => o.encre === "couleur")) {
    violations.push(violation("INVALID_INK_POLICY", `references.${reference.id}.politiqueImpression.valeur`, "TroGlass : encre noir uniquement (§14.3)"));
  }
  return violations.length > 0 ? { ok: false, violations } : { ok: true, operations };
}

/**
 * Une encre demandée explicitement est un champ interdit côté requête (P13) ; côté serveur, toute encre couleur
 * pour TroGlass est rejetée explicitement, jamais corrigée (§14.3).
 */
export function checkInkForReference(reference: MaterialVariant, encre: Encre): DomainViolation[] {
  return reference.family === "troglass_metallic" && encre !== "noir_uniquement"
    ? [violation("INVALID_INK_POLICY", "encre", "TroGlass : encre noir uniquement (§14.3)")]
    : [];
}

// ---------- Artefacts (Annexe A, notation indicative) ----------

export const miroirSchema = z.enum(["none", "x"]);
export type Miroir = z.infer<typeof miroirSchema>;

/** Miroir X côté envers (§13) : x' = W − x, depuis la géométrie canonique vue face. */
export const mirrorX = (xMm: number, widthMm: number): number => widthMm - xMm;
export const miroirPourCote = (cote: Cote): Miroir => (cote === "envers" ? "x" : "none");

export const laserArtifactSchema = z.strictObject({
  kind: z.literal("laser"),
  contractId: z.literal("PRODUCTION_SVG_CONTRACT_v1"),
  cote: coteSchema,
  miroir: miroirSchema,
  svg: z.string().min(1),
  hash: z.string().min(1),
});

export const uvArtifactSchema = z.strictObject({
  kind: z.literal("uv"),
  contractId: z.literal("PRODUCTION_UV_CONTRACT_v1"),
  status: z.enum(["contract_defined", "contract_pending"]),
  cote: coteSchema,
  /** §14.3 (arbitrage D1) : miroir porté par l'artefact UV, identique au laser ; issu du plan, sans effet sur le contenu UV (VR-33). */
  miroir: miroirSchema,
  encre: z.enum(["noir_uniquement", "couleur"]),
  canonicalPrintLayer: z.unknown(),
  /** Format VR-33 : absent tant que le contrat UV n'est pas défini. */
  payload: z.unknown().optional(),
  hash: z.string().min(1),
});

export const hybridArtifactSchema = z.strictObject({
  kind: z.literal("hybrid"),
  contractId: z.literal("HYBRID_TROGLASS_METALLIC"),
  laserArtifact: laserArtifactSchema,
  uvArtifact: uvArtifactSchema,
  metadata: z.strictObject({
    sequence: z.array(z.number().int().positive()).min(1),
    registration: etatSchema(z.literal("shared_origin_mirrored_x")),
    batId: z.string().min(1),
    jobRef: z.string().min(1).optional(),
  }),
});

export const productionArtifactSchema = z.discriminatedUnion("kind", [laserArtifactSchema, uvArtifactSchema, hybridArtifactSchema]);
export type ProductionArtifact = z.infer<typeof productionArtifactSchema>;

// ---------- Plan des artefacts (sélection par workflow, §13) ----------

export type GroupeLaser = "ENGRAVE" | "CUT" | "HOLES";

export type PlanLaser = { kind: "laser"; cote: Cote; miroir: Miroir; groupes: GroupeLaser[] };
export type PlanUV = { kind: "uv"; cote: Cote; miroir: Miroir; encre: Encre; status: "contract_pending" };
export type PlanArtefact = PlanLaser | PlanUV | { kind: "hybrid"; laser: PlanLaser; uv: PlanUV; sequence: number[] };

export type ResultatPlan = { ok: true; plan: PlanArtefact[] } | { ok: false; violations: DomainViolation[] };

const holes = (count: number): GroupeLaser[] => (count > 0 ? ["HOLES"] : []);

/**
 * Artefacts attendus pour un workflow résolu (§13). HOLES présent si count > 0 (§14.1).
 * TroLase / TroLase Metallic : la présence de CUT dépend de VR-34 (§13) ⇒ VALIDATION_REQUIRED tant que non confirmée.
 */
export function planArtifacts(workflowId: ProductionWorkflowId, operations: readonly ResolvedOperation[], holeCount: number): ResultatPlan {
  const uv = operations.find((o) => o.type === "uv_print");
  const cut = operations.find((o) => o.type === "laser_cut");
  switch (workflowId) {
    case "TROLASE_ENGRAVE":
    case "TROLASE_METALLIC_ENGRAVE": {
      if (!cut || cut.condition === "A_VALIDER") {
        return { ok: false, violations: [violation("VALIDATION_REQUIRED", `workflows.${workflowId}.laser_cut`, "découpe TroLase non confirmée (VR-34)")] };
      }
      return { ok: true, plan: [{ kind: "laser", cote: "face", miroir: "none", groupes: ["ENGRAVE", "CUT", ...holes(holeCount)] }] };
    }
    case "PLEXIGLASS_UV": {
      if (!uv?.encre) return { ok: false, violations: [violation("VALIDATION_REQUIRED", "encre", "encre UV non résolue")] };
      return {
        ok: true,
        plan: [
          { kind: "laser", cote: "face", miroir: "none", groupes: ["CUT", ...holes(holeCount)] },
          { kind: "uv", cote: "face", miroir: "none", encre: uv.encre, status: "contract_pending" },
        ],
      };
    }
    case "TROGLASS_METALLIC_HYBRID": {
      if (uv?.encre !== "noir_uniquement") {
        return { ok: false, violations: [violation("INVALID_INK_POLICY", "encre", "TroGlass : encre noir uniquement (§14.3)")] };
      }
      return {
        ok: true,
        plan: [
          {
            kind: "hybrid",
            laser: { kind: "laser", cote: "envers", miroir: "x", groupes: ["ENGRAVE", "CUT", ...holes(holeCount)] },
            uv: { kind: "uv", cote: "envers", miroir: "x", encre: "noir_uniquement", status: "contract_pending" },
            sequence: operations.map((o) => o.sequence),
          },
        ],
      };
    }
  }
}
