// T1 — preview serveur (§12) et comparaison « bbox preview / production » (§14.1). Données de TEST fictives.
// Hors périmètre : artwork (ART1-DOC), texte imprimé, contenu UV (VR-33), hash (P7), VR-34 / P3, VR-35.
import { describe, expect, it } from "vitest";
import {
  type BatBrouillon,
  buildCanonicalGeometry,
  buildLaserArtifact,
  type CaractereTrace,
  type Catalog,
  comparerPreviewProduction,
  createBat,
  definie,
  INITIAL_CATALOG,
  type MaterialVariant,
  planArtifacts,
  renderPreviewSvg,
  sansObjet,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "../domain/fixtures";

const plexi: MaterialVariant = referenceTest({
  id: "test-plexi",
  family: "plexiglass",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "PLEXIGLASS_UV",
  artworkRulesId: "artwork-PLEXIGLASS_UV",
  politiqueImpression: { valeur: definie("couleur"), cote: definie("envers") },
  apparence: { couleurSurface: definie({ name: "Support test", hex: "#F0F0F0" }), finition: definie("t"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  dimensionRulesIds: ["dim-plexi"],
  mountingRulesId: "mounting-default",
});
const troglass: MaterialVariant = referenceTest({
  id: "test-troglass",
  family: "troglass_metallic",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "TROGLASS_METALLIC_HYBRID",
  artworkRulesId: "artwork-TROGLASS_METALLIC_HYBRID",
  politiqueImpression: { valeur: definie("noir_uniquement"), cote: definie("envers") },
  capaciteGravure: { cote: definie("envers") },
  apparence: { couleurSurface: definie({ name: "Gold test", hex: "#C9A227" }), finition: definie("t"), couleurRevelee: definie({ name: "Révélée test", hex: "#EEEEEE" }) },
  dimensionRulesIds: ["dim-troglass"],
  mountingRulesId: "mounting-default",
});
const bornes = (id: string, variantId: string) => ({ id, variantId, thicknessId: "th_3_0" as const, minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" as const });
const catalogue: Catalog = (() => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, plexi, troglass],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id, troglass.id] })),
    dimensionRules: [bornes("dim-plexi", plexi.id), bornes("dim-troglass", troglass.id)],
    mountingRules: [
      { ...INITIAL_CATALOG.mountingRules[0]!, holeDiameterMm: definie(4), minEdgeDistanceMm: definie(2), holeKeepOutMarginMm: definie(1), edgeDistanceSemantics: definie("edge_to_center"), twoHolesDisposition: definie("horizontal_centered") },
    ],
  };
})();
const hacher = (s: string) => `h${s.length}-${[...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1_000_000_007, 7)}`;

const bat = (ref: MaterialVariant, o: Record<string, unknown> = {}): BatBrouillon => {
  const r = createBat({
    input: { configurationVersion: 4, productId: "test-produit", materialVariantId: ref.id, thicknessId: "th_3_0", format: { mode: "custom", widthMm: 300, heightMm: 200 }, design: { text: null, artwork: null }, mounting: { count: 4, mode: "advanced", edgeDistanceXMm: 12, edgeDistanceYMm: 20, symmetry: true }, quantity: 1, ...o },
    catalog: catalogue,
    identite: { batId: "bat-t1", createdAt: "2026-01-01T00:00:00Z", contentHash: "h" },
    engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" },
    previewSvg: "<svg/>",
    hacher,
  });
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.bat;
};
const laserSvg = (b: BatBrouillon) => {
  for (const a of b.artifacts) {
    if (a.kind === "laser") return a.svg;
    if (a.kind === "hybrid") return a.laserArtifact.svg;
  }
  return "";
};
const preview = (b: BatBrouillon) => {
  const r = renderPreviewSvg({ geometry: b.geometryJson, spec: b.spec });
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.svg;
};

