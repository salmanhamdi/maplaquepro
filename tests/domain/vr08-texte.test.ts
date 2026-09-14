// VR-08 / SP-3 — faits atelier F1 à F11 et arbitrage Supervisor A1 à A7. Catalogue et tracés de TEST fictifs.
import { describe, expect, it } from "vitest";
import {
  boiteEnglobante,
  type CaractereTrace,
  type Catalog,
  definie,
  evaluateFabricability,
  evaluerTexteTrace,
  hauteurBoiteEnglobanteMm,
  INITIAL_CATALOG,
  type MaterialVariant,
  MIN_CHARACTER_BOUNDING_BOX_HEIGHT_MM,
  MIN_STROKE_WIDTH_MM,
  productionSvg,
  sansObjet,
  traitsSousMinimum,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "./fixtures";

/** Caractère de test : rectangle (x, y, largeur, hauteur) en mm. */
const rect = (caractere: string, x: number, y: number, w: number, h: number): CaractereTrace => ({
  caractere,
  contours: [[{ op: "M", x, y }, { op: "L", x: x + w, y }, { op: "L", x: x + w, y: y + h }, { op: "L", x, y: y + h }, { op: "Z" }]],
});
const plaque = { widthMm: 300, heightMm: 200 };
const codes = (v: { code: string; path: string }[]) => v.map((x) => `${x.code}@${x.path}`);

describe("VR-08 — valeurs arbitrées", () => {
  it("hauteur de boîte englobante minimale 1 mm ; trait minimal de gravure 1 mm", () => {
    expect([MIN_CHARACTER_BOUNDING_BOX_HEIGHT_MM, MIN_STROKE_WIDTH_MM]).toEqual([1, 1]);
  });
});

describe("A — hauteur de boîte englobante (F1, F2)", () => {
  it("exactement 1 mm ⇒ valide ; < 1 mm ⇒ BELOW_LEGIBILITY", () => {
    expect(evaluerTexteTrace({ caracteres: [rect("A", 10, 10, 1, 1)], plaque, zonesTrous: [] })).toEqual([]);
    expect(codes(evaluerTexteTrace({ caracteres: [rect("A", 10, 10, 1, 1), rect("B", 12, 10, 1, 0.999)], plaque, zonesTrous: [] }))).toEqual(["BELOW_LEGIBILITY@design.text.caracteres.1"]);
  });

  it("boîte englobante exacte : les extrema d'une courbe dépassant ses extrémités sont inclus", () => {
    const courbe: CaractereTrace = { caractere: "o", contours: [[{ op: "M", x: 0, y: 0 }, { op: "C", x1: 0, y1: 1, x2: 2, y2: 1, x: 2, y: 0 }, { op: "Z" }]] };
    expect(boiteEnglobante(courbe.contours)).toEqual({ xMin: 0, yMin: 0, xMax: 2, yMax: 0.75 });
    expect(hauteurBoiteEnglobanteMm(courbe)).toBe(0.75);
  });

  it("caractère sans contour (espace) : non mesuré", () => {
    expect(hauteurBoiteEnglobanteMm({ caractere: " ", contours: [] })).toBeNull();
    expect(evaluerTexteTrace({ caracteres: [{ caractere: " ", contours: [] }], plaque, zonesTrous: [] })).toEqual([]);
  });
});

describe("B — trait minimal de gravure (F3)", () => {
  it("exactement 1 mm ⇒ conforme ; < 1 mm ⇒ non conforme (index renvoyé, code non arbitré)", () => {
    expect(traitsSousMinimum([{ index: 0, epaisseurMinMm: 1 }])).toEqual([]);
    expect(traitsSousMinimum([{ index: 0, epaisseurMinMm: 1 }, { index: 1, epaisseurMinMm: 0.99 }])).toEqual([1]);
  });
});

describe("C / G — aucune marge texte de 10 mm ; zone utile = plaque − zones de trous", () => {
  it("caractère à 0,5 mm du bord ⇒ aucune violation", () => {
    expect(evaluerTexteTrace({ caracteres: [rect("A", 0.5, 0.5, 4, 4), rect("B", 295.5, 195.5, 4, 4)], plaque, zonesTrous: [] })).toEqual([]);
  });

  it("caractère touchant la zone d'un trou ⇒ TEXT_TOO_LONG ; hors zone ⇒ valide", () => {
    const zonesTrous = [{ cxMm: 10, cyMm: 10, rMm: 3.5 }];
    expect(codes(evaluerTexteTrace({ caracteres: [rect("A", 12, 8, 4, 4)], plaque, zonesTrous }))).toEqual(["TEXT_TOO_LONG@design.text"]);
    expect(evaluerTexteTrace({ caracteres: [rect("A", 14, 8, 4, 4)], plaque, zonesTrous })).toEqual([]);
  });
});

describe("D — texte trop grand (F6)", () => {
  it("dépassement de la plaque ⇒ TEXT_TOO_LONG ; tracés reçus non modifiés, aucun redimensionnement", () => {
    const caracteres = [rect("A", 290, 10, 12, 20)];
    const avant = structuredClone(caracteres);
    expect(codes(evaluerTexteTrace({ caracteres, plaque, zonesTrous: [] }))).toEqual(["TEXT_TOO_LONG@design.text"]);
    expect(caracteres).toEqual(avant);
  });
});

// ---------- Intégration dans evaluateFabricability ----------

const plexi: MaterialVariant = referenceTest({
  id: "test-plexi",
  family: "plexiglass",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "PLEXIGLASS_UV",
  artworkRulesId: "artwork-PLEXIGLASS_UV",
  politiqueImpression: { valeur: definie("couleur"), cote: definie("envers") },
  apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  dimensionRulesIds: ["test-dim-plexi"],
  mountingRulesId: "mounting-default",
});

const catalogue = (police = "test-font"): Catalog => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, plexi],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id], allowedFonts: [police] })),
    dimensionRules: [
      { id: "test-dim-plexi", variantId: plexi.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" },
    ],
    mountingRules: [...INITIAL_CATALOG.mountingRules],
  };
};

