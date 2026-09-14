// Données de TEST uniquement — fictives, jamais utilisées comme catalogue ni présentées comme références réelles.
import { aValider, type Catalog, definie, INITIAL_CATALOG, type MaterialVariant, sansObjet } from "../../src/domain";

export const couleurTest = { name: "Couleur de test", hex: "#123456" };

export function referenceTest(overrides: Partial<MaterialVariant> = {}): MaterialVariant {
  return {
    id: "test-ref-trolase",
    manufacturer: definie("Fabricant de test"),
    reference: definie("REF-TEST"),
    family: "trolase",
    label: "Référence de test",
    thicknessIds: ["th_1_6"],
    apparence: { couleurSurface: definie(couleurTest), finition: definie("finition de test"), couleurRevelee: definie(couleurTest) },
    capaciteGravure: { cote: definie("face") },
    politiqueImpression: { valeur: definie("aucune"), cote: sansObjet() },
    productionWorkflowId: "TROLASE_ENGRAVE",
    dimensionRulesIds: [],
    mountingRulesId: "mounting-default",
    artworkRulesId: "artwork-TROLASE_ENGRAVE",
    outdoorStatus: definie("outdoor"),
    swatch: { surface: "#123456" },
    statut: "active",
    ...overrides,
  };
}

export function catalogueTest(overrides: Partial<Catalog> = {}): Catalog {
  return {
    ...INITIAL_CATALOG,
    references: [referenceTest()],
    formats: [{ id: "test-format", label: "Format de test", widthMm: 300, heightMm: 200, cornerRadiusMm: 3, statut: "active" }],
    products: [
      {
        id: "test-produit",
        slug: "test-produit",
        name: "Produit de test",
        allowedVariantIds: ["test-ref-trolase"],
        allowedFormats: ["test-format"],
        allowedLayouts: ["test-layout"],
        allowedFonts: ["test-font"],
        mountingRulesId: "mounting-default",
        statut: "active",
      },
    ],
    ...overrides,
  };
}

export const aValiderTest = aValider;
