// Sérialiseur du contrat laser PRODUCTION_SVG_CONTRACT_v1 (§14.1). Pur et déterministe : ordre d'attributs fixe,
// roundMm, "\n", aucun timestamp. Conformité à la spécification uniquement : la validation atelier reste À VALIDER
// (VR-20, VR-42). Le miroir X, lorsqu'il est demandé par le plan (VR-35), est pré-appliqué, aucun `transform` résiduel.
// Le côté (`data-side`) et le miroir (`data-mirrored`) sont indépendants : un côté envers n'implique pas de miroir (V-2).
import { roundMm } from "./geometry";
import type { Miroir } from "./production";
import type { Cote } from "./referentiels";

export const PRODUCTION_SVG_CONTRACT_ID = "PRODUCTION_SVG_CONTRACT_v1";

/** Segment de tracé en coordonnées absolues (mm), vue face. */
export type SegmentTrace =
  | { op: "M" | "L"; x: number; y: number }
  | { op: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { op: "Z" };

export type EntreeSvgLaser = {
  plaque: { widthMm: number; heightMm: number; cornerRadiusMm: number };
  cote: Cote;
  /** Transformation explicite issue du plan d'artefacts ; jamais déduite du côté. */
  miroir: Miroir;
  /** Tracés de gravure déjà résolus (glyphes, artwork vectoriel monochrome) ; null si le plan n'inclut pas ENGRAVE. */
  engrave: SegmentTrace[][] | null;
  /** Contour de découpe ; null si le plan n'inclut pas CUT. */
  cut: boolean;
  holes: Array<{ cxMm: number; cyMm: number; diameterMm: number }>;
  tracabilite: { batId: string; batHash: string; geometryHash: string; catalogVersion: string; jobRef?: string };
};

const n = (v: number): string => String(roundMm(v));

const escapeAttr = (v: string): string => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Miroir X (§13) : x' = W − x ; les points de contrôle suivent. */
function miroirSegment(s: SegmentTrace, W: number): SegmentTrace {
  if (s.op === "Z") return s;
  if (s.op === "C") return { ...s, x1: W - s.x1, x2: W - s.x2, x: W - s.x };
  return { ...s, x: W - s.x };
}

function traceD(segments: SegmentTrace[]): string {
  return segments
    .map((s) => {
      if (s.op === "Z") return "Z";
      if (s.op === "C") return `C${n(s.x1)} ${n(s.y1)} ${n(s.x2)} ${n(s.y2)} ${n(s.x)} ${n(s.y)}`;
      return `${s.op}${n(s.x)} ${n(s.y)}`;
    })
    .join(" ");
}

/** Contour rectangulaire, coins arrondis par arcs approximés en courbes de Bézier cubiques (k = 0,5523). Symétrique : invariant par miroir X. */
export function contourPlaque(W: number, H: number, r: number): SegmentTrace[] {
  if (r <= 0) {
    return [{ op: "M", x: 0, y: 0 }, { op: "L", x: W, y: 0 }, { op: "L", x: W, y: H }, { op: "L", x: 0, y: H }, { op: "Z" }];
  }
  const k = r * 0.5522847498;
  return [
    { op: "M", x: r, y: 0 },
    { op: "L", x: W - r, y: 0 },
    { op: "C", x1: W - r + k, y1: 0, x2: W, y2: r - k, x: W, y: r },
    { op: "L", x: W, y: H - r },
    { op: "C", x1: W, y1: H - r + k, x2: W - r + k, y2: H, x: W - r, y: H },
    { op: "L", x: r, y: H },
    { op: "C", x1: r - k, y1: H, x2: 0, y2: H - r + k, x: 0, y: H - r },
    { op: "L", x: 0, y: r },
    { op: "C", x1: 0, y1: r - k, x2: r - k, y2: 0, x: r, y: 0 },
    { op: "Z" },
  ];
}

const STYLE_DECOUPE = 'fill="none" stroke="#FF0000" stroke-width="0.001pt"';

/** Produit le SVG laser conforme au §14.1. `productionSvg(e) === productionSvg(e)`. */
export function productionSvg(entree: EntreeSvgLaser): string {
  const { widthMm: W, heightMm: H, cornerRadiusMm: r } = entree.plaque;
  const envers = entree.cote === "envers";
  const miroirX = entree.miroir === "x";
  const x = (v: number) => (miroirX ? W - v : v);
  const t = entree.tracabilite;
  const attrs = [
    'xmlns="http://www.w3.org/2000/svg"',
    `width="${n(W)}mm"`,
    `height="${n(H)}mm"`,
    `viewBox="0 0 ${n(W)} ${n(H)}"`,
    `data-bat="${escapeAttr(t.batId)}"`,
    `data-bat-hash="${escapeAttr(t.batHash)}"`,
    `data-convention="${PRODUCTION_SVG_CONTRACT_ID}"`,
    `data-geometry-hash="${escapeAttr(t.geometryHash)}"`,
    `data-catalog-version="${escapeAttr(t.catalogVersion)}"`,
    `data-side="${envers ? "reverse" : "front"}"`,
    `data-mirrored="${miroirX ? "x" : "none"}"`,
    ...(t.jobRef !== undefined ? [`data-job="${escapeAttr(t.jobRef)}"`] : []),
  ];
  const lignes = [`<svg ${attrs.join(" ")}>`];
  if (entree.engrave !== null) {
    lignes.push("<!-- ENGRAVE -->", '<g id="ENGRAVE">');
    for (const trace of entree.engrave) {
      const segments = miroirX ? trace.map((s) => miroirSegment(s, W)) : trace;
      lignes.push(`<path d="${traceD(segments)}" fill="#000000" stroke="none"/>`);
    }
    lignes.push("</g>");
  }
  if (entree.cut) {
    lignes.push("<!-- CUT -->", '<g id="CUT">', `<path d="${traceD(contourPlaque(W, H, r))}" ${STYLE_DECOUPE}/>`, "</g>");
  }
  if (entree.holes.length > 0) {
    lignes.push("<!-- HOLES -->", '<g id="HOLES">');
    for (const h of entree.holes) lignes.push(`<circle cx="${n(x(h.cxMm))}" cy="${n(h.cyMm)}" r="${n(h.diameterMm / 2)}" ${STYLE_DECOUPE}/>`);
    lignes.push("</g>");
  }
  lignes.push("</svg>");
  return `${lignes.join("\n")}\n`;
}
