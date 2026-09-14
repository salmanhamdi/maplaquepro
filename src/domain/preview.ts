// T1 (Phase 4, sous-périmètre autorisé) : preview serveur dérivée de la géométrie canonique (§12) et comparaison
// « bbox preview / production » (§14.1). Aucune seconde source de vérité : la preview et le fichier machine dérivent de la
// même géométrie canonique. La preview est en vue face (§12) ; le fichier machine côté envers porte le miroir X (§13).
// Rendu visuel non normatif (DA / UX-2 à préciser). Non couverts : artwork (ART1-DOC), texte imprimé (couleur non définie).
import type { CanonicalGeometry } from "./geometrie-canonique";
import { roundMm } from "./geometry";
import type { ResolvedSpec } from "./resolved-spec";
import { contourPlaque, type SegmentTrace } from "./production-svg";
import { boiteEnglobante, type Boite } from "./texte";
import { type DomainViolation, violation } from "./violation";

const n = (v: number) => String(roundMm(v));
const d = (segments: readonly SegmentTrace[]) =>
  segments
    .map((s) => (s.op === "Z" ? "Z" : s.op === "C" ? `C${n(s.x1)} ${n(s.y1)} ${n(s.x2)} ${n(s.y2)} ${n(s.x)} ${n(s.y)}` : `${s.op}${n(s.x)} ${n(s.y)}`))
    .join(" ");

export type ResultatPreview = { ok: true; svg: string } | { ok: false; violations: DomainViolation[] };

/**
 * Preview serveur en vue face (§12). Couleurs dérivées de la référence résolue (§12) : surface de la plaque ; gravure
 * laser dans la couleur révélée ; hybride (gravure envers + UV noir) en noir. Éléments non rendus ⇒ VALIDATION_REQUIRED.
 */
export function renderPreviewSvg(input: { geometry: CanonicalGeometry; spec: ResolvedSpec }): ResultatPreview {
  const { geometry: g, spec } = input;
  const violations: DomainViolation[] = [];
  const W = g.plate.widthMm;
  const H = g.plate.heightMm;
  const hybride = spec.workflow.id === "TROGLASS_METALLIC_HYBRID";
  const revelee = spec.apparence.couleurRevelee;
  const couleurGravure = hybride ? "#000000" : revelee.etat === "DEFINIE" ? revelee.valeur.hex : null;

  const lignes = [`<svg xmlns="http://www.w3.org/2000/svg" width="${n(W)}mm" height="${n(H)}mm" viewBox="0 0 ${n(W)} ${n(H)}" data-preview="vue-face">`];
  if (hybride) lignes.push("<desc>vue face — gravure et impression réalisées à l'envers</desc>");
  lignes.push(`<path data-role="plate" d="${d(contourPlaque(W, H, g.plate.cornerRadiusMm))}" fill="${spec.apparence.couleurSurface.hex}" stroke="none"/>`);

  lignes.push('<g data-role="engrave">');
  for (const e of g.layers.engrave) {
    if (e.kind === "artwork") {
      violations.push(violation("VALIDATION_REQUIRED", "layers.engrave.artwork", "rendu de l'artwork non disponible (ART1-DOC)"));
      continue;
    }
    if (couleurGravure === null) {
      violations.push(violation("VALIDATION_REQUIRED", "apparence.couleurRevelee", "couleur de gravure non définie"));
      continue;
    }
    for (const glyphe of e.glyphs) for (const c of glyphe.contours) lignes.push(`<path d="${d(c as SegmentTrace[])}" fill="${couleurGravure}" stroke="none"/>`);
  }
  lignes.push("</g>");

  // Impression : noir défini par §12 pour la politique « noir uniquement » (dont l'hybride) ; couleur d'un texte imprimé
  // en politique « couleur » et rendu de l'artwork non définis ⇒ VALIDATION_REQUIRED, jamais présumés.
  const couleurImpression = spec.politiqueImpression.valeur === "noir_uniquement" ? "#000000" : null;
  lignes.push('<g data-role="print">');
  for (const e of g.layers.print ?? []) {
    if (e.kind === "artwork") {
      violations.push(violation("VALIDATION_REQUIRED", "layers.print.artwork", "rendu de l'artwork non disponible (ART1-DOC)"));
      continue;
    }
    if (couleurImpression === null) {
      violations.push(violation("VALIDATION_REQUIRED", "layers.print.text", "couleur d'impression du texte non définie"));
      continue;
    }
    for (const glyphe of e.glyphs) for (const c of glyphe.contours) lignes.push(`<path d="${d(c as SegmentTrace[])}" fill="${couleurImpression}" stroke="none"/>`);
  }
  lignes.push("</g>");

  lignes.push('<g data-role="holes">');
  for (const h of g.holes) lignes.push(`<circle cx="${n(h.cxMm)}" cy="${n(h.cyMm)}" r="${n(h.diameterMm / 2)}" fill="none" stroke="#000000" stroke-width="0.2"/>`);
  lignes.push("</g>", "</svg>");

  return violations.length > 0 ? { ok: false, violations } : { ok: true, svg: `${lignes.join("\n")}\n` };
}

