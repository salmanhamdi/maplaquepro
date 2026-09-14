import { describe, expect, it } from "vitest";
import { aValider, definie, sansObjet, validateCatalog, validateReference } from "../../src/domain";
import { catalogueTest, couleurTest, referenceTest } from "./fixtures";

const codes = (ref: Parameters<typeof validateReference>[0]) => validateReference(ref).map((v) => v.code);

describe("invariants d'une référence (Annexe A)", () => {
  it("accepte une référence de test cohérente", () => {
    expect(codes(referenceTest())).toEqual([]);
    expect(validateCatalog(catalogueTest())).toEqual([]);
  });

  it("INV-02 : une référence active ne peut avoir aucune propriété obligatoire À VALIDER", () => {
    expect(codes(referenceTest({ manufacturer: aValider() }))).toContain("ACTIVE_REFERENCE_WITH_PENDING_PROPERTY");
    expect(codes(referenceTest({ manufacturer: aValider(), statut: "validation_required" }))).toEqual([]);
  });

  it("INV-03 : épaisseurs dans celles de la famille ; TroGlass À VALIDER interdit l'activation", () => {
    expect(codes(referenceTest({ thicknessIds: ["th_5_0"] }))).toContain("THICKNESS_NOT_ALLOWED_FOR_FAMILY");
    const troglass = referenceTest({
      family: "troglass_metallic",
      productionWorkflowId: "TROGLASS_METALLIC_HYBRID",
      artworkRulesId: "artwork-TROGLASS_METALLIC_HYBRID",
      capaciteGravure: { cote: definie("envers") },
      politiqueImpression: { valeur: definie("noir_uniquement"), cote: definie("envers") },
    });
    expect(codes(troglass)).toContain("ACTIVE_REFERENCE_WITH_PENDING_FAMILY_THICKNESSES");
    expect(codes({ ...troglass, statut: "validation_required" })).toEqual([]);
  });

  it("INV-07 : le workflow découle de la famille", () => {
    expect(codes(referenceTest({ productionWorkflowId: "PLEXIGLASS_UV" }))).toContain("WORKFLOW_FAMILY_MISMATCH");
  });

  it("INV-04 : gravure laser → politique « aucune », gravure face, couleur révélée", () => {
    expect(codes(referenceTest({ politiqueImpression: { valeur: definie("couleur"), cote: definie("face") } }))).toContain("ENGRAVE_FAMILY_PRINT_POLICY");
    expect(codes(referenceTest({ capaciteGravure: { cote: definie("envers") } }))).toContain("ENGRAVE_FAMILY_ENGRAVING_SIDE");
    expect(
      codes(referenceTest({ apparence: { couleurSurface: definie(couleurTest), finition: definie("f"), couleurRevelee: sansObjet() } })),
    ).toContain("ENGRAVE_FAMILY_REVEALED_COLOR");
  });

  it("INV-05 : Plexiglass → jamais sans impression en MVP ; couleur révélée SANS_OBJET", () => {
    const plexi = referenceTest({
      family: "plexiglass",
      thicknessIds: ["th_3_0"],
      productionWorkflowId: "PLEXIGLASS_UV",
      artworkRulesId: "artwork-PLEXIGLASS_UV",
      capaciteGravure: { cote: sansObjet() },
      apparence: { couleurSurface: definie(couleurTest), finition: definie("f"), couleurRevelee: sansObjet() },
      politiqueImpression: { valeur: definie("noir_uniquement"), cote: definie("face") },
    });
    expect(codes(plexi)).toEqual([]);
    expect(codes({ ...plexi, politiqueImpression: { valeur: definie("aucune"), cote: sansObjet() } })).toContain("PLEXIGLASS_WITHOUT_PRINT_FORBIDDEN");
    expect(codes({ ...plexi, apparence: { ...plexi.apparence, couleurRevelee: definie(couleurTest) } })).toContain("PLEXIGLASS_REVEALED_COLOR_NOT_APPLICABLE");
  });

  it("INV-06 : TroGlass → noir uniquement, gravure et impression envers", () => {
    const troglass = referenceTest({
      family: "troglass_metallic",
      productionWorkflowId: "TROGLASS_METALLIC_HYBRID",
      artworkRulesId: "artwork-TROGLASS_METALLIC_HYBRID",
      statut: "validation_required",
      capaciteGravure: { cote: definie("envers") },
      politiqueImpression: { valeur: definie("couleur"), cote: definie("face") },
    });
    const c = codes(troglass);
    expect(c).toContain("TROGLASS_PRINT_POLICY");
    expect(c).toContain("TROGLASS_PRINT_SIDE");
  });

  it("la politique d'impression n'est jamais SANS_OBJET (« aucune » est une valeur)", () => {
    expect(codes(referenceTest({ politiqueImpression: { valeur: sansObjet(), cote: sansObjet() } }))).toContain(
      "PRINT_POLICY_VALUE_CANNOT_BE_NOT_APPLICABLE",
    );
  });

  it("le catalogue détecte les liens rompus d'une référence", () => {
    const catalog = catalogueTest({ references: [referenceTest({ mountingRulesId: "inconnu", dimensionRulesIds: ["absent"] })] });
    const c = validateCatalog(catalog).map((v) => v.code);
    expect(c).toContain("MOUNTING_RULES_MISSING");
    expect(c).toContain("DIMENSION_RULES_MISSING");
  });
});
