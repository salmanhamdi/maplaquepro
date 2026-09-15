// Tests dédiés ARCH-2 : INV-02, INV-06, INV-17. Comportement déjà codé uniquement ; données de TEST fictives.
import { describe, expect, it } from "vitest";
import {
  aValider,
  computePrice,
  definie,
  type DimensionRules,
  evaluateArtwork,
  evaluerDimensions,
  formatSchema,
  INITIAL_CATALOG,
  MATERIAL_FAMILIES,
  type MaterialFamily,
  materialFamilySchema,
  materialVariantSchema,
  PRODUCTION_WORKFLOWS,
  resolveMountingRules,
  resolveWorkflow,
  sansObjet,
  THICKNESSES_BY_FAMILY,
  validateConfigurationAgainstCatalog,
  validateReference,
  WORKFLOW_BY_FAMILY,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "./fixtures";

describe("INV-02 — statut actif et propriétés À VALIDER", () => {
  it("références : actif refusé si une propriété obligatoire est À VALIDER (chaque propriété)", () => {
    const pendantes = [
      { manufacturer: aValider<string>() },
      { reference: aValider<string>() },
      { outdoorStatus: aValider<"outdoor" | "indoor">() },
      { apparence: { ...referenceTest().apparence, couleurSurface: aValider<{ name: string; hex: string }>() } },
    ];
    for (const o of pendantes) {
      expect(validateReference(referenceTest(o as never)).map((v) => v.code)).toContain("ACTIVE_REFERENCE_WITH_PENDING_PROPERTY");
      expect(validateReference(referenceTest({ ...(o as object), statut: "validation_required" } as never)).map((v) => v.code)).not.toContain("ACTIVE_REFERENCE_WITH_PENDING_PROPERTY");
    }
  });

  it("formats : aucune propriété à état — une valeur À VALIDER ne peut pas figurer dans un format, actif ou non (non applicable par construction)", () => {
    const format = { id: "f", label: "F", widthMm: 300, heightMm: 200, cornerRadiusMm: 3, statut: "active" };
    expect(formatSchema.safeParse(format).success).toBe(true);
    for (const champ of ["widthMm", "heightMm", "cornerRadiusMm"]) {
      expect(formatSchema.safeParse({ ...format, [champ]: { etat: "A_VALIDER" } }).success).toBe(false);
    }
  });

  it("formats : un format non actif n'est jamais utilisable par une configuration", () => {
    const c = catalogueTest();
    const inactif = { ...c, formats: c.formats.map((f) => ({ ...f, statut: "validation_required" as const })) };
    const config = { configurationVersion: 4 as const, productId: "test-produit", materialVariantId: "test-ref-trolase", thicknessId: "th_1_6" as const, format: { mode: "standard" as const, formatId: "test-format" }, design: { text: null, artwork: null }, mounting: { count: 0 as const }, quantity: 1 };
    expect(validateConfigurationAgainstCatalog(config, inactif).map((v) => v.code)).toContain("FORMAT_NOT_AVAILABLE");
  });

  describe("règles : un statut « active » ne rend jamais utilisable une valeur À VALIDER", () => {
    it("DimensionRules", () => {
      const r: DimensionRules = { id: "d", variantId: "v", thicknessId: "th_3_0", minWidthMm: aValider(), maxWidthMm: definie(400), minHeightMm: definie(10), maxHeightMm: definie(400), statut: "active" };
      expect(evaluerDimensions(r, { widthMm: 100, heightMm: 100, cornerRadiusMm: 0 }).map((v) => v.code)).toEqual(["VALIDATION_REQUIRED"]);
    });

    it("MountingRules", () => {
      const r = resolveMountingRules({ ...INITIAL_CATALOG.mountingRules[0]!, statut: "active" }, { variantId: "v", thicknessId: "th_3_0" });
      expect(!r.ok && r.violations.every((v) => v.code === "MOUNTING_PARAMETER_NOT_VALIDATED")).toBe(true);
    });

    it("ArtworkRules", () => {
      const rules = { ...INITIAL_CATALOG.artworkRules.find((a) => a.workflowId === "TROLASE_ENGRAVE")!, statut: "active" as const };
      const r = evaluateArtwork({ placement: { artworkRef: "a", xMm: 1, yMm: 1, widthMm: 10, heightMm: 10, rotationDeg: 0 }, meta: { format: "svg", bytes: 1, contientCouleur: false }, rules, reference: referenceTest(), plaque: { widthMm: 100, heightMm: 100 }, holes: [], holeKeepOutMarginMm: null });
      expect(r.violations.map((v) => v.code)).toEqual(["VALIDATION_REQUIRED"]);
    });

    it("PriceRules", () => {
      const r = computePrice({
        rules: { id: "p", version: "t", base: aValider(), byVariant: {}, byThickness: {}, byFormat: {}, customDimensionPricing: { etat: "A_VALIDER" }, byWorkflow: {}, byMounting: {}, artworkProcessingFee: aValider(), quantityTiers: { etat: "SANS_OBJET" }, vatRate: aValider(), pricingStatus: "active" },
        variantId: "v",
        thicknessId: "th_3_0",
        workflowId: "PLEXIGLASS_UV",
        format: { mode: "standard", formatId: "f" },
        mountingCount: 0,
        artworkPresent: false,
        quantity: 1,
      });
      expect(r.etat).toBe("A_VALIDER");
    });
  });
});

describe("INV-06 — le noir UV n'est jamais une couleur révélée", () => {
  const workflow = PRODUCTION_WORKFLOWS.find((w) => w.id === "TROGLASS_METALLIC_HYBRID")!;
  const troglass = (couleurRevelee: ReturnType<typeof sansObjet> | ReturnType<typeof definie>) =>
    referenceTest({
      id: "t-troglass",
      family: "troglass_metallic",
      productionWorkflowId: "TROGLASS_METALLIC_HYBRID",
      artworkRulesId: "artwork-TROGLASS_METALLIC_HYBRID",
      politiqueImpression: { valeur: definie("noir_uniquement"), cote: definie("envers") },
      capaciteGravure: { cote: definie("envers") },
      apparence: { couleurSurface: definie({ name: "Surface de test", hex: "#C0C0C0" }), finition: definie("t"), couleurRevelee: couleurRevelee as never },
    });

  it("l'encre UV noire vient de la politique d'impression, jamais de la couleur révélée", () => {
    const a = resolveWorkflow(workflow, troglass(sansObjet()));
    const b = resolveWorkflow(workflow, troglass(definie({ name: "Révélée de test", hex: "#FFD700" })));
    expect(a.ok && a.operations.map((o) => o.encre)).toEqual([null, null, "noir_uniquement"]);
    expect(b.ok && b.operations).toEqual(a.ok && a.operations);
  });

  it("la couleur révélée d'une référence TroGlass n'est jamais remplacée par le noir UV", () => {
    const revelee = definie({ name: "Révélée de test", hex: "#FFD700" });
    const ref = troglass(revelee);
    // Aucun invariant TroGlass (INV-06) n'est violé ; l'épaisseur de famille À VALIDER (INV-03) est hors objet de ce test.
    expect(validateReference(ref).map((v) => v.code).filter((c) => c.startsWith("TROGLASS_"))).toEqual([]);
    expect(ref.apparence.couleurRevelee).toEqual(revelee);
    expect(ref.politiqueImpression.valeur).toEqual(definie("noir_uniquement"));
  });

  it("artwork : TroGlass produit une version normalisée noire (impression), TroLase une version dans la couleur révélée (gravure)", () => {
    const eval_ = (reference: ReturnType<typeof referenceTest>) =>
      evaluateArtwork({
        placement: { artworkRef: "a", xMm: 1, yMm: 1, widthMm: 10, heightMm: 10, rotationDeg: 0 },
        meta: { format: "svg", bytes: 1, contientCouleur: true },
        rules: { ...INITIAL_CATALOG.artworkRules.find((a) => a.workflowId === reference.productionWorkflowId)!, maxBytes: definie(10) },
        reference,
        plaque: { widthMm: 100, heightMm: 100 },
        holes: [],
        holeKeepOutMarginMm: null,
      }).transformations.map((t) => t.kind);
    expect(eval_(troglass(definie({ name: "Révélée de test", hex: "#FFD700" })))).toEqual(["noir"]);
    expect(eval_(referenceTest())).toEqual(["monochrome_couleur_revelee"]);
  });
});

describe("INV-17 — exactement 4 familles", () => {
  it("référentiel : TroLase, TroLase Metallic, Plexiglass, TroGlass, dans cet ordre", () => {
    expect(MATERIAL_FAMILIES).toEqual(["trolase", "trolase_metallic", "plexiglass", "troglass_metallic"]);
    expect(Object.keys(WORKFLOW_BY_FAMILY).sort()).toEqual([...MATERIAL_FAMILIES].sort());
    expect(Object.keys(THICKNESSES_BY_FAMILY).sort()).toEqual([...MATERIAL_FAMILIES].sort());
  });

  it("le contrat typé refuse toute famille supplémentaire (schéma et référence)", () => {
    for (const autre of ["troglass_clear", "famille_inconnue", "", "TROLASE"]) {
      expect(materialFamilySchema.safeParse(autre).success).toBe(false);
      expect(materialVariantSchema.safeParse({ ...referenceTest(), family: autre }).success).toBe(false);
    }
  });

  it("le type MaterialFamily n'admet pas de cinquième valeur (contrôlé par le typecheck)", () => {
    // @ts-expect-error — famille hors référentiel (P3)
    const interdite: MaterialFamily = "troglass_clear";
    expect(materialFamilySchema.safeParse(interdite).success).toBe(false);
  });
});
