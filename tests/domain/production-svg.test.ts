import { describe, expect, it } from "vitest";
import { contourPlaque, type EntreeSvgLaser, productionSvg } from "../../src/domain";

const entree = (o: Partial<EntreeSvgLaser> = {}): EntreeSvgLaser => ({
  plaque: { widthMm: 200, heightMm: 100, cornerRadiusMm: 0 },
  cote: "face",
  engrave: [[{ op: "M", x: 10, y: 10 }, { op: "L", x: 30, y: 10 }, { op: "L", x: 30, y: 20 }, { op: "Z" }]],
  cut: true,
  holes: [
    { cxMm: 10, cyMm: 50, diameterMm: 4 },
    { cxMm: 190, cyMm: 50, diameterMm: 4 },
  ],
  tracabilite: { batId: "bat-test", batHash: "h-bat", geometryHash: "h-geo", catalogVersion: "0.1.0" },
  ...o,
});

describe("PRODUCTION_SVG_CONTRACT_v1 (§14.1) — conformité à la spécification", () => {
  it("racine en mm, viewBox réel, traçabilité complète, sans transform", () => {
    const svg = productionSvg(entree());
    expect(svg.split("\n")[0]).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200mm" height="100mm" viewBox="0 0 200 100" data-bat="bat-test" data-bat-hash="h-bat" data-convention="PRODUCTION_SVG_CONTRACT_v1" data-geometry-hash="h-geo" data-catalog-version="0.1.0" data-side="front" data-mirrored="none">',
    );
    expect(svg).not.toMatch(/transform|<text|<style|<script|opacity|filter|mask|clipPath|<image/);
  });

  it("groupes dans l'ordre ENGRAVE, CUT, HOLES avec commentaires et styles exacts", () => {
    const svg = productionSvg(entree());
    const ids = [...svg.matchAll(/<g id="(\w+)">/g)].map((m) => m[1]);
    expect(ids).toEqual(["ENGRAVE", "CUT", "HOLES"]);
    expect(svg).toContain("<!-- ENGRAVE -->\n<g id=\"ENGRAVE\">\n<path d=\"M10 10 L30 10 L30 20 Z\" fill=\"#000000\" stroke=\"none\"/>");
    expect(svg).toContain('<circle cx="10" cy="50" r="2" fill="none" stroke="#FF0000" stroke-width="0.001pt"/>');
  });

  it("couleurs limitées à #000000 et #FF0000", () => {
    const couleurs = new Set([...productionSvg(entree({ plaque: { widthMm: 200, heightMm: 100, cornerRadiusMm: 5 } })).matchAll(/#[0-9A-Fa-f]{6}/g)].map((m) => m[0]));
    expect([...couleurs].sort()).toEqual(["#000000", "#FF0000"]);
  });

  it("ENGRAVE absent si non planifié ; HOLES absent sans trous ; CUT présent", () => {
    const svg = productionSvg(entree({ engrave: null, holes: [] }));
    expect(svg).not.toContain('id="ENGRAVE"');
    expect(svg).not.toContain('id="HOLES"');
    expect(svg).toContain('<g id="CUT">');
  });

  it("déterministe : même entrée ⇒ même octets ; \\n final, pas de \\r", () => {
    expect(productionSvg(entree())).toBe(productionSvg(entree()));
    expect(productionSvg(entree()).endsWith("</svg>\n")).toBe(true);
    expect(productionSvg(entree())).not.toContain("\r");
  });

  it("dimensions sur mesure arrondies par roundMm", () => {
    const svg = productionSvg(entree({ plaque: { widthMm: 123.45678, heightMm: 67.0001, cornerRadiusMm: 0 } }));
    expect(svg).toContain('width="123.457mm" height="67mm" viewBox="0 0 123.457 67"');
  });

  it("côté envers : miroir X pré-appliqué (x' = W − x), traçabilité reverse / x", () => {
    const svg = productionSvg(entree({ cote: "envers", holes: [{ cxMm: 15, cyMm: 50, diameterMm: 4 }] }));
    expect(svg).toContain('data-side="reverse" data-mirrored="x"');
    expect(svg).toContain('d="M190 10 L170 10 L170 20 Z"');
    expect(svg).toContain('<circle cx="185" cy="50"');
  });

  it("bbox du tracé miroir exacte", () => {
    const svg = productionSvg(entree({ cote: "envers" }));
    const xs = [...svg.match(/<g id="ENGRAVE">\n<path d="([^"]+)"/)![1]!.matchAll(/[ML](\d+(?:\.\d+)?) /g)].map((m) => Number(m[1]));
    expect([Math.min(...xs), Math.max(...xs)]).toEqual([170, 190]);
  });

  it("contour à coins arrondis fermé et symétrique en X", () => {
    const c = contourPlaque(200, 100, 5);
    expect(c[0]).toEqual({ op: "M", x: 5, y: 0 });
    expect(c.at(-1)).toEqual({ op: "Z" });
  });

  it("valeurs de traçabilité échappées", () => {
    expect(productionSvg(entree({ tracabilite: { batId: 'a"<b', batHash: "h", geometryHash: "g", catalogVersion: "v", jobRef: "j&1" } }))).toContain(
      'data-bat="a&quot;&lt;b"',
    );
  });
});
