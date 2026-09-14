// Montants de TEST fictifs, jamais des tarifs.
import { describe, expect, it } from "vitest";
import { aValider, checkPriceUnchanged, computePrice, definie, type PriceRules, sansObjet } from "../../src/domain";

const regles = (o: Partial<PriceRules> = {}): PriceRules => ({
  id: "test-prix",
  base: definie(1000),
  byVariant: { v: definie(200) },
  byThickness: { th_3_0: definie(50) },
  byFormat: { f: definie(300) },
  customDimensionPricing: { etat: "A_VALIDER" },
  byWorkflow: { PLEXIGLASS_UV: definie(150) },
  byMounting: { "0": sansObjet(), "2": definie(40) },
  artworkProcessingFee: definie(70),
  quantityTiers: { etat: "SANS_OBJET" },
  vatRate: aValider(),
  pricingStatus: "draft",
  ...o,
});

const entree = (o: Partial<Parameters<typeof computePrice>[0]> = {}): Parameters<typeof computePrice>[0] => ({
  rules: regles(),
  variantId: "v",
  thicknessId: "th_3_0",
  workflowId: "PLEXIGLASS_UV",
  format: { mode: "standard", formatId: "f" },
  mountingCount: 2,
  artworkPresent: true,
  quantity: 3,
  ...o,
});

const codes = (r: ReturnType<typeof computePrice>) => (r.etat === "A_VALIDER" ? r.violations.map((v) => v.path) : []);

describe("computePrice (§16) — structure", () => {
  it("somme des composantes en centimes × quantité ; TVA non appliquée (VR-10)", () => {
    const r = computePrice(entree());
    expect(r).toEqual({
      etat: "DEFINIE",
      valeur: {
        composantes: { base: 1000, reference: 200, epaisseur: 50, dimensions: 300, workflow: 150, artwork: 70, trous: 40 },
        unitaireHtCentimes: 1810,
        quantite: 3,
        totalHtCentimes: 5430,
        vatRate: { etat: "A_VALIDER" },
        pricingStatus: "draft",
      },
    });
  });

  it("sans artwork : pas de frais ; composante SANS_OBJET = non applicable", () => {
    const r = computePrice(entree({ artworkPresent: false, mountingCount: 0 }));
    expect(r.etat === "DEFINIE" && [r.valeur.composantes.artwork, r.valeur.composantes.trous]).toEqual([0, 0]);
  });
});

describe("computePrice — valeurs OPEN (VR-07) : jamais de prix partiel", () => {
  it("montant À VALIDER ou absent ⇒ prix À VALIDER avec chemins", () => {
    expect(codes(computePrice(entree({ rules: regles({ base: aValider() }) })))).toEqual(["priceRules.test-prix.base"]);
    expect(codes(computePrice(entree({ variantId: "autre" })))).toEqual(["priceRules.test-prix.byVariant.autre"]);
  });

  it("format sur mesure : tarification non définie ⇒ À VALIDER", () => {
    expect(codes(computePrice(entree({ format: { mode: "custom", widthMm: 300, heightMm: 200 } })))).toEqual(["priceRules.test-prix.customDimensionPricing"]);
  });

  it("paliers de quantité À VALIDER ⇒ À VALIDER", () => {
    expect(codes(computePrice(entree({ rules: regles({ quantityTiers: { etat: "A_VALIDER" } }) })))).toEqual(["priceRules.test-prix.quantityTiers"]);
  });

  it("catalogue initial sans règles de prix : aucun tarif présumé", () => {
    const vide = regles({ base: aValider(), byVariant: {}, byThickness: {}, byFormat: {}, byWorkflow: {}, byMounting: {}, artworkProcessingFee: aValider() });
    const r = computePrice(entree({ rules: vide }));
    expect(r.etat).toBe("A_VALIDER");
  });
});

describe("prix figé (G2-D7)", () => {
  it("divergence ⇒ PRICE_MISMATCH, jamais corrigée", () => {
    expect(checkPriceUnchanged(5430, 5430)).toEqual([]);
    expect(checkPriceUnchanged(5430, 5500).map((v) => v.code)).toEqual(["PRICE_MISMATCH"]);
  });
});
