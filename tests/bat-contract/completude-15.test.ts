// BAT-1 — complétude et exploitabilité du BAT validé au regard du §15 (étape de preuve ; checkpoint NON satisfait).
// Référence normative : §15 (tableau des blocs), §14.3, Annexe A. Aucune règle métier nouvelle.
// Les valeurs encore ouvertes (prix VR-07, expiration G2-D12, versions, statuts de contrats VR-42, règles d'artwork) sont
// remplacées par des valeurs FICTIVES dans ces fixtures uniquement ; aucun point normatif n'est fermé.
import { describe, expect, it } from "vitest";
import {
  acknowledgeWorkflow,
  type BatValide,
  type Catalog,
  canonicalGeometrySchema,
  canonicalJson,
  confirmArtwork,
  createBat,
  createBatDraft,
  definie,
  ficheProduction,
  INITIAL_CATALOG,
  type MaterialVariant,
  PROCEDE_BY_WORKFLOW,
  regenererArtefacts,
  sansObjet,
  validateBat,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "../domain/fixtures";

// ---------- Fixtures de TEST ----------

const plexi: MaterialVariant = referenceTest({
  id: "test-plexi",
  family: "plexiglass",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "PLEXIGLASS_UV",
  artworkRulesId: "artwork-PLEXIGLASS_UV",
  politiqueImpression: { valeur: definie("couleur"), cote: definie("face") },
  apparence: { couleurSurface: definie({ name: "Support test", hex: "#FFFFFF" }), finition: definie("test"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  dimensionRulesIds: ["dim-plexi"],
  mountingRulesId: "mounting-default",
});

const catalogue = (): Catalog => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, plexi],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id] })),
    dimensionRules: [{ id: "dim-plexi", variantId: plexi.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" }],
    mountingRules: [
      { ...INITIAL_CATALOG.mountingRules[0]!, holeDiameterMm: definie(4), minEdgeDistanceMm: definie(2), holeKeepOutMarginMm: definie(1), edgeDistanceSemantics: definie("edge_to_center"), twoHolesDisposition: definie("horizontal_centered") },
    ],
    artworkRules: base.artworkRules.map((a) =>
      a.workflowId === "PLEXIGLASS_UV" ? { ...a, maxBytes: definie(1_000_000), minDpiAtPlacedSize: definie(1), minLineWidthMm: definie(1), rasterPolicy: definie("accept_color" as const) } : a,
    ),
  };
};

const hacher = (s: string) => `h${s.length}-${[...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1_000_000_007, 7)}`;
const CONFIG = {
  configurationVersion: 4,
  productId: "test-produit",
  materialVariantId: plexi.id,
  thicknessId: "th_3_0",
  format: { mode: "custom", widthMm: 300, heightMm: 200 },
  design: { text: null, artwork: { artworkRef: "art-1", xMm: 100, yMm: 50, widthMm: 80, heightMm: 60, rotationDeg: 0 } },
  mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 },
  quantity: 1,
};

function batValide(cat: Catalog = catalogue()): BatValide {
  const r = createBat({
    input: CONFIG,
    catalog: cat,
    donnees: { artwork: { format: "svg", bytes: 1200, contientCouleur: true } },
    identite: { batId: "bat-completude", createdAt: "2026-01-01T00:00:00Z", contentHash: "h-contenu" },
    engineVersions: { design: "d-1", mounting: "m-1", geometry: "g-1", render: "r-1", production: "p-1" },
    previewSvg: "<svg><!-- preview test --></svg>",
    hacher,
    artworkFichier: { artworkHash: "h-original", normalizedHash: "h-normalise", mime: "image/svg+xml" },
  });
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  const d = createBatDraft({
    ...r.bat,
    expiresAt: definie("2026-02-01T00:00:00Z"),
    price: definie({ totalHtCentimes: 1234 }),
    versions: { ...r.bat.versions, pricingVersion: definie("prix-test"), designRulesVersion: definie("design-test") },
    productionContracts: [
      { contractId: "PRODUCTION_SVG_CONTRACT_v1", conformite: "conforme", validationAtelier: definie("validee"), preuveValidationAtelier: "preuve de test" },
      { contractId: "PRODUCTION_UV_CONTRACT_v1", conformite: "non_conforme", validationAtelier: sansObjet() },
    ],
  });
  if (!d.ok) throw new Error(JSON.stringify(d.violations));
  const a = acknowledgeWorkflow(d.bat, "2026-01-01T10:00:00Z");
  const b = a.ok ? confirmArtwork(a.bat, "2026-01-01T10:01:00Z") : a;
  if (!b.ok) throw new Error("confirmations");
  const v = validateBat(b.bat, "2026-01-01T10:05:00Z");
  if (!v.ok) throw new Error(JSON.stringify(v.violations));
  return v.bat;
}

// ---------- §15 — blocs ----------

