import { describe, expect, it } from "vitest";
import {
  activeReferences,
  catalogSchema,
  INITIAL_CATALOG,
  MAX_PIXELS_MVP,
  PROCEDE_BY_WORKFLOW,
  validateCatalog,
  WORKFLOW_BY_FAMILY,
} from "../../src/domain";

describe("catalogue initial (référentiels décidés uniquement)", () => {
  it("est conforme au schéma et aux invariants", () => {
    expect(catalogSchema.safeParse(INITIAL_CATALOG).success).toBe(true);
    expect(validateCatalog(INITIAL_CATALOG)).toEqual([]);
  });

  it("n'expose aucune référence, aucun produit, aucun format ni tarif inventés", () => {
    expect(INITIAL_CATALOG.references).toEqual([]);
    expect(activeReferences(INITIAL_CATALOG)).toEqual([]);
    expect(INITIAL_CATALOG.products).toEqual([]);
    expect(INITIAL_CATALOG.formats).toEqual([]);
    expect(INITIAL_CATALOG.priceRules).toEqual([]);
  });

  it("contient exactement 4 épaisseurs, 4 workflows, 3 procédés (INV-17, P3)", () => {
    expect(INITIAL_CATALOG.thicknesses.map((t) => t.mm)).toEqual([0.8, 1.6, 3.0, 5.0]);
    expect(INITIAL_CATALOG.workflows).toHaveLength(4);
    expect(new Set(Object.values(PROCEDE_BY_WORKFLOW)).size).toBe(3);
    expect(Object.keys(WORKFLOW_BY_FAMILY)).toHaveLength(4);
  });

  it("reprend les zones machine décidées sans ajouter de valeur", () => {
    const speedy = INITIAL_CATALOG.machines.find((m) => m.machineId === "SPEEDY_400");
    const artisjet = INITIAL_CATALOG.machines.find((m) => m.machineId === "ARTISJET_3000U");
    expect(speedy?.workingArea).toEqual({ widthMm: 1010, heightMm: 610 });
    expect(artisjet?.printableArea).toEqual({ widthMm: 347, heightMm: 490 });
  });

  it("garde toutes les valeurs atelier non validées À VALIDER", () => {
    const [mounting] = INITIAL_CATALOG.mountingRules;
    expect(mounting?.holeDiameterMm).toEqual({ etat: "A_VALIDER" });
    expect(mounting?.edgeDistanceSemantics).toEqual({ etat: "A_VALIDER" });
    expect(mounting?.defaultEdgeDistanceTargetMm).toBe(3);
    for (const rules of INITIAL_CATALOG.artworkRules) {
      expect(rules.maxPixels).toBe(MAX_PIXELS_MVP);
      expect(rules.maxBytes).toEqual({ etat: "A_VALIDER" });
    }
    const trolase = INITIAL_CATALOG.workflows.find((w) => w.id === "TROLASE_ENGRAVE");
    expect(trolase?.operations[1]?.condition).toBe("A_VALIDER");
  });

  it("dérive le mode couleur de l'artwork du workflow (INV-15)", () => {
    const mode = (id: string) => INITIAL_CATALOG.artworkRules.find((a) => a.workflowId === id)?.modeCouleur;
    expect(mode("TROLASE_ENGRAVE")).toBe("monochrome");
    expect(mode("PLEXIGLASS_UV")).toBe("selon_politique_impression_reference");
    expect(mode("TROGLASS_METALLIC_HYBRID")).toBe("noir_uniquement");
  });

  it("détecte un maxPixels différent de la valeur MVP (INV-19)", () => {
    const catalog = { ...INITIAL_CATALOG, artworkRules: INITIAL_CATALOG.artworkRules.map((a) => ({ ...a, maxPixels: 100_000_000 })) };
    expect(validateCatalog(catalog).some((v) => v.code === "MAX_PIXELS_NOT_MVP_VALUE")).toBe(true);
  });

  it("détecte une encre sur une opération laser et un workflow manquant (INV-09, INV-17)", () => {
    const [premier, ...autres] = INITIAL_CATALOG.workflows;
    if (!premier) throw new Error("workflow attendu");
    const fautif = { ...premier, operations: premier.operations.map((op) => ({ ...op, encre: "derivee_de_la_politique_d_impression" as const })) };
    const codes = validateCatalog({ ...INITIAL_CATALOG, workflows: [fautif, ...autres] }).map((v) => v.code);
    expect(codes).toContain("INK_ON_NON_UV_OPERATION");
    expect(validateCatalog({ ...INITIAL_CATALOG, workflows: autres }).map((v) => v.code)).toContain("WORKFLOW_REFERENTIAL_INVALID");
  });

  it("refuse une contrainte machine portée par un workflow (INV-10)", () => {
    const [premier] = INITIAL_CATALOG.workflows;
    expect(catalogSchema.safeParse({ ...INITIAL_CATALOG, workflows: [{ ...premier, workingArea: { widthMm: 1, heightMm: 1 } }] }).success).toBe(false);
  });
});
