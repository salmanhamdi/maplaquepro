// L2 (décision Supervisor) : le champ geometryJson du BAT est typé avec la géométrie canonique existante (§6, §12).
// Aucune nouvelle représentation ni règle métier. L1 : la safe zone reste portée par geometryJson.safeZoneMm.
import { describe, expect, it } from "vitest";
import { batBrouillonSchema, canonicalJson, createBatDraft } from "../../src/domain";
import { geometrieCanoniqueTest } from "../domain/fixtures";

// Brouillon minimal de TEST : spécification résolue obtenue depuis un test existant n'étant pas nécessaire,
// on vérifie ici uniquement le champ geometryJson du schéma du BAT.
const champGeometrie = batBrouillonSchema.shape.geometryJson;

describe("L2 — geometryJson typé avec la géométrie canonique", () => {
  it("géométrie canonique valide acceptée telle quelle (aucune transformation, JSON canonique identique)", () => {
    const g = geometrieCanoniqueTest();
    const r = champGeometrie.safeParse(g);
    expect(r.success).toBe(true);
    expect(r.success && canonicalJson(r.data)).toBe(canonicalJson(g));
  });

  it("champ opaque ou non canonique refusé : objet vide, champ inconnu, safe zone À VALIDER, couche sans élément typé", () => {
    const g = geometrieCanoniqueTest();
    for (const invalide of [{}, { ...g, autre: 1 }, { ...g, safeZoneMm: { etat: "A_VALIDER" } }, { ...g, layers: { engrave: [{ kind: "inconnu" }], print: [] } }, "géométrie", null]) {
      expect(champGeometrie.safeParse(invalide).success).toBe(false);
    }
  });

  it("createBatDraft refuse un brouillon dont la géométrie n'est pas canonique (BAT_INVALID sur geometryJson)", () => {
    const r = createBatDraft({ geometryJson: {} });
    expect(!r.ok && r.violations.some((v) => v.code === "BAT_INVALID" && v.path.startsWith("geometryJson"))).toBe(true);
  });
});