describe("§15 Identité", () => {
  it("batId, contentHash, createdAt, expiresAt, status (validé) et horodatage de validation", () => {
    const b = batValide();
    expect([b.batId, b.contentHash, b.createdAt, b.status, b.validatedAt]).toEqual(["bat-completude", "h-contenu", "2026-01-01T00:00:00Z", "validated", "2026-01-01T10:05:00Z"]);
    expect(b.expiresAt).toEqual({ etat: "DEFINIE", valeur: "2026-02-01T00:00:00Z" });
  });
});

describe("§15 Versions et statuts des contrats", () => {
  it("configurationVersion 4, catalogVersion, pricingVersion, designRulesVersion, engineVersions, workflowId + workflowVersion", () => {
    const b = batValide();
    expect(b.versions.configurationVersion).toBe(4);
    expect(b.versions.catalogVersion).toBe(catalogue().catalogVersion);
    expect([b.versions.pricingVersion.etat, b.versions.designRulesVersion.etat]).toEqual(["DEFINIE", "DEFINIE"]);
    expect(Object.keys(b.versions.engineVersions).sort()).toEqual(["design", "geometry", "mounting", "production", "render"]);
    expect([b.spec.workflow.id, b.spec.workflow.version]).toEqual(["PLEXIGLASS_UV", "1"]);
  });

  it("un statut par contrat du workflow (conformité ; validation atelier), contrat versionné par son identifiant", () => {
    const b = batValide();
    expect(b.productionContracts.map((c) => c.contractId).sort()).toEqual([...b.spec.productionContractIds].sort());
    for (const c of b.productionContracts) {
      expect(c.contractId).toMatch(/_v\d+$/);
      expect(["conforme", "non_conforme"]).toContain(c.conformite);
      expect(["DEFINIE", "SANS_OBJET", "A_VALIDER"]).toContain(c.validationAtelier.etat);
    }
  });
});

describe("§15 Spécification résolue", () => {
  it("produit ; famille ; référence (fabricant + code) ; épaisseur (id + mm)", () => {
    const s = batValide().spec;
    expect(s.product).toEqual({ id: "test-produit", slug: "test-produit", name: "Produit de test" });
    expect([s.reference.family, s.reference.manufacturer, s.reference.code]).toEqual(["plexiglass", "Fabricant de test", "REF-TEST"]);
    expect(s.thickness).toEqual({ id: "th_3_0", mm: 3 });
  });

  it("plaque (W, H, rayon, mode de format) — safe zone : voir lacune L1", () => {
    const s = batValide().spec;
    expect(s.plate).toEqual({ widthMm: 300, heightMm: 200, cornerRadiusMm: 0, formatMode: "custom" });
    expect("safeZoneMm" in s.plate).toBe(false);
  });

  it("apparence (surface, finition, couleur révélée) ; capacité de gravure (côté) ; politique d'impression (valeur, côté)", () => {
    const s = batValide().spec;
    expect(s.apparence).toEqual({ couleurSurface: { name: "Support test", hex: "#FFFFFF" }, finition: { etat: "DEFINIE", valeur: "test" }, couleurRevelee: { etat: "SANS_OBJET" } });
    expect(s.capaciteGravure).toEqual({ cote: { etat: "SANS_OBJET" } });
    expect(s.politiqueImpression).toEqual({ valeur: "couleur", cote: { etat: "DEFINIE", valeur: "face" } });
  });

  it("workflow : opérations, machines, côtés, encre dérivée, séquence ; règles de trous résolues ; artworkRules", () => {
    const s = batValide().spec;
    expect(s.workflow.operations.map((o) => [o.sequence, o.type, o.machineId, o.cote, o.encre, o.condition])).toEqual([
      [1, "laser_cut", "SPEEDY_400", "face", null, "always"],
      [2, "uv_print", "ARTISJET_3000U", "face", "couleur", "always"],
    ]);
    expect(s.mountingRules).toEqual({ holeDiameterMm: 4, minEdgeDistanceMm: 2, holeKeepOutMarginMm: 1, edgeDistanceSemantics: "edge_to_center" });
    expect(s.artworkRules?.workflowId).toBe("PLEXIGLASS_UV");
  });
});

describe("§15 Poses par opération (P6)", () => {
  it("une zone machine et une orientation de pose enregistrées pour chaque opération", () => {
    const s = batValide().spec;
    expect(s.posesParOperation.map((p) => p.operationSequence)).toEqual(s.workflow.operations.map((o) => o.sequence));
    expect(s.posesParOperation).toEqual([
      { operationSequence: 1, machineId: "SPEEDY_400", zoneMachine: { widthMm: 1010, heightMm: 610 }, orientationDePose: "tel_quel" },
      { operationSequence: 2, machineId: "ARTISJET_3000U", zoneMachine: { widthMm: 347, heightMm: 490 }, orientationDePose: "tel_quel" },
    ]);
  });
});

