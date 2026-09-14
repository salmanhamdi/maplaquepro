// Suite §14.3 — structure de l'artefact hybride HYBRID_TROGLASS_METALLIC (DECISION ; contenu UV À VALIDER).
// Références : §14.3, §13 (« même BAT, même job »), Annexe A (notation indicative), arbitrages D1 (miroir UV porté par
// l'artefact) et D2 (séquence en numéros d'opération). Étape de preuve : BAT-1 / PROD-SVG-1 NON satisfaits.
// Non résolus : contenu et format UV (VR-33), calage hybride (À VALIDER), miroir attendu par l'atelier (VR-35),
// critère « découpe si nécessaire » (P3, hypothèse isolée). Données de TEST fictives.
import { describe, expect, it } from "vitest";
import {
  type BatBrouillon,
  type Catalog,
  checkInkForReference,
  createBat,
  definie,
  INITIAL_CATALOG,
  type MaterialVariant,
  productionArtifactSchema,
  regenererArtefacts,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "../domain/fixtures";

const troglass = (politique: "noir_uniquement" | "couleur" = "noir_uniquement"): MaterialVariant =>
  referenceTest({
    id: "test-troglass",
    family: "troglass_metallic",
    thicknessIds: ["th_3_0"],
    productionWorkflowId: "TROGLASS_METALLIC_HYBRID",
    artworkRulesId: "artwork-TROGLASS_METALLIC_HYBRID",
    politiqueImpression: { valeur: definie(politique), cote: definie("envers") },
    capaciteGravure: { cote: definie("envers") },
    dimensionRulesIds: ["dim-troglass"],
    mountingRulesId: "mounting-default",
  });

const catalogue = (ref: MaterialVariant = troglass()): Catalog => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, ref],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, ref.id] })),
    dimensionRules: [{ id: "dim-troglass", variantId: ref.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" }],
    mountingRules: [
      { ...INITIAL_CATALOG.mountingRules[0]!, holeDiameterMm: definie(4), minEdgeDistanceMm: definie(2), holeKeepOutMarginMm: definie(1), edgeDistanceSemantics: definie("edge_to_center"), twoHolesDisposition: definie("horizontal_centered") },
    ],
  };
};

const hacher = (s: string) => `h${s.length}-${[...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1_000_000_007, 7)}`;

const creer = (o: { jobRef?: string; trous?: boolean; ref?: MaterialVariant } = {}) =>
  createBat({
    input: {
      configurationVersion: 4,
      productId: "test-produit",
      materialVariantId: "test-troglass",
      thicknessId: "th_3_0",
      format: { mode: "custom", widthMm: 300, heightMm: 200 },
      design: { text: null, artwork: null },
      mounting: o.trous ? { count: 2, mode: "standard", edgeDistanceMm: 10 } : { count: 0 },
      quantity: 1,
    },
    catalog: catalogue(o.ref),
    identite: { batId: "bat-hybride", createdAt: "2026-01-01T00:00:00Z", contentHash: "h-contenu" },
    engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" },
    previewSvg: "<svg/>",
    hacher,
    ...(o.jobRef ? { jobRef: o.jobRef } : {}),
  });

const bat = (o: { jobRef?: string; trous?: boolean } = {}): BatBrouillon => {
  const r = creer(o);
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.bat;
};

const hybride = (b: BatBrouillon) => {
  if (b.artifacts.length !== 1 || b.artifacts[0]?.kind !== "hybrid") throw new Error("un seul artefact hybride attendu");
  return b.artifacts[0];
};

describe("§14.3 — structure de l'artefact hybride", () => {
  it("un seul artefact hybride HYBRID_TROGLASS_METALLIC composé d'un artefact laser et d'un artefact UV, conforme au schéma", () => {
    const h = hybride(bat());
    expect([h.contractId, h.laserArtifact.kind, h.laserArtifact.contractId, h.uvArtifact.kind, h.uvArtifact.contractId]).toEqual([
      "HYBRID_TROGLASS_METALLIC",
      "laser",
      "PRODUCTION_SVG_CONTRACT_v1",
      "uv",
      "PRODUCTION_UV_CONTRACT_v1",
    ]);
    expect(productionArtifactSchema.safeParse(h).success).toBe(true);
  });

  it("le BAT référence les trois contrats du workflow hybride", () => {
    expect(bat().spec.productionContractIds).toEqual(["PRODUCTION_SVG_CONTRACT_v1", "PRODUCTION_UV_CONTRACT_v1", "HYBRID_TROGLASS_METALLIC"]);
  });
});

describe("§13 / §14.3 — même BAT, même job", () => {
  it("batId des métadonnées = BAT ; traçabilité laser data-bat identique", () => {
    const b = bat();
    const h = hybride(b);
    expect(h.metadata.batId).toBe(b.batId);
    expect(h.laserArtifact.svg).toContain(`data-bat="${b.batId}"`);
  });

  it("jobRef fourni : identique dans les métadonnées et dans le fichier laser ; absent sinon", () => {
    const avec = hybride(bat({ jobRef: "job-7" }));
    expect(avec.metadata.jobRef).toBe("job-7");
    expect(avec.laserArtifact.svg).toContain('data-job="job-7"');
    const sans = hybride(bat());
    expect("jobRef" in sans.metadata).toBe(false);
    expect(sans.laserArtifact.svg).not.toContain("data-job");
  });
});

