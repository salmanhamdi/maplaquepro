// Matrice normative de fabricabilité §30.1 (Phase 3). Moteur serveur : evaluateFabricability + proposeAlternatives.
// Catalogue de TEST : références, bornes et apparences fictives ; le catalogue réel n'est pas modifié.
// Ligne « TroLase 600 × 400 gravé » : DIFFÉRÉE (décision Supervisor, option a) tant que VR-34 est À VALIDER.
// Chaque ligne est testée dans les deux orientations ; les valeurs limites (,1) dans les deux orientations de pose.
import { describe, expect, it } from "vitest";
import {
  type Catalog,
  definie,
  evaluateFabricability,
  type FabricabilityResult,
  INITIAL_CATALOG,
  type MaterialVariant,
  proposeAlternatives,
  sansObjet,
} from "../../src/domain";

const couleur = (name: string, hex: string) => ({ name, hex });

const trolase: MaterialVariant = {
  id: "m-trolase",
  manufacturer: definie("Fabricant de test"),
  reference: definie("REF-TEST-1"),
  family: "trolase",
  label: "TroLase de test",
  thicknessIds: ["th_1_6"],
  apparence: { couleurSurface: definie(couleur("Surface test", "#123456")), finition: definie("test"), couleurRevelee: definie(couleur("Révélée test", "#FFFFFF")) },
  capaciteGravure: { cote: definie("face") },
  politiqueImpression: { valeur: definie("aucune"), cote: sansObjet() },
  productionWorkflowId: "TROLASE_ENGRAVE",
  dimensionRulesIds: ["dim-trolase"],
  mountingRulesId: "mounting-default",
  artworkRulesId: "artwork-TROLASE_ENGRAVE",
  outdoorStatus: definie("outdoor"),
  swatch: { surface: "#123456" },
  statut: "active",
};

