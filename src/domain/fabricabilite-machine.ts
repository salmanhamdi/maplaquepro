// Évaluation des opérations et des capacités machine (Annexe B, étapes 4 à 6 ; §7.4, P6).
// Le repère physique des axes des zones machine reste À ARBITRER (R-1) : la comparaison porte sur (widthMm, heightMm)
// tels que déclarés. Une orientation de pose tournée n'implique aucune transformation de fichier (P6 D4, VR-41).
import type { DimensionRules } from "./dimensions";
import { definie } from "./etat";
import type { MachineCapability, ZoneMm } from "./machine";
import { BORNES_DIMENSIONS_VR25, type MachineId, type MaterialFamily } from "./referentiels";
import { type DomainViolation, violation } from "./violation";
import type { ProductionOperation, ProductionWorkflow } from "./workflow";

export type OrientationDePose = "tel_quel" | "tournee";

export type PoseOperation = {
  operationSequence: number;
  machineId: MachineId;
  zoneMachine: ZoneMm;
  orientationDePose: OrientationDePose;
};

/** Zone machine applicable (Annexe B, étape 5) : printableArea, sinon workingArea. */
export const zoneMachine = (machine: MachineCapability): ZoneMm | undefined => machine.printableArea ?? machine.workingArea;

/**
 * Orientation de pose (P6) : « tel quel » par défaut lorsqu'il est admissible ; « tournée » seulement si autorisée ;
 * null si aucune n'est admissible. Déterministe, indépendant de l'ordre de traitement.
 */
export function orientationDePose(widthMm: number, heightMm: number, zone: ZoneMm, tourneeAutorisee: boolean): OrientationDePose | null {
  if (widthMm <= zone.widthMm && heightMm <= zone.heightMm) return "tel_quel";
  if (tourneeAutorisee && widthMm <= zone.heightMm && heightMm <= zone.widthMm) return "tournee";
  return null;
}

export type ResultatPoses = { ok: true; poses: PoseOperation[] } | { ok: false; violations: DomainViolation[] };

/**
 * Étapes 4 et 5 sur toutes les opérations du workflow (intersection, §7.4).
 * v1.6 : toutes les découpes des workflows sont systématiques (`always` ; VR-34 close, P3, E-1). Les valeurs conditionnelles
 * restent acceptées par le modèle (V-5) : `A_VALIDER` ⇒ VALIDATION_REQUIRED, jamais présumée ; `if_geometry_requires`
 * (aucun critère géométrique défini) ⇒ évaluée comme requise. Le côté d'opération n'intervient pas dans les capacités machine.
 */
export function evaluerPoses(workflow: ProductionWorkflow, machines: readonly MachineCapability[], widthMm: number, heightMm: number): ResultatPoses {
  const violations: DomainViolation[] = [];
  const poses: PoseOperation[] = [];
  const operations = [...workflow.operations].sort((a, b) => a.sequence - b.sequence);
  for (const op of operations) {
    const path = `workflows.${workflow.id}.operations.${op.sequence}`;
    if (op.condition === "A_VALIDER") {
      violations.push(violation("VALIDATION_REQUIRED", `${path}.condition`, "opération conditionnelle non validée"));
      continue;
    }
    const pose = evaluerOperation(op, machines, widthMm, heightMm, path);
    if ("code" in pose) violations.push(pose);
    else poses.push(pose);
  }
  return violations.length > 0 ? { ok: false, violations } : { ok: true, poses };
}

