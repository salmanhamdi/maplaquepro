// Catalogue de TEST fictif. La découpe TroLase est rendue « always » UNIQUEMENT dans ce catalogue de test
// pour exercer switch_family ; VR-34 reste ouvert dans le catalogue réel.
import { describe, expect, it } from "vitest";
import { type Catalog, definie, INITIAL_CATALOG, type MaterialVariant, operationsHorsZone, proposeAlternatives, sansObjet } from "../../src/domain";
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
});
const trolase = referenceTest({ thicknessIds: ["th_3_0"], dimensionRulesIds: ["test-dim-trolase"] });

const dim = (id: string, variantId: string) => ({
  id,
  variantId,
  thicknessId: "th_3_0" as const,
  minWidthMm: definie(50),
  maxWidthMm: definie(600),
  minHeightMm: definie(50),
  maxHeightMm: definie(600),
  statut: "active" as const,
});

const catalogue = (decoupeTrolaseConfirmee: boolean): Catalog => {
  const base = catalogueTest();
  return {
    ...base,
    references: [trolase, plexi],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [trolase.id, plexi.id] })),
    dimensionRules: [dim("test-dim-plexi", plexi.id), dim("test-dim-trolase", trolase.id)],
    mountingRules: [...INITIAL_CATALOG.mountingRules],
    workflows: decoupeTrolaseConfirmee
      ? base.workflows.map((w) => (w.id === "TROLASE_ENGRAVE" ? { ...w, operations: w.operations.map((o) => ({ ...o, condition: "always" as const })) } : w))
      : base.workflows,
  };
};

const config = (widthMm: number, heightMm: number) => ({
  configurationVersion: 4,
  productId: "test-produit",
  materialVariantId: plexi.id,
  thicknessId: "th_3_0",
  format: { mode: "custom", widthMm, heightMm },
  design: { text: null, artwork: null },
  mounting: { count: 0 },
  quantity: 1,
});

describe("operationsHorsZone", () => {
  it("Plexiglass 500 × 300 : seule l'impression UV (ArtisJet) est hors zone", () => {
    expect(operationsHorsZone(catalogue(false), plexi.id, 500, 300)).toEqual([{ type: "uv_print", widthMm: 347, heightMm: 490, tourneeAutorisee: true }]);
  });
});

describe("proposeAlternatives (Annexe B étape 9)", () => {
  it("exemple normatif Plexiglass 500 × 300 : dimensions maximales dans les deux orientations ; famille gravure laser si fabricable", () => {
    expect(proposeAlternatives(config(500, 300), catalogue(true))).toEqual([
      { kind: "max_dimensions", widthMm: 347, heightMm: 490 },
      { kind: "max_dimensions", widthMm: 490, heightMm: 347 },
      { kind: "switch_family", toFamily: "trolase" },
    ]);
  });

  it("aucune alternative non fabricable : TroLase bloqué par VR-34 ⇒ pas de switch_family", () => {
    expect(proposeAlternatives(config(500, 300), catalogue(false))).toEqual([
      { kind: "max_dimensions", widthMm: 347, heightMm: 490 },
      { kind: "max_dimensions", widthMm: 490, heightMm: 347 },
    ]);
  });

  it("dimensions maximales qui échouent à leur tour (bornes de test) ⇒ non proposées", () => {
    const c = catalogue(false);
    const bornes = { ...c, dimensionRules: c.dimensionRules.map((d) => (d.variantId === plexi.id ? { ...d, maxHeightMm: definie(400) } : d)) };
    expect(proposeAlternatives(config(500, 300), bornes)).toEqual([{ kind: "max_dimensions", widthMm: 490, heightMm: 347 }]);
  });

  it("configuration fabricable ou échec sans dépassement machine ⇒ aucune alternative", () => {
    expect(proposeAlternatives(config(300, 200), catalogue(false))).toEqual([]);
    expect(proposeAlternatives(config(40, 200), catalogue(false))).toEqual([]);
  });

  it("déterministe", () => {
    expect(proposeAlternatives(config(500, 300), catalogue(true))).toEqual(proposeAlternatives(config(500, 300), catalogue(true)));
  });
});