const plexi: MaterialVariant = {
  ...trolase,
  id: "m-plexi",
  reference: definie("REF-TEST-2"),
  family: "plexiglass",
  label: "Plexiglass de test",
  thicknessIds: ["th_3_0"],
  apparence: { couleurSurface: definie(couleur("Support test", "#FFFFFF")), finition: definie("test"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  politiqueImpression: { valeur: definie("couleur"), cote: definie("face") },
  productionWorkflowId: "PLEXIGLASS_UV",
  dimensionRulesIds: ["dim-plexi"],
  artworkRulesId: "artwork-PLEXIGLASS_UV",
};

const troglassGold = (politique: "noir_uniquement" | "couleur" = "noir_uniquement"): MaterialVariant => ({
  ...trolase,
  id: "m-troglass-gold",
  reference: definie("REF-TEST-3"),
  family: "troglass_metallic",
  label: "TroGlass Gold de test",
  thicknessIds: ["th_3_0"],
  apparence: { couleurSurface: definie(couleur("Gold test", "#C9A227")), finition: definie("test"), couleurRevelee: definie(couleur("Révélée test", "#EEEEEE")) },
  capaciteGravure: { cote: definie("envers") },
  politiqueImpression: { valeur: definie(politique), cote: definie("envers") },
  productionWorkflowId: "TROGLASS_METALLIC_HYBRID",
  dimensionRulesIds: ["dim-troglass"],
  artworkRulesId: "artwork-TROGLASS_METALLIC_HYBRID",
});

const bornes = (id: string, variantId: string, thicknessId: "th_1_6" | "th_3_0") => ({
  id,
  variantId,
  thicknessId,
  minWidthMm: definie(50),
  maxWidthMm: definie(2000),
  minHeightMm: definie(50),
  maxHeightMm: definie(2000),
  statut: "active" as const,
});

const catalogue = (gold: MaterialVariant = troglassGold()): Catalog => ({
  ...INITIAL_CATALOG,
  references: [trolase, plexi, gold],
  dimensionRules: [bornes("dim-trolase", trolase.id, "th_1_6"), bornes("dim-plexi", plexi.id, "th_3_0"), bornes("dim-troglass", gold.id, "th_3_0")],
  products: [
    { id: "p", slug: "p", name: "Produit de test", allowedVariantIds: [trolase.id, plexi.id, gold.id], allowedFormats: [], allowedLayouts: [], allowedFonts: [], mountingRulesId: "mounting-default", statut: "active" },
  ],
});

const config = (ref: MaterialVariant, widthMm: number, heightMm: number, o: Record<string, unknown> = {}) => ({
  configurationVersion: 4,
  productId: "p",
  materialVariantId: ref.id,
  thicknessId: ref.thicknessIds[0],
  format: { mode: "custom", widthMm, heightMm },
  design: { text: null, artwork: null },
  mounting: { count: 0 },
  quantity: 1,
  ...o,
});

const evaluer = (ref: MaterialVariant, w: number, h: number, c: Catalog = catalogue()) => evaluateFabricability(config(ref, w, h), c);
const codes = (r: FabricabilityResult) => (r.ok ? [] : r.violations.map((v) => `${v.code}@${v.path}`));
const poses = (r: FabricabilityResult) => (r.ok ? r.posesParOperation.map((p) => `${p.machineId}:${p.orientationDePose}`) : null);

describe("§30.1 — matrice normative de fabricabilité", () => {
  it("DIFFÉRÉE (VR-34) — TroLase 600 × 400 gravé : état actuel VALIDATION_REQUIRED, aucune preuve positive", () => {
    for (const [w, h] of [[600, 400], [400, 600]] as const) {
      expect(codes(evaluer(trolase, w, h))).toEqual(["VALIDATION_REQUIRED@workflows.TROLASE_ENGRAVE.operations.2.condition"]);
    }
  });

  it("Plexiglass 347 × 490 ⇒ ✓ (ArtisJet tel quel)", () => {
    expect(poses(evaluer(plexi, 347, 490))).toEqual(["SPEEDY_400:tel_quel", "ARTISJET_3000U:tel_quel"]);
  });

  it("Plexiglass 490 × 347 ⇒ ✓ (ArtisJet tournée)", () => {
    expect(poses(evaluer(plexi, 490, 347))).toEqual(["SPEEDY_400:tel_quel", "ARTISJET_3000U:tournee"]);
  });

  it("Plexiglass 347,1 × 490 ⇒ ❌ NOT_FABRICABLE sur l'impression UV, avec alternative ; idem 490 × 347,1", () => {
    for (const [w, h] of [[347.1, 490], [490, 347.1]] as const) {
      expect(codes(evaluer(plexi, w, h))).toEqual(["EXCEEDS_MACHINE@workflows.PLEXIGLASS_UV.operations.2"]);
      expect(proposeAlternatives(config(plexi, w, h), catalogue()).length).toBeGreaterThan(0);
    }
  });

  it("Plexiglass 347 × 490,1 ⇒ ❌ ; idem 490,1 × 347", () => {
    for (const [w, h] of [[347, 490.1], [490.1, 347]] as const) {
      expect(codes(evaluer(plexi, w, h))).toEqual(["EXCEEDS_MACHINE@workflows.PLEXIGLASS_UV.operations.2"]);
    }
  });

  it("Plexiglass 500 × 300 ⇒ ❌ + alternative « ≤ 347 × 490 » ; famille gravure laser non proposée car elle-même non fabricable (VR-34) ; idem 300 × 500", () => {
    for (const [w, h] of [[500, 300], [300, 500]] as const) {
      expect(codes(evaluer(plexi, w, h))).toEqual(["EXCEEDS_MACHINE@workflows.PLEXIGLASS_UV.operations.2"]);
      const alternatives = proposeAlternatives(config(plexi, w, h), catalogue());
      expect(alternatives).toEqual([
        { kind: "max_dimensions", widthMm: 347, heightMm: 490 },
        { kind: "max_dimensions", widthMm: 490, heightMm: 347 },
      ]);
      expect(alternatives.some((a) => a.kind === "switch_family")).toBe(false);
    }
  });

  it("TroGlass Gold hybride ≤ 347 × 490 ⇒ ✓ ; idem 490 × 347", () => {
    expect(poses(evaluer(troglassGold(), 347, 490))).toEqual(["SPEEDY_400:tel_quel", "SPEEDY_400:tel_quel", "ARTISJET_3000U:tel_quel"]);
    expect(poses(evaluer(troglassGold(), 490, 347))).toEqual(["SPEEDY_400:tel_quel", "SPEEDY_400:tel_quel", "ARTISJET_3000U:tournee"]);
  });

  it("TroGlass Gold > 347 × 490 ⇒ ❌ ; idem inversé, et limites ,1 dans les deux orientations", () => {
    for (const [w, h] of [[500, 400], [400, 500], [347.1, 490], [490, 347.1], [347, 490.1], [490.1, 347]] as const) {
      expect(codes(evaluer(troglassGold(), w, h))).toEqual(["EXCEEDS_MACHINE@workflows.TROGLASS_METALLIC_HYBRID.operations.3"]);
    }
  });

  it("TroGlass Gold, encre couleur demandée ⇒ ❌ rejet explicite (P13) : champ encre refusé ; politique couleur ⇒ INVALID_INK_POLICY", () => {
    const demande = evaluateFabricability(config(troglassGold(), 300, 200, { encre: "couleur" }), catalogue());
    expect(!demande.ok && [demande.stage, codes(demande)]).toEqual(["request", ["FORBIDDEN_CLIENT_FIELD@encre"]]);
    const politique = evaluer(troglassGold("couleur"), 300, 200, catalogue(troglassGold("couleur")));
    expect(codes(politique)).toEqual(["INVALID_INK_POLICY@references.m-troglass-gold.politiqueImpression.valeur"]);
  });

  it("TroGlass Gold UV noir ⇒ ✓ (encre noir uniquement, dérivée)", () => {
    const r = evaluer(troglassGold(), 300, 200);
    expect(r.ok && r.operations.map((o) => o.encre)).toEqual([null, null, "noir_uniquement"]);
  });

  it("TroLase > 1010 × 610 ⇒ ❌ (Speedy, gravure) ; idem inversé — rejet indépendant de la découpe VR-34", () => {
    for (const [w, h] of [[1011, 611], [611, 1011]] as const) {
      expect(codes(evaluer(trolase, w, h))).toContain("EXCEEDS_MACHINE@workflows.TROLASE_ENGRAVE.operations.1");
    }
  });

  it("toute référence : dimensions < DimensionRules.min ⇒ ❌ ; idem inversé", () => {
    for (const ref of [trolase, plexi, troglassGold()]) {
      for (const [w, h] of [[49, 200], [200, 49]] as const) {
        expect(codes(evaluer(ref, w, h)).some((c) => c.startsWith("BELOW_MIN@"))).toBe(true);
      }
    }
  });

  it("carré admissible dans les deux poses (300 × 300) ⇒ ✓, orientation de pose = tel quel (P6)", () => {
    expect(poses(evaluer(plexi, 300, 300))).toEqual(["SPEEDY_400:tel_quel", "ARTISJET_3000U:tel_quel"]);
    expect(poses(evaluer(troglassGold(), 300, 300))).toEqual(["SPEEDY_400:tel_quel", "SPEEDY_400:tel_quel", "ARTISJET_3000U:tel_quel"]);
  });
});
