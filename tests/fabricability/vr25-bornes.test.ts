// VR-25 (FACT ATELIER 15/09/2026, autorisation Supervisor) : bornes de dimensions par famille, toutes épaisseurs.
// Distinctes des capacités machine (§4.1) ; le panneau fournisseur 600 × 300 n'est pas modélisé.
import { describe, expect, it } from "vitest";
import { BORNES_DIMENSIONS_VR25, evaluerBornesVr25, evaluerPoses, MACHINE_CAPABILITIES, PRODUCTION_WORKFLOWS } from "../../src/domain";

const plaque = (widthMm: number, heightMm: number) => ({ widthMm, heightMm, cornerRadiusMm: 0 });
const codes = (family: Parameters<typeof evaluerBornesVr25>[0], w: number, h: number) => evaluerBornesVr25(family, plaque(w, h)).map((v) => `${v.code}@${v.path}`);

describe("VR-25 — valeurs normatives", () => {
  it("TroLase et TroLase Metallic 10 × 10 → 594 × 294 ; Plexiglass / TroGlass Clear et TroGlass Metallic 10 × 10 → 347 × 490, deux orientations", () => {
    expect(BORNES_DIMENSIONS_VR25).toEqual({
      trolase: { minWidthMm: 10, minHeightMm: 10, maxWidthMm: 594, maxHeightMm: 294, deuxOrientations: false },
      trolase_metallic: { minWidthMm: 10, minHeightMm: 10, maxWidthMm: 594, maxHeightMm: 294, deuxOrientations: false },
      plexiglass: { minWidthMm: 10, minHeightMm: 10, maxWidthMm: 347, maxHeightMm: 490, deuxOrientations: true },
      troglass_metallic: { minWidthMm: 10, minHeightMm: 10, maxWidthMm: 347, maxHeightMm: 490, deuxOrientations: true },
    });
  });
});

describe("VR-25 — minima", () => {
  it("10 × 10 admis pour chaque famille ; largeur ou hauteur sous 10 ⇒ BELOW_MIN", () => {
    for (const f of ["trolase", "trolase_metallic", "plexiglass", "troglass_metallic"] as const) {
      expect(codes(f, 10, 10)).toEqual([]);
      expect(codes(f, 9.9, 10)).toEqual([`BELOW_MIN@vr25.${f}.minWidthMm`]);
      expect(codes(f, 10, 9.9)).toEqual([`BELOW_MIN@vr25.${f}.minHeightMm`]);
    }
  });
});

describe("VR-25 — maxima", () => {
  it("TroLase / TroLase Metallic : 594 × 294 admis ; dépassement de largeur ; dépassement de hauteur", () => {
    for (const f of ["trolase", "trolase_metallic"] as const) {
      expect(codes(f, 594, 294)).toEqual([]);
      expect(codes(f, 594.1, 294)).toEqual([`ABOVE_RULES@vr25.${f}.maxWidthMm`]);
      expect(codes(f, 594, 294.1)).toEqual([`ABOVE_RULES@vr25.${f}.maxHeightMm`]);
    }
  });

  it("Plexiglass / TroGlass Clear et TroGlass Metallic : 347 × 490 admis ; dépassement de largeur ; dépassement de hauteur", () => {
    for (const f of ["plexiglass", "troglass_metallic"] as const) {
      expect(codes(f, 347, 490)).toEqual([]);
      expect(codes(f, 347.1, 490)).toEqual([`ABOVE_RULES@vr25.${f}.maxWidthMm`]);
      expect(codes(f, 347, 490.1)).toEqual([`ABOVE_RULES@vr25.${f}.maxHeightMm`]);
    }
  });
});

describe("VR-25 — orientations", () => {
  it("Plexiglass / TroGlass Clear et TroGlass Metallic : 490 × 347 admis (tournée) ; limites ,1 refusées dans les deux orientations", () => {
    for (const f of ["plexiglass", "troglass_metallic"] as const) {
      expect(codes(f, 490, 347)).toEqual([]);
      expect(codes(f, 490.1, 347)).toEqual([`ABOVE_RULES@vr25.${f}.maxWidthMm`]);
      expect(codes(f, 490, 347.1)).toEqual([`ABOVE_RULES@vr25.${f}.maxWidthMm`]);
    }
  });
});

describe("VR-25 ≠ capacité machine ; format fournisseur non modélisé", () => {
  it("TroLase 600 × 400 : admis par la zone Speedy 400 (capacité machine inchangée) mais refusé par VR-25", () => {
    const trolase = PRODUCTION_WORKFLOWS.find((w) => w.id === "TROLASE_ENGRAVE")!;
    expect(evaluerPoses(trolase, MACHINE_CAPABILITIES, 600, 400).ok).toBe(true);
    expect(codes("trolase", 600, 400)).toEqual(["ABOVE_RULES@vr25.trolase.maxWidthMm", "ABOVE_RULES@vr25.trolase.maxHeightMm"]);
    expect(MACHINE_CAPABILITIES.find((m) => m.machineId === "SPEEDY_400")?.workingArea).toEqual({ widthMm: 1010, heightMm: 610 });
  });

  it("aucune borne VR-25 n'est le panneau fournisseur 600 × 300", () => {
    for (const b of Object.values(BORNES_DIMENSIONS_VR25)) {
      expect([b.maxWidthMm, b.maxHeightMm]).not.toEqual([600, 300]);
    }
  });
});

describe("VR-25 — déterminisme", () => {
  it("même entrée ⇒ même résultat ; plaque source non modifiée", () => {
    const p = plaque(500, 300);
    const avant = structuredClone(p);
    expect(evaluerBornesVr25("plexiglass", p)).toEqual(evaluerBornesVr25("plexiglass", p));
    expect(p).toEqual(avant);
  });
});
