// Géométrie canonique : structure, données sources vs dérivées, déterminisme, isolement des points ouverts.
// Catalogue et valeurs de TEST fictifs ; aucune valeur atelier.
import { describe, expect, it } from "vitest";
import {
  buildCanonicalGeometry,
  canonicalGeometrySchema,
  canonicalJson,
  type Catalog,
  definie,
  evaluateFabricability,
  INITIAL_CATALOG,
  type MaterialVariant,
  type ResolvedSpec,
  resolveSpec,
  sansObjet,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "./fixtures";

const plexi: MaterialVariant = referenceTest({
  id: "test-plexi",
  family: "plexiglass",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "PLEXIGLASS_UV",
  artworkRulesId: "artwork-PLEXIGLASS_UV",
  politiqueImpression: { valeur: definie("couleur"), cote: definie("face") },
  apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  dimensionRulesIds: ["test-dim-plexi"],
  mountingRulesId: "test-mounting",
});

const catalogue: Catalog = (() => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, plexi],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id] })),
    dimensionRules: [
      { id: "test-dim-plexi", variantId: plexi.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" },
    ],
    mountingRules: [
      ...INITIAL_CATALOG.mountingRules,
      {
        ...INITIAL_CATALOG.mountingRules[0]!,
        id: "test-mounting",
        holeDiameterMm: definie(4),
        minEdgeDistanceMm: definie(2),
        holeKeepOutMarginMm: definie(1.5),
        edgeDistanceSemantics: definie("edge_to_center"),
        twoHolesDisposition: definie("horizontal_centered"),
        statut: "active",
      },
    ],
  };
})();

const VERSIONS = { design: "d-test", mounting: "m-test", geometry: "g-test", render: "r-test", production: "p-test" };

function spec(o: Record<string, unknown> = {}): ResolvedSpec {
  const fab = evaluateFabricability(
    {
      configurationVersion: 4,
      productId: "test-produit",
      materialVariantId: plexi.id,
      thicknessId: "th_3_0",
      format: { mode: "custom", widthMm: 300.12345, heightMm: 200 },
      design: { text: null, artwork: null },
      mounting: { count: 4, mode: "standard", edgeDistanceMm: 10 },
      quantity: 1,
      ...o,
    },
    catalogue,
  );
  if (!fab.ok) throw new Error(JSON.stringify(fab.violations));
  const r = resolveSpec(fab, catalogue);
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.spec;
}

const placement = { artworkRef: "art-1", xMm: 20.00049, yMm: 30, widthMm: 50, heightMm: 40, rotationDeg: 90 as const };

describe("géométrie canonique — structure (§6)", () => {
  it("plaque, trous, zones autour des trous, couches, versions ; conforme au schéma strict", () => {
    const r = buildCanonicalGeometry({ spec: spec(), artwork: placement, textePresent: false, engineVersions: VERSIONS });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const g = r.geometry;
    expect(canonicalGeometrySchema.safeParse(g).success).toBe(true);
    expect(g.plate).toEqual({ widthMm: 300.123, heightMm: 200, cornerRadiusMm: 0, thicknessMm: 3 });
    expect(g.holes).toEqual([
      { cxMm: 10, cyMm: 10, diameterMm: 4 },
      { cxMm: 290.123, cyMm: 10, diameterMm: 4 },
      { cxMm: 10, cyMm: 190, diameterMm: 4 },
      { cxMm: 290.123, cyMm: 190, diameterMm: 4 },
    ]);
    expect(g.keepOutZones[0]).toEqual({ kind: "hole", shape: { type: "circle", cxMm: 10, cyMm: 10, rMm: 3.5 } });
    expect(g.keepOutZones).toHaveLength(4);
    expect(g.engineVersions).toEqual(VERSIONS);
  });

  it("safe zone SANS_OBJET (arbitrage A2), aucune zone de bord ni marge texte de 10 mm", () => {
    const r = buildCanonicalGeometry({ spec: spec(), artwork: null, textePresent: false, engineVersions: VERSIONS });
    expect(r.ok && r.geometry.safeZoneMm).toEqual({ etat: "SANS_OBJET" });
    expect(r.ok && r.geometry.keepOutZones.every((z) => z.kind === "hole")).toBe(true);
  });

  it("sans trous : aucune zone, aucune marge utilisée", () => {
    const r = buildCanonicalGeometry({ spec: spec({ mounting: { count: 0 } }), artwork: null, textePresent: false, engineVersions: VERSIONS });
    expect(r.ok && [r.geometry.holes, r.geometry.keepOutZones]).toEqual([[], []]);
  });
});

