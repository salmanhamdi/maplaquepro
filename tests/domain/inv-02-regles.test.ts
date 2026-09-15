// INV-02 sur les règles (décision Supervisor) : une règle contenant au moins une valeur À VALIDER ne peut pas être active.
// Valeurs de TEST fictives ; le catalogue réel n'est pas modifié.
import { describe, expect, it } from "vitest";
import { aValider, type Catalog, definie, INITIAL_CATALOG, type MountingRules, type PriceRules, validateCatalog } from "../../src/domain";

const codes = (c: Catalog) => validateCatalog(c).filter((v) => v.code === "ACTIVE_RULE_WITH_PENDING_VALUE").map((v) => v.path);

const dimension = (o: Partial<Catalog["dimensionRules"][number]> = {}): Catalog["dimensionRules"][number] => ({
  id: "d",
  variantId: "v",
  thicknessId: "th_3_0",
  minWidthMm: definie(50),
  maxWidthMm: definie(400),
  minHeightMm: definie(50),
  maxHeightMm: definie(400),
  statut: "active",
  ...o,
});

const trousResolus: MountingRules = {
  ...INITIAL_CATALOG.mountingRules[0]!,
  id: "m",
  holeDiameterMm: definie(4),
  minEdgeDistanceMm: definie(2),
  holeKeepOutMarginMm: definie(1),
  edgeDistanceSemantics: definie("edge_to_center"),
  twoHolesDisposition: definie("horizontal_centered"),
  cornerRadiusClearanceMm: definie(0),
  statut: "active",
};

const artworkResolu = {
  ...INITIAL_CATALOG.artworkRules.find((a) => a.workflowId === "TROLASE_ENGRAVE")!,
  maxBytes: definie(1000),
  minDpiAtPlacedSize: definie(1),
  minLineWidthMm: definie(1),
  statut: "active" as const,
};

const prixResolu: PriceRules = {
  id: "p",
  version: "fixture-1",
  base: definie(100),
  byVariant: { v: definie(1) },
  byThickness: {},
  byFormat: {},
  customDimensionPricing: { etat: "SANS_OBJET" },
  byWorkflow: {},
  byMounting: {},
  artworkProcessingFee: definie(0),
  quantityTiers: { etat: "SANS_OBJET" },
  vatRate: definie(0.2),
  pricingStatus: "active",
};

const avec = (o: Partial<Catalog>): Catalog => ({ ...INITIAL_CATALOG, ...o });

describe("INV-02 — règles", () => {
  it("catalogue réel : aucune règle active, aucune violation", () => {
    expect(validateCatalog(INITIAL_CATALOG)).toEqual([]);
  });

  it("DimensionRules : valeur À VALIDER ⇒ actif refusé ; résolue ⇒ actif possible ; non active ⇒ admise", () => {
    expect(codes(avec({ dimensionRules: [dimension({ maxWidthMm: aValider() })] }))).toEqual(["dimensionRules.d.maxWidthMm"]);
    expect(codes(avec({ dimensionRules: [dimension({ minAreaMm2: aValider() })] }))).toEqual(["dimensionRules.d.minAreaMm2"]);
    expect(codes(avec({ dimensionRules: [dimension()] }))).toEqual([]);
    expect(codes(avec({ dimensionRules: [dimension({ maxWidthMm: aValider(), statut: "validation_required" })] }))).toEqual([]);
  });

  it("MountingRules : chaque paramètre À VALIDER, y compris dans une surcharge, refuse l'actif", () => {
    for (const p of ["holeDiameterMm", "minEdgeDistanceMm", "holeKeepOutMarginMm", "edgeDistanceSemantics", "twoHolesDisposition", "cornerRadiusClearanceMm"] as const) {
      expect(codes(avec({ mountingRules: [{ ...trousResolus, [p]: aValider() }] }))).toEqual([`mountingRules.m.${p}`]);
    }
    expect(codes(avec({ mountingRules: [{ ...trousResolus, overrides: [{ thicknessId: "th_3_0", holeDiameterMm: aValider() }] }] }))).toEqual(["mountingRules.m.overrides.0.holeDiameterMm"]);
    expect(codes(avec({ mountingRules: [trousResolus] }))).toEqual([]);
  });

  it("ArtworkRules : maxBytes, DPI, trait ou politique raster À VALIDER ⇒ actif refusé ; résolue ⇒ actif possible", () => {
    for (const p of ["maxBytes", "minDpiAtPlacedSize", "minLineWidthMm", "rasterPolicy"] as const) {
      const regles = INITIAL_CATALOG.artworkRules.map((a) => (a.id === artworkResolu.id ? { ...artworkResolu, [p]: aValider() } : a));
      expect(codes(avec({ artworkRules: regles }))).toEqual([`artworkRules.${artworkResolu.id}.${p}`]);
    }
    const resolues = INITIAL_CATALOG.artworkRules.map((a) => (a.id === artworkResolu.id ? artworkResolu : a));
    expect(codes(avec({ artworkRules: resolues }))).toEqual([]);
    expect(validateCatalog(avec({ artworkRules: resolues }))).toEqual([]);
  });

  it("PriceRules : montant, taux, tarification sur mesure ou paliers À VALIDER ⇒ pricingStatus actif refusé", () => {
    expect(codes(avec({ priceRules: [{ ...prixResolu, base: aValider() }] }))).toEqual(["priceRules.p.base"]);
    expect(codes(avec({ priceRules: [{ ...prixResolu, byVariant: { v: aValider() } }] }))).toEqual(["priceRules.p.byVariant.v"]);
    expect(codes(avec({ priceRules: [{ ...prixResolu, vatRate: aValider() }] }))).toEqual(["priceRules.p.vatRate"]);
    expect(codes(avec({ priceRules: [{ ...prixResolu, customDimensionPricing: { etat: "A_VALIDER" } }] }))).toEqual(["priceRules.p.customDimensionPricing"]);
    expect(codes(avec({ priceRules: [{ ...prixResolu, quantityTiers: { etat: "A_VALIDER" } }] }))).toEqual(["priceRules.p.quantityTiers"]);
    const paliers = (montant: PriceRules["base"]): PriceRules["customDimensionPricing"] => ({
      etat: "DEFINIE",
      valeur: { modele: "paliers_dimensions", paliers: [{ id: "P1", grandCoteMinMm: 10, grandCoteMaxMm: 200, petitCoteMinMm: 10, petitCoteMaxMm: 100, montant }] },
    });
    expect(codes(avec({ priceRules: [{ ...prixResolu, customDimensionPricing: paliers(aValider()) }] }))).toEqual(["priceRules.p.customDimensionPricing.valeur.paliers.0.montant"]);
    expect(codes(avec({ priceRules: [{ ...prixResolu, customDimensionPricing: paliers(definie(400)) }] }))).toEqual([]);
    expect(codes(avec({ priceRules: [prixResolu] }))).toEqual([]);
    expect(codes(avec({ priceRules: [{ ...prixResolu, base: aValider(), pricingStatus: "draft" }] }))).toEqual([]);
  });

  it("formats : comportement inchangé (aucune propriété à état, INV-02 non applicable)", () => {
    const formats = [{ id: "f", label: "F", widthMm: 300, heightMm: 200, cornerRadiusMm: 3, statut: "active" as const }];
    expect(validateCatalog(avec({ formats }))).toEqual([]);
  });
});