describe("§14.3 — séquence gravure laser → découpe laser → impression UV (D2 : numéros d'opération)", () => {
  it("séquence [1, 2, 3] ; chaque numéro désigne sans ambiguïté l'opération du workflow dans le BAT", () => {
    const b = bat();
    const h = hybride(b);
    expect(h.metadata.sequence).toEqual([1, 2, 3]);
    const ops = h.metadata.sequence.map((n) => b.spec.workflow.operations.find((o) => o.sequence === n));
    expect(ops.map((o) => [o?.type, o?.machineId, o?.cote])).toEqual([
      ["laser_engrave", "SPEEDY_400", "envers"],
      ["laser_cut", "SPEEDY_400", "envers"],
      ["uv_print", "ARTISJET_3000U", "envers"],
    ]);
  });

  it("découpe systématique (v1.6, P3) : condition « always » conservée dans le BAT", () => {
    const cut = bat().spec.workflow.operations.find((o) => o.type === "laser_cut");
    expect(cut?.condition).toBe("always");
  });

  it("séquence déterministe : deux créations identiques", () => {
    expect(hybride(bat()).metadata.sequence).toEqual(hybride(bat()).metadata.sequence);
  });
});

describe("§14.3 — laser : côté envers, miroir X, ENGRAVE + CUT + HOLES", () => {
  it("laser côté envers, miroir X, traçabilité reverse / x ; groupes ENGRAVE, CUT puis HOLES si trous", () => {
    const h = hybride(bat({ trous: true }));
    expect([h.laserArtifact.cote, h.laserArtifact.miroir]).toEqual(["envers", "x"]);
    expect(h.laserArtifact.svg).toContain('data-side="reverse" data-mirrored="x"');
    expect([...h.laserArtifact.svg.matchAll(/<g id="(\w+)">/g)].map((m) => m[1])).toEqual(["ENGRAVE", "CUT", "HOLES"]);
  });
});

describe("§14.3 — UV : côté envers, encre noir uniquement, même miroir (D1)", () => {
  it("UV côté envers, encre noir_uniquement, miroir identique au laser (X)", () => {
    const h = hybride(bat());
    expect([h.uvArtifact.cote, h.uvArtifact.encre, h.uvArtifact.miroir]).toEqual(["envers", "noir_uniquement", "x"]);
    expect(h.uvArtifact.miroir).toBe(h.laserArtifact.miroir);
    expect(h.uvArtifact.cote).toBe(h.laserArtifact.cote);
  });

  it("encre couleur : TroGlass à politique couleur ⇒ INVALID_INK_POLICY, aucun BAT ; demande serveur couleur ⇒ INVALID_INK_POLICY", () => {
    const r = creer({ ref: troglass("couleur") });
    expect(!r.ok && r.violations.map((v) => v.code)).toContain("INVALID_INK_POLICY");
    expect(checkInkForReference(troglass(), "couleur").map((v) => v.code)).toEqual(["INVALID_INK_POLICY"]);
  });

  it("contenu UV non inventé : contract_pending, aucun payload, couche d'impression canonique seule (VR-33 ouvert)", () => {
    const b = bat();
    const h = hybride(b);
    expect(h.uvArtifact.status).toBe("contract_pending");
    expect("payload" in h.uvArtifact).toBe(false);
    expect(h.uvArtifact.canonicalPrintLayer).toEqual(b.geometryJson.layers.print);
  });
});

describe("§14.3 — même repère : calage À VALIDER", () => {
  it("registration explicitement À VALIDER, jamais présumée", () => {
    expect(hybride(bat()).metadata.registration).toEqual({ etat: "A_VALIDER" });
  });
});

describe("§14.3 — reconstruction sans interprétation humaine", () => {
  it("le BAT conserve famille, référence, épaisseur, capacité de gravure et politique d'impression (côtés envers), encre, dimensions, poses, géométrie, hashes, versions", () => {
    const b = bat();
    const s = b.spec;
    expect([s.reference.family, s.thickness.id, s.capaciteGravure.cote, s.politiqueImpression.valeur, s.politiqueImpression.cote]).toEqual([
      "troglass_metallic",
      "th_3_0",
      { etat: "DEFINIE", valeur: "envers" },
      "noir_uniquement",
      { etat: "DEFINIE", valeur: "envers" },
    ]);
    expect(s.workflow.operations.find((o) => o.type === "uv_print")?.encre).toBe("noir_uniquement");
    expect([s.plate.widthMm, s.plate.heightMm]).toEqual([300, 200]);
    expect(s.posesParOperation).toHaveLength(3);
    expect(b.geometryHash).toBeTruthy();
    expect(b.versions.configurationVersion).toBe(4);
  });

  it("artefact hybride régénéré depuis le BAT identique à l'artefact stocké (laser, UV, métadonnées)", () => {
    const b = bat({ jobRef: "job-7", trous: true });
    const r = regenererArtefacts(b, hacher, "job-7");
    expect(r.ok && r.artifacts).toEqual(b.artifacts);
  });
});
