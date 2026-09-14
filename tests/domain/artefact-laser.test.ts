// Artefact laser dérivé de la géométrie canonique (§13, §14.1). Données de TEST fictives.
import { describe, expect, it } from "vitest";
import {
  buildCanonicalGeometry,
  buildLaserArtifact,
  type CanonicalGeometry,
  type Catalog,
  definie,
  evaluateFabricability,
  INITIAL_CATALOG,
  type MaterialVariant,
  type PlanLaser,
  planArtifacts,
  resolveSpec,
  sansObjet,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "./fixtures";

const TRACABILITE = { batId: "bat-test", batHash: "h-bat", geometryHash: "h-geo", catalogVersion: "0.1.0" };

const geometrie = (o: Partial<CanonicalGeometry> = {}): CanonicalGeometry => ({
  plate: { widthMm: 200, heightMm: 100, cornerRadiusMm: 0, thicknessMm: 3 },
  safeZoneMm: { etat: "SANS_OBJET" },
  holes: [
    { cxMm: 10, cyMm: 50, diameterMm: 4 },
    { cxMm: 190, cyMm: 50, diameterMm: 4 },
  ],
  keepOutZones: [],
  layers: {
    engrave: [{ kind: "text", glyphs: [{ caractere: "A", contours: [[{ op: "M", x: 30, y: 40 }, { op: "L", x: 40, y: 40 }, { op: "L", x: 40, y: 50 }, { op: "Z" }]] }] }],
    print: [],
  },
  engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" },
  ...o,
});

const planHybride: PlanLaser = { kind: "laser", cote: "envers", miroir: "x", groupes: ["ENGRAVE", "CUT", "HOLES"] };
const planFace: PlanLaser = { kind: "laser", cote: "face", miroir: "none", groupes: ["ENGRAVE", "CUT", "HOLES"] };
const codes = (r: ReturnType<typeof buildLaserArtifact>) => (r.ok ? [] : r.violations.map((v) => `${v.code}@${v.path}`));

describe("buildLaserArtifact — géométrie → PRODUCTION_SVG_CONTRACT_v1", () => {
  it("côté face : tracés du texte dans ENGRAVE, contour CUT, trous HOLES de la géométrie", () => {
    const r = buildLaserArtifact({ geometry: geometrie(), plan: planFace, tracabilite: TRACABILITE, hash: "h-svg" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([r.artifact.kind, r.artifact.contractId, r.artifact.cote, r.artifact.miroir, r.artifact.hash]).toEqual(["laser", "PRODUCTION_SVG_CONTRACT_v1", "face", "none", "h-svg"]);
    expect(r.artifact.svg).toContain('<path d="M30 40 L40 40 L40 50 Z" fill="#000000" stroke="none"/>');
    expect(r.artifact.svg).toContain('<circle cx="10" cy="50" r="2"');
    expect([...r.artifact.svg.matchAll(/<g id="(\w+)">/g)].map((m) => m[1])).toEqual(["ENGRAVE", "CUT", "HOLES"]);
  });

  it("côté envers (hybride) : miroir X contractuel seul, x' = W − x", () => {
    const r = buildLaserArtifact({ geometry: geometrie(), plan: planHybride, tracabilite: TRACABILITE, hash: "h" });
    expect(r.ok && r.artifact.svg).toContain('d="M170 40 L160 40 L160 50 Z"');
    expect(r.ok && r.artifact.svg).toContain('data-side="reverse" data-mirrored="x"');
  });

  it("artwork dans la couche gravure ⇒ VALIDATION_REQUIRED (version normalisée vectorielle non disponible, ART1-DOC)", () => {
    const g = geometrie({ layers: { engrave: [{ kind: "artwork", artworkRef: "a", placement: { artworkRef: "a", xMm: 1, yMm: 1, widthMm: 10, heightMm: 10, rotationDeg: 0 } }], print: [] } });
    expect(codes(buildLaserArtifact({ geometry: g, plan: planFace, tracabilite: TRACABILITE, hash: "h" }))).toEqual(["VALIDATION_REQUIRED@layers.engrave.artwork"]);
  });

  it("incohérence plan / géométrie (trous, gravure) ⇒ ARTIFACT_PLAN_MISMATCH ; hash absent ⇒ VALIDATION_REQUIRED", () => {
    expect(codes(buildLaserArtifact({ geometry: geometrie({ holes: [] }), plan: planFace, tracabilite: TRACABILITE, hash: "h" }))).toEqual(["ARTIFACT_PLAN_MISMATCH@holes"]);
    expect(codes(buildLaserArtifact({ geometry: geometrie(), plan: { ...planFace, groupes: ["CUT", "HOLES"] }, tracabilite: TRACABILITE, hash: "h" }))).toEqual(["ARTIFACT_PLAN_MISMATCH@layers.engrave"]);
    expect(codes(buildLaserArtifact({ geometry: geometrie(), plan: planFace, tracabilite: TRACABILITE, hash: "" }))).toEqual(["VALIDATION_REQUIRED@hash"]);
  });

  it("déterministe ; géométrie source non modifiée", () => {
    const g = geometrie();
    const avant = structuredClone(g);
    const a = buildLaserArtifact({ geometry: g, plan: planHybride, tracabilite: TRACABILITE, hash: "h" });
    expect(a).toEqual(buildLaserArtifact({ geometry: g, plan: planHybride, tracabilite: TRACABILITE, hash: "h" }));
    expect(g).toEqual(avant);
  });
});

describe("chaîne configuration → fabricabilité → géométrie → artefact laser (Plexiglass)", () => {
  const plexi: MaterialVariant = referenceTest({
    id: "test-plexi",
    family: "plexiglass",
    thicknessIds: ["th_3_0"],
    productionWorkflowId: "PLEXIGLASS_UV",
    artworkRulesId: "artwork-PLEXIGLASS_UV",
    politiqueImpression: { valeur: definie("couleur"), cote: definie("envers") },
    apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
    capaciteGravure: { cote: sansObjet() },
    dimensionRulesIds: ["test-dim-plexi"],
    mountingRulesId: "mounting-default",
  });
  const base = catalogueTest();
  const catalogue: Catalog = {
    ...base,
    references: [...base.references, plexi],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id] })),
    dimensionRules: [
      { id: "test-dim-plexi", variantId: plexi.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" },
    ],
    mountingRules: [...INITIAL_CATALOG.mountingRules],
  };

  it("plan issu du workflow (CUT, sans ENGRAVE ni HOLES) ⇒ SVG laser découpe seule, côté face", () => {
    const fab = evaluateFabricability(
      { configurationVersion: 4, productId: "test-produit", materialVariantId: plexi.id, thicknessId: "th_3_0", format: { mode: "custom", widthMm: 300, heightMm: 200 }, design: { text: null, artwork: null }, mounting: { count: 0 }, quantity: 1 },
      catalogue,
    );
    if (!fab.ok) throw new Error(JSON.stringify(fab.violations));
    const spec = resolveSpec(fab, catalogue);
    if (!spec.ok) throw new Error(JSON.stringify(spec.violations));
    const geo = buildCanonicalGeometry({ spec: spec.spec, artwork: null, textePresent: false, engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" } });
    const plan = planArtifacts(spec.spec.workflow.id, spec.spec.workflow.operations, 0);
    if (!geo.ok || !plan.ok) throw new Error("chaîne interrompue");
    const laser = plan.plan.find((p) => p.kind === "laser");
    if (!laser || laser.kind !== "laser") throw new Error("plan laser attendu");
    const r = buildLaserArtifact({ geometry: geo.geometry, plan: laser, tracabilite: TRACABILITE, hash: "h" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect([...r.artifact.svg.matchAll(/<g id="(\w+)">/g)].map((m) => m[1])).toEqual(["CUT"]);
    expect(r.artifact.svg).toContain('width="300mm" height="200mm"');
  });
});
