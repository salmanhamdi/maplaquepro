import { describe, expect, it } from "vitest";
import { INITIAL_CATALOG, parseConfiguration, validateConfigurationAgainstCatalog } from "../../src/domain";
import { catalogueTest, referenceTest } from "./fixtures";

const valide = {
  configurationVersion: 4,
  productId: "test-produit",
  materialVariantId: "test-ref-trolase",
  thicknessId: "th_1_6",
  format: { mode: "standard", formatId: "test-format" },
  design: { text: { lines: ["Texte de test"], fontId: "test-font", layoutId: "test-layout", alignment: "center" }, artwork: null },
  mounting: { count: 4, mode: "standard", edgeDistanceMm: 3 },
  quantity: 1,
};

describe("configuration client v4 (P13)", () => {
  it("accepte une configuration contenant uniquement les champs autorisés", () => {
    const result = parseConfiguration(valide);
    expect(result.ok).toBe(true);
  });

  it("rejette chaque champ résolu serveur avec un code typé (INV-11)", () => {
    for (const champ of ["price", "geometry", "workflow", "operations", "orientationDePose", "zoneMachine", "encre", "modeCouleur", "artifacts"]) {
      const result = parseConfiguration({ ...valide, [champ]: "x" });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.violations).toContainEqual(expect.objectContaining({ code: "FORBIDDEN_CLIENT_FIELD", path: champ }));
    }
  });

  it("rejette un champ inconnu, y compris imbriqué", () => {
    const racine = parseConfiguration({ ...valide, bonus: true });
    expect(!racine.ok && racine.violations[0]?.code).toBe("UNKNOWN_FIELD");
    const imbrique = parseConfiguration({ ...valide, design: { ...valide.design, couleur: "#fff" } });
    expect(!imbrique.ok && imbrique.violations[0]?.path).toBe("design.couleur");
  });

  it("rejette une version de configuration différente de 4 et ne corrige aucune valeur (INV-12)", () => {
    expect(parseConfiguration({ ...valide, configurationVersion: 3 }).ok).toBe(false);
    const decimale = parseConfiguration({ ...valide, mounting: { count: 4, mode: "standard", edgeDistanceMm: 3.04 } });
    expect(decimale.ok).toBe(false);
    if (!decimale.ok) expect(decimale.violations[0]?.code).toBe("INVALID_VALUE");
  });

  it("vérifie la cohérence avec le catalogue sans correction", () => {
    const parsed = parseConfiguration(valide);
    if (!parsed.ok) throw new Error("configuration attendue valide");
    expect(validateConfigurationAgainstCatalog(parsed.value, catalogueTest())).toEqual([]);

    const codes = validateConfigurationAgainstCatalog({ ...parsed.value, thicknessId: "th_5_0" }, catalogueTest()).map((v) => v.code);
    expect(codes).toContain("THICKNESS_NOT_AVAILABLE_FOR_REFERENCE");
  });

  it("refuse toute référence non active, dont l'ensemble du catalogue initial", () => {
    const parsed = parseConfiguration(valide);
    if (!parsed.ok) throw new Error("configuration attendue valide");
    const inactif = catalogueTest({ references: [referenceTest({ statut: "validation_required" })] });
    expect(validateConfigurationAgainstCatalog(parsed.value, inactif).map((v) => v.code)).toContain("REFERENCE_NOT_AVAILABLE");
    const initial = validateConfigurationAgainstCatalog(parsed.value, INITIAL_CATALOG).map((v) => v.code);
    expect(initial).toContain("PRODUCT_NOT_AVAILABLE");
    expect(initial).toContain("REFERENCE_NOT_AVAILABLE");
  });
});
