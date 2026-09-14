import { describe, expect, it } from "vitest";
import {
  aValider,
  definie,
  type DimensionRules,
  evaluerDimensions,
  evaluerPoses,
  MACHINE_CAPABILITIES,
  orientationDePose,
  PRODUCTION_WORKFLOWS,
  sansObjet,
} from "../../src/domain";

const workflow = (id: string) => PRODUCTION_WORKFLOWS.find((w) => w.id === id)!;
const ARTISJET = { widthMm: 347, heightMm: 490 };

describe("orientation de pose (§7.4, P6) — tests normatifs", () => {
  it("347 × 490 admissible tel quel", () => expect(orientationDePose(347, 490, ARTISJET, true)).toBe("tel_quel"));
  it("490 × 347 admissible tournée", () => expect(orientationDePose(490, 347, ARTISJET, true)).toBe("tournee"));
  it("347,1 × 490 rejet", () => expect(orientationDePose(347.1, 490, ARTISJET, true)).toBeNull());
  it("347 × 490,1 rejet", () => expect(orientationDePose(347, 490.1, ARTISJET, true)).toBeNull());
  it("tel quel retenu par défaut quand les deux sont admissibles", () => expect(orientationDePose(100, 100, ARTISJET, true)).toBe("tel_quel"));
  it("tournée non autorisée ⇒ rejet", () => expect(orientationDePose(490, 347, ARTISJET, false)).toBeNull());
});

describe("evaluerPoses — intersection sur toutes les opérations (Annexe B étapes 4-5)", () => {
  it("exemple normatif : Plexiglass 500 × 300 ⇒ Speedy OK, ArtisJet NON", () => {
    const r = evaluerPoses(workflow("PLEXIGLASS_UV"), MACHINE_CAPABILITIES, 500, 300);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.violations).toEqual([expect.objectContaining({ code: "EXCEEDS_MACHINE", path: "workflows.PLEXIGLASS_UV.operations.2" })]);
  });

  it("Plexiglass 300 × 200 : poses enregistrées par opération, tel quel", () => {
    expect(evaluerPoses(workflow("PLEXIGLASS_UV"), MACHINE_CAPABILITIES, 300, 200)).toEqual({
      ok: true,
      poses: [
        { operationSequence: 1, machineId: "SPEEDY_400", zoneMachine: { widthMm: 1010, heightMm: 610 }, orientationDePose: "tel_quel" },
        { operationSequence: 2, machineId: "ARTISJET_3000U", zoneMachine: ARTISJET, orientationDePose: "tel_quel" },
      ],
    });
  });

  it("TroGlass 480 × 340 : ArtisJet en pose tournée", () => {
    const r = evaluerPoses(workflow("TROGLASS_METALLIC_HYBRID"), MACHINE_CAPABILITIES, 480, 340);
    expect(r.ok && r.poses.map((p) => p.orientationDePose)).toEqual(["tel_quel", "tel_quel", "tournee"]);
  });

  it("TroLase : découpe conditionnelle À VALIDER (VR-34) ⇒ VALIDATION_REQUIRED", () => {
    const r = evaluerPoses(workflow("TROLASE_ENGRAVE"), MACHINE_CAPABILITIES, 300, 200);
    expect(!r.ok && r.violations.map((v) => v.code)).toEqual(["VALIDATION_REQUIRED"]);
  });

  it("machine absente ou non validée ⇒ MACHINE_UNAVAILABLE", () => {
    const machines = MACHINE_CAPABILITIES.map((m) => (m.machineId === "ARTISJET_3000U" ? { ...m, statut: "validation_required" as const } : m));
    const r = evaluerPoses(workflow("PLEXIGLASS_UV"), machines, 300, 200);
    expect(!r.ok && r.violations.map((v) => v.code)).toEqual(["MACHINE_UNAVAILABLE"]);
  });

  it("déterministe et monotone : réduire W ou H ne dégrade pas le résultat", () => {
    const a = evaluerPoses(workflow("PLEXIGLASS_UV"), MACHINE_CAPABILITIES, 347, 490);
    expect(a).toEqual(evaluerPoses(workflow("PLEXIGLASS_UV"), MACHINE_CAPABILITIES, 347, 490));
    expect(a.ok).toBe(true);
    expect(evaluerPoses(workflow("PLEXIGLASS_UV"), MACHINE_CAPABILITIES, 300, 400).ok).toBe(true);
  });
});

describe("evaluerDimensions (Annexe B étape 6)", () => {
  const regles = (o: Partial<DimensionRules> = {}): DimensionRules => ({
    id: "d",
    variantId: "v",
    thicknessId: "th_3_0",
    minWidthMm: definie(50),
    maxWidthMm: definie(400),
    minHeightMm: definie(50),
    maxHeightMm: definie(300),
    statut: "active",
    ...o,
  });
  const plaque = { widthMm: 200, heightMm: 100, cornerRadiusMm: 0 };

  it("dans les bornes ⇒ aucune violation", () => expect(evaluerDimensions(regles(), plaque)).toEqual([]));
  it("sous le minimum / au-dessus du maximum", () => {
    expect(evaluerDimensions(regles(), { ...plaque, widthMm: 40 }).map((v) => v.code)).toEqual(["BELOW_MIN"]);
    expect(evaluerDimensions(regles(), { ...plaque, heightMm: 301 }).map((v) => v.code)).toEqual(["ABOVE_RULES"]);
  });
  it("borne À VALIDER ⇒ VALIDATION_REQUIRED, jamais ignorée", () => {
    expect(evaluerDimensions(regles({ maxWidthMm: aValider() }), plaque).map((v) => v.code)).toEqual(["VALIDATION_REQUIRED"]);
  });
  it("borne optionnelle SANS_OBJET ou absente ne contraint pas ; aire et rayon évalués si définis", () => {
    expect(evaluerDimensions(regles({ minAreaMm2: sansObjet() }), plaque)).toEqual([]);
    expect(evaluerDimensions(regles({ maxAreaMm2: definie(10_000) }), plaque).map((v) => v.code)).toEqual(["ABOVE_RULES"]);
    expect(evaluerDimensions(regles({ minCornerRadiusMm: definie(2) }), plaque).map((v) => v.code)).toEqual(["BELOW_MIN"]);
  });
});
