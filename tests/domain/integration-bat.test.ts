// Catalogue et données de TEST fictifs ; aucune valeur atelier, commerciale ni normative.
import { describe, expect, it } from "vitest";
import {
  acknowledgeWorkflow,
  batValidationViolations,
  buildBatDraft,
  type Catalog,
  definie,
  evaluateFabricability,
  INITIAL_CATALOG,
  type MaterialVariant,
  type PriceRules,
  resolveSpec,
  sansObjet,
} from "../../src/domain";
import { catalogueTest, geometrieCanoniqueTest, referenceTest } from "./fixtures";

const plexi: MaterialVariant = referenceTest({
  id: "test-plexi",
  family: "plexiglass",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "PLEXIGLASS_UV",
  artworkRulesId: "artwork-PLEXIGLASS_UV",
  politiqueImpression: { valeur: definie("noir_uniquement"), cote: definie("envers") },
  apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  dimensionRulesIds: ["test-dim-plexi"],
  mountingRulesId: "mounting-default",
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
    mountingRules: [...INITIAL_CATALOG.mountingRules],
  };
})();

const placement = { artworkRef: "a", xMm: 10, yMm: 10, widthMm: 50, heightMm: 50, rotationDeg: 0 as const };
const config = (o: Record<string, unknown> = {}) => ({
  configurationVersion: 4,
  productId: "test-produit",
  materialVariantId: plexi.id,
  thicknessId: "th_3_0",
  format: { mode: "custom", widthMm: 300, heightMm: 200 },
  design: { text: null, artwork: null },
  mounting: { count: 0 },
  quantity: 2,
  ...o,
});
const codes = (r: { ok: boolean; violations?: { code: string; path: string }[] }) => (r.ok ? [] : r.violations!.map((v) => `${v.code}@${v.path}`));

describe("evaluateFabricability — étape 8 artwork", () => {
  it("règles d'artwork du catalogue initial : maxBytes À VALIDER ⇒ VALIDATION_REQUIRED, jamais présumé", () => {
    const r = evaluateFabricability(config({ design: { text: null, artwork: placement } }), catalogue, { artwork: { format: "svg", bytes: 10, contientCouleur: true } });
    expect(codes(r)).toEqual(["VALIDATION_REQUIRED@artworkRules.artwork-PLEXIGLASS_UV.maxBytes"]);
  });

  it("métadonnées serveur absentes ⇒ ARTWORK_METADATA_MISSING", () => {
    expect(codes(evaluateFabricability(config({ design: { text: null, artwork: placement } }), catalogue))).toEqual(["ARTWORK_METADATA_MISSING@design.artwork.artworkRef"]);
  });

  it("règles définies (valeurs de test) : transformation imposée remontée dans le résultat", () => {
    const c = { ...catalogue, artworkRules: catalogue.artworkRules.map((a) => (a.workflowId === "PLEXIGLASS_UV" ? { ...a, maxBytes: definie(1000) } : a)) };
    const r = evaluateFabricability(config({ design: { text: null, artwork: placement } }), c, { artwork: { format: "svg", bytes: 10, contientCouleur: true } });
    expect(r.ok && r.artwork?.transformations).toEqual([{ kind: "noir", visible: true, categorie: { etat: "DEFINIE", valeur: "B" } }]);
  });
});

describe("evaluateFabricability — étape 8 texte", () => {
  const text = { lines: [" Martin "], fontId: "test-font", layoutId: "test-layout", alignment: "center" };

  it("mesure et lisibilité non définies (VR-08, SP-3) ⇒ VALIDATION_REQUIRED ; police non validée sans glyphes", () => {
    expect(codes(evaluateFabricability(config({ design: { text, artwork: null } }), catalogue))).toEqual([
      "VALIDATION_REQUIRED@design.text.fontId",
      "VALIDATION_REQUIRED@design.text.effectiveFontSizeMm",
    ]);
  });

  it("glyphes fournis : glyphes absents signalés, mesure toujours À VALIDER", () => {
    const r = evaluateFabricability(config({ design: { text, artwork: null } }), catalogue, { glyphesDisponibles: new Set([..."Mart"]) });
    expect(codes(r)).toEqual(["UNSUPPORTED_GLYPHS@design.text.lines", "VALIDATION_REQUIRED@design.text.effectiveFontSizeMm"]);
  });
});