const config = (o: Record<string, unknown> = {}) => ({
  configurationVersion: 4,
  productId: "test-produit",
  materialVariantId: plexi.id,
  thicknessId: "th_3_0",
  format: { mode: "custom", widthMm: 300, heightMm: 200 },
  design: { text: { lines: ["AB"], fontId: "test-font", layoutId: "test-layout", alignment: "center" }, artwork: null },
  mounting: { count: 0 },
  quantity: 1,
  ...o,
});
const glyphes = new Set([..."AB"]);

describe("evaluateFabricability — texte tracé", () => {
  it("impression (Plexiglass) : tracés conformes ⇒ fabricable ; aucun contrôle de trait de gravure", () => {
    const r = evaluateFabricability(config(), catalogue(), { glyphesDisponibles: glyphes, texteTrace: [rect("A", 100, 90, 8, 10), rect("B", 110, 90, 8, 10)] });
    expect(r.ok).toBe(true);
  });

  it("tracés absents ⇒ VALIDATION_REQUIRED (SP-3) ; hauteur < 1 mm ⇒ BELOW_LEGIBILITY ; dépassement ⇒ TEXT_TOO_LONG", () => {
    expect(codes(evaluateFabricability(config(), catalogue(), { glyphesDisponibles: glyphes }).ok ? [] : (evaluateFabricability(config(), catalogue(), { glyphesDisponibles: glyphes }) as { violations: { code: string; path: string }[] }).violations)).toEqual([
      "VALIDATION_REQUIRED@design.text.effectiveFontSizeMm",
    ]);
    const r = evaluateFabricability(config(), catalogue(), { glyphesDisponibles: glyphes, texteTrace: [rect("A", 100, 90, 0.5, 0.5), rect("B", 295, 90, 8, 10)] });
    expect(!r.ok && codes(r.violations)).toEqual(["BELOW_LEGIBILITY@design.text.caracteres.0", "TEXT_TOO_LONG@design.text"]);
  });

  it("gravure : contrôle du trait non arbitré (mesure, code) ⇒ VALIDATION_REQUIRED, jamais présumé conforme", () => {
    const trolaseConfig = config({ materialVariantId: "test-ref-trolase", thicknessId: "th_1_6" });
    const r = evaluateFabricability(trolaseConfig, catalogue(), { glyphesDisponibles: glyphes, texteTrace: [rect("A", 100, 90, 8, 10)] });
    expect(!r.ok && codes(r.violations)).toContain("VALIDATION_REQUIRED@design.text.traits");
  });

  it("E — polices : aucune liste imposée par le domaine ; glyphe absent ⇒ UNSUPPORTED_GLYPHS (le client change de police)", () => {
    const quelconque = evaluateFabricability(config({ design: { text: { lines: ["AB"], fontId: "Police quelconque", layoutId: "test-layout", alignment: "center" }, artwork: null } }), catalogue("Police quelconque"), {
      glyphesDisponibles: glyphes,
      texteTrace: [rect("A", 100, 90, 8, 10), rect("B", 110, 90, 8, 10)],
    });
    expect(quelconque.ok).toBe(true);
    const absent = evaluateFabricability(config(), catalogue(), { glyphesDisponibles: new Set(["A"]), texteTrace: [rect("A", 100, 90, 8, 10), rect("B", 110, 90, 8, 10)] });
    expect(!absent.ok && codes(absent.violations)).toEqual(["UNSUPPORTED_GLYPHS@design.text.lines"]);
  });
});

