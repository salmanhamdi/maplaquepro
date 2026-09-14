// INV-12 — Aucune valeur invalide n'est corrigée silencieusement côté serveur (P11 × P13).
// Un test par chemin du domaine susceptible de corriger, normaliser, substituer, arrondir ou transformer une donnée.
// Les chemins non concernés sont documentés dans le dossier de preuves ARCH-2. Données de TEST fictives.
import { describe, expect, it } from "vitest";
import {
  type Catalog,
  definie,
  evaluateFabricability,
  INITIAL_CATALOG,
  type MaterialVariant,
  parseConfiguration,
  productionSvg,
  proposeAlternatives,
  resolveMountingRules,
  resolveSpec,
  sansObjet,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "./fixtures";

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
  mountingRulesId: "test-mounting",
});

const catalogue: Catalog = (() => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, plexi],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id] })),
    dimensionRules: [
      { id: "test-dim-plexi", variantId: plexi.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" },
    ],
    mountingRules: [
      ...INITIAL_CATALOG.mountingRules,
      {
        ...INITIAL_CATALOG.mountingRules[0]!,
        id: "test-mounting",
        holeDiameterMm: definie(4),
        minEdgeDistanceMm: definie(2),
        holeKeepOutMarginMm: definie(1),
        edgeDistanceSemantics: definie("edge_to_center"),
        twoHolesDisposition: definie("horizontal_centered"),
        statut: "active",
      },
    ],
  };
})();

const config = (o: Record<string, unknown> = {}) => ({
  configurationVersion: 4,
  productId: "test-produit",
  materialVariantId: plexi.id,
  thicknessId: "th_3_0",
  format: { mode: "custom", widthMm: 300, heightMm: 200 },
  design: { text: null, artwork: null },
  mounting: { count: 0 },
  quantity: 1,
  ...o,
});

const figer = <T>(v: T): T => structuredClone(v);

describe("C1 — contrat de requête : aucune valeur par défaut, coercition ni suppression", () => {
  it("une configuration valide est restituée à l'identique (aucun champ ajouté, retiré ou modifié)", () => {
    const entree = config({ format: { mode: "custom", widthMm: 123.45678, heightMm: 200 }, mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 } });
    const r = parseConfiguration(entree);
    expect(r.ok && r.value).toEqual(entree);
    expect(r.ok && "cornerRadiusMm" in r.value.format).toBe(false);
  });

  it("aucune coercition de type : chaîne numérique, quantité décimale, version différente ⇒ rejet", () => {
    expect(parseConfiguration(config({ format: { mode: "custom", widthMm: "300", heightMm: 200 } })).ok).toBe(false);
    expect(parseConfiguration(config({ quantity: 1.5 })).ok).toBe(false);
    expect(parseConfiguration(config({ quantity: "1" })).ok).toBe(false);
    expect(parseConfiguration(config({ configurationVersion: "4" })).ok).toBe(false);
  });

  it("cote de trou hors pas de 0,1 mm ⇒ rejet, jamais arrondie", () => {
    const r = parseConfiguration(config({ mounting: { count: 2, mode: "standard", edgeDistanceMm: 3.05 } }));
    expect(!r.ok && r.violations.map((v) => v.path)).toEqual(["mounting.edgeDistanceMm"]);
  });

  it("champ absent obligatoire ⇒ rejet, jamais complété", () => {
    const { quantity: _q, ...sansQuantite } = config();
    expect(parseConfiguration(sansQuantite).ok).toBe(false);
  });
});

