// Fiche de production dérivée du BAT validé (Phase 5, §13, §31, PROD-1 en préparation).
// Projection pure des données contractuelles figées du BAT : aucune règle métier nouvelle, aucune valeur absente du BAT,
// aucune transformation de fichier déduite de l'orientation de pose (VR-41). La quantité et la commande relèvent de la
// Phase 6 et ne figurent pas ici.
import type { Bat } from "./bat";
import { type DomainViolation, violation } from "./violation";

export type FicheProduction = Readonly<{
  batId: string;
  contentHash: string;
  validatedAt: string;
  versions: { configurationVersion: number; catalogVersion: string; workflowId: string; workflowVersion: string };
  reference: { id: string; family: string; manufacturer: string; code: string; label: string };
  thickness: { id: string; mm: number };
  plaque: { widthMm: number; heightMm: number; cornerRadiusMm: number; formatMode: "standard" | "custom"; formatId?: string };
  operations: ReadonlyArray<{ sequence: number; type: string; machineId: string; cote: string; encre: string | null; condition: string }>;
  poses: ReadonlyArray<{ operationSequence: number; machineId: string; zoneMachine: { widthMm: number; heightMm: number }; orientationDePose: "tel_quel" | "tournee" }>;
  trous: ReadonlyArray<{ cxMm: number; cyMm: number; diameterMm: number }>;
  artefacts: ReadonlyArray<{ kind: string; contractId: string; cote?: string; miroir?: string; status?: string; hash?: string }>;
  geometryHash: string;
  workflowAcknowledgedAt: string;
}>;

export type ResultatFiche = { ok: true; fiche: FicheProduction } | { ok: false; violations: DomainViolation[] };

/** Fiche de production : seulement pour un BAT validé ; la production dérive du BAT (§15). */
export function ficheProduction(bat: Bat): ResultatFiche {
  if (bat.status !== "validated" || bat.confirmations.workflowAcknowledgedAt === undefined) {
    return { ok: false, violations: [violation("BAT_NOT_VALIDATED", "status", "fiche de production dérivée d'un BAT validé uniquement")] };
  }
  const s = bat.spec;
  const fiche: FicheProduction = {
    batId: bat.batId,
    contentHash: bat.contentHash,
    validatedAt: bat.validatedAt,
    versions: { configurationVersion: bat.versions.configurationVersion, catalogVersion: bat.versions.catalogVersion, workflowId: s.workflow.id, workflowVersion: s.workflow.version },
    reference: { id: s.reference.id, family: s.reference.family, manufacturer: s.reference.manufacturer, code: s.reference.code, label: s.reference.label },
    thickness: { id: s.thickness.id, mm: s.thickness.mm },
    plaque: { widthMm: s.plate.widthMm, heightMm: s.plate.heightMm, cornerRadiusMm: s.plate.cornerRadiusMm, formatMode: s.plate.formatMode, ...(s.plate.formatId !== undefined ? { formatId: s.plate.formatId } : {}) },
    operations: s.workflow.operations.map((o) => ({ sequence: o.sequence, type: o.type, machineId: o.machineId, cote: o.cote, encre: o.encre, condition: o.condition })),
    poses: s.posesParOperation.map((p) => ({ ...p, zoneMachine: { ...p.zoneMachine } })),
    trous: s.holes.map((h) => ({ ...h })),
    artefacts: bat.artifacts.map((a) =>
      a.kind === "laser"
        ? { kind: a.kind, contractId: a.contractId, cote: a.cote, miroir: a.miroir, hash: a.hash }
        : a.kind === "uv"
          ? { kind: a.kind, contractId: a.contractId, cote: a.cote, status: a.status, hash: a.hash }
          : { kind: a.kind, contractId: a.contractId },
    ),
    geometryHash: bat.geometryHash,
    workflowAcknowledgedAt: bat.confirmations.workflowAcknowledgedAt,
  };
  return { ok: true, fiche: Object.freeze(fiche) };
}