describe("T1 — preview serveur dérivée de la géométrie canonique (§12)", () => {
  it("dimensions en mm et viewBox issus de la géométrie ; vue face ; trous et contour issus de la géométrie", () => {
    const b = bat(plexi);
    const svg = preview(b);
    expect(svg.split("\n")[0]).toBe('<svg xmlns="http://www.w3.org/2000/svg" width="300mm" height="200mm" viewBox="0 0 300 200" data-preview="vue-face">');
    const cx = [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(cx).toEqual(b.geometryJson.holes.map((h) => [h.cxMm, h.cyMm]));
    expect(svg).toContain('data-role="plate"');
  });

  it("couleurs dérivées de la référence résolue : surface de la plaque ; hybride en vue face avec mention envers", () => {
    expect(preview(bat(plexi))).toContain('fill="#F0F0F0"');
    const h = preview(bat(troglass));
    expect(h).toContain('fill="#C9A227"');
    expect(h).toContain("<desc>vue face — gravure et impression réalisées à l'envers</desc>");
  });

  it("déterminisme : même géométrie ⇒ mêmes octets ; géométrie source non modifiée", () => {
    const b = bat(plexi);
    const avant = structuredClone(b.geometryJson);
    expect(preview(b)).toBe(preview(b));
    expect(b.geometryJson).toEqual(avant);
  });

  it("éléments non définis au contrat : artwork gravé ⇒ VALIDATION_REQUIRED (ART1-DOC) ; aucune preview partielle", () => {
    const b = bat(troglass);
    const g = { ...b.geometryJson, layers: { ...b.geometryJson.layers, engrave: [{ kind: "artwork" as const, artworkRef: "a", placement: { artworkRef: "a", xMm: 1, yMm: 1, widthMm: 10, heightMm: 10, rotationDeg: 0 as const } }] } };
    const r = renderPreviewSvg({ geometry: g, spec: b.spec });
    expect(!r.ok && r.violations.map((v) => v.code)).toEqual(["VALIDATION_REQUIRED"]);
  });
});

describe("T1 — comparaison §14.1 « bbox preview / production »", () => {
  it("cas conforme Plexiglass (V-2) : découpe côté envers sans miroir, contour et 4 trous identiques à la vue face", () => {
    const b = bat(plexi);
    expect(laserSvg(b)).toContain('data-side="reverse" data-mirrored="none"');
    expect(comparerPreviewProduction(preview(b), laserSvg(b))).toEqual([]);
  });

  it("cas conforme côté envers (TroGlass) : fichier machine miroir X ramené en vue face", () => {
    const b = bat(troglass);
    expect(laserSvg(b)).toContain('data-mirrored="x"');
    expect(comparerPreviewProduction(preview(b), laserSvg(b))).toEqual([]);
  });

  it("cas conforme avec tracés gravés (TroGlass envers) : bbox de chaque tracé identique après retour en vue face", () => {
    const b = bat(troglass);
    const texte: CaractereTrace[] = [
      { caractere: "A", contours: [[{ op: "M", x: 40.5, y: 60 }, { op: "C", x1: 45, y1: 50, x2: 55, y2: 50, x: 60.25, y: 60 }, { op: "Z" }]] },
      { caractere: "B", contours: [[{ op: "M", x: 70, y: 60 }, { op: "L", x: 80, y: 60 }, { op: "L", x: 80, y: 75 }, { op: "Z" }]] },
    ];
    const geo = buildCanonicalGeometry({ spec: b.spec, artwork: null, textePresent: true, texteTrace: texte, engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" } });
    const plan = planArtifacts(b.spec.workflow.id, b.spec.workflow.operations, b.spec.holes.length);
    if (!geo.ok || !plan.ok || plan.plan[0]?.kind !== "hybrid") throw new Error("chaîne interrompue");
    const laser = buildLaserArtifact({ geometry: geo.geometry, plan: plan.plan[0].laser, tracabilite: { batId: "b", batHash: "h", geometryHash: "g", catalogVersion: "v" }, hash: "h" });
    const pv = renderPreviewSvg({ geometry: geo.geometry, spec: b.spec });
    if (!laser.ok || !pv.ok) throw new Error("rendu attendu");
    expect(comparerPreviewProduction(pv.svg, laser.artifact.svg)).toEqual([]);
  });

  it("divergence détectée : trou déplacé dans le fichier machine", () => {
    const b = bat(plexi);
    const altere = laserSvg(b).replace(/<circle cx="12"/, '<circle cx="13"');
    expect(comparerPreviewProduction(preview(b), altere).map((v) => `${v.code}@${v.path}`)).toEqual(["PREVIEW_PRODUCTION_BBOX_MISMATCH@holes.0"]);
  });

  it("divergence détectée : dimensions de plaque différentes", () => {
    const b = bat(plexi);
    const autre = bat(plexi, { format: { mode: "custom", widthMm: 301, heightMm: 200 } });
    expect(comparerPreviewProduction(preview(b), laserSvg(autre)).map((v) => v.path)).toContain("plate");
  });

  it("divergence détectée : miroir absent côté envers (fichier non ramené en vue face correctement)", () => {
    const b = bat(troglass);
    const sansMiroir = laserSvg(b).replace('data-mirrored="x"', 'data-mirrored="none"');
    expect(comparerPreviewProduction(preview(b), sansMiroir).map((v) => v.path)).toEqual(["holes.0", "holes.1", "holes.2", "holes.3"]);
  });

  it("divergence détectée : nombre de trous différent", () => {
    const b = bat(plexi);
    const moins = laserSvg(b).replace(/<circle [^>]+\/>\n/, "");
    expect(comparerPreviewProduction(preview(b), moins).map((v) => v.path)).toEqual(["holes"]);
  });
});