function evaluerOperation(op: ProductionOperation, machines: readonly MachineCapability[], widthMm: number, heightMm: number, path: string): PoseOperation | DomainViolation {
  const machine = machines.find((m) => m.machineId === op.machineId);
  if (!machine || machine.statut !== "validated" || !machine.operationTypes.includes(op.type)) {
    return violation("MACHINE_UNAVAILABLE", `${path}.machineId`, "machine non validée ou incapable de l'opération");
  }
  const zone = zoneMachine(machine);
  if (!zone) return violation("MACHINE_UNAVAILABLE", `${path}.machineId`, "zone machine non déclarée");
  const orientation = orientationDePose(widthMm, heightMm, zone, machine.orientationDePoseTourneeAutorisee);
  if (orientation === null) return violation("EXCEEDS_MACHINE", path, `dimensions hors zone ${machine.machineId}`);
  return { operationSequence: op.sequence, machineId: machine.machineId, zoneMachine: zone, orientationDePose: orientation };
}

/**
 * Étape 6 : bornes de dimensions (§7.4). Une borne À VALIDER ⇒ VALIDATION_REQUIRED (VR-25), jamais ignorée.
 * Une borne SANS_OBJET ou absente (optionnelle) ne contraint pas.
 */
export function evaluerDimensions(
  rules: Omit<DimensionRules, "variantId" | "thicknessId" | "statut">,
  plaque: { widthMm: number; heightMm: number; cornerRadiusMm: number },
  base = `dimensionRules.${rules.id}`,
): DomainViolation[] {
  const out: DomainViolation[] = [];
  const aire = plaque.widthMm * plaque.heightMm;
  const bornes = [
    ["minWidthMm", rules.minWidthMm, plaque.widthMm, "min"],
    ["maxWidthMm", rules.maxWidthMm, plaque.widthMm, "max"],
    ["minHeightMm", rules.minHeightMm, plaque.heightMm, "min"],
    ["maxHeightMm", rules.maxHeightMm, plaque.heightMm, "max"],
    ["minAreaMm2", rules.minAreaMm2, aire, "min"],
    ["maxAreaMm2", rules.maxAreaMm2, aire, "max"],
    ["minCornerRadiusMm", rules.minCornerRadiusMm, plaque.cornerRadiusMm, "min"],
    ["maxCornerRadiusMm", rules.maxCornerRadiusMm, plaque.cornerRadiusMm, "max"],
  ] as const;
  for (const [nom, borne, valeur, sens] of bornes) {
    if (!borne || borne.etat === "SANS_OBJET") continue;
    if (borne.etat === "A_VALIDER") {
      out.push(violation("VALIDATION_REQUIRED", `${base}.${nom}`, "borne de dimension non validée (VR-25)"));
    } else if (sens === "min" && valeur < borne.valeur) {
      out.push(violation("BELOW_MIN", `${base}.${nom}`, "dimension sous la borne minimale"));
    } else if (sens === "max" && valeur > borne.valeur) {
      out.push(violation("ABOVE_RULES", `${base}.${nom}`, "dimension au-dessus de la borne maximale"));
    }
  }
  return out;
}

/**
 * VR-25 : bornes de dimensions de la famille (`BORNES_DIMENSIONS_VR25`), évaluées avec `evaluerDimensions`.
 * Famille à deux orientations : conforme si la plaque l'est tel quel ou tournée ; sinon, violations de la plaque tel quel.
 * Indépendant des zones machine (étapes 4-5) et des règles de dimensions du catalogue, qui restent évaluées.
 */
export function evaluerBornesVr25(family: MaterialFamily, plaque: { widthMm: number; heightMm: number; cornerRadiusMm: number }): DomainViolation[] {
  const b = BORNES_DIMENSIONS_VR25[family];
  const bornes = { id: `VR-25.${family}`, minWidthMm: definie(b.minWidthMm), maxWidthMm: definie(b.maxWidthMm), minHeightMm: definie(b.minHeightMm), maxHeightMm: definie(b.maxHeightMm) };
  const base = `vr25.${family}`;
  const telQuel = evaluerDimensions(bornes, plaque, base);
  if (telQuel.length === 0 || !b.deuxOrientations) return telQuel;
  return evaluerDimensions(bornes, { ...plaque, widthMm: plaque.heightMm, heightMm: plaque.widthMm }, base).length === 0 ? [] : telQuel;
}