describe("C2 — evaluateFabricability ne modifie ni l'entrée ni la configuration retenue", () => {
  it("l'objet reçu n'est pas muté ; la configuration du résultat est identique à la requête", () => {
    const entree = config({ mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 } });
    const avant = figer(entree);
    const r = evaluateFabricability(entree, catalogue);
    expect(entree).toEqual(avant);
    expect(r.ok && r.configuration).toEqual(avant);
  });

  it("dimensions sur mesure conservées sans arrondi dans la plaque et la spécification résolue", () => {
    const r = evaluateFabricability(config({ format: { mode: "custom", widthMm: 123.45678, heightMm: 67.0001 } }), catalogue);
    expect(r.ok && [r.plaque.widthMm, r.plaque.heightMm]).toEqual([123.45678, 67.0001]);
    if (!r.ok) return;
    const spec = resolveSpec(r, catalogue);
    expect(spec.ok && [spec.spec.plate.widthMm, spec.spec.plate.heightMm]).toEqual([123.45678, 67.0001]);
  });

  it("rayon absent : coins droits (convention technique P2) pour la géométrie, sans ajout du champ dans la configuration", () => {
    const r = evaluateFabricability(config(), catalogue);
    expect(r.ok && r.plaque.cornerRadiusMm).toBe(0);
    expect(r.ok && "cornerRadiusMm" in r.configuration.format).toBe(false);
  });
});

describe("C3 — trous : cote invalide rejetée, jamais remplacée par la valeur P11", () => {
  it("une valeur par défaut valide existe (3,0) mais la cote reçue invalide est rejetée", () => {
    const r = evaluateFabricability(config({ mounting: { count: 2, mode: "standard", edgeDistanceMm: 2.5 } }), catalogue);
    expect(!r.ok && r.violations.map((v) => v.code)).toEqual(["HOLE_KEEP_OUT_MARGIN_VIOLATED"]);
  });

  it("surcharges contextuelles multiples : rejet, aucune substitution arbitraire", () => {
    const rules = { ...catalogue.mountingRules[1]!, overrides: [{ thicknessId: "th_3_0" as const, holeDiameterMm: definie(5) }, { variantId: plexi.id, holeDiameterMm: definie(6) }] };
    const r = resolveMountingRules(rules, { variantId: plexi.id, thicknessId: "th_3_0" });
    expect(!r.ok && r.violations.map((v) => v.code)).toEqual(["MOUNTING_OVERRIDE_AMBIGUOUS"]);
  });
});

describe("C4 — texte : normalisation §10 signalée, requête conservée", () => {
  it("les lignes reçues ne sont jamais réécrites dans la requête ; la normalisation reste interne et signalée (texte.test)", () => {
    const text = { lines: ["  Martin "], fontId: "test-font", layoutId: "test-layout", alignment: "center" };
    const entree = config({ design: { text, artwork: null } });
    const avant = figer(entree);
    const r = evaluateFabricability(entree, catalogue, { glyphesDisponibles: new Set([..."Martin"]) });
    expect(entree).toEqual(avant);
    // Mesure non définie (VR-08) : non fabricable ; la requête n'est jamais réécrite.
    expect(!r.ok && r.violations.map((v) => v.code)).toEqual(["VALIDATION_REQUIRED"]);
  });
});

describe("C5 — alternatives proposées, jamais appliquées", () => {
  it("la configuration d'origine reste inchangée et toujours non fabricable", () => {
    const entree = config({ format: { mode: "custom", widthMm: 500, heightMm: 300 } });
    const avant = figer(entree);
    expect(proposeAlternatives(entree, catalogue).length).toBeGreaterThan(0);
    expect(entree).toEqual(avant);
    expect(evaluateFabricability(entree, catalogue).ok).toBe(false);
  });
});

describe("C6 — arrondi contractuel du fichier machine uniquement (§14.1), sans effet sur les données", () => {
  it("le SVG de production arrondit par roundMm ; les dimensions sources restent intactes", () => {
    const plaque = { widthMm: 123.45678, heightMm: 67.0001, cornerRadiusMm: 0 };
    const avant = figer(plaque);
    const svg = productionSvg({ plaque, cote: "face", miroir: "none", engrave: null, cut: true, holes: [], tracabilite: { batId: "b", batHash: "h", geometryHash: "g", catalogVersion: "v" } });
    expect(svg).toContain('width="123.457mm"');
    expect(plaque).toEqual(avant);
  });
});