describe("F — tracés de gravure : aucune transformation après conversion (F10, F11)", () => {
  it("les tracés du texte sont écrits tels quels dans ENGRAVE (côté face) : ni compensation, ni simplification", () => {
    const a = rect("A", 10.25, 20.5, 3, 4.125);
    const svg = productionSvg({ plaque: { widthMm: 300, heightMm: 200, cornerRadiusMm: 0 }, cote: "face", miroir: "none", engrave: a.contours, cut: true, holes: [], tracabilite: { batId: "b", batHash: "h", geometryHash: "g", catalogVersion: "v" } });
    expect(svg).toContain('<path d="M10.25 20.5 L13.25 20.5 L13.25 24.625 L10.25 24.625 Z" fill="#000000" stroke="none"/>');
  });
});

describe("S4 (validé Supervisor) — caractère empiétant sur la zone d'un trou ⇒ TEXT_TOO_LONG", () => {
  // Paramètres de trous FICTIFS de test : VR-22 à VR-24 restent À VALIDER dans le catalogue réel.
  const avecTrous = (): Catalog => {
    const c = catalogue();
    return {
      ...c,
      mountingRules: [
        {
          ...INITIAL_CATALOG.mountingRules[0]!,
          holeDiameterMm: definie(4),
          minEdgeDistanceMm: definie(2),
          holeKeepOutMarginMm: definie(1.5),
          edgeDistanceSemantics: definie("edge_to_center"),
          twoHolesDisposition: definie("horizontal_centered"),
        },
      ],
    };
  };
  const trous = { mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 } };

  it("trous (10, 100) et (290, 100), zone de rayon 3,5 : caractère sur la zone ⇒ TEXT_TOO_LONG ; à côté ⇒ fabricable", () => {
    const sur = evaluateFabricability(config(trous), avecTrous(), { glyphesDisponibles: glyphes, texteTrace: [rect("A", 12, 96, 8, 8), rect("B", 150, 96, 8, 8)] });
    expect(!sur.ok && codes(sur.violations)).toEqual(["TEXT_TOO_LONG@design.text"]);
    const cote = evaluateFabricability(config(trous), avecTrous(), { glyphesDisponibles: glyphes, texteTrace: [rect("A", 14, 96, 8, 8), rect("B", 150, 96, 8, 8)] });
    expect(cote.ok).toBe(true);
  });
});
