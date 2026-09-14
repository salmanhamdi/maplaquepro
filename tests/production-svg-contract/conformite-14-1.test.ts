// Suite de conformité PRODUCTION_SVG_CONTRACT_v1 (§14.1) — première étape vers BAT-1 + PROD-SVG-1 (checkpoint NON satisfait).
// Référence : §14.1 et §13. Fichiers laser issus de la chaîne réelle (createBat → BAT → artefacts) ou de la géométrie canonique.
// EXCLUS : comparaison avec la preview (Phase 4), artwork gravé (ART1-DOC), découpe TroLase (VR-34), validation atelier
// (VR-20, VR-42), sens du miroir attendu par l'atelier (VR-35), algorithme de hash (P7), UV (VR-33), hybride (assemblage).
// Catalogue, paramètres de trous, tracés et hachage de TEST fictifs.
import { describe, expect, it } from "vitest";
import {
  type BatBrouillon,
  buildCanonicalGeometry,
  buildLaserArtifact,
  type CaractereTrace,
  type Catalog,
  createBat,
  definie,
  INITIAL_CATALOG,
  type MaterialVariant,
  planArtifacts,
  regenererArtefacts,
  type ResolvedSpec,
  sansObjet,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "../domain/fixtures";

// ---------- Catalogue de test ----------

const plexi: MaterialVariant = referenceTest({
  id: "test-plexi",
  family: "plexiglass",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "PLEXIGLASS_UV",
  artworkRulesId: "artwork-PLEXIGLASS_UV",
  politiqueImpression: { valeur: definie("couleur"), cote: definie("face") },
  apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
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
  dimensionRulesIds: ["dim-troglass"],
  mountingRulesId: "mounting-default",
});
const bornes = (id: string, variantId: string) => ({ id, variantId, thicknessId: "th_3_0" as const, minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" as const });

const catalogue = (): Catalog => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, plexi, troglass],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id, troglass.id] })),
    dimensionRules: [bornes("dim-plexi", plexi.id), bornes("dim-troglass", troglass.id)],
    mountingRules: [
      {
        ...INITIAL_CATALOG.mountingRules[0]!,
        holeDiameterMm: definie(4),
        minEdgeDistanceMm: definie(2),
        holeKeepOutMarginMm: definie(1),
        edgeDistanceSemantics: definie("edge_to_center"),
        twoHolesDisposition: definie("horizontal_centered"),
      },
    ],
  };
};

const hacher = (s: string) => `h${s.length}-${[...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1_000_000_007, 7)}`;

const bat = (ref: MaterialVariant, o: Record<string, unknown> = {}, jobRef?: string, cat: Catalog = catalogue()): BatBrouillon => {
  const r = createBat({
    input: { configurationVersion: 4, productId: "test-produit", materialVariantId: ref.id, thicknessId: "th_3_0", format: { mode: "custom", widthMm: 300, heightMm: 200 }, design: { text: null, artwork: null }, mounting: { count: 0 }, quantity: 1, ...o },
    catalog: cat,
    identite: { batId: "bat-conformite", createdAt: "2026-01-01T00:00:00Z", contentHash: "h-contenu" },
    engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" },
    previewSvg: "<svg/>",
    hacher,
    ...(jobRef ? { jobRef } : {}),
  });
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.bat;
};

/** SVG laser d'un BAT : artefact laser direct (Plexiglass) ou partie laser (TroGlass), sans l'assemblage hybride. */
const svgLaser = (b: BatBrouillon): string => {
  for (const a of b.artifacts) {
    if (a.kind === "laser") return a.svg;
    if (a.kind === "hybrid") return a.laserArtifact.svg;
  }
  throw new Error("aucun artefact laser");
};

const groupes = (svg: string) => [...svg.matchAll(/<g id="(\w+)">/g)].map((m) => m[1]);
const TRACE = { op: "M" as const };

// ---------- Contrôles ----------

describe("§14.1 — dimensions et unités (standard et sur mesure)", () => {
  it("sur mesure : width / height en mm, viewBox réel 0 0 W H, valeurs arrondies roundMm", () => {
    const svg = svgLaser(bat(plexi, { format: { mode: "custom", widthMm: 123.45678, heightMm: 67.8912 } }));
    expect(svg.split("\n")[0]).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" width="123\.457mm" height="67\.891mm" viewBox="0 0 123\.457 67\.891" /);
  });

  it("standard : dimensions du format du catalogue au moment du BAT, rayon de coin dans le contour CUT", () => {
    const svg = svgLaser(bat(plexi, { format: { mode: "standard", formatId: "test-format" } }));
    expect(svg).toContain('width="300mm" height="200mm" viewBox="0 0 300 200"');
    expect(svg).toMatch(/<g id="CUT">\n<path d="M3 0 L297 0 C[^"]+Z" fill="none" stroke="#FF0000" stroke-width="0\.001pt"\/>/);
  });
});

