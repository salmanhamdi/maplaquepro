// Préparation d'un brouillon de BAT de bout en bout (§13, §15) : configuration fabricable → spécification résolue →
// géométrie canonique → plan d'artefacts → artefacts (laser, UV contract_pending, hybride) → brouillon de BAT.
// Aucun calcul de hash dans le domaine (P7) : la fonction de hachage est fournie par le serveur. Le rendu de preview
// (Phase 4) est reçu. Points isolés : UV (VR-33, contract_pending), enregistrement hybride (À VALIDER), artwork vectoriel
// en gravure (ART1-DOC), découpe TroLase (VR-34). Le brouillon n'est jamais validable tant qu'une valeur est À VALIDER (P7).
import { buildLaserArtifact, type LaserArtifact } from "./artefact-laser";
import { buildBatDraft, type ResultatBrouillon } from "./bat-brouillon";
import type { Catalog } from "./catalog";
import type { PriceRules } from "./pricing";
import type { Fabricable } from "./fabricabilite";
import { buildCanonicalGeometry, canonicalJson, type CanonicalGeometry } from "./geometrie-canonique";
import { planArtifacts, type PlanUV, type ProductionArtifact } from "./production";
import { resolveSpec } from "./resolved-spec";
import type { DomainViolation } from "./violation";

export type EntreePreparationBat = {
  fabricable: Fabricable;
  catalog: Catalog;
  identite: { batId: string; createdAt: string; contentHash: string };
  engineVersions: { design: string; mounting: string; geometry: string; render: string; production: string };
  /** Rendu serveur de la preview (Phase 4), reçu. */
  previewSvg: string;
  /** Fonction de hachage fournie par le serveur (P7 : aucun algorithme dans le domaine). */
  hacher: (contenu: string) => string;
  artworkFichier?: { artworkHash: string; normalizedHash: string; mime: string };
  priceRules?: PriceRules;
  jobRef?: string;
};

export type ResultatPreparationBat = ResultatBrouillon & { geometry?: CanonicalGeometry };

const echec = (violations: DomainViolation[]): ResultatPreparationBat => ({ ok: false, violations });

export function preparerBat(e: EntreePreparationBat): ResultatPreparationBat {
  const { fabricable: fab, catalog } = e;
  const config = fab.configuration;

  const spec = resolveSpec(fab, catalog);
  if (!spec.ok) return echec(spec.violations);

  const geo = buildCanonicalGeometry({
    spec: spec.spec,
    artwork: config.design.artwork,
    // Texte : tracés non portés par le résultat fabricable ⇒ la géométrie renvoie VALIDATION_REQUIRED (bloc texte du BAT : P7 / A7)
    textePresent: config.design.text !== null,
    engineVersions: e.engineVersions,
  });
  if (!geo.ok) return echec(geo.violations);
  const geometry = geo.geometry;
  const geometryHash = e.hacher(canonicalJson(geometry));

  const plan = planArtifacts(spec.spec.workflow.id, spec.spec.workflow.operations, spec.spec.holes.length);
  if (!plan.ok) return echec(plan.violations);

  const tracabilite = { batId: e.identite.batId, batHash: e.identite.contentHash, geometryHash, catalogVersion: catalog.catalogVersion, ...(e.jobRef ? { jobRef: e.jobRef } : {}) };
  const violations: DomainViolation[] = [];

  const laser = (p: Parameters<typeof buildLaserArtifact>[0]["plan"]): LaserArtifact | null => {
    const svg = buildLaserArtifact({ geometry, plan: p, tracabilite, hash: "en-attente" });
    if (!svg.ok) {
      violations.push(...svg.violations);
      return null;
    }
    return { ...svg.artifact, hash: e.hacher(svg.artifact.svg) };
  };
  const uv = (p: PlanUV) => {
    const canonicalPrintLayer = geometry.layers.print ?? [];
    return { kind: "uv" as const, contractId: "PRODUCTION_UV_CONTRACT_v1" as const, status: p.status, cote: p.cote, encre: p.encre, canonicalPrintLayer, hash: e.hacher(canonicalJson(canonicalPrintLayer)) };
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
          // Registration laser / UV : non validée (§14.3, VR-33) ⇒ À VALIDER, le BAT reste non validable (P7)
          metadata: { sequence: p.sequence, registration: { etat: "A_VALIDER" }, batId: e.identite.batId, ...(e.jobRef ? { jobRef: e.jobRef } : {}) },
        });
      }
    }
  }
  if (violations.length > 0) return echec(violations);

  const brouillon = buildBatDraft({
    fabricable: fab,
    spec: spec.spec,
    catalog,
    identite: e.identite,
    rendu: { geometryJson: geometry, geometryHash, previewSvg: e.previewSvg, artifacts },
    engineVersions: e.engineVersions,
    ...(e.artworkFichier ? { artworkFichier: e.artworkFichier } : {}),
    ...(e.priceRules ? { priceRules: e.priceRules } : {}),
  });
  return brouillon.ok ? { ...brouillon, geometry } : brouillon;
}
