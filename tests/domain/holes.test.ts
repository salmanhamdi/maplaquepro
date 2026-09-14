// Paramètres de trous FICTIFS, pour tester les formules §11.3 : aucune valeur atelier (VR-22 à VR-24 restent À VALIDER).
import { describe, expect, it } from "vitest";
import {
  definie,
  generateHoles,
  INITIAL_CATALOG,
  type MountingRules,
  resolveDefaultEdgeDistance,
  resolveMountingRules,
  type ResolvedMountingRules,
  roundMm,
} from "../../src/domain";

const regles = (s: ResolvedMountingRules["edgeDistanceSemantics"] = "edge_to_center"): ResolvedMountingRules => ({
  holeDiameterMm: 4,
  minEdgeDistanceMm: 2,
  holeKeepOutMarginMm: 1,
  edgeDistanceSemantics: s,
  twoHolesDisposition: "horizontal_centered",
});
const plaque = { widthMm: 200, heightMm: 100, cornerRadiusMm: 0 };
const ctx = { variantId: "v", thicknessId: "th_3_0" as const };

describe("roundMm (§10)", () => {
  it("arrondit à 3 décimales, sans -0", () => {
    expect(roundMm(1.23456)).toBe(1.235);
    expect(roundMm(1.0005)).toBe(1.001);
    expect(roundMm(-0.0001)).toBe(0);
  });
});

describe("resolveMountingRules", () => {
  it("catalogue initial : paramètres À VALIDER ⇒ trous indisponibles", () => {
    const r = resolveMountingRules(INITIAL_CATALOG.mountingRules[0]!, ctx);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.violations.map((v) => v.code)).toEqual(Array(4).fill("MOUNTING_PARAMETER_NOT_VALIDATED"));
  });

  const base: MountingRules = {
    ...INITIAL_CATALOG.mountingRules[0]!,
    holeDiameterMm: definie(4),
    minEdgeDistanceMm: definie(2),
    holeKeepOutMarginMm: definie(1),
    edgeDistanceSemantics: definie("edge_to_center"),
  };

  it("résout les paramètres DEFINIE ; disposition à 2 trous non validée ⇒ null", () => {
    const r = resolveMountingRules(base, ctx);
    expect(r).toEqual({ ok: true, value: { ...regles(), twoHolesDisposition: null } });
  });

  it("applique la surcharge correspondant au contexte", () => {
    const r = resolveMountingRules({ ...base, overrides: [{ thicknessId: "th_3_0", holeDiameterMm: definie(5) }] }, ctx);
    expect(r.ok && r.value.holeDiameterMm).toBe(5);
    const autre = resolveMountingRules({ ...base, overrides: [{ thicknessId: "th_5_0", holeDiameterMm: definie(5) }] }, ctx);
    expect(autre.ok && autre.value.holeDiameterMm).toBe(4);
  });

  it("plusieurs surcharges applicables ⇒ rejet (aucune priorité inventée)", () => {
    const r = resolveMountingRules({ ...base, overrides: [{ thicknessId: "th_3_0" }, { variantId: "v" }] }, ctx);
    expect(!r.ok && r.violations[0]!.code).toBe("MOUNTING_OVERRIDE_AMBIGUOUS");
  });
});

