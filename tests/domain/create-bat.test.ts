// createBat — point d'entrée serveur de bout en bout. Catalogue, tracés et hachage de TEST fictifs.
import { describe, expect, it } from "vitest";
import { type CaractereTrace, type Catalog, createBat, definie, findPendingValues, INITIAL_CATALOG, type MaterialVariant, sansObjet } from "../../src/domain";
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
  mountingRulesId: "mounting-default",
});
const troglass: MaterialVariant = referenceTest({
  id: "test-troglass",
  family: "troglass_metallic",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "TROGLASS_METALLIC_HYBRID",
  artworkRulesId: "artwork-TROGLASS_METALLIC_HYBRID",
  politiqueImpression: { valeur: definie("noir_uniquement"), cote: definie("envers") },
  capaciteGravure: { cote: definie("envers") },
  dimensionRulesIds: ["test-dim-troglass"],
  mountingRulesId: "mounting-default",
});
const bornes = (id: string, variantId: string) => ({ id, variantId, thicknessId: "th_3_0" as const, minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" as const });

const catalogue: Catalog = (() => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, plexi, troglass],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id, troglass.id] })),
    dimensionRules: [bornes("test-dim-plexi", plexi.id), bornes("test-dim-troglass", troglass.id)],
    mountingRules: [...INITIAL_CATALOG.mountingRules],
  };
})();

const config = (ref: MaterialVariant, o: Record<string, unknown> = {}) => ({
  configurationVersion: 4,
  productId: "test-produit",
  materialVariantId: ref.id,
  thicknessId: "th_3_0",
  format: { mode: "custom", widthMm: 300, heightMm: 200 },
  design: { text: null, artwork: null },
  mounting: { count: 0 },
  quantity: 1,
  ...o,
});

const commun = {
  catalog: catalogue,
  identite: { batId: "bat-test", createdAt: "2026-01-01T00:00:00Z", contentHash: "h-bat" },
  engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" },
  previewSvg: "<svg/>",
  hacher: (s: string) => `h${s.length}`,
};

const rect = (caractere: string, x: number): CaractereTrace => ({ caractere, contours: [[{ op: "M", x, y: 90 }, { op: "L", x: x + 8, y: 90 }, { op: "L", x: x + 8, y: 100 }, { op: "Z" }]] });

describe("createBat — point d'entrée serveur", () => {
  it("Plexiglass conforme et fabricable ⇒ brouillon de BAT, points ouverts listés, jamais validable par défaut", () => {
    const r = createBat({ ...commun, input: config(plexi) });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.bat.status).toBe("draft");
    expect(r.bat.artifacts.map((a) => a.kind)).toEqual(["uv", "laser"]);
    expect(r.enAttente.sort()).toEqual(["expiresAt", "price", "versions.designRulesVersion", "versions.pricingVersion"]);
  });

  it("requête non conforme (P13) ⇒ rejet au stade request, sans alternative ni BAT", () => {
    const r = createBat({ ...commun, input: config(plexi, { prix: 100 }) });
    expect(!r.ok && [r.stage, r.violations.map((v) => v.code), r.alternatives]).toEqual(["request", ["FORBIDDEN_CLIENT_FIELD"], []]);
  });

  it("non fabricable (Plexiglass 500 × 300) ⇒ stage fabrication avec alternatives fabricables", () => {
    const r = createBat({ ...commun, input: config(plexi, { format: { mode: "custom", widthMm: 500, heightMm: 300 } }) });
    expect(!r.ok && r.stage).toBe("fabrication");
    expect(!r.ok && r.alternatives).toEqual([
      { kind: "max_dimensions", widthMm: 347, heightMm: 490 },
      { kind: "max_dimensions", widthMm: 490, heightMm: 347 },
    ]);
  });

  it("TroGlass ⇒ brouillon hybride, calage À VALIDER conservé", () => {
    const r = createBat({ ...commun, input: config(troglass) });
    expect(r.ok && r.bat.artifacts.map((a) => a.kind)).toEqual(["hybrid"]);
    expect(r.ok && findPendingValues(r.bat)).toContain("artifacts.0.metadata.registration");
  });

  it("texte avec tracés : contrôles passés, mais bloc texte du BAT non constructible (P7 / A7) ⇒ stage bat, aucun BAT partiel", () => {
    const text = { lines: ["AB"], fontId: "test-font", layoutId: "test-layout", alignment: "center" };
    const r = createBat({ ...commun, input: config(plexi, { design: { text, artwork: null } }), donnees: { glyphesDisponibles: new Set([..."AB"]), texteTrace: [rect("A", 100), rect("B", 110)] } });
    expect(!r.ok && [r.stage, r.violations.map((v) => `${v.code}@${v.path}`)]).toEqual(["bat", ["VALIDATION_REQUIRED@design.text"]]);
  });

  it("texte sans tracés ⇒ stage fabrication (SP-3), aucun BAT", () => {
    const text = { lines: ["AB"], fontId: "test-font", layoutId: "test-layout", alignment: "center" };
    const r = createBat({ ...commun, input: config(plexi, { design: { text, artwork: null } }), donnees: { glyphesDisponibles: new Set([..."AB"]) } });
    expect(!r.ok && [r.stage, r.violations.map((v) => `${v.code}@${v.path}`)]).toEqual(["fabrication", ["VALIDATION_REQUIRED@design.text.effectiveFontSizeMm"]]);
  });

  it("déterministe ; entrée non modifiée", () => {
    const input = config(troglass);
    const avant = structuredClone(input);
    expect(createBat({ ...commun, input })).toEqual(createBat({ ...commun, input }));
    expect(input).toEqual(avant);
  });
});
