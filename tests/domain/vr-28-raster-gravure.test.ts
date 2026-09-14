import { describe, expect, it } from "vitest";
import { acceptsArtworkFormat, ENGRAVE_ONLY_WORKFLOWS, INITIAL_CATALOG, validateCatalog } from "../../src/domain";

const regles = (workflowId: string) => {
  const r = INITIAL_CATALOG.artworkRules.find((a) => a.workflowId === workflowId);
  if (!r) throw new Error(`règles attendues pour ${workflowId}`);
  return r;
};

describe("VR-28 — gravure = vectoriel exclusivement, tout raster rejeté", () => {
  it("les workflows de gravure seule ont une politique raster DEFINIE « reject »", () => {
    expect(ENGRAVE_ONLY_WORKFLOWS).toEqual(["TROLASE_ENGRAVE", "TROLASE_METALLIC_ENGRAVE"]);
    for (const id of ENGRAVE_ONLY_WORKFLOWS) {
      expect(regles(id).rasterPolicy).toEqual({ etat: "DEFINIE", valeur: "reject" });
    }
  });

  it("gravure : SVG accepté, PNG et JPEG rejetés", () => {
    for (const id of ENGRAVE_ONLY_WORKFLOWS) {
      expect(acceptsArtworkFormat(regles(id), "svg")).toBe(true);
      expect(acceptsArtworkFormat(regles(id), "png")).toBe(false);
      expect(acceptsArtworkFormat(regles(id), "jpeg")).toBe(false);
    }
  });

  it("la règle n'est pas généralisée à l'impression UV (reste À VALIDER)", () => {
    expect(regles("PLEXIGLASS_UV").rasterPolicy).toEqual({ etat: "A_VALIDER" });
  });

  it("TroGlass (workflow hybride) : pas de rejet, conversion bilevel (§9.2)", () => {
    const troglass = regles("TROGLASS_METALLIC_HYBRID");
    expect(ENGRAVE_ONLY_WORKFLOWS).not.toContain("TROGLASS_METALLIC_HYBRID");
    expect(troglass.rasterPolicy).toEqual({ etat: "DEFINIE", valeur: "accept_bilevel" });
    expect(acceptsArtworkFormat(troglass, "svg")).toBe(true);
    for (const format of troglass.formats) expect(acceptsArtworkFormat(troglass, format)).toBe(true);
  });

  it("une politique raster À VALIDER n'accepte aucun raster (aucune valeur présumée)", () => {
    expect(acceptsArtworkFormat(regles("PLEXIGLASS_UV"), "png")).toBe(false);
    expect(acceptsArtworkFormat(regles("PLEXIGLASS_UV"), "svg")).toBe(true);
  });

  it("le catalogue détecte un workflow de gravure qui n'impose pas le rejet des rasters", () => {
    const catalogue = {
      ...INITIAL_CATALOG,
      artworkRules: INITIAL_CATALOG.artworkRules.map((a) =>
        a.workflowId === "TROLASE_ENGRAVE" ? { ...a, rasterPolicy: { etat: "DEFINIE" as const, valeur: "accept_bilevel" as const } } : a,
      ),
    };
    expect(validateCatalog(catalogue).map((v) => v.code)).toContain("ENGRAVE_WORKFLOW_RASTER_NOT_REJECTED");
    expect(validateCatalog(INITIAL_CATALOG)).toEqual([]);
  });

  it("un format absent de la liste des formats n'est jamais accepté", () => {
    expect(acceptsArtworkFormat({ ...regles("TROLASE_ENGRAVE"), formats: ["png"] }, "svg")).toBe(false);
  });
});