describe("generateHoles (§11.3)", () => {
  it("aucun trou", () => {
    expect(generateHoles({ count: 0 }, plaque, regles())).toEqual({ ok: true, value: [] });
  });

  it("2 trous horizontaux centrés verticalement, edge_to_center", () => {
    expect(generateHoles({ count: 2, mode: "standard", edgeDistanceMm: 10 }, plaque, regles())).toEqual({
      ok: true,
      value: [
        { cxMm: 10, cyMm: 50, diameterMm: 4 },
        { cxMm: 190, cyMm: 50, diameterMm: 4 },
      ],
    });
  });

  it("4 trous, edge_to_rim : c = e + d/2", () => {
    const r = generateHoles({ count: 4, mode: "standard", edgeDistanceMm: 10 }, plaque, regles("edge_to_rim"));
    expect(r.ok && r.value.map((h) => [h.cxMm, h.cyMm])).toEqual([
      [12, 12],
      [188, 12],
      [12, 88],
      [188, 88],
    ]);
  });

  it("mode avancé : X et Y distincts, symétriques", () => {
    const r = generateHoles({ count: 4, mode: "advanced", edgeDistanceXMm: 15, edgeDistanceYMm: 8, symmetry: true }, plaque, regles());
    expect(r.ok && r.value.map((h) => [h.cxMm, h.cyMm])).toEqual([
      [15, 8],
      [185, 8],
      [15, 92],
      [185, 92],
    ]);
  });

  it("2 trous sans disposition validée ⇒ rejet", () => {
    const r = generateHoles({ count: 2, mode: "standard", edgeDistanceMm: 10 }, plaque, { ...regles(), twoHolesDisposition: null });
    expect(!r.ok && r.violations[0]!.code).toBe("MOUNTING_PARAMETER_NOT_VALIDATED");
  });

  it("cote sous la distance minimale ⇒ rejet, jamais corrigée", () => {
    const r = generateHoles({ count: 2, mode: "standard", edgeDistanceMm: 1.5 }, plaque, regles());
    expect(!r.ok && r.violations.map((v) => v.code)).toContain("HOLE_EDGE_DISTANCE_BELOW_MINIMUM");
  });

  it("marge autour du trou : c ≥ d/2 + marge", () => {
    const r = generateHoles({ count: 2, mode: "standard", edgeDistanceMm: 2.5 }, plaque, regles());
    expect(!r.ok && r.violations.map((v) => v.code)).toEqual(["HOLE_KEEP_OUT_MARGIN_VIOLATED"]);
  });

  it("2·c + d < W strict", () => {
    const etroite = { widthMm: 24, heightMm: 100, cornerRadiusMm: 0 };
    expect(generateHoles({ count: 2, mode: "standard", edgeDistanceMm: 10 }, etroite, regles()).ok).toBe(false);
    expect(generateHoles({ count: 2, mode: "standard", edgeDistanceMm: 9.9 }, etroite, regles()).ok).toBe(true);
  });

  it("centre dans la zone d'arrondi ⇒ rejet", () => {
    const r = generateHoles({ count: 4, mode: "standard", edgeDistanceMm: 5 }, { ...plaque, cornerRadiusMm: 6 }, regles());
    expect(!r.ok && r.violations.map((v) => v.code)).toContain("HOLE_IN_CORNER_RADIUS_ZONE");
  });
});

describe("resolveDefaultEdgeDistance (P11)", () => {
  it("3,0 mm retenu si valide", () => {
    expect(resolveDefaultEdgeDistance(4, plaque, { ...regles(), holeDiameterMm: 2, minEdgeDistanceMm: 1 })).toEqual({ disponible: true, edgeDistanceMm: 3, adapte: false });
  });

  it("sinon plus petite valeur supérieure valide au pas de 0,1, signalée", () => {
    expect(resolveDefaultEdgeDistance(4, plaque, regles())).toEqual({ disponible: true, edgeDistanceMm: 3, adapte: false });
    expect(resolveDefaultEdgeDistance(4, plaque, { ...regles(), holeKeepOutMarginMm: 1.3 })).toEqual({ disponible: true, edgeDistanceMm: 3.3, adapte: true });
  });

  it("aucune valeur valide ⇒ trous indisponibles", () => {
    const r = resolveDefaultEdgeDistance(4, { widthMm: 8, heightMm: 8, cornerRadiusMm: 0 }, regles());
    expect(r.disponible).toBe(false);
    if (!r.disponible) expect(r.violations[0]!.code).toBe("HOLES_UNAVAILABLE");
  });

  it("déterministe : même entrée ⇒ même résultat", () => {
    const a = resolveDefaultEdgeDistance(2, plaque, { ...regles(), minEdgeDistanceMm: 4.2 });
    expect(a).toEqual(resolveDefaultEdgeDistance(2, plaque, { ...regles(), minEdgeDistanceMm: 4.2 }));
    expect(a).toEqual({ disponible: true, edgeDistanceMm: 4.2, adapte: true });
  });
});