describe("géométrie canonique — couches selon le workflow", () => {
  it("Plexiglass (impression) : artwork dans print, engrave vide", () => {
    const r = buildCanonicalGeometry({ spec: spec(), artwork: placement, textePresent: false, engineVersions: VERSIONS });
    expect(r.ok && r.geometry.layers.engrave).toEqual([]);
    expect(r.ok && r.geometry.layers.print).toEqual([{ kind: "artwork", artworkRef: "art-1", placement: { ...placement, xMm: 20 } }]);
  });

  it("gravure laser (politique « aucune ») : artwork dans engrave, print null", () => {
    const s = spec();
    const trolase: ResolvedSpec = { ...s, politiqueImpression: { valeur: "aucune", cote: { etat: "SANS_OBJET" } }, workflow: { ...s.workflow, id: "TROLASE_ENGRAVE" } };
    const r = buildCanonicalGeometry({ spec: trolase, artwork: placement, textePresent: false, engineVersions: VERSIONS });
    expect(r.ok && r.geometry.layers.print).toBeNull();
    expect(r.ok && r.geometry.layers.engrave.map((e) => (e.kind === "artwork" ? e.artworkRef : e.kind))).toEqual(["art-1"]);
  });

  it("hybride TroGlass : artwork dans engrave et print", () => {
    const s = spec();
    const hybride: ResolvedSpec = { ...s, politiqueImpression: { valeur: "noir_uniquement", cote: { etat: "DEFINIE", valeur: "envers" } }, workflow: { ...s.workflow, id: "TROGLASS_METALLIC_HYBRID" } };
    const r = buildCanonicalGeometry({ spec: hybride, artwork: placement, textePresent: false, engineVersions: VERSIONS });
    expect(r.ok && [r.geometry.layers.engrave.length, r.geometry.layers.print?.length]).toEqual([1, 1]);
  });
});

describe("géométrie canonique — sources conservées, aucune modification de la requête", () => {
  it("la spécification et le placement reçus ne sont ni mutés ni arrondis ; seul l'objet canonique l'est", () => {
    const s = spec();
    const avantSpec = structuredClone(s);
    const avantPlacement = structuredClone(placement);
    const r = buildCanonicalGeometry({ spec: s, artwork: placement, textePresent: false, engineVersions: VERSIONS });
    expect(s).toEqual(avantSpec);
    expect(placement).toEqual(avantPlacement);
    expect(s.plate.widthMm).toBe(300.12345);
    expect(r.ok && r.geometry.plate.widthMm).toBe(300.123);
  });
});

describe("géométrie canonique — versions des moteurs : reçues, jamais présumées", () => {
  it("absentes, incomplètes ou vides ⇒ ENGINE_VERSION_MISSING, aucune valeur de repli", () => {
    for (const v of [undefined, {}, { ...VERSIONS, render: "" }, { design: "d", mounting: "m", geometry: "g", render: "r" }]) {
      const r = buildCanonicalGeometry({ spec: spec(), artwork: null, textePresent: false, engineVersions: v });
      expect(!r.ok && r.violations.every((x) => x.code === "ENGINE_VERSION_MISSING")).toBe(true);
    }
  });

  it("champ de version inconnu ⇒ rejet", () => {
    const r = buildCanonicalGeometry({ spec: spec(), artwork: null, textePresent: false, engineVersions: { ...VERSIONS, autre: "x" } });
    expect(r.ok).toBe(false);
  });
});

describe("géométrie canonique — dépendances ouvertes", () => {
  it("texte présent : tracés non définis (SP-3) ⇒ VALIDATION_REQUIRED", () => {
    const r = buildCanonicalGeometry({ spec: spec(), artwork: null, textePresent: true, engineVersions: VERSIONS });
    expect(!r.ok && r.violations.map((v) => v.code)).toEqual(["VALIDATION_REQUIRED"]);
  });

  it("trous sans règles résolues ⇒ VALIDATION_REQUIRED, aucune marge inventée", () => {
    const s = spec();
    const r = buildCanonicalGeometry({ spec: { ...s, mountingRules: null }, artwork: null, textePresent: false, engineVersions: VERSIONS });
    expect(!r.ok && r.violations.map((v) => `${v.code}@${v.path}`)).toEqual(["VALIDATION_REQUIRED@mountingRules"]);
  });
});

describe("JSON canonique (§12) — déterminisme, sans hash", () => {
  it("indépendant de l'ordre des clés ; même entrée ⇒ même chaîne", () => {
    expect(canonicalJson({ b: 1, a: { d: [1, { f: 2, e: 3 }], c: "x" } })).toBe('{"a":{"c":"x","d":[1,{"e":3,"f":2}]},"b":1}');
    const a = buildCanonicalGeometry({ spec: spec(), artwork: placement, textePresent: false, engineVersions: VERSIONS });
    const b = buildCanonicalGeometry({ spec: spec(), artwork: placement, textePresent: false, engineVersions: { production: "p-test", render: "r-test", geometry: "g-test", mounting: "m-test", design: "d-test" } });
    expect(a.ok && b.ok && canonicalJson(a.geometry)).toBe(b.ok ? canonicalJson(b.geometry) : "");
  });
});
