// Géométrie canonique — couche texte (TextGlyphPaths §6) à partir des tracés reçus. Données de TEST fictives.
import { describe, expect, it } from "vitest";
import {
  buildCanonicalGeometry,
  canonicalGeometrySchema,
  canonicalJson,
  type CaractereTrace,
  type Catalog,
  definie,
  evaluateFabricability,
  INITIAL_CATALOG,
  type MaterialVariant,
  type ResolvedSpec,
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
  politiqueImpression: { valeur: definie("couleur"), cote: definie("face") },
  apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  dimensionRulesIds: ["test-dim-plexi"],
  mountingRulesId: "mounting-default",
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
    mountingRules: [...INITIAL_CATALOG.mountingRules],
  };
})();

/** Spécification résolue Plexiglass (impression) ; variantes gravure et hybride dérivées pour tester l'affectation des couches. */
function specPlexi(): ResolvedSpec {
  const fab = evaluateFabricability(
    { configurationVersion: 4, productId: "test-produit", materialVariantId: plexi.id, thicknessId: "th_3_0", format: { mode: "custom", widthMm: 300, heightMm: 200 }, design: { text: null, artwork: null }, mounting: { count: 0 }, quantity: 1 },
    catalogue,
  );
  if (!fab.ok) throw new Error(JSON.stringify(fab.violations));
  const r = resolveSpec(fab, catalogue);
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.spec;
}
const specGravure = (): ResolvedSpec => {
  const s = specPlexi();
  return { ...s, politiqueImpression: { valeur: "aucune", cote: { etat: "SANS_OBJET" } }, workflow: { ...s.workflow, id: "TROLASE_ENGRAVE" } };
};
const specHybride = (): ResolvedSpec => {
  const s = specPlexi();
  return { ...s, politiqueImpression: { valeur: "noir_uniquement", cote: { etat: "DEFINIE", valeur: "envers" } }, workflow: { ...s.workflow, id: "TROGLASS_METALLIC_HYBRID" } };
};

const VERSIONS = { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" };

const traces = (): CaractereTrace[] => [
  { caractere: "A", contours: [[{ op: "M", x: 10.12345, y: 20 }, { op: "C", x1: 11, y1: 25.00049, x2: 13, y2: 25, x: 14, y: 20 }, { op: "Z" }]] },
  { caractere: " ", contours: [] },
  { caractere: "B", contours: [[{ op: "M", x: 16, y: 20 }, { op: "L", x: 19, y: 20 }, { op: "L", x: 19, y: 25 }, { op: "Z" }]] },
];

const construire = (spec: ResolvedSpec, texteTrace?: readonly CaractereTrace[], textePresent = true) =>
  buildCanonicalGeometry({ spec, artwork: null, textePresent, ...(texteTrace ? { texteTrace } : {}), engineVersions: VERSIONS });

const texteDe = (couche: unknown[] | null | undefined) => (couche ?? []).filter((e) => (e as { kind: string }).kind === "text");

describe("couche texte de la géométrie canonique", () => {
  it("A — texte gravé : TextGlyphPaths dans la couche gravure, impression null", () => {
    const r = construire(specGravure(), traces());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(texteDe(r.geometry.layers.engrave)).toHaveLength(1);
    expect(r.geometry.layers.print).toBeNull();
    expect(canonicalGeometrySchema.safeParse(r.geometry).success).toBe(true);
  });

  it("B / H — texte imprimé (Plexiglass) : TextGlyphPaths dans la couche impression ; gravure = []", () => {
    const r = construire(specPlexi(), traces());
    expect(r.ok && texteDe(r.geometry.layers.print)).toHaveLength(1);
    expect(r.ok && r.geometry.layers.engrave).toEqual([]);
  });

  it("C — workflow hybride : texte dans la gravure et dans l'impression", () => {
    const r = construire(specHybride(), traces());
    expect(r.ok && [texteDe(r.geometry.layers.engrave).length, texteDe(r.geometry.layers.print).length]).toEqual([1, 1]);
  });

  it("D — fidélité : glyphes, ordre et opérations recopiés ; seules les coordonnées canoniques sont arrondies (roundMm)", () => {
    const r = construire(specPlexi(), traces());
    expect(r.ok && texteDe(r.geometry.layers.print)[0]).toEqual({
      kind: "text",
      glyphs: [
        { caractere: "A", contours: [[{ op: "M", x: 10.123, y: 20 }, { op: "C", x1: 11, y1: 25, x2: 13, y2: 25, x: 14, y: 20 }, { op: "Z" }]] },
        { caractere: " ", contours: [] },
        { caractere: "B", contours: [[{ op: "M", x: 16, y: 20 }, { op: "L", x: 19, y: 20 }, { op: "L", x: 19, y: 25 }, { op: "Z" }]] },
      ],
    });
  });

  it("E — immutabilité : les tracés sources ne sont pas modifiés", () => {
    const sources = traces();
    const avant = structuredClone(sources);
    construire(specHybride(), sources);
    expect(sources).toEqual(avant);
    expect(sources[0]!.contours[0]![0]).toEqual({ op: "M", x: 10.12345, y: 20 });
  });

  it("F — texte présent sans tracés ⇒ VALIDATION_REQUIRED ; aucun texte ⇒ aucun élément texte", () => {
    const sans = construire(specPlexi());
    expect(!sans.ok && sans.violations.map((v) => `${v.code}@${v.path}`)).toEqual(["VALIDATION_REQUIRED@layers.text"]);
    const aucun = construire(specPlexi(), traces(), false);
    expect(aucun.ok && texteDe(aucun.geometry.layers.print)).toEqual([]);
  });

  it("G — déterminisme : même entrée ⇒ même géométrie ; ordre des clés d'entrée sans effet sur le JSON canonique", () => {
    const a = construire(specPlexi(), traces());
    const inverse: CaractereTrace[] = traces().map((g) => ({ contours: g.contours.map((c) => c.map((s) => Object.fromEntries(Object.entries(s).reverse()) as typeof s)), caractere: g.caractere }));
    const b = construire(specPlexi(), inverse);
    expect(a).toEqual(construire(specPlexi(), traces()));
    expect(a.ok && b.ok && canonicalJson(a.geometry)).toBe(b.ok ? canonicalJson(b.geometry) : "");
  });
});
