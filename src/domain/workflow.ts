// Workflows de production (§7.2, P3, P7 D5). Aucune contrainte machine (dimensions) n'est portée par un workflow (R30).
import { z } from "zod";
import type { MachineCapability } from "./machine";
import {
  contractIdSchema,
  coteSchema,
  machineIdSchema,
  operationTypeSchema,
  PROCEDE_BY_WORKFLOW,
  procedeSchema,
  workflowIdSchema,
} from "./referentiels";
import { type DomainViolation, violation } from "./violation";

export const productionOperationSchema = z.strictObject({
  sequence: z.number().int().positive(),
  type: operationTypeSchema,
  machineId: machineIdSchema,
  cote: coteSchema,
  /** uv_print uniquement ; dérivée de la politique d'impression de la référence, jamais saisie (P7 D5). */
  encre: z.literal("derivee_de_la_politique_d_impression").optional(),
  /** v1.6 : `always` pour les découpes des quatre workflows (VR-34 close, P3, E-1). Champ et valeurs conservés (V-5). */
  condition: z.enum(["always", "if_geometry_requires", "A_VALIDER"]),
});
export type ProductionOperation = z.infer<typeof productionOperationSchema>;

export const productionWorkflowSchema = z.strictObject({
  id: workflowIdSchema,
  procede: procedeSchema,
  version: z.string().min(1),
  operations: z.array(productionOperationSchema).min(1),
  artworkRulesId: z.string().min(1),
  contractIds: z.array(contractIdSchema).min(1),
});
export type ProductionWorkflow = z.infer<typeof productionWorkflowSchema>;

export const PRODUCTION_WORKFLOWS: readonly ProductionWorkflow[] = [
  {
    id: "TROLASE_ENGRAVE",
    procede: "gravure_laser",
    version: "2",
    // v1.6 §7.2 : gravure puis découpe systématique, même session (VR-34 close ; C5).
    operations: [
      { sequence: 1, type: "laser_engrave", machineId: "SPEEDY_400", cote: "face", condition: "always" },
      { sequence: 2, type: "laser_cut", machineId: "SPEEDY_400", cote: "face", condition: "always" },
    ],
    artworkRulesId: "artwork-TROLASE_ENGRAVE",
    contractIds: ["PRODUCTION_SVG_CONTRACT_v1"],
  },
  {
    id: "TROLASE_METALLIC_ENGRAVE",
    procede: "gravure_laser",
    version: "2",
    // v1.6 §7.2 : gravure puis découpe systématique (VR-34 close). Machine et côté de la découpe : valeurs v1.5 inchangées,
    // aucune précision ajoutée par copie du TroLase (V-1, non établis par les faits atelier).
    operations: [
      { sequence: 1, type: "laser_engrave", machineId: "SPEEDY_400", cote: "face", condition: "always" },
      { sequence: 2, type: "laser_cut", machineId: "SPEEDY_400", cote: "face", condition: "always" },
    ],
    artworkRulesId: "artwork-TROLASE_METALLIC_ENGRAVE",
    contractIds: ["PRODUCTION_SVG_CONTRACT_v1"],
  },
  {
    id: "PLEXIGLASS_UV",
    procede: "decoupe_impression_uv", // identifiant historique conservé ; procédé normatif : impression UV à l'envers → découpe (v1.6)
    version: "2",
    // v1.6 §7.2 (E-1, P3, V-2, V-3) : impression UV à l'envers en miroir puis découpe systématique. TroGlass Clear = Plexiglass.
    // Découpe côté envers (face imprimée vers le laser, V-2) : information de fabrication, pas une transformation miroir.
    operations: [
      {
        sequence: 1,
        type: "uv_print",
        machineId: "ARTISJET_3000U",
        cote: "envers",
        encre: "derivee_de_la_politique_d_impression",
        condition: "always",
      },
      { sequence: 2, type: "laser_cut", machineId: "SPEEDY_400", cote: "envers", condition: "always" },
    ],
    artworkRulesId: "artwork-PLEXIGLASS_UV",
    contractIds: ["PRODUCTION_SVG_CONTRACT_v1", "PRODUCTION_UV_CONTRACT_v1"],
  },
  {
    id: "TROGLASS_METALLIC_HYBRID",
    procede: "gravure_envers_uv_noir",
    version: "2",
    // v1.6 §7.2 (P3) : gravure envers → découpe systématique → UV noir envers ; workflow distinct de PLEXIGLASS_UV.
    operations: [
      { sequence: 1, type: "laser_engrave", machineId: "SPEEDY_400", cote: "envers", condition: "always" },
      { sequence: 2, type: "laser_cut", machineId: "SPEEDY_400", cote: "envers", condition: "always" },
      {
        sequence: 3,
        type: "uv_print",
        machineId: "ARTISJET_3000U",
        cote: "envers",
        encre: "derivee_de_la_politique_d_impression",
        condition: "always",
      },
    ],
    artworkRulesId: "artwork-TROGLASS_METALLIC_HYBRID",
    contractIds: ["PRODUCTION_SVG_CONTRACT_v1", "PRODUCTION_UV_CONTRACT_v1", "HYBRID_TROGLASS_METALLIC"],
  },
];

/** Invariants d'un workflow : procédé cohérent, séquence 1..n, encre sur uv_print uniquement, opérations réalisables. */
export function validateWorkflow(workflow: ProductionWorkflow, machines: readonly MachineCapability[]): DomainViolation[] {
  const out: DomainViolation[] = [];
  const base = `workflows.${workflow.id}`;
  if (PROCEDE_BY_WORKFLOW[workflow.id] !== workflow.procede) {
    out.push(violation("WORKFLOW_PROCEDE_MISMATCH", `${base}.procede`, "procédé incohérent avec le workflow (P3)"));
  }
  workflow.operations.forEach((op, index) => {
    const path = `${base}.operations.${index}`;
    if (op.sequence !== index + 1) {
      out.push(violation("WORKFLOW_SEQUENCE_INVALID", `${path}.sequence`, "séquence attendue 1..n dans l'ordre"));
    }
    if (op.type === "uv_print" && op.encre === undefined) {
      out.push(violation("UV_OPERATION_WITHOUT_DERIVED_INK", `${path}.encre`, "impression UV sans encre dérivée (P7 D5)"));
    }
    if (op.type !== "uv_print" && op.encre !== undefined) {
      out.push(violation("INK_ON_NON_UV_OPERATION", `${path}.encre`, "encre sur une opération non UV (P7 D5)"));
    }
    const machine = machines.find((m) => m.machineId === op.machineId);
    if (!machine) {
      out.push(violation("MACHINE_UNKNOWN", `${path}.machineId`, "machine sans capacité déclarée"));
    } else if (!machine.operationTypes.includes(op.type)) {
      out.push(violation("MACHINE_CANNOT_PERFORM_OPERATION", `${path}.type`, "opération non réalisable par la machine"));
    }
  });
  return out;
}