describe("§15 Design", () => {
  it("artwork : artworkRef, artworkHash (original), hash normalisé, mime, placement, mode couleur appliqué, transformations", () => {
    const art = batValide().artwork;
    expect(art).toEqual({
      artworkRef: "art-1",
      artworkHash: "h-original",
      normalizedHash: "h-normalise",
      mime: "image/svg+xml",
      placement: CONFIG.design.artwork,
      modeCouleurApplique: "selon_politique_impression_reference",
      transformations: [],
    });
  });

  it("texte : bloc prévu au schéma (police + hash, layout, alignement, taille effective) — non constructible aujourd'hui, voir lacune L3", () => {
    expect(batValide().text).toBeNull();
  });
});

describe("§15 Trous", () => {
  it("valeurs soumises, trous résolus (disposition), règles résolues", () => {
    const b = batValide();
    expect(b.holes.pattern).toEqual(CONFIG.mounting);
    expect(b.spec.holes).toEqual([
      { cxMm: 10, cyMm: 100, diameterMm: 4 },
      { cxMm: 290, cyMm: 100, diameterMm: 4 },
    ]);
    expect(b.spec.mountingRules).not.toBeNull();
  });
});

describe("§15 Géométrie et hash", () => {
  it("geometryJson = géométrie canonique (plaque, safe zone, zones de trous, trous, couches) ; geometryHash cohérent — voir lacune L2", () => {
    const b = batValide();
    const g = canonicalGeometrySchema.parse(b.geometryJson);
    expect(Object.keys(g).sort()).toEqual(["engineVersions", "holes", "keepOutZones", "layers", "plate", "safeZoneMm"]);
    expect(g.safeZoneMm).toEqual({ etat: "SANS_OBJET" });
    expect(g.keepOutZones).toHaveLength(2);
    expect(g.layers.print?.map((e) => e.kind)).toEqual(["artwork"]);
    expect(b.geometryHash).toBe(hacher(canonicalJson(b.geometryJson)));
  });
});

describe("§15 Rendus et artefacts", () => {
  it("previewSvg présent ; artefacts laser et UV présents et régénérables ≡ stockés", () => {
    const b = batValide();
    expect(b.previewSvg).toBe("<svg><!-- preview test --></svg>");
    expect(b.artifacts.map((a) => [a.kind, a.contractId])).toEqual([
      ["laser", "PRODUCTION_SVG_CONTRACT_v1"],
      ["uv", "PRODUCTION_UV_CONTRACT_v1"],
    ]);
    const r = regenererArtefacts(b, hacher);
    expect(r.ok && r.artifacts).toEqual(b.artifacts);
  });
});

describe("§15 Prix", () => {
  it("priceJson présent dans le BAT validé (valeur fictive de test, VR-07 ouvert)", () => {
    expect(batValide().price).toEqual({ etat: "DEFINIE", valeur: { totalHtCentimes: 1234 } });
  });
});

describe("§15 Confirmations", () => {
  it("procédé affiché et confirmé (workflowAcknowledgedAt), visuel, avertissements et transformations acceptés", () => {
    const c = batValide().confirmations;
    expect(c.workflowAcknowledgedAt).toBe("2026-01-01T10:00:00Z");
    expect(c.artworkConfirmedAt).toBe("2026-01-01T10:01:00Z");
    expect(Array.isArray(c.warningsAcknowledged) && Array.isArray(c.transformationsAcceptees)).toBe(true);
  });
});

describe("§15 Exploitabilité — workflow reconstructible sans interprétation humaine", () => {
  it("à partir du seul BAT : procédé, séquence, machines, côtés, encre, zones et orientations, artefacts et fiche de production", () => {
    const b = batValide();
    expect(PROCEDE_BY_WORKFLOW[b.spec.workflow.id]).toBe("decoupe_impression_uv");
    const ops = [...b.spec.workflow.operations].sort((x, y) => x.sequence - y.sequence);
    expect(ops.every((o) => b.spec.posesParOperation.some((p) => p.operationSequence === o.sequence && p.machineId === o.machineId))).toBe(true);
    expect(regenererArtefacts(b, hacher).ok).toBe(true);
    const f = ficheProduction(b);
    expect(f.ok && f.fiche.operations.map((o) => o.machineId)).toEqual(["SPEEDY_400", "ARTISJET_3000U"]);
  });

  it("après évolution du catalogue : le BAT validé reste identique et suffit à reconstruire (G2-D2, G2-D3)", () => {
    const cat = catalogue();
    const b = batValide(cat);
    const avant = canonicalJson(b);
    cat.catalogVersion = "9.9.9";
    cat.workflows = [];
    cat.machines = [];
    expect(canonicalJson(b)).toBe(avant);
    const r = regenererArtefacts(b, hacher);
    expect(r.ok && r.artifacts).toEqual(b.artifacts);
    expect(Object.isFrozen(b)).toBe(true);
  });
});
