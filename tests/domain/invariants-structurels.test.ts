import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  aValider,
  catalogSchema,
  configurationSchema,
  definie,
  materialVariantSchema,
  priceRulesSchema,
  productSchema,
  validateReference,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "./fixtures";

describe("INV-08 — aucune apparence déduite d'une capacité (P5)", () => {
  const ref = referenceTest({
    statut: "validation_required",
    capaciteGravure: { cote: definie("face") },
    politiqueImpression: { valeur: definie("aucune"), cote: { etat: "SANS_OBJET" } },
    apparence: { couleurSurface: aValider(), finition: aValider(), couleurRevelee: aValider() },
  });

  it("le schéma ne complète aucune propriété d'apparence à partir des capacités", () => {
    const parsed = materialVariantSchema.parse(ref);
    expect(parsed.apparence).toEqual({ couleurSurface: aValider(), finition: aValider(), couleurRevelee: aValider() });
  });

  it("la validation ne modifie pas l'apparence et ne la déduit pas", () => {
    const avant = structuredClone(ref);
    validateReference(ref);
    expect(ref).toEqual(avant);
  });

  it("une capacité définie ne rend pas la référence activable si l'apparence reste À VALIDER", () => {
    const codes = validateReference({ ...ref, statut: "active" }).map((v) => v.code);
    expect(codes.filter((c) => c === "ACTIVE_REFERENCE_WITH_PENDING_PROPERTY").length).toBeGreaterThanOrEqual(3);
  });
});

describe("INV-18 — aucun champ tenant / marque (§21)", () => {
  const CHAMPS = ["brand_id", "store_id", "channel_id", "tenant_id", "brandId", "storeId", "channelId", "tenantId"];

  it("les schémas stricts rejettent tout champ tenant / marque", () => {
    const configuration = {
      configurationVersion: 4,
      productId: "p",
      materialVariantId: "v",
      thicknessId: "th_1_6",
      format: { mode: "custom", widthMm: 300, heightMm: 200 },
      design: { text: null, artwork: null },
      mounting: { count: 0 },
      quantity: 1,
    };
    const catalogue = catalogueTest();
    const produit = catalogue.products[0];
    for (const champ of CHAMPS) {
      expect(configurationSchema.safeParse({ ...configuration, [champ]: "x" }).success, `configuration.${champ}`).toBe(false);
      expect(materialVariantSchema.safeParse({ ...referenceTest(), [champ]: "x" }).success, `référence.${champ}`).toBe(false);
      expect(productSchema.safeParse({ ...produit, [champ]: "x" }).success, `produit.${champ}`).toBe(false);
      expect(catalogSchema.safeParse({ ...catalogue, [champ]: "x" }).success, `catalogue.${champ}`).toBe(false);
    }
  });

  it("aucun fichier du domaine ne déclare d'identifiant tenant / marque", () => {
    const dir = path.resolve(__dirname, "../../src/domain");
    const motif = /\b(brand|store|channel|tenant)_?id\b/i;
    for (const file of readdirSync(dir)) {
      expect(motif.test(readFileSync(path.join(dir, file), "utf8")), file).toBe(false);
    }
  });
});

describe("I-6 — tarification non définie jusqu'à VR-07", () => {
  const base = {
    id: "prix-test",
    version: "fixture-1",
    base: aValider(),
    byVariant: {},
    byThickness: {},
    byFormat: {},
    customDimensionPricing: aValider(),
    byWorkflow: {},
    byMounting: {},
    artworkProcessingFee: aValider(),
    quantityTiers: { etat: "SANS_OBJET" },
    vatRate: aValider(),
    pricingStatus: "validation_required",
  };

  it("accepte À VALIDER et SANS OBJET", () => {
    expect(priceRulesSchema.safeParse(base).success).toBe(true);
  });

  it("VR-07 : sur mesure DEFINIE uniquement par paliers de dimensions ; tarif libre au cm², paliers de quantité, texte ou options refusés", () => {
    const palier = { id: "P1", grandCoteMinMm: 10, grandCoteMaxMm: 200, petitCoteMinMm: 10, petitCoteMaxMm: 100, montant: aValider() };
    expect(priceRulesSchema.safeParse({ ...base, customDimensionPricing: { etat: "DEFINIE", valeur: { modele: "paliers_dimensions", paliers: [palier] } } }).success).toBe(true);
    expect(priceRulesSchema.safeParse({ ...base, customDimensionPricing: { etat: "DEFINIE", valeur: { parMm2: 1 } } }).success).toBe(false);
    expect(priceRulesSchema.safeParse({ ...base, customDimensionPricing: { etat: "DEFINIE", valeur: { modele: "paliers_dimensions", paliers: [] } } }).success).toBe(false);
    expect(priceRulesSchema.safeParse({ ...base, customDimensionPricing: { etat: "DEFINIE", valeur: { modele: "paliers_dimensions", paliers: [{ ...palier, grandCoteMinMm: 300 }] } } }).success).toBe(false);
    expect(priceRulesSchema.safeParse({ ...base, quantityTiers: { etat: "DEFINIE", valeur: [] } }).success).toBe(false);
    expect(priceRulesSchema.safeParse({ ...base, texte: { etat: "SANS_OBJET" } }).success).toBe(false);
    expect(priceRulesSchema.safeParse({ ...base, options: { etat: "SANS_OBJET" } }).success).toBe(false);
    const { version: _version, ...sansVersion } = base;
    expect(priceRulesSchema.safeParse(sansVersion).success).toBe(false);
  });
});
