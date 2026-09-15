// SP-3 — passage des TextGlyphPaths produits par le spike dans le domaine EXISTANT, sans le modifier (ESSAI — NON NORMATIF).
// npx vitest run --config spikes/sp3-polices-reelles/vitest.sp3.config.mjs  → écrit DOMAINE.json (réécriture refusée).
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  boiteEnglobante,
  buildCanonicalGeometry,
  canonicalGeometrySchema,
  canonicalJson,
  definie,
  ENGINE_VERSIONS,
  evaluateFabricability,
  evaluerTexteTrace,
  INITIAL_CATALOG,
  normaliserTexte,
  resolveSpec,
  sansObjet,
} from "../../src/domain/index.ts";
import { catalogueTest, referenceTest } from "../../tests/domain/fixtures.ts";
import { MATRICE } from "./matrix.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const sortie = path.join(dir, "DOMAINE.json");
const passe = JSON.parse(readFileSync(path.join(dir, "resultats/node/passe-1.json"), "utf8"));
const configs = new Map(MATRICE.map((c) => [c.id, c]));
const sha = (s) => createHash("sha256").update(s).digest("hex");
const codes = (v) => v.map((x) => `${x.code}@${x.path}`);

// Catalogue de TEST (repris de tests/domain/vr08-texte.test.ts) : aucune valeur atelier ni commerciale.
const plexi = referenceTest({
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
const base = catalogueTest();
const catalogue = {
  ...base,
  references: [...base.references, plexi],
  products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id], allowedFonts: ["test-font"] })),
  dimensionRules: [{ id: "test-dim-plexi", variantId: plexi.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" }],
  mountingRules: [...INITIAL_CATALOG.mountingRules],
};
const configuration = (cfg, o = {}) => ({
  configurationVersion: 4,
  productId: "test-produit",
  materialVariantId: plexi.id,
  thicknessId: "th_3_0",
  format: { mode: "custom", widthMm: cfg.plaque.widthMm, heightMm: cfg.plaque.heightMm },
  design: { text: { lines: cfg.lignes, fontId: "test-font", layoutId: "test-layout", alignment: cfg.alignement }, artwork: null },
  mounting: { count: 0 },
  quantity: 1,
  ...o,
});

describe("SP-3 — TextGlyphPaths dans le domaine existant", () => {
  it("contrôle et mesure de toutes les sorties Node (passe 1)", () => {
    if (existsSync(sortie)) throw new Error("DOMAINE.json existe déjà : aucune réécriture");
    const lignes = [];
    let serialisationIdentique = 0;
    let serialisationComparee = 0;
    let traitsSoumis = null;
    for (const r of passe.resultats) {
      const cfg = configs.get(r.id);
      const entree = { id: r.id, mode: r.mode, famille: cfg.famille, police: cfg.police, statut: r.statut };
      if (r.statut !== "ok") {
        lignes.push({ ...entree, erreur: r.erreur });
        continue;
      }
      // Sérialisation : canonicalJson du domaine ≡ sérialisation du spike (même SHA-256).
      serialisationComparee++;
      if (sha(canonicalJson(r.caracteres)) === r.empreintes.geometrie) serialisationIdentique++;
      // Mesure géométrique avec les fonctions du domaine.
      const hauteurs = r.caracteres.map((c) => boiteEnglobante(c.contours)).filter(Boolean).map((b) => Math.round((b.yMax - b.yMin) * 1000) / 1000);
      entree.elements = r.caracteres.length;
      entree.elementsNonAttribues = r.caracteres.filter((c) => c.caractere === "").length;
      entree.hauteurBoiteMinMm = hauteurs.length ? Math.min(...hauteurs) : null;
      entree.hauteurBoiteMaxMm = hauteurs.length ? Math.max(...hauteurs) : null;
      entree.absents = r.absents;
      entree.evaluerTexteTrace = codes(evaluerTexteTrace({ caracteres: r.caracteres, plaque: cfg.plaque, zonesTrous: cfg.trous }));
      // Pipeline : fabricabilité puis géométrie canonique (configurations sans trou d'essai).
      if (cfg.trous.length === 0) {
        const texte = normaliserTexte(cfg.lignes).lines.join("");
        const glyphesDisponibles = new Set([...texte].filter((c) => !r.absents.includes("U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"))));
        const fab = evaluateFabricability(configuration(cfg), catalogue, { glyphesDisponibles, texteTrace: r.caracteres });
        entree.fabricabilite = fab.ok ? "ok" : codes(fab.violations);
        if (fab.ok) {
          try {
            const spec = resolveSpec(fab, catalogue);
            if (!spec.ok) throw new Error(JSON.stringify(spec.violations));
            const g = buildCanonicalGeometry({ spec: spec.spec, artwork: null, textePresent: true, texteTrace: r.caracteres, engineVersions: ENGINE_VERSIONS });
            if (!g.ok) throw new Error(JSON.stringify(g.violations));
            entree.geometrieCanonique = canonicalGeometrySchema.safeParse(g.geometry).success ? "schéma valide" : "schéma invalide";
            entree.couchesTexte = [...g.geometry.layers.engrave, ...(g.geometry.layers.print ?? [])].filter((e) => e.kind === "text").length;
          } catch (e) {
            entree.geometrieCanonique = `erreur : ${String(e.message).slice(0, 300)}`;
          }
          // Gravure (TroLase de test) : contrôle du trait 1 mm toujours non arbitré (S1, S2 OPEN).
          if (traitsSoumis === null) {
            const t = evaluateFabricability(configuration(cfg, { materialVariantId: "test-ref-trolase", thicknessId: "th_1_6" }), catalogue, { glyphesDisponibles, texteTrace: r.caracteres });
            traitsSoumis = { id: r.id, mode: r.mode, resultat: t.ok ? "ok" : codes(t.violations) };
          }
        }
      }
      lignes.push(entree);
    }
    writeFileSync(sortie, `${JSON.stringify({ avertissement: "ESSAI SP-3 — NON NORMATIF", serialisation: { comparees: serialisationComparee, identiques: serialisationIdentique }, graveureTraitMinimal: traitsSoumis, resultats: lignes }, null, 2)}\n`);
    expect(serialisationIdentique).toBe(serialisationComparee);
  });
});