describe("§14.1 — groupes, ordre, identifiants, commentaires et styles", () => {
  it("découpe + trous (Plexiglass) : CUT puis HOLES, commentaires, un cercle par trou au style de découpe", () => {
    const svg = svgLaser(bat(plexi, { mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 } }));
    expect(groupes(svg)).toEqual(["CUT", "HOLES"]);
    expect(svg).toContain('<!-- CUT -->\n<g id="CUT">');
    expect(svg).toContain('<!-- HOLES -->\n<g id="HOLES">\n<circle cx="10" cy="100" r="2" fill="none" stroke="#FF0000" stroke-width="0.001pt"/>\n<circle cx="290" cy="100" r="2" fill="none" stroke="#FF0000" stroke-width="0.001pt"/>\n</g>');
  });

  it("sans trous : HOLES absent ; CUT présent", () => {
    const svg = svgLaser(bat(plexi));
    expect(groupes(svg)).toEqual(["CUT"]);
  });

  it("gravure (partie laser TroGlass) : ENGRAVE puis CUT, ENGRAVE présent même vide", () => {
    const svg = svgLaser(bat(troglass));
    expect(groupes(svg)).toEqual(["ENGRAVE", "CUT"]);
    expect(svg).toContain('<!-- ENGRAVE -->\n<g id="ENGRAVE">\n</g>');
  });

  it("tracés de texte gravés : ENGRAVE en paths fill #000000 stroke none, aucun <text>", () => {
    const b = bat(troglass);
    const spec = b.spec as ResolvedSpec;
    const texte: CaractereTrace[] = [{ caractere: "A", contours: [[{ ...TRACE, x: 20, y: 30 }, { op: "L", x: 28, y: 30 }, { op: "L", x: 28, y: 40 }, { op: "Z" }]] }];
    const geo = buildCanonicalGeometry({ spec, artwork: null, textePresent: true, texteTrace: texte, engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" } });
    const plan = planArtifacts(spec.workflow.id, spec.workflow.operations, 0);
    if (!geo.ok || !plan.ok || plan.plan[0]?.kind !== "hybrid") throw new Error("chaîne interrompue");
    const face = buildLaserArtifact({ geometry: geo.geometry, plan: { ...plan.plan[0].laser, cote: "face", miroir: "none" }, tracabilite: { batId: "b", batHash: "h", geometryHash: "g", catalogVersion: "v" }, hash: "h" });
    expect(face.ok && face.artifact.svg).toContain('<g id="ENGRAVE">\n<path d="M20 30 L28 30 L28 40 Z" fill="#000000" stroke="none"/>\n</g>');
    expect(face.ok && face.artifact.svg).not.toContain("<text");
  });
});

describe("§14.1 — interdictions", () => {
  const svgs = () => [
    svgLaser(bat(plexi)),
    svgLaser(bat(plexi, { format: { mode: "standard", formatId: "test-format" }, mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 } })),
    svgLaser(bat(troglass, { mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 } })),
  ];

  it("aucun élément ni attribut interdit (texte, style, script, transform, opacity, filter, mask, clipPath, image, dépendance externe)", () => {
    for (const svg of svgs()) {
      expect(svg).not.toMatch(/<text|<style|<script|transform=|opacity|filter|<mask|mask=|clipPath|<image|href=|url\(|<use|<foreignObject/);
    }
  });

  it("couleurs limitées à #000000 et #FF0000", () => {
    for (const svg of svgs()) {
      const couleurs = new Set([...svg.matchAll(/#[0-9A-Fa-f]{3,8}\b/g)].map((m) => m[0]));
      expect([...couleurs].every((c) => c === "#000000" || c === "#FF0000")).toBe(true);
    }
  });

  it("aucune cotation, décor ou texte d'interface : seuls svg, commentaires de groupes, g, path, circle", () => {
    for (const svg of svgs()) {
      const balises = new Set([...svg.matchAll(/<([a-zA-Z!][\w-]*)/g)].map((m) => m[1]));
      expect([...balises].every((b) => ["svg", "!--", "g", "path", "circle"].includes(b!.replace(/^!--.*/, "!--")))).toBe(true);
    }
  });
});

describe("§14.1 — traçabilité", () => {
  it("attributs data-* exacts sur la racine ; data-job uniquement s'il est fourni", () => {
    const b = bat(plexi);
    const racine = svgLaser(b).split("\n")[0]!;
    expect([...racine.matchAll(/ (data-[\w-]+)="/g)].map((m) => m[1])).toEqual(["data-bat", "data-bat-hash", "data-convention", "data-geometry-hash", "data-catalog-version", "data-side", "data-mirrored"]);
    expect(racine).toContain(`data-bat="bat-conformite" data-bat-hash="h-contenu" data-convention="PRODUCTION_SVG_CONTRACT_v1" data-geometry-hash="${b.geometryHash}" data-catalog-version="${b.versions.catalogVersion}" data-side="front" data-mirrored="none"`);
    expect(svgLaser(bat(plexi, {}, "job-42")).split("\n")[0]).toMatch(/ data-job="job-42">$/);
  });
});

describe("§14.1 — déterminisme et reproductibilité", () => {
  it("BAT identique ⇒ mêmes octets ; \\n, pas de \\r, pas de BOM, pas d'horodatage", () => {
    const a = svgLaser(bat(plexi, { mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 } }));
    const b = svgLaser(bat(plexi, { mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 } }));
    expect(a).toBe(b);
    expect(a.endsWith("</svg>\n")).toBe(true);
    expect(a).not.toContain("\r");
    expect(a.charCodeAt(0)).not.toBe(0xfeff);
    expect(a).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });
});

describe("§14.1 / §15 — régénération depuis geometryJson", () => {
  it("artefacts régénérés depuis le BAT ≡ artefacts stockés (octets identiques)", () => {
    const b = bat(plexi, { mounting: { count: 2, mode: "standard", edgeDistanceMm: 10 } });
    const r = regenererArtefacts(b, hacher);
    expect(r.ok && r.artifacts).toEqual(b.artifacts);
  });

  it("indépendance vis-à-vis d'un changement de catalogue après le BAT : régénération inchangée", () => {
    const cat = catalogue();
    const b = bat(plexi, { format: { mode: "standard", formatId: "test-format" } }, undefined, cat);
    const avant = svgLaser(b);
    // Évolution ultérieure du catalogue : format modifié, version changée
    cat.formats = cat.formats.map((f) => ({ ...f, widthMm: 999, heightMm: 999 }));
    cat.catalogVersion = "9.9.9";
    const r = regenererArtefacts(b, hacher);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const laser = r.artifacts[0];
    expect(laser?.kind === "laser" && laser.svg).toBe(avant);
    expect(avant).toContain('width="300mm"');
  });
});

describe("§13 / §14.1 — côté envers : miroir X pré-appliqué (contrat technique)", () => {
  it("TroGlass (partie laser) : data-side reverse, data-mirrored x ; trous miroir x' = W − x", () => {
    const svg = svgLaser(bat(troglass, { format: { mode: "custom", widthMm: 300, heightMm: 200 }, mounting: { count: 4, mode: "advanced", edgeDistanceXMm: 12, edgeDistanceYMm: 20, symmetry: true } }));
    expect(svg).toContain('data-side="reverse" data-mirrored="x"');
    const cx = [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect(cx).toEqual([
      [288, 20],
      [12, 20],
      [288, 180],
      [12, 180],
    ]);
  });

  it("tracé gravé : bbox miroir exacte [W − xMax, W − xMin], ordonnées inchangées, aucun transform", () => {
    const b = bat(troglass);
    const spec = b.spec as ResolvedSpec;
    const texte: CaractereTrace[] = [{ caractere: "A", contours: [[{ ...TRACE, x: 20.5, y: 30 }, { op: "L", x: 28.25, y: 30 }, { op: "L", x: 28.25, y: 41 }, { op: "Z" }]] }];
    const geo = buildCanonicalGeometry({ spec, artwork: null, textePresent: true, texteTrace: texte, engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" } });
    const plan = planArtifacts(spec.workflow.id, spec.workflow.operations, 0);
    if (!geo.ok || !plan.ok || plan.plan[0]?.kind !== "hybrid") throw new Error("chaîne interrompue");
    const envers = buildLaserArtifact({ geometry: geo.geometry, plan: plan.plan[0].laser, tracabilite: { batId: "b", batHash: "h", geometryHash: "g", catalogVersion: "v" }, hash: "h" });
    if (!envers.ok) throw new Error("artefact attendu");
    const d = envers.artifact.svg.match(/<g id="ENGRAVE">\n<path d="([^"]+)"/)![1]!;
    const points = [...d.matchAll(/[ML]([\d.]+) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
    expect([Math.min(...points.map((p) => p[0]!)), Math.max(...points.map((p) => p[0]!))]).toEqual([300 - 28.25, 300 - 20.5]);
    expect(points.map((p) => p[1])).toEqual([30, 30, 41]);
    expect(envers.artifact.svg).not.toContain("transform");
  });
});
