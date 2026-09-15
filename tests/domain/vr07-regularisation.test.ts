// VR-07 régularisation (arbitrage Supervisor) — FIXTURES DE TEST fictives : aucun montant, identifiant ni version n'est commercial.
import { describe, expect, it } from "vitest";
import {
  definie,
  estGrilleApplicable,
  INITIAL_CATALOG,
  type PriceRules,
  priceRulesSchema,
  selectionnerGrillePrix,
  validateCatalog,
  validateProductionCatalog,
  validerImmutabiliteGrilles,
} from "../../src/domain";

const grille = (o: Partial<PriceRules> = {}): PriceRules => ({
  id: "grille-fixture",
  version: "fixture-1",
  base: definie(1000),
  byVariant: {},
  byThickness: {},
  byFormat: {},
  customDimensionPricing: { etat: "SANS_OBJET" },
  byWorkflow: {},
  byMounting: {},
  artworkProcessingFee: definie(0),
  quantityTiers: { etat: "SANS_OBJET" },
  vatRate: definie(0.2),
  pricingStatus: "active",
  commercialValidation: "validated",
  ...o,
});

const reel = { paiementReel: true };

describe("VR-07 — validation commerciale distincte de pricingStatus", () => {
  it("schéma : exactement pending | validated, obligatoire ; pricingStatus inchangé", () => {
    expect(priceRulesSchema.safeParse(grille({ commercialValidation: "pending" })).success).toBe(true);
    expect(priceRulesSchema.safeParse({ ...grille(), commercialValidation: "active" }).success).toBe(false);
    const { commercialValidation: _c, ...sans } = grille();
    expect(priceRulesSchema.safeParse(sans).success).toBe(false);
    expect(priceRulesSchema.safeParse({ ...grille(), pricingStatus: "validated" }).success).toBe(false);
  });

  it("A — active + validated ⇒ applicable et sélectionnée", () => {
    expect(estGrilleApplicable(grille())).toBe(true);
    const r = selectionnerGrillePrix([grille()]);
    expect(r.ok && r.grille.id).toBe("grille-fixture");
    expect(validateProductionCatalog({ priceRules: [grille()] }, reel)).toEqual([]);
  });

  it("B — active + pending ⇒ non applicable", () => {
    expect(estGrilleApplicable(grille({ commercialValidation: "pending" }))).toBe(false);
    expect(selectionnerGrillePrix([grille({ commercialValidation: "pending" })]).ok).toBe(false);
  });

  it("C — draft ou validation_required + validated ⇒ non applicable", () => {
    for (const pricingStatus of ["draft", "validation_required"] as const) {
      expect(estGrilleApplicable(grille({ pricingStatus }))).toBe(false);
      expect(selectionnerGrillePrix([grille({ pricingStatus })]).ok).toBe(false);
    }
  });
});

describe("GATE 6 — validateProductionCatalog (garde-fou pur)", () => {
  it("D — zéro grille applicable avec paiement réel ⇒ VALIDATION_REQUIRED", () => {
    for (const priceRules of [[], [grille({ commercialValidation: "pending" })], [grille({ pricingStatus: "draft" })]]) {
      expect(validateProductionCatalog({ priceRules }, reel).map((v) => [v.code, v.path])).toEqual([["VALIDATION_REQUIRED", "priceRules"]]);
    }
  });

  it("E — plusieurs grilles applicables ⇒ échec déterministe (références triées, indépendant de l'ordre)", () => {
    const a = grille({ id: "b-grille", version: "fixture-2" });
    const b = grille({ id: "a-grille", version: "fixture-1" });
    const attendu = [{ code: "VALIDATION_REQUIRED", path: "priceRules", message: "plusieurs grilles tarifaires applicables : a-grille@fixture-1, b-grille@fixture-2 (GATE 6)" }];
    expect(validateProductionCatalog({ priceRules: [a, b] }, reel)).toEqual(attendu);
    expect(validateProductionCatalog({ priceRules: [b, a] }, reel)).toEqual(attendu);
  });

  it("I — catalogue actuel vide : non bloquant hors paiement réel (tests, dev, CI), bloquant avec paiement réel", () => {
    expect(INITIAL_CATALOG.priceRules).toEqual([]);
    expect(validateProductionCatalog(INITIAL_CATALOG, { paiementReel: false })).toEqual([]);
    expect(validateProductionCatalog(INITIAL_CATALOG, reel)).toHaveLength(1);
    expect(validerImmutabiliteGrilles(INITIAL_CATALOG)).toEqual([]);
  });
});

describe("VR-07 — immutabilité intra-catalogue de id@version", () => {
  it("F — même id@version, contenu différent ⇒ rejet (aussi via validateCatalog)", () => {
    const priceRules = [grille(), grille({ base: definie(1001) })];
    expect(validerImmutabiliteGrilles({ priceRules }).map((v) => [v.code, v.path])).toEqual([["VALIDATION_REQUIRED", "priceRules.grille-fixture@fixture-1"]]);
    expect(validateCatalog({ ...INITIAL_CATALOG, priceRules }).map((v) => v.path)).toContain("priceRules.grille-fixture@fixture-1");
    // un changement de statut est aussi un changement de contenu de la grille
    expect(validerImmutabiliteGrilles({ priceRules: [grille(), grille({ commercialValidation: "pending" })] })).toHaveLength(1);
  });

  it("G — même id@version, contenu identique ⇒ pas de conflit d'immutabilité, mais jamais sélectionnable deux fois", () => {
    // ordre des clés différent : canonicalisation identique
    const { base, ...reste } = grille();
    const reordonnee = { ...reste, base } as PriceRules;
    expect(validerImmutabiliteGrilles({ priceRules: [grille(), reordonnee] })).toEqual([]);
    expect(selectionnerGrillePrix([grille(), reordonnee]).ok).toBe(false);
    expect(validateProductionCatalog({ priceRules: [grille(), reordonnee] }, reel)).toHaveLength(1);
  });

  it("H — même id, versions différentes ⇒ coexistence autorisée ; seule la version applicable est retenue", () => {
    const ancienne = grille({ version: "fixture-0", base: definie(900), pricingStatus: "draft" });
    const nouvelle = grille({ version: "fixture-1" });
    expect(validerImmutabiliteGrilles({ priceRules: [ancienne, nouvelle] })).toEqual([]);
    const r = selectionnerGrillePrix([ancienne, nouvelle]);
    expect(r.ok && r.grille.version).toBe("fixture-1");
    expect(ancienne.base).toEqual(definie(900));
  });
});
