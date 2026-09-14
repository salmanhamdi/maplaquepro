// Évaluation des opérations et des capacités machine (Annexe B, étapes 4 à 6 ; §7.4, P6).
// Le repère physique des axes des zones machine reste À ARBITRER (R-1) : la comparaison porte sur (widthMm, heightMm)
// tels que déclarés. Une orientation de pose tournée n'implique aucune transformation de fichier (P6 D4, VR-41).
import type { DimensionRules } from "./dimensions";
import type { MachineCapability, ZoneMm } from "./machine";
import type { MachineId } from "./referentiels";
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
 * Opération conditionnelle À VALIDER (VR-34) : son évaluation est impossible ⇒ VALIDATION_REQUIRED, jamais présumée.
 * `if_geometry_requires` : aucun critère géométrique n'est défini. HYPOTHÈSE TECHNIQUE ISOLÉE, NON NORMATIVE
 * (arbitrage Supervisor P3) : l'opération est évaluée comme requise. Point OPEN, à remplacer par le critère validé.
 */
export function evaluerPoses(workflow: ProductionWorkflow, machines: readonly MachineCapability[], widthMm: number, heightMm: number): ResultatPoses {
  const violations: DomainViolation[] = [];
  const poses: PoseOperation[] = [];
  const operations = [...workflow.operations].sort((a, b) => a.sequence - b.sequence);
  for (const op of operations) {
    const path = `workflows.${workflow.id}.operations.${op.sequence}`;
    if (op.condition === "A_VALIDER") {
      violations.push(violation("VALIDATION_REQUIRED", `${path}.condition`, "opération conditionnelle non validée (VR-34)"));
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
export function evaluerDimensions(rules: DimensionRules, plaque: { widthMm: number; heightMm: number; cornerRadiusMm: number }): DomainViolation[] {
  const out: DomainViolation[] = [];
  const base = `dimensionRules.${rules.id}`;
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
