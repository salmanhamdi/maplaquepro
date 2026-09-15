// VR-07 (arbitré) — FIXTURES DE TEST fictives : aucun montant, palier, identifiant ni version de grille n'est commercial.
import { describe, expect, it } from "vitest";
import {
  aValider,
  calculerTvaCentimes,
  checkPriceUnchanged,
  computePrice,
  definie,
  INITIAL_CATALOG,
  type PalierDimensions,
  type PriceRules,
  referenceGrille,
  sansObjet,
  selectionnerGrillePrix,
  TAUX_TVA_POURCENT,
} from "../../src/domain";

const palier = (id: string, grandMin: number, grandMax: number, petitMin: number, petitMax: number, montant: PriceRules["base"]): PalierDimensions => ({
  id,
  grandCoteMinMm: grandMin,
  grandCoteMaxMm: grandMax,
  petitCoteMinMm: petitMin,
  petitCoteMaxMm: petitMax,
  montant,
});

const paliers = (...liste: PalierDimensions[]): PriceRules["customDimensionPricing"] => ({ etat: "DEFINIE", valeur: { modele: "paliers_dimensions", paliers: liste } });

const grille = (o: Partial<PriceRules> = {}): PriceRules => ({
  id: "grille-fixture",
  version: "fixture-1",
  base: definie(1000),
  byVariant: { v: definie(200) },
  byThickness: { th_3_0: definie(50) },
  byFormat: { f: definie(300) },
  customDimensionPricing: paliers(palier("P1", 10, 200, 10, 100, definie(400)), palier("P2", 201, 400, 10, 300, definie(900))),
  byWorkflow: { PLEXIGLASS_UV: definie(150) },
  byMounting: { "0": sansObjet(), "2": definie(40), "4": definie(80) },
  artworkProcessingFee: definie(70),
  quantityTiers: { etat: "SANS_OBJET" },
  vatRate: definie(0.2),
  pricingStatus: "active",
  commercialValidation: "validated",
  ...o,
});

type Entree = Parameters<typeof computePrice>[0];
const entree = (o: Partial<Entree> = {}): Entree => ({
  rules: grille(),
  variantId: "v",
  thicknessId: "th_3_0",
  workflowId: "PLEXIGLASS_UV",
  format: { mode: "custom", widthMm: 150, heightMm: 80 },
  mountingCount: 2,
  artworkPresent: true,
  quantity: 3,
  ...o,
});
const sur = (widthMm: number, heightMm: number, o: Partial<Entree> = {}) => computePrice(entree({ format: { mode: "custom", widthMm, heightMm }, ...o }));
const chemins = (r: ReturnType<typeof computePrice>) => (r.etat === "A_VALIDER" ? r.violations.map((v) => `${v.code}@${v.path}`) : []);
const dims = (r: ReturnType<typeof computePrice>) => (r.etat === "DEFINIE" ? r.valeur.composantes.dimensions : null);

describe("VR-07 — sélection de la grille (serveur)", () => {
  it("exactement une grille active ⇒ sélectionnée ; référence id@version", () => {
    const r = selectionnerGrillePrix([grille({ id: "ancienne", version: "fixture-0", pricingStatus: "draft" }), grille()]);
    expect(r.ok && r.grille.id).toBe("grille-fixture");
    expect(referenceGrille(grille())).toBe("grille-fixture@fixture-1");
  });

  it("zéro grille applicable ⇒ VALIDATION_REQUIRED", () => {
    for (const grilles of [[], [grille({ pricingStatus: "draft" })], [grille({ pricingStatus: "validation_required" })]]) {
      const r = selectionnerGrillePrix(grilles);
      expect(!r.ok && r.violations.map((v) => [v.code, v.path, v.message])).toEqual([["VALIDATION_REQUIRED", "priceRules", "aucune grille tarifaire applicable (VR-07)"]]);
    }
  });

  it("plusieurs grilles applicables ⇒ VALIDATION_REQUIRED, jamais de choix par défaut", () => {
    const r = selectionnerGrillePrix([grille(), grille({ version: "fixture-2" })]);
    expect(!r.ok && r.violations.map((v) => [v.code, v.message])).toEqual([["VALIDATION_REQUIRED", "plusieurs grilles tarifaires applicables (VR-07)"]]);
  });

  it("aucune donnée tarifaire inventée : catalogue réel sans grille ⇒ aucune grille applicable", () => {
    expect(INITIAL_CATALOG.priceRules).toEqual([]);
    expect(selectionnerGrillePrix(INITIAL_CATALOG.priceRules).ok).toBe(false);
  });
});

