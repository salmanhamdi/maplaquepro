// Catalogue de TEST : valeurs fictives, aucune valeur atelier.
import { describe, expect, it } from "vitest";
import {
  aValider,
  type Catalog,
  definie,
  evaluateFabricability,
  findPendingValues,
  INITIAL_CATALOG,
  type MaterialVariant,
  resolvedSpecSchema,
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
  politiqueImpression: { valeur: definie("couleur"), cote: definie("envers") },
  apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  dimensionRulesIds: ["test-dim-plexi"],
  mountingRulesId: "test-mounting",
});

const catalogue = (ref: MaterialVariant = plexi): Catalog => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, ref],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, ref.id] })),
    dimensionRules: [
      { id: "test-dim-plexi", variantId: ref.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" },
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

const resoudre = (c: Catalog, cfg = config()) => {
  const fab = evaluateFabricability(cfg, c);
  if (!fab.ok) throw new Error(JSON.stringify(fab.violations));
  return resolveSpec(fab, c);
};

describe("findPendingValues (P7)", () => {
  it("trouve tout À VALIDER à toute profondeur, avec son chemin", () => {
    expect(findPendingValues({ a: definie(1), b: { c: aValider(), d: [sansObjet(), aValider()] } })).toEqual(["b.c", "b.d.1"]);
    expect(findPendingValues({ a: definie({ etat: "x" }), b: null })).toEqual([]);
  });
});

describe("resolveSpec (§6, §15, P7)", () => {
  it("spécification résolue complète, valide au schéma, sans aucun À VALIDER", () => {
    const r = resoudre(catalogue());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(findPendingValues(r.spec)).toEqual([]);
    expect(r.spec.reference).toEqual({ id: "test-plexi", manufacturer: "Fabricant de test", code: "REF-TEST", family: "plexiglass", label: "Référence de test" });
    expect(r.spec.politiqueImpression).toEqual({ valeur: "couleur", cote: { etat: "DEFINIE", valeur: "envers" } });
    expect(r.spec.workflow.operations.map((o) => o.encre)).toEqual(["couleur", null]);
    expect(r.spec.mountingRules).toEqual({ holeDiameterMm: 4, minEdgeDistanceMm: 2, holeKeepOutMarginMm: 1, edgeDistanceSemantics: "edge_to_center" });
    expect(r.spec.productionContractIds).toEqual(["PRODUCTION_SVG_CONTRACT_v1", "PRODUCTION_UV_CONTRACT_v1"]);
    expect(r.spec.artworkRules).toBeNull();
  });

  it("propriété de référence À VALIDER ⇒ VALIDATION_REQUIRED (référence non active dans le catalogue réel ; garde P7 indépendante)", () => {
    const c = catalogue({ ...plexi, apparence: { ...plexi.apparence, finition: aValider() } });
    const fab = evaluateFabricability(config(), c);
    expect(fab.ok).toBe(true);
    if (!fab.ok) return;
    const r = resolveSpec(fab, c);
    expect(!r.ok && r.violations).toEqual([expect.objectContaining({ code: "VALIDATION_REQUIRED", path: "references.test-plexi.finition" })]);
  });

  it("artwork placé avec des règles d'artwork À VALIDER (catalogue initial) ⇒ BAT non validable", () => {
    // L'étape 8 bloque déjà en amont (maxBytes À VALIDER) : on vérifie ici la garde P7 propre à resolveSpec.
    const c2 = catalogue();
    const sansArtwork = evaluateFabricability(config(), c2);
    if (!sansArtwork.ok) throw new Error("attendu fabricable");
    const placement = { artworkRef: "a", xMm: 10, yMm: 10, widthMm: 50, heightMm: 50, rotationDeg: 0 as const };
    const fab = { ...sansArtwork, configuration: { ...sansArtwork.configuration, design: { text: null, artwork: placement } } };
    const r = resolveSpec(fab, c2);
    expect(!r.ok && r.violations.every((v) => v.code === "VALIDATION_REQUIRED" && v.path.startsWith("artworkRules.artwork-PLEXIGLASS_UV"))).toBe(true);
  });

  it("sans trous : mountingRules null ; format standard : formatId conservé", () => {
    const r = resoudre(catalogue(), config({ mounting: { count: 0 }, format: { mode: "standard", formatId: "test-format" } }));
    expect(r.ok && r.spec.mountingRules).toBeNull();
    expect(r.ok && r.spec.plate).toEqual({ widthMm: 300, heightMm: 200, cornerRadiusMm: 3, formatMode: "standard", formatId: "test-format" });
  });

  it("le schéma résolu refuse tout À VALIDER et tout champ inconnu", () => {
    const r = resoudre(catalogue());
    if (!r.ok) throw new Error("attendu ok");
    expect(resolvedSpecSchema.safeParse({ ...r.spec, apparence: { ...r.spec.apparence, finition: { etat: "A_VALIDER" } } }).success).toBe(false);
    expect(resolvedSpecSchema.safeParse({ ...r.spec, prix: 1 }).success).toBe(false);
  });

  it("déterministe", () => {
    expect(resoudre(catalogue())).toEqual(resoudre(catalogue()));
  });
});