// VR-07 : la grille n'est jamais injectée en entrée ; elle est sélectionnée dans le catalogue.
const entree = (priceRules: PriceRules[] = []) => {
  const fab = evaluateFabricability(config(), catalogue);
  if (!fab.ok) throw new Error(JSON.stringify(fab.violations));
  const spec = resolveSpec(fab, catalogue);
  if (!spec.ok) throw new Error(JSON.stringify(spec.violations));
  return {
    fabricable: fab,
    spec: spec.spec,
    catalog: { ...catalogue, priceRules },
    identite: { batId: "bat-test", createdAt: "2026-01-01T00:00:00Z", contentHash: "h" },
    rendu: { geometryJson: geometrieCanoniqueTest(), geometryHash: "g", previewSvg: "<svg/>", artifacts: [] },
    engineVersions: { design: "t", mounting: "t", geometry: "t", render: "t", production: "t" },
  };
};

describe("buildBatDraft (§15)", () => {
  it("brouillon construit ; éléments OPEN restés À VALIDER, listés ; aucune valeur par défaut", () => {
    const r = buildBatDraft(entree());
    expect(r.ok).toBe(true);
    expect(r.enAttente?.sort()).toEqual(["expiresAt", "price", "versions.designRulesVersion", "versions.pricingVersion"]);
  });

  it("BAT non validable : P7 et statuts de contrats absents du catalogue initial", () => {
    const r = buildBatDraft(entree());
    if (!r.ok) throw new Error("attendu ok");
    const ack = acknowledgeWorkflow(r.bat, "t");
    const v = ack.ok ? batValidationViolations(ack.bat).map((x) => x.code) : [];
    expect(v.filter((c) => c === "VALIDATION_REQUIRED")).toHaveLength(4);
    expect(v.filter((c) => c === "CONTRACT_STATUS_MISSING")).toHaveLength(2);
  });

  it("règles de prix incomplètes ⇒ prix À VALIDER (jamais partiel)", () => {
    const partielles: PriceRules = {
      id: "p",
      version: "fixture-1",
      base: definie(100),
      byVariant: {},
      byThickness: {},
      byFormat: {},
      customDimensionPricing: { etat: "A_VALIDER" },
      byWorkflow: {},
      byMounting: {},
      artworkProcessingFee: definie(0),
      quantityTiers: { etat: "SANS_OBJET" },
      vatRate: { etat: "A_VALIDER" },
      pricingStatus: "active",
      commercialValidation: "validated",
    };
    const r = buildBatDraft(entree([partielles]));
    expect(r.ok && r.bat.price).toEqual({ etat: "A_VALIDER" });
    expect(r.ok && r.bat.versions.pricingVersion).toEqual({ etat: "A_VALIDER" });
  });

  // FIXTURE DE TEST fictive couvrant la configuration de test (Plexiglass 300 × 200, quantité 2, sans trou ni artwork).
  const grilleComplete = (o: Partial<PriceRules> = {}): PriceRules => ({
    id: "grille-fixture",
    version: "fixture-1",
    base: definie(1000),
    byVariant: { [plexi.id]: definie(200) },
    byThickness: { th_3_0: definie(50) },
    byFormat: {},
    customDimensionPricing: { etat: "DEFINIE", valeur: { modele: "paliers_dimensions", paliers: [{ id: "P2", grandCoteMinMm: 201, grandCoteMaxMm: 400, petitCoteMinMm: 101, petitCoteMaxMm: 300, montant: definie(900) }] } },
    byWorkflow: { PLEXIGLASS_UV: definie(150) },
    byMounting: { "0": sansObjet() },
    artworkProcessingFee: sansObjet(),
    quantityTiers: { etat: "SANS_OBJET" },
    vatRate: definie(0.2),
    pricingStatus: "active",
    commercialValidation: "validated",
    ...o,
  });

  it("VR-07 : grille unique complète ⇒ prix complet et version de grille figés dans le brouillon", () => {
    const r = buildBatDraft(entree([grilleComplete({ id: "grille-fixture", version: "fixture-0", pricingStatus: "draft" }), grilleComplete()]));
    if (!r.ok) throw new Error(JSON.stringify(r.violations));
    expect(r.bat.versions.pricingVersion).toEqual({ etat: "DEFINIE", valeur: "grille-fixture@fixture-1" });
    expect(r.bat.price).toEqual({
      etat: "DEFINIE",
      valeur: {
        grille: { id: "grille-fixture", version: "fixture-1" },
        composantes: { base: 1000, reference: 200, epaisseur: 50, dimensions: 900, workflow: 150, artwork: 0, trous: 0 },
        unitaireHtCentimes: 2300,
        quantite: 2,
        totalHtCentimes: 4600,
        tauxTvaPourcent: 20,
        tvaCentimes: 920,
        totalTtcCentimes: 5520,
        pricingStatus: "active",
      },
    });
    expect(r.enAttente?.sort()).toEqual(["expiresAt", "versions.designRulesVersion"]);
  });

  it("VR-07 : zéro ou plusieurs grilles applicables ⇒ prix et version de grille À VALIDER", () => {
    for (const grilles of [[], [grilleComplete({ pricingStatus: "draft" })], [grilleComplete(), grilleComplete({ version: "fixture-2" })]]) {
      const r = buildBatDraft(entree(grilles));
      expect(r.ok && [r.bat.price, r.bat.versions.pricingVersion]).toEqual([{ etat: "A_VALIDER" }, { etat: "A_VALIDER" }]);
    }
  });

  it("VR-07 : grille active mais commercialement pending ⇒ prix et version de grille À VALIDER", () => {
    const r = buildBatDraft(entree([grilleComplete({ commercialValidation: "pending" })]));
    expect(r.ok && [r.bat.price, r.bat.versions.pricingVersion]).toEqual([{ etat: "A_VALIDER" }, { etat: "A_VALIDER" }]);
  });

  it("VR-07 : une grille fournie par l'appelant (client) n'est jamais applicable ; seule la grille du catalogue compte", () => {
    const injectee = { ...entree([]), priceRules: grilleComplete(), grille: grilleComplete() } as unknown as Parameters<typeof buildBatDraft>[0];
    const r = buildBatDraft(injectee);
    expect(r.ok && [r.bat.price, r.bat.versions.pricingVersion]).toEqual([{ etat: "A_VALIDER" }, { etat: "A_VALIDER" }]);
  });

  it("VR-07 : dimension hors de tout palier ⇒ prix À VALIDER, jamais de prix par défaut", () => {
    const horsGrille = grilleComplete({ customDimensionPricing: { etat: "DEFINIE", valeur: { modele: "paliers_dimensions", paliers: [{ id: "P1", grandCoteMinMm: 10, grandCoteMaxMm: 200, petitCoteMinMm: 10, petitCoteMaxMm: 100, montant: definie(400) }] } } });
    const r = buildBatDraft(entree([horsGrille]));
    expect(r.ok && [r.bat.price, r.bat.versions.pricingVersion]).toEqual([{ etat: "A_VALIDER" }, { etat: "A_VALIDER" }]);
  });

  it("texte présent ⇒ bloc texte non constructible (VR-08)", () => {
    const e = entree();
    const avecTexte = { ...e, fabricable: { ...e.fabricable, texte: { lines: ["Martin"], modifie: false } } };
    expect(codes(buildBatDraft(avecTexte))).toEqual(["VALIDATION_REQUIRED@design.text"]);
  });
});
