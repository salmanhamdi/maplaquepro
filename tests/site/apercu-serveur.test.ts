// T4-a : aperçu serveur issu de la géométrie canonique. Aucune seconde logique de rendu, aucun BAT, aucune persistance,
// aucun prix, aucun contentHash ; versions des moteurs exclusivement ENGINE_VERSIONS côté serveur.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ETAT_INITIAL, versConfiguration } from "../../src/components/configurateur/interpretation";
import { buildCanonicalGeometry, ENGINE_VERSIONS, evaluateFabricability, parseConfiguration, renderPreviewSvg, resolveSpec } from "../../src/domain";
import { construireApercuServeur } from "../../src/server/apercu";
import { CATALOGUE_DEMO, COMPOSITION_DEMO, POLICE_DEMO, PRODUIT_DEMO, referenceDemo } from "../../src/server/catalogue-demo";
import { verifier } from "../../src/server/verification";

const ids = (famille: Parameters<typeof referenceDemo>[0]) => {
  const r = referenceDemo(famille);
  return { productId: PRODUIT_DEMO, variantId: r.variantId, thicknessId: r.thicknessId, fontId: POLICE_DEMO, layoutId: COMPOSITION_DEMO };
};
const source = (f: string) => readFileSync(f, "utf8");

describe("T4-a — aperçu serveur", () => {
  it("configuration fabricable ⇒ aperçu serveur disponible, identique à la chaîne canonique (resolveSpec → géométrie → renderPreviewSvg)", () => {
    const v = verifier(ETAT_INITIAL);
    expect(v.statut).toBe("fabricable");
    expect(v.apercu.etat).toBe("disponible");
    if (v.apercu.etat !== "disponible") return;

    const fab = evaluateFabricability(versConfiguration(ETAT_INITIAL, ids("plexiglass")), CATALOGUE_DEMO);
    if (!fab.ok) throw new Error("fabricable attendu");
    const spec = resolveSpec(fab, CATALOGUE_DEMO);
    if (!spec.ok) throw new Error("spécification attendue");
    const geo = buildCanonicalGeometry({ spec: spec.spec, artwork: null, textePresent: false, engineVersions: ENGINE_VERSIONS });
    if (!geo.ok) throw new Error("géométrie attendue");
    const attendu = renderPreviewSvg({ geometry: geo.geometry, spec: spec.spec });
    expect(attendu.ok && attendu.svg).toBe(v.apercu.svg);
    expect(v.apercu.svg).toContain('data-preview="vue-face"');
    expect(v.apercu.svg).toContain('width="200mm" height="100mm"');
  });

  it("configuration non fabricable (hors bornes) ⇒ refus propre, aucun rendu", () => {
    const v = verifier({ ...ETAT_INITIAL, largeur: "600" });
    expect(v.statut).toBe("bloque");
    expect(v.apercu).toEqual({ etat: "non_applicable" });
  });

  it("configuration en attente (texte, trous, TroLase) ⇒ aucun aperçu serveur, état conservé", () => {
    for (const etat of [
      { ...ETAT_INITIAL, lignes: ["Atelier"] },
      { ...ETAT_INITIAL, trous: 4 as const },
      { ...ETAT_INITIAL, famille: "trolase" as const },
    ]) {
      const v = verifier(etat);
      expect(v.statut).toBe("en_validation");
      expect(v.apercu).toEqual({ etat: "non_applicable" });
    }
  });

  it("TroGlass Metallic fabricable ⇒ aperçu serveur disponible (vue face, gravure envers)", () => {
    const v = verifier({ ...ETAT_INITIAL, famille: "troglass_metallic" });
    expect(v.apercu.etat).toBe("disponible");
    expect(v.apercu.etat === "disponible" && v.apercu.svg).toContain("gravure et impression réalisées à l'envers");
  });

  it("versions des moteurs injectées côté serveur uniquement : ENGINE_VERSIONS dans la chaîne, jamais dans la saisie", () => {
    expect(source("src/server/apercu.ts")).toMatch(/engineVersions: ENGINE_VERSIONS/);
    expect(Object.keys(ETAT_INITIAL)).not.toContain("engineVersions");
    expect(Object.keys(versConfiguration(ETAT_INITIAL, ids("plexiglass")))).not.toContain("engineVersions");
    const r = parseConfiguration({ ...versConfiguration(ETAT_INITIAL, ids("plexiglass")), engineVersions: { design: "9" } });
    expect(!r.ok && r.violations.map((x) => x.code)).toEqual(["UNKNOWN_FIELD"]);
  });

  it("aperçu indisponible si la chaîne canonique échoue (aucun faux rendu)", () => {
    const fab = evaluateFabricability(versConfiguration(ETAT_INITIAL, ids("plexiglass")), CATALOGUE_DEMO);
    if (!fab.ok) throw new Error("fabricable attendu");
    const catalogueIncomplet = { ...CATALOGUE_DEMO, references: [] };
    expect(construireApercuServeur(fab, catalogueIncomplet)).toEqual({ etat: "indisponible" });
  });

  it("aucun calcul métier ni rendu parallèle côté client", () => {
    const client = source("src/components/configurateur/Configurateur.tsx");
    expect(client).not.toMatch(/evaluateFabricability|renderPreviewSvg|buildCanonicalGeometry|resolveSpec|ENGINE_VERSIONS/);
  });

  it("aucun BAT, aucune persistance, aucun prix, aucun contentHash dans la chaîne serveur ni dans le verdict", () => {
    for (const f of ["src/server/apercu.ts", "src/server/verification.ts", "src/app/configurateur/actions.ts"]) {
      expect(source(f)).not.toMatch(/createBat|preparerBat|buildBatDraft|validateBat|enregistrerBat|computePrice|priceRules|contentHash|writeFile|localStorage|cookies\(/);
    }
    const v = verifier(ETAT_INITIAL);
    expect(Object.keys(v).sort()).toEqual(["alternatives", "apercu", "messages", "statut", "texteModifie"]);
    expect(JSON.stringify(v)).not.toMatch(/"(price|prix|batId|contentHash|geometryHash|expiresAt)"/);
  });
});
