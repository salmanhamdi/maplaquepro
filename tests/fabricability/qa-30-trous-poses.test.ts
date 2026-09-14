// QA §30 (Phase 3) — contrôles bloquants déjà spécifiés, sur le moteur existant :
// - Trous : symétrie à 0,001 mm ; règle P11 identique à l'ouverture et après tout changement de contexte ;
// - Fabricabilité : zone machine et orientation de pose figées dans le BAT.
// Paramètres et catalogue de TEST fictifs ; VR-22 à VR-24 restent À VALIDER dans le catalogue réel.
import { describe, expect, it } from "vitest";
import { geometrieCanoniqueTest } from "../domain/fixtures";
import {
  buildBatDraft,
  type Catalog,
  definie,
  evaluateFabricability,
  generateHoles,
  INITIAL_CATALOG,
  type MaterialVariant,
  resolveDefaultEdgeDistance,
  type ResolvedMountingRules,
  resolveSpec,
  sansObjet,
} from "../../src/domain";

const regles = (o: Partial<ResolvedMountingRules> = {}): ResolvedMountingRules => ({
  holeDiameterMm: 4.2,
  minEdgeDistanceMm: 2.3,
  holeKeepOutMarginMm: 1.1,
  edgeDistanceSemantics: "edge_to_rim",
  twoHolesDisposition: "horizontal_centered",
  ...o,
});

describe("§30 Trous — symétrie 0,001 mm", () => {
  const plaques = [
    { widthMm: 300, heightMm: 200, cornerRadiusMm: 0 },
    { widthMm: 123.457, heightMm: 67.891, cornerRadiusMm: 0 },
    { widthMm: 347, heightMm: 490, cornerRadiusMm: 0 },
  ];

  it("2 et 4 trous, deux sémantiques : positions symétriques par rapport aux axes médians à 0,001 mm près", () => {
    for (const plaque of plaques) {
      for (const s of ["edge_to_center", "edge_to_rim"] as const) {
        for (const pattern of [
          { count: 2 as const, mode: "standard" as const, edgeDistanceMm: 7.3 },
          { count: 4 as const, mode: "standard" as const, edgeDistanceMm: 7.3 },
          { count: 4 as const, mode: "advanced" as const, edgeDistanceXMm: 9.1, edgeDistanceYMm: 6.7, symmetry: true as const },
        ]) {
          const r = generateHoles(pattern, plaque, regles({ edgeDistanceSemantics: s }));
          expect(r.ok).toBe(true);
          if (!r.ok) continue;
          for (const h of r.value) {
            const miroirX = r.value.find((o) => Math.abs(o.cyMm - h.cyMm) <= 0.001 && Math.abs(o.cxMm - (plaque.widthMm - h.cxMm)) <= 0.001);
            expect(miroirX).toBeDefined();
            if (pattern.count === 4) {
              const miroirY = r.value.find((o) => Math.abs(o.cxMm - h.cxMm) <= 0.001 && Math.abs(o.cyMm - (plaque.heightMm - h.cyMm)) <= 0.001);
              expect(miroirY).toBeDefined();
            } else {
              expect(Math.abs(h.cyMm - plaque.heightMm / 2)).toBeLessThanOrEqual(0.001);
            }
          }
        }
      }
    }
  });
});

