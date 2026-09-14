// Artefact laser dérivé de la géométrie canonique (§13) : BAT → géométrie → PRODUCTION_SVG_CONTRACT_v1 (§14.1).
// Le plan (côté, miroir, groupes) vient de planArtifacts (sélection par workflow) ; la géométrie fournit plaque, trous et
// tracés de gravure. Hors domaine / ouverts : hash (P7, reçu en entrée), version normalisée de l'artwork (ART1-DOC),
// contrat UV (VR-33). Aucune transformation n'est ajoutée : seul le miroir X fixé par le plan (§13) s'applique.
import type { CanonicalGeometry } from "./geometrie-canonique";
import { type PlanLaser } from "./production";
import { PRODUCTION_SVG_CONTRACT_ID, productionSvg, type SegmentTrace } from "./production-svg";
import { type DomainViolation, violation } from "./violation";

export type LaserArtifact = {
  kind: "laser";
  contractId: typeof PRODUCTION_SVG_CONTRACT_ID;
  cote: PlanLaser["cote"];
  miroir: PlanLaser["miroir"];
  svg: string;
  hash: string;
};

export type ResultatArtefactLaser = { ok: true; artifact: LaserArtifact } | { ok: false; violations: DomainViolation[] };

export function buildLaserArtifact(input: {
  geometry: CanonicalGeometry;
  plan: PlanLaser;
  tracabilite: { batId: string; batHash: string; geometryHash: string; catalogVersion: string; jobRef?: string };
  /** Hash du SVG produit : calcul hors domaine (P7), reçu en entrée. */
  hash: string;
}): ResultatArtefactLaser {
  const { geometry, plan } = input;
  const violations: DomainViolation[] = [];

  // ENGRAVE : tracés du texte ; un artwork exige sa version normalisée vectorielle, non disponible dans le domaine (ART1-DOC)
  let engrave: SegmentTrace[][] | null = null;
  if (plan.groupes.includes("ENGRAVE")) {
    engrave = [];
    for (const element of geometry.layers.engrave) {
      if (element.kind === "artwork") {
        violations.push(violation("VALIDATION_REQUIRED", "layers.engrave.artwork", "tracés de la version normalisée de l'artwork non disponibles (ART1-DOC)"));
      } else {
        for (const glyphe of element.glyphs) engrave.push(...(glyphe.contours as SegmentTrace[][]));
      }
    }
  } else if (geometry.layers.engrave.length > 0) {
    violations.push(violation("ARTIFACT_PLAN_MISMATCH", "layers.engrave", "éléments de gravure sans groupe ENGRAVE au plan"));
  }

  // HOLES : présents au plan si et seulement si la géométrie contient des trous
  const trousAuPlan = plan.groupes.includes("HOLES");
  if (trousAuPlan !== geometry.holes.length > 0) {
    violations.push(violation("ARTIFACT_PLAN_MISMATCH", "holes", "trous de la géométrie incohérents avec le plan"));
  }

  if (!input.hash) violations.push(violation("VALIDATION_REQUIRED", "hash", "hash de l'artefact non fourni (P7)"));

  if (violations.length > 0) return { ok: false, violations };

  const svg = productionSvg({
    plaque: { widthMm: geometry.plate.widthMm, heightMm: geometry.plate.heightMm, cornerRadiusMm: geometry.plate.cornerRadiusMm },
    cote: plan.cote,
    miroir: plan.miroir,
    engrave,
    cut: plan.groupes.includes("CUT"),
    holes: trousAuPlan ? geometry.holes : [],
    tracabilite: input.tracabilite,
  });
  return { ok: true, artifact: { kind: "laser", contractId: PRODUCTION_SVG_CONTRACT_ID, cote: plan.cote, miroir: plan.miroir, svg, hash: input.hash } };
}
