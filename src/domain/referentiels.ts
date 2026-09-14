// Référentiels décidés (Master Plan v1.5 §4.1, §7.2, §7.5 ; P3). Noms techniques indicatifs (A-1).
import { z } from "zod";

export const MACHINE_IDS = ["SPEEDY_400", "ARTISJET_3000U", "FIBER_50W", "UV_5W"] as const;
export const machineIdSchema = z.enum(MACHINE_IDS);
export type MachineId = z.infer<typeof machineIdSchema>;

export const OPERATION_TYPES = ["laser_engrave", "laser_cut", "uv_print"] as const;
export const operationTypeSchema = z.enum(OPERATION_TYPES);
export type ProductionOperationType = z.infer<typeof operationTypeSchema>;

export const THICKNESS_IDS = ["th_0_8", "th_1_6", "th_3_0", "th_5_0"] as const;
export const thicknessIdSchema = z.enum(THICKNESS_IDS);
export type ThicknessId = z.infer<typeof thicknessIdSchema>;

/** 4 familles (P3). */
export const MATERIAL_FAMILIES = ["trolase", "trolase_metallic", "plexiglass", "troglass_metallic"] as const;
export const materialFamilySchema = z.enum(MATERIAL_FAMILIES);
export type MaterialFamily = z.infer<typeof materialFamilySchema>;

/** 3 procédés (P3). */
export const PROCEDES = ["gravure_laser", "decoupe_impression_uv", "gravure_envers_uv_noir"] as const;
export const procedeSchema = z.enum(PROCEDES);
export type Procede = z.infer<typeof procedeSchema>;

export const WORKFLOW_IDS = [
  "TROLASE_ENGRAVE",
  "TROLASE_METALLIC_ENGRAVE",
  "PLEXIGLASS_UV",
  "TROGLASS_METALLIC_HYBRID",
] as const;
export const workflowIdSchema = z.enum(WORKFLOW_IDS);
export type ProductionWorkflowId = z.infer<typeof workflowIdSchema>;

export const STATUTS = ["active", "validation_required", "draft"] as const;
export const statutSchema = z.enum(STATUTS);
export type Statut = z.infer<typeof statutSchema>;

export const COTES = ["face", "envers"] as const;
export const coteSchema = z.enum(COTES);
export type Cote = z.infer<typeof coteSchema>;

export const CONTRACT_IDS = ["PRODUCTION_SVG_CONTRACT_v1", "PRODUCTION_UV_CONTRACT_v1", "HYBRID_TROGLASS_METALLIC"] as const;
export const contractIdSchema = z.enum(CONTRACT_IDS);
export type ContractId = z.infer<typeof contractIdSchema>;

/** Workflow de chaque famille : le procédé vient de la référence, jamais d'une couleur (§6, §7.2). */
export const WORKFLOW_BY_FAMILY: Readonly<Record<MaterialFamily, ProductionWorkflowId>> = {
  trolase: "TROLASE_ENGRAVE",
  trolase_metallic: "TROLASE_METALLIC_ENGRAVE",
  plexiglass: "PLEXIGLASS_UV",
  troglass_metallic: "TROGLASS_METALLIC_HYBRID",
};

/** Procédé de chaque workflow (§7.2, P3). */
export const PROCEDE_BY_WORKFLOW: Readonly<Record<ProductionWorkflowId, Procede>> = {
  TROLASE_ENGRAVE: "gravure_laser",
  TROLASE_METALLIC_ENGRAVE: "gravure_laser",
  PLEXIGLASS_UV: "decoupe_impression_uv",
  TROGLASS_METALLIC_HYBRID: "gravure_envers_uv_noir",
};

/** Seuil applicatif de protection du runtime pour le MVP (décision Supervisor, ADR-0003) — pas une limite d'hébergeur. */
export const MAX_PIXELS_MVP = 50_000_000;

/** VR-08 (FACT ATELIER F1-F2, arbitrage Supervisor A1/A3) : hauteur de la boîte englobante d'un caractère ≥ 1 mm. */
export const MIN_CHARACTER_BOUNDING_BOX_HEIGHT_MM = 1;

/** VR-08 (FACT ATELIER F3, arbitrage Supervisor A4) : épaisseur minimale de trait pour la gravure laser = 1 mm. */
export const MIN_STROKE_WIDTH_MM = 1;

/**
 * VR-25 (FACT ATELIER 15/09/2026, autorisation Supervisor) : bornes de dimensions de plaque par famille, en mm, toutes
 * épaisseurs. Règle distincte des capacités machine (§4.1) ; le panneau fournisseur 600 × 300 (approvisionnement) n'est
 * pas modélisé. `deuxOrientations` : la borne est satisfaite si la plaque l'est tel quel ou tournée.
 */
export const BORNES_DIMENSIONS_VR25: Readonly<
  Record<MaterialFamily, { minWidthMm: number; minHeightMm: number; maxWidthMm: number; maxHeightMm: number; deuxOrientations: boolean }>
> = {
  trolase: { minWidthMm: 10, minHeightMm: 10, maxWidthMm: 594, maxHeightMm: 294, deuxOrientations: false },
  trolase_metallic: { minWidthMm: 10, minHeightMm: 10, maxWidthMm: 594, maxHeightMm: 294, deuxOrientations: false },
  plexiglass: { minWidthMm: 10, minHeightMm: 10, maxWidthMm: 347, maxHeightMm: 490, deuxOrientations: true },
  troglass_metallic: { minWidthMm: 10, minHeightMm: 10, maxWidthMm: 347, maxHeightMm: 490, deuxOrientations: true },
};

/** Version du contrat de configuration client (§6). */
export const CONFIGURATION_VERSION = 4;