describe("VR-07 — paliers de dimensions", () => {
  it("palier trouvé : prix complet HT puis TVA puis TTC", () => {
    expect(computePrice(entree())).toEqual({
      etat: "DEFINIE",
      valeur: {
        grille: { id: "grille-fixture", version: "fixture-1" },
        composantes: { base: 1000, reference: 200, epaisseur: 50, dimensions: 400, workflow: 150, artwork: 70, trous: 40 },
        unitaireHtCentimes: 1910,
        quantite: 3,
        totalHtCentimes: 5730,
        tauxTvaPourcent: 20,
        tvaCentimes: 1146,
        totalTtcCentimes: 6876,
        pricingStatus: "active",
      },
    });
  });

  it("aucun palier ⇒ VALIDATION_REQUIRED, jamais de prix par défaut", () => {
    expect(chemins(sur(150, 150))).toEqual(["VALIDATION_REQUIRED@priceRules.grille-fixture.customDimensionPricing.paliers"]);
    expect(chemins(sur(500, 50))).toEqual(["VALIDATION_REQUIRED@priceRules.grille-fixture.customDimensionPricing.paliers"]);
  });

  it("bornes inclusives", () => {
    expect(dims(sur(200, 100))).toBe(400);
    expect(dims(sur(10, 10))).toBe(400);
    expect(dims(sur(201, 10))).toBe(900);
    expect(dims(sur(400, 300))).toBe(900);
    expect(chemins(sur(200, 101)).length).toBe(1);
  });

  it("orientation neutralisée : largeur et hauteur interchangeables", () => {
    expect(sur(80, 150)).toEqual(sur(150, 80));
    expect(sur(300, 250)).toEqual(sur(250, 300));
  });

  it("paliers qui se chevauchent ⇒ VALIDATION_REQUIRED (ambigu), jamais de choix arbitraire", () => {
    const ambigue = grille({ customDimensionPricing: paliers(palier("P1", 10, 200, 10, 100, definie(400)), palier("P1bis", 100, 300, 50, 100, definie(500))) });
    expect(chemins(sur(150, 80, { rules: ambigue }))).toEqual(["VALIDATION_REQUIRED@priceRules.grille-fixture.customDimensionPricing.paliers"]);
  });

  it("montant de palier À VALIDER ⇒ prix À VALIDER (jamais partiel)", () => {
    const r = sur(150, 80, { rules: grille({ customDimensionPricing: paliers(palier("P1", 10, 200, 10, 100, aValider())) }) });
    expect(r.etat).toBe("A_VALIDER");
    expect(chemins(r)).toEqual(["VALIDATION_REQUIRED@priceRules.grille-fixture.customDimensionPricing.paliers.P1.montant"]);
  });

  it("sur mesure À VALIDER ou SANS OBJET ⇒ non tarifable", () => {
    expect(chemins(computePrice(entree({ rules: grille({ customDimensionPricing: { etat: "A_VALIDER" } }) })))).toEqual(["VALIDATION_REQUIRED@priceRules.grille-fixture.customDimensionPricing"]);
    expect(chemins(computePrice(entree({ rules: grille({ customDimensionPricing: { etat: "SANS_OBJET" } }) })))).toEqual(["CUSTOM_DIMENSIONS_NOT_PRICED@priceRules.grille-fixture.customDimensionPricing"]);
  });

  it("format standard : montant du format", () => {
    expect(dims(computePrice(entree({ format: { mode: "standard", formatId: "f" } })))).toBe(300);
  });
});

describe("VR-07 — quantité, texte, options", () => {
  it("quantityTiers SANS OBJET ⇒ prix calculé ; À VALIDER ⇒ bloqué", () => {
    expect(computePrice(entree()).etat).toBe("DEFINIE");
    expect(chemins(computePrice(entree({ rules: grille({ quantityTiers: { etat: "A_VALIDER" } }) })))).toEqual(["VALIDATION_REQUIRED@priceRules.grille-fixture.quantityTiers"]);
  });

  it("texte et options SANS OBJET : aucune composante dédiée", () => {
    const r = computePrice(entree());
    expect(r.etat === "DEFINIE" && Object.keys(r.valeur.composantes).sort()).toEqual(["artwork", "base", "dimensions", "epaisseur", "reference", "trous", "workflow"]);
  });

  it("sans artwork ni trou : composantes à 0", () => {
    const r = computePrice(entree({ artworkPresent: false, mountingCount: 0 }));
    expect(r.etat === "DEFINIE" && [r.valeur.composantes.artwork, r.valeur.composantes.trous]).toEqual([0, 0]);
  });
});

describe("VR-07 — TVA 20 %, HT / TTC, arrondi", () => {
  it("taux arbitré 20 % ; TTC = HT + TVA", () => {
    expect(TAUX_TVA_POURCENT).toBe(20);
    const r = computePrice(entree());
    if (r.etat !== "DEFINIE") throw new Error("prix attendu");
    expect(r.valeur.totalTtcCentimes).toBe(r.valeur.totalHtCentimes + r.valeur.tvaCentimes);
    expect(r.valeur.tauxTvaPourcent).toBe(20);
  });

  it("taux absent, sans objet ou différent de 20 % ⇒ VALIDATION_REQUIRED", () => {
    for (const vatRate of [aValider<number>(), sansObjet<number>(), definie(0.19), definie(0.055), definie(0)]) {
      expect(chemins(computePrice(entree({ rules: grille({ vatRate }) })))).toEqual(["VALIDATION_REQUIRED@priceRules.grille-fixture.vatRate"]);
    }
  });

  it("arrondi au centime, déterministe, en arithmétique entière, une seule fois sur le total HT", () => {
    expect([0, 1, 2, 3, 7, 8, 9, 10, 5730, 123457].map(calculerTvaCentimes)).toEqual([0, 0, 0, 1, 1, 2, 2, 2, 1146, 24691]);
    expect(computePrice(entree())).toEqual(computePrice(entree()));
  });
});

describe("VR-07 — prix jamais partiel, jamais corrigé", () => {
  it("montant À VALIDER ou absent ⇒ prix À VALIDER avec chemins, sans valeur", () => {
    const r = computePrice(entree({ rules: grille({ base: aValider() }) }));
    expect(r).toEqual({ etat: "A_VALIDER", violations: [expect.objectContaining({ path: "priceRules.grille-fixture.base" })] });
    expect(chemins(computePrice(entree({ variantId: "autre" })))).toEqual(["VALIDATION_REQUIRED@priceRules.grille-fixture.byVariant.autre"]);
  });

  it("divergence ⇒ PRICE_MISMATCH, jamais corrigée", () => {
    expect(checkPriceUnchanged(6876, 6876)).toEqual([]);
    expect(checkPriceUnchanged(6876, 6900).map((v) => v.code)).toEqual(["PRICE_MISMATCH"]);
  });
});
