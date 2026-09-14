// Construction d'un brouillon de BAT à partir des résultats disponibles (§15). Aucune valeur par défaut :
// prix (VR-07), expiration (G2-D12), versions de tarif et de règles de design (VR-08) restent À VALIDER tant qu'ils ne sont
// pas fournis ; la catégorie ART-1 d'une transformation reste celle de l'évaluation (bilevel À VALIDER, ART1-DOC).
// Les hash, la géométrie, le rendu et les artefacts sont reçus en entrée (arbitrage Supervisor P7).
import { aValider, definie } from "./etat";
import { type BatBrouillon, createBatDraft, type ResultatBat } from "./bat";
import type { Catalog } from "./catalog";
import type { Fabricable } from "./fabricabilite";
import type { PriceRules } from "./pricing";
import { computePrice } from "./prix";
import type { ProductionArtifact } from "./production";
import { findPendingValues, type ResolvedSpec } from "./resolved-spec";
import { violation } from "./violation";

export type EntreeBrouillonBat = {
  fabricable: Fabricable;
  spec: ResolvedSpec;
  catalog: Catalog;
  identite: { batId: string; createdAt: string; contentHash: string };
  rendu: { geometryJson: unknown; geometryHash: string; previewSvg: string; artifacts: ProductionArtifact[] };
  engineVersions: { design: string; mounting: string; geometry: string; render: string; production: string };
  /** Fichiers d'artwork issus du pipeline (original et version normalisée). */
  artworkFichier?: { artworkHash: string; normalizedHash: string; mime: string };
  /** Règles de prix applicables : leur sélection n'est pas définie ; absentes ⇒ prix À VALIDER. */
  priceRules?: PriceRules;
};

export type ResultatBrouillon = ResultatBat<BatBrouillon> & { enAttente?: string[] };

export function buildBatDraft(e: EntreeBrouillonBat): ResultatBrouillon {
  const { fabricable: fab, spec, catalog } = e;
  const config = fab.configuration;

  // Texte : police, hash de police et taille effective non disponibles (VR-08, SP-3)
  if (fab.texte !== null) {
    return { ok: false, violations: [violation("VALIDATION_REQUIRED", "design.text", "bloc texte du BAT non constructible : police et mesure non définies (VR-08)")] };
  }

  let artwork: BatBrouillon["artwork"] = null;
  if (config.design.artwork !== null) {
    if (!fab.artwork || !e.artworkFichier) {
      return { ok: false, violations: [violation("ARTWORK_METADATA_MISSING", "design.artwork", "original et version normalisée requis (ART1-D3)")] };
    }
    artwork = {
      artworkRef: config.design.artwork.artworkRef,
      ...e.artworkFichier,
      placement: config.design.artwork,
      modeCouleurApplique: fab.artwork.modeCouleur,
      transformations: fab.artwork.transformations.map((t) => ({ id: t.kind, description: t.kind, visible: t.visible, categorie: t.categorie })),
    };
  }

  const prix = e.priceRules
    ? computePrice({
        rules: e.priceRules,
        variantId: config.materialVariantId,
        thicknessId: config.thicknessId,
        workflowId: spec.workflow.id,
        format: config.format,
        mountingCount: config.mounting.count,
        artworkPresent: config.design.artwork !== null,
        quantity: config.quantity,
      })
    : null;

  const resultat = createBatDraft({
    status: "draft",
    ...e.identite,
    expiresAt: aValider(),
    versions: {
      configurationVersion: config.configurationVersion,
      catalogVersion: catalog.catalogVersion,
      pricingVersion: aValider(),
      designRulesVersion: aValider(),
      engineVersions: e.engineVersions,
    },
    productionContracts: catalog.productionContracts.filter((c) => spec.productionContractIds.includes(c.contractId)),
    spec,
    holes: { pattern: config.mounting },
    text: null,
    artwork,
    ...e.rendu,
    price: prix?.etat === "DEFINIE" ? definie(prix.valeur) : aValider(),
    warnings: [],
    confirmations: { warningsAcknowledged: [], transformationsAcceptees: [] },
  });
  return resultat.ok ? { ...resultat, enAttente: findPendingValues(resultat.bat) } : resultat;
}
