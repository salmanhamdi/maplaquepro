// Construction et régénération des artefacts de production (§13, §15, Phase 5).
// Une seule construction, partagée par la préparation du BAT et la régénération depuis un BAT : plan par workflow,
// artefact laser dérivé de la géométrie, UV contract_pending (VR-33), hybride avec calage À VALIDER.
// La régénération n'utilise que les données du BAT (géométrie, spécification résolue, versions) : jamais le catalogue
// courant (G2-D2, G2-D3). Hachage fourni par le serveur (P7 OPEN).
import { buildLaserArtifact, type LaserArtifact } from "./artefact-laser";
import type { Bat } from "./bat";
import { canonicalGeometrySchema, canonicalJson, type CanonicalGeometry } from "./geometrie-canonique";
import { planArtifacts, type PlanLaser, type PlanUV, type ProductionArtifact, type ResolvedOperation } from "./production";
import type { ProductionWorkflowId } from "./referentiels";
import { type DomainViolation, violation } from "./violation";

export type Tracabilite = { batId: string; batHash: string; geometryHash: string; catalogVersion: string; jobRef?: string };

export type ResultatArtefacts = { ok: true; artifacts: ProductionArtifact[] } | { ok: false; violations: DomainViolation[] };

export function construireArtefacts(e: {
  geometry: CanonicalGeometry;
  workflowId: ProductionWorkflowId;
  operations: readonly ResolvedOperation[];
  holeCount: number;
  tracabilite: Tracabilite;
  hacher: (contenu: string) => string;
}): ResultatArtefacts {
  const plan = planArtifacts(e.workflowId, e.operations, e.holeCount);
  if (!plan.ok) return plan;
  const violations: DomainViolation[] = [];

  const laser = (p: PlanLaser): LaserArtifact | null => {
    const r = buildLaserArtifact({ geometry: e.geometry, plan: p, tracabilite: e.tracabilite, hash: "en-attente" });
    if (!r.ok) {
      violations.push(...r.violations);
      return null;
    }
    return { ...r.artifact, hash: e.hacher(r.artifact.svg) };
  };
  const uv = (p: PlanUV) => {
    const canonicalPrintLayer = e.geometry.layers.print ?? [];
    return { kind: "uv" as const, contractId: "PRODUCTION_UV_CONTRACT_v1" as const, status: p.status, cote: p.cote, miroir: p.miroir, encre: p.encre, canonicalPrintLayer, hash: e.hacher(canonicalJson(canonicalPrintLayer)) };
  };

  const artifacts: ProductionArtifact[] = [];
  for (const p of plan.plan) {
    if (p.kind === "laser") {
      const a = laser(p);
      if (a) artifacts.push(a);
    } else if (p.kind === "uv") {
      artifacts.push(uv(p));
    } else {
      const a = laser(p.laser);
      if (a) {
        artifacts.push({
          kind: "hybrid",
          contractId: "HYBRID_TROGLASS_METALLIC",
          laserArtifact: a,
          uvArtifact: uv(p.uv),
          // Calage laser / UV non validé (§14.3, VR-33) ⇒ À VALIDER
          metadata: { sequence: p.sequence, registration: { etat: "A_VALIDER" }, batId: e.tracabilite.batId, ...(e.tracabilite.jobRef ? { jobRef: e.tracabilite.jobRef } : {}) },
        });
      }
    }
  }
  return violations.length > 0 ? { ok: false, violations } : { ok: true, artifacts };
}

/** Régénère les artefacts d'un BAT à partir de ses seules données contractuelles (§15, §13). */
export function regenererArtefacts(bat: Bat, hacher: (contenu: string) => string, jobRef?: string): ResultatArtefacts {
  const geometry = canonicalGeometrySchema.safeParse(bat.geometryJson);
  if (!geometry.success) return { ok: false, violations: [violation("BAT_GEOMETRY_INVALID", "geometryJson", "géométrie canonique du BAT invalide")] };
  if (hacher(canonicalJson(geometry.data)) !== bat.geometryHash) {
    return { ok: false, violations: [violation("BAT_GEOMETRY_HASH_MISMATCH", "geometryHash", "hash de géométrie différent de la géométrie du BAT")] };
  }
  return construireArtefacts({
    geometry: geometry.data,
    workflowId: bat.spec.workflow.id,
    operations: bat.spec.workflow.operations,
    holeCount: bat.spec.holes.length,
    tracabilite: { batId: bat.batId, batHash: bat.contentHash, geometryHash: bat.geometryHash, catalogVersion: bat.versions.catalogVersion, ...(jobRef ? { jobRef } : {}) },
    hacher,
  });
}

/** Vérifie que les artefacts stockés sont identiques aux artefacts régénérés depuis le BAT (§15). */
export function verifierArtefacts(bat: Bat, hacher: (contenu: string) => string, jobRef?: string): DomainViolation[] {
  const r = regenererArtefacts(bat, hacher, jobRef);
  if (!r.ok) return r.violations;
  return canonicalJson(r.artifacts) === canonicalJson(bat.artifacts) ? [] : [violation("BAT_ARTIFACTS_MISMATCH", "artifacts", "artefacts stockés différents des artefacts régénérés")];
}
