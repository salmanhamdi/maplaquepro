// Valeurs de TEST fictives (trous, marges) ; aucune valeur atelier.
import { describe, expect, it } from "vitest";
import {
  type ArtworkMetadata,
  type ArtworkPlacement,
  type ArtworkRules,
  definie,
  dpiEffectif,
  empriseArtwork,
  evaluateArtwork,
  INITIAL_CATALOG,
  type MaterialVariant,
  sansObjet,
} from "../../src/domain";
import { referenceTest } from "./fixtures";

const regles = (id: string): ArtworkRules => INITIAL_CATALOG.artworkRules.find((a) => a.workflowId === id)!;
const placement = (o: Partial<ArtworkPlacement> = {}): ArtworkPlacement => ({ artworkRef: "a", xMm: 10, yMm: 10, widthMm: 50.8, heightMm: 25.4, rotationDeg: 0, ...o });
const svg = (o: Partial<ArtworkMetadata> = {}): ArtworkMetadata => ({ format: "svg", bytes: 1000, contientCouleur: false, ...o });
const png = (o: Partial<ArtworkMetadata> = {}): ArtworkMetadata => ({ format: "png", bytes: 1000, pixels: { width: 600, height: 300 }, contientCouleur: false, ...o });

const troglass: MaterialVariant = referenceTest({
  id: "t-troglass",
  family: "troglass_metallic",
  productionWorkflowId: "TROGLASS_METALLIC_HYBRID",
  politiqueImpression: { valeur: definie("noir_uniquement"), cote: definie("envers") },
  capaciteGravure: { cote: definie("envers") },
});
const plexi = (valeur: "noir_uniquement" | "couleur"): MaterialVariant =>
  referenceTest({
    id: "t-plexi",
    family: "plexiglass",
    productionWorkflowId: "PLEXIGLASS_UV",
    politiqueImpression: { valeur: definie(valeur), cote: definie("face") },
    apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
  });

const evaluer = (reference: MaterialVariant, meta: ArtworkMetadata, o: Partial<Parameters<typeof evaluateArtwork>[0]> = {}) =>
  evaluateArtwork({
    placement: placement(),
    meta,
    rules: { ...regles(reference.productionWorkflowId), maxBytes: definie(10_000) },
    reference,
    plaque: { widthMm: 200, heightMm: 100 },
    holes: [],
    holeKeepOutMarginMm: null,
    ...o,
  });
const codes = (r: { violations: { code: string }[] }) => r.violations.map((v) => v.code);

describe("Artwork — destination et mode couleur dérivés du workflow (§9.2, §10, INV-15)", () => {
  it("couche d'après le workflow, jamais d'après les couleurs", () => {
    expect(evaluer(referenceTest(), svg({ contientCouleur: true })).couche).toBe("engrave");
    expect(evaluer(plexi("couleur"), svg()).couche).toBe("print");
    expect(evaluer(troglass, svg()).couche).toBe("engrave_et_print");
    expect(evaluer(troglass, svg()).modeCouleur).toBe("noir_uniquement");
  });
});

describe("Artwork — formats et raster (VR-28, décision TroGlass)", () => {
  it("TroLase : raster refusé ; SVG accepté", () => {
    expect(codes(evaluer(referenceTest(), png()))).toContain("ARTWORK_RASTER_REJECTED");
    expect(codes(evaluer(referenceTest(), svg()))).toEqual([]);
  });

  it("TroGlass : raster accepté, conversion bilevel à catégorie ART-1 À VALIDER (ART1-DOC)", () => {
    const r = evaluer(troglass, png(), { rules: { ...regles("TROGLASS_METALLIC_HYBRID"), maxBytes: definie(10_000), minDpiAtPlacedSize: definie(1) } });
    expect(codes(r)).toEqual([]);
    expect(r.transformations).toEqual([{ kind: "bilevel", visible: true, categorie: { etat: "A_VALIDER" } }]);
  });

  it("Plexiglass : politique raster À VALIDER ⇒ VALIDATION_REQUIRED, jamais accepté", () => {
    expect(evaluer(plexi("couleur"), png()).violations).toContainEqual(expect.objectContaining({ code: "VALIDATION_REQUIRED", path: "artworkRules.artwork-PLEXIGLASS_UV.rasterPolicy" }));
  });

  it("maxPixels (50 000 000) dépassé ; pixels absents pour un raster", () => {
    expect(codes(evaluer(troglass, png({ pixels: { width: 10_000, height: 5_001 } })))).toContain("ARTWORK_TOO_MANY_PIXELS");
    expect(codes(evaluer(troglass, png({ pixels: undefined })))).toContain("ARTWORK_PIXELS_UNKNOWN");
  });
});

