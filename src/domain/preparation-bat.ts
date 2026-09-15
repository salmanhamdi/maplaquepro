// Préparation d'un brouillon de BAT de bout en bout (§13, §15) : configuration fabricable → spécification résolue →
// géométrie canonique → plan d'artefacts → artefacts (laser, UV contract_pending, hybride) → brouillon de BAT.
// Aucun calcul de hash dans le domaine (P7) : la fonction de hachage est fournie par le serveur. Le rendu de preview
// (Phase 4) est reçu. Points isolés : UV (VR-33, contract_pending), enregistrement hybride (À VALIDER), artwork vectoriel
// en gravure (ART1-DOC), découpe TroLase (VR-34). Le brouillon n'est jamais validable tant qu'une valeur est À VALIDER (P7).
import { construireArtefacts } from "./artefacts-bat";
import { buildBatDraft, type ResultatBrouillon } from "./bat-brouillon";
import type { Catalog } from "./catalog";
import type { Fabricable } from "./fabricabilite";
import { buildCanonicalGeometry, canonicalJson, type CanonicalGeometry } from "./geometrie-canonique";
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
    // Texte : tracés transmis par le résultat fabricable ; absents ⇒ VALIDATION_REQUIRED (le bloc texte du BAT reste soumis à P7 / A7)
    textePresent: config.design.text !== null,
    ...(fab.texteTrace ? { texteTrace: fab.texteTrace } : {}),
    engineVersions: e.engineVersions,
  });
  if (!geo.ok) return echec(geo.violations);
  const geometry = geo.geometry;
  const geometryHash = e.hacher(canonicalJson(geometry));

  const artefacts = construireArtefacts({
    geometry,
    workflowId: spec.spec.workflow.id,
    operations: spec.spec.workflow.operations,
    holeCount: spec.spec.holes.length,
    tracabilite: { batId: e.identite.batId, batHash: e.identite.contentHash, geometryHash, catalogVersion: catalog.catalogVersion, ...(e.jobRef ? { jobRef: e.jobRef } : {}) },
    hacher: e.hacher,
  });
  if (!artefacts.ok) return echec(artefacts.violations);

  const brouillon = buildBatDraft({
    fabricable: fab,
    spec: spec.spec,
    catalog,
    identite: e.identite,
    rendu: { geometryJson: geometry, geometryHash, previewSvg: e.previewSvg, artifacts: artefacts.artifacts },
    engineVersions: e.engineVersions,
    ...(e.artworkFichier ? { artworkFichier: e.artworkFichier } : {}),
  });
  return brouillon.ok ? { ...brouillon, geometry } : brouillon;
}