describe("§30 Trous — règle P11 identique à l'ouverture et après tout changement de contexte", () => {
  const A = { widthMm: 300, heightMm: 200, cornerRadiusMm: 0 };
  const B = { widthMm: 40, heightMm: 30, cornerRadiusMm: 0 };
  const reglesA = regles();
  const reglesB = regles({ holeKeepOutMarginMm: 2.4, minEdgeDistanceMm: 4.4 });

  it("format : A → B → A donne le même résultat qu'à l'ouverture sur A", () => {
    const ouverture = resolveDefaultEdgeDistance(4, A, reglesA);
    resolveDefaultEdgeDistance(4, B, reglesA);
    expect(resolveDefaultEdgeDistance(4, A, reglesA)).toEqual(ouverture);
  });

  it("épaisseur ou référence (règles résolues différentes) : même configuration ⇒ même résultat, quel que soit le chemin", () => {
    const direct = resolveDefaultEdgeDistance(2, A, reglesB);
    resolveDefaultEdgeDistance(2, A, reglesA);
    resolveDefaultEdgeDistance(4, B, reglesA);
    expect(resolveDefaultEdgeDistance(2, A, reglesB)).toEqual(direct);
  });

  it("résultats distincts selon le contexte, chacun signalé (adapte) ou indisponible, jamais forcé", () => {
    expect(resolveDefaultEdgeDistance(4, A, reglesA)).toEqual({ disponible: true, edgeDistanceMm: 3, adapte: false });
    const adapte = resolveDefaultEdgeDistance(4, A, reglesB);
    expect(adapte.disponible && adapte.adapte).toBe(true);
    expect(resolveDefaultEdgeDistance(4, { widthMm: 10, heightMm: 10, cornerRadiusMm: 0 }, reglesB).disponible).toBe(false);
  });
});

describe("§30 Fabricabilité — zone machine et orientation de pose figées dans le BAT", () => {
  const plexi: MaterialVariant = {
    id: "m-plexi",
    manufacturer: definie("Fabricant de test"),
    reference: definie("REF-TEST"),
    family: "plexiglass",
    label: "Plexiglass de test",
    thicknessIds: ["th_3_0"],
    apparence: { couleurSurface: definie({ name: "Support test", hex: "#FFFFFF" }), finition: definie("test"), couleurRevelee: sansObjet() },
    capaciteGravure: { cote: sansObjet() },
    politiqueImpression: { valeur: definie("couleur"), cote: definie("face") },
    productionWorkflowId: "PLEXIGLASS_UV",
    dimensionRulesIds: ["dim-plexi"],
    mountingRulesId: "mounting-default",
    artworkRulesId: "artwork-PLEXIGLASS_UV",
    outdoorStatus: definie("outdoor"),
    swatch: { surface: "#FFFFFF" },
    statut: "active",
  };
  const catalogue: Catalog = {
    ...INITIAL_CATALOG,
    references: [plexi],
    dimensionRules: [{ id: "dim-plexi", variantId: plexi.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" }],
    products: [{ id: "p", slug: "p", name: "Produit de test", allowedVariantIds: [plexi.id], allowedFormats: [], allowedLayouts: [], allowedFonts: [], mountingRulesId: "mounting-default", statut: "active" }],
  };

  it("490 × 347 : poses par opération (zone et orientation tournée) enregistrées telles quelles dans le brouillon de BAT", () => {
    const fab = evaluateFabricability(
      { configurationVersion: 4, productId: "p", materialVariantId: plexi.id, thicknessId: "th_3_0", format: { mode: "custom", widthMm: 490, heightMm: 347 }, design: { text: null, artwork: null }, mounting: { count: 0 }, quantity: 1 },
      catalogue,
    );
    if (!fab.ok) throw new Error(JSON.stringify(fab.violations));
    const spec = resolveSpec(fab, catalogue);
    if (!spec.ok) throw new Error(JSON.stringify(spec.violations));
    const bat = buildBatDraft({
      fabricable: fab,
      spec: spec.spec,
      catalog: catalogue,
      identite: { batId: "bat-test", createdAt: "2026-01-01T00:00:00Z", contentHash: "h-test" },
      rendu: { geometryJson: geometrieCanoniqueTest(), geometryHash: "g-test", previewSvg: "<svg/>", artifacts: [] },
      engineVersions: { design: "t", mounting: "t", geometry: "t", render: "t", production: "t" },
    });
    expect(bat.ok).toBe(true);
    if (!bat.ok) return;
    expect(bat.bat.spec.posesParOperation).toEqual([
      { operationSequence: 1, machineId: "SPEEDY_400", zoneMachine: { widthMm: 1010, heightMm: 610 }, orientationDePose: "tel_quel" },
      { operationSequence: 2, machineId: "ARTISJET_3000U", zoneMachine: { widthMm: 347, heightMm: 490 }, orientationDePose: "tournee" },
    ]);
  });
});