describe("Artwork — valeurs OPEN isolées", () => {
  it("maxBytes À VALIDER (OD-25) ⇒ VALIDATION_REQUIRED ; défini ⇒ contrôle", () => {
    expect(evaluateArtwork({ placement: placement(), meta: svg(), rules: regles("TROLASE_ENGRAVE"), reference: referenceTest(), plaque: { widthMm: 200, heightMm: 100 }, holes: [], holeKeepOutMarginMm: null }).violations).toEqual([
      expect.objectContaining({ code: "VALIDATION_REQUIRED", path: "artworkRules.artwork-TROLASE_ENGRAVE.maxBytes" }),
    ]);
    expect(codes(evaluer(referenceTest(), svg({ bytes: 20_000 })))).toEqual(["ARTWORK_TOO_LARGE"]);
  });

  it("DPI effectif calculé ; seuil À VALIDER (VR-27) ⇒ VALIDATION_REQUIRED, aucun seuil présumé", () => {
    const r = evaluer(troglass, png());
    expect(r.dpiEffectif).toBe(300);
    expect(r.violations).toEqual([expect.objectContaining({ code: "VALIDATION_REQUIRED", path: "artworkRules.artwork-TROGLASS_METALLIC_HYBRID.minDpiAtPlacedSize" })]);
    const bas = evaluer(troglass, png(), { rules: { ...regles("TROGLASS_METALLIC_HYBRID"), maxBytes: definie(10_000), minDpiAtPlacedSize: definie(400) } });
    expect(codes(bas)).toEqual(["ARTWORK_DPI_TOO_LOW"]);
  });

  it("dpiEffectif : axe le plus faible, indépendant de la rotation", () => {
    expect(dpiEffectif({ width: 600, height: 200 }, placement())).toBe(200);
    expect(dpiEffectif({ width: 600, height: 300 }, placement({ rotationDeg: 90 }))).toBe(300);
  });
});

describe("Artwork — placement", () => {
  it("emprise après rotation 90° : largeur et hauteur échangées", () => {
    expect(empriseArtwork(placement({ rotationDeg: 90 }))).toEqual({ xMin: 10, yMin: 10, xMax: 35.4, yMax: 60.8 });
  });

  it("hors plaque ⇒ ARTWORK_OUT_OF_BOUNDS", () => {
    expect(codes(evaluer(referenceTest(), svg(), { placement: placement({ xMm: 160 }) }))).toEqual(["ARTWORK_OUT_OF_BOUNDS"]);
    expect(codes(evaluer(referenceTest(), svg(), { placement: placement({ yMm: 70, rotationDeg: 90 }) }))).toEqual(["ARTWORK_OUT_OF_BOUNDS"]);
  });

  it("zone d'un trou : chevauchement ⇒ ARTWORK_KEEPOUT ; marge non validée ⇒ VALIDATION_REQUIRED", () => {
    const holes = [{ cxMm: 8, cyMm: 20, diameterMm: 2 }];
    expect(codes(evaluer(referenceTest(), svg(), { holes, holeKeepOutMarginMm: 1.5 }))).toEqual(["ARTWORK_KEEPOUT"]);
    expect(codes(evaluer(referenceTest(), svg(), { holes, holeKeepOutMarginMm: 0.5 }))).toEqual([]);
    expect(codes(evaluer(referenceTest(), svg(), { holes, holeKeepOutMarginMm: null }))).toEqual(["VALIDATION_REQUIRED"]);
  });
});

describe("Artwork — transformations imposées (ART1-D1, D5)", () => {
  it("TroLase avec couleur : version normalisée monochrome, catégorie B visible", () => {
    expect(evaluer(referenceTest(), svg({ contientCouleur: true })).transformations).toEqual([{ kind: "monochrome_couleur_revelee", visible: true, categorie: { etat: "DEFINIE", valeur: "B" } }]);
    expect(evaluer(referenceTest(), svg()).transformations).toEqual([]);
  });

  it("Plexiglass noir uniquement avec couleur : conversion noire B ; couleur : aucune transformation", () => {
    expect(evaluer(plexi("noir_uniquement"), svg({ contientCouleur: true })).transformations).toEqual([{ kind: "noir", visible: true, categorie: { etat: "DEFINIE", valeur: "B" } }]);
    expect(evaluer(plexi("couleur"), svg({ contientCouleur: true })).transformations).toEqual([]);
  });

  it("TroGlass SVG avec couleur : version normalisée noire B", () => {
    expect(evaluer(troglass, svg({ contientCouleur: true })).transformations).toEqual([{ kind: "noir", visible: true, categorie: { etat: "DEFINIE", valeur: "B" } }]);
  });
});
