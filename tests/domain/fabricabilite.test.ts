// Catalogue de TEST : références, bornes et paramètres fictifs ; aucune valeur atelier.
import { describe, expect, it } from "vitest";
import { type Catalog, definie, evaluateFabricability, INITIAL_CATALOG, type MaterialVariant, sansObjet } from "../../src/domain";
import { catalogueTest, referenceTest } from "./fixtures";

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
  mountingRulesId: "test-mounting",
});

const catalogue = (o: Partial<Catalog> = {}): Catalog => {
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
        holeKeepOutMarginMm: definie(1),
        edgeDistanceSemantics: definie("edge_to_center"),
        twoHolesDisposition: definie("horizontal_centered"),
        statut: "active",
      },
    ],
    ...o,
  };
};

const config = (o: Record<string, unknown> = {}) => ({
  configurationVersion: 4,
  productId: "test-produit",
  materialVariantId: plexi.id,
  thicknessId: "th_3_0",
  format: { mode: "custom", widthMm: 300, heightMm: 200 },
  design: { text: null, artwork: null },
  mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 },
  quantity: 1,
  ...o,
});

describe("evaluateFabricability (Annexe B étapes 0 à 7)", () => {
  it("configuration fabricable : plaque, encre dérivée, poses par opération, trous", () => {
    const r = evaluateFabricability(config(), catalogue());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.plaque).toEqual({ widthMm: 300, heightMm: 200, cornerRadiusMm: 0, thicknessMm: 3, formatMode: "custom" });
    expect(r.operations.map((o) => o.encre)).toEqual(["couleur", null]);
    expect(r.posesParOperation.map((p) => [p.machineId, p.orientationDePose])).toEqual([
      ["ARTISJET_3000U", "tel_quel"],
      ["SPEEDY_400", "tel_quel"],
    ]);
    expect(r.holes).toEqual([
      { cxMm: 10, cyMm: 100, diameterMm: 4 },
      { cxMm: 290, cyMm: 100, diameterMm: 4 },
    ]);
  });

  it("étape 0 : champ interdit ⇒ rejet typé au stade requête, rien n'est recalculé", () => {
    const r = evaluateFabricability(config({ encre: "couleur" }), catalogue());
    expect(r).toEqual({ ok: false, stage: "request", violations: [expect.objectContaining({ code: "FORBIDDEN_CLIENT_FIELD", path: "encre" })] });
  });

  it("étape 1 : référence inconnue ⇒ rejet au stade catalogue", () => {
    const r = evaluateFabricability(config({ materialVariantId: "inconnue" }), catalogue());
    expect(!r.ok && r.stage).toBe("catalog");
  });

  it("exemple normatif : Plexiglass 500 × 300 ⇒ NOT_FABRICABLE sur l'impression UV et hors VR-25", () => {
    const r = evaluateFabricability(config({ format: { mode: "custom", widthMm: 500, heightMm: 300 } }), catalogue());
    expect(!r.ok && r.violations.map((v) => `${v.code}@${v.path}`)).toEqual(["EXCEEDS_MACHINE@workflows.PLEXIGLASS_UV.operations.1", "ABOVE_RULES@vr25.plexiglass.maxWidthMm"]);
  });

  it("VR-25 dans le moteur : Plexiglass 490 × 347 admis (deux orientations) ; 9 × 200 ⇒ BELOW_MIN VR-25 en plus des règles du catalogue", () => {
    expect(evaluateFabricability(config({ format: { mode: "custom", widthMm: 490, heightMm: 347 }, mounting: { count: 0 } }), catalogue()).ok).toBe(true);
    const r = evaluateFabricability(config({ format: { mode: "custom", widthMm: 9, heightMm: 200 }, mounting: { count: 0 } }), catalogue());
    expect(!r.ok && r.violations.map((v) => `${v.code}@${v.path}`)).toEqual(["BELOW_MIN@vr25.plexiglass.minWidthMm", "BELOW_MIN@dimensionRules.test-dim-plexi.minWidthMm"]);
  });

  it("étape 6 : bornes de dimensions ; absence de règles pour l'épaisseur ⇒ VALIDATION_REQUIRED", () => {
    const hors = evaluateFabricability(config({ format: { mode: "custom", widthMm: 40, heightMm: 200 } }), catalogue());
    expect(!hors.ok && hors.violations.map((v) => v.code)).toContain("BELOW_MIN");
    const sansRegles = evaluateFabricability(config(), catalogue({ dimensionRules: [] }));
    expect(!sansRegles.ok && sansRegles.violations.map((v) => v.code)).toEqual(["VALIDATION_REQUIRED"]);
  });

  it("étape 7 : cote invalide rejetée, jamais adaptée ; sans trous, règles non requises", () => {
    const r = evaluateFabricability(config({ mounting: { count: 2, mode: "standard", edgeDistanceMm: 1 } }), catalogue());
    expect(!r.ok && r.violations.map((v) => v.code)).toContain("HOLE_EDGE_DISTANCE_BELOW_MINIMUM");
    const sans = evaluateFabricability(config({ mounting: { count: 0 } }), catalogue());
    expect(sans.ok && sans.holes).toEqual([]);
  });

  it("paramètres de trous À VALIDER (catalogue initial) ⇒ trous indisponibles", () => {
    const refDefaut = { ...plexi, mountingRulesId: "mounting-default" };
    const c = catalogue();
    const r = evaluateFabricability(config(), { ...c, references: c.references.map((x) => (x.id === plexi.id ? refDefaut : x)) });
    expect(!r.ok && r.violations.every((v) => v.code === "MOUNTING_PARAMETER_NOT_VALIDATED")).toBe(true);
  });

  it("TroLase : découpe VR-34 ouverte ⇒ VALIDATION_REQUIRED", () => {
    const r = evaluateFabricability(config({ materialVariantId: "test-ref-trolase", thicknessId: "th_1_6", mounting: { count: 0 } }), catalogue());
    expect(!r.ok && r.violations.map((v) => v.code)).toContain("VALIDATION_REQUIRED");
  });

  it("déterministe : même entrée ⇒ même résultat", () => {
    expect(evaluateFabricability(config(), catalogue())).toEqual(evaluateFabricability(config(), catalogue()));
  });
});