// ---------- Comparaison §14.1 « bbox preview / production » ----------

/** Analyse d'un attribut `d` limité aux commandes absolues M, L, C, Z produites par les sérialiseurs du domaine. */
function segmentsDepuisD(dAttr: string): SegmentTrace[] {
  const out: SegmentTrace[] = [];
  for (const m of dAttr.matchAll(/([MLCZ])([^MLCZ]*)/g)) {
    const v = m[2]!.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (m[1] === "Z") out.push({ op: "Z" });
    else if (m[1] === "C") out.push({ op: "C", x1: v[0]!, y1: v[1]!, x2: v[2]!, y2: v[3]!, x: v[4]!, y: v[5]! });
    else out.push({ op: m[1] as "M" | "L", x: v[0]!, y: v[1]! });
  }
  return out;
}

const arrondirBoite = (b: Boite): Boite => ({ xMin: roundMm(b.xMin), yMin: roundMm(b.yMin), xMax: roundMm(b.xMax), yMax: roundMm(b.yMax) });
const miroir = (b: Boite, W: number): Boite => ({ xMin: W - b.xMax, yMin: b.yMin, xMax: W - b.xMin, yMax: b.yMax });

type BoitesSvg = { plaque: Boite | null; gravure: Boite[]; trous: Boite[] };

function groupe(svg: string, ouverture: RegExp): string | null {
  const m = svg.match(ouverture);
  if (!m || m.index === undefined) return null;
  const debut = m.index + m[0].length;
  return svg.slice(debut, svg.indexOf("</g>", debut));
}
const boitesChemins = (fragment: string | null) => (fragment === null ? [] : [...fragment.matchAll(/<path d="([^"]+)"/g)].map((m) => boiteEnglobante([segmentsDepuisD(m[1]!)])!));
const boitesCercles = (fragment: string | null) =>
  fragment === null
    ? []
    : [...fragment.matchAll(/<circle cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.-]+)"/g)].map((m) => {
        const [cx, cy, r] = [Number(m[1]), Number(m[2]), Number(m[3])];
        return { xMin: cx - r, yMin: cy - r, xMax: cx + r, yMax: cy + r };
      });

function boitesPreview(svg: string): BoitesSvg {
  const plaque = svg.match(/<path data-role="plate" d="([^"]+)"/);
  return {
    plaque: plaque ? boiteEnglobante([segmentsDepuisD(plaque[1]!)]) : null,
    gravure: boitesChemins(groupe(svg, /<g data-role="engrave">/)),
    trous: boitesCercles(groupe(svg, /<g data-role="holes">/)),
  };
}

function boitesProduction(svg: string): { boites: BoitesSvg; W: number; miroirX: boolean } {
  const W = Number(svg.match(/viewBox="0 0 ([\d.]+) /)?.[1]);
  const miroirX = svg.includes('data-mirrored="x"');
  const cut = boitesChemins(groupe(svg, /<g id="CUT">/));
  return { boites: { plaque: cut[0] ?? null, gravure: boitesChemins(groupe(svg, /<g id="ENGRAVE">/)), trous: boitesCercles(groupe(svg, /<g id="HOLES">/)) }, W, miroirX };
}

const egales = (a: Boite | null, b: Boite | null) => a !== null && b !== null && JSON.stringify(arrondirBoite(a)) === JSON.stringify(arrondirBoite(b));

/**
 * Compare les boîtes englobantes des éléments présents dans le fichier machine laser et dans la preview (§14.1) :
 * contour de plaque (CUT), tracés gravés (ENGRAVE, un à un, dans l'ordre), trous (HOLES, un à un, dans l'ordre).
 * Le fichier côté envers est ramené en vue face (x' = W − x, §13). Comparaison exacte après roundMm.
 * Points ouverts : tolérance et ensemble d'éléments à comparer non précisés par le §14.1 ; couche UV non comparée (VR-33).
 */
export function comparerPreviewProduction(previewSvg: string, productionSvg: string): DomainViolation[] {
  const p = boitesPreview(previewSvg);
  const { boites: m, W, miroirX } = boitesProduction(productionSvg);
  const face = (b: Boite) => (miroirX ? miroir(b, W) : b);
  const out: DomainViolation[] = [];
  const ecart = (element: string, detail: string) => out.push(violation("PREVIEW_PRODUCTION_BBOX_MISMATCH", element, detail));

  if (m.plaque !== null && !egales(p.plaque, face(m.plaque))) ecart("plate", "boîte englobante de la plaque différente du contour de découpe");
  if (p.gravure.length !== m.gravure.length) ecart("engrave", `nombre de tracés gravés différent (preview ${p.gravure.length}, production ${m.gravure.length})`);
  else p.gravure.forEach((b, i) => !egales(b, face(m.gravure[i]!)) && ecart(`engrave.${i}`, "boîte englobante du tracé gravé différente"));
  if (p.trous.length !== m.trous.length) ecart("holes", `nombre de trous différent (preview ${p.trous.length}, production ${m.trous.length})`);
  else p.trous.forEach((b, i) => !egales(b, face(m.trous[i]!)) && ecart(`holes.${i}`, "boîte englobante du trou différente"));
  return out;
}
