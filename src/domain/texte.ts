// Texte (§10) — parties décidées : normalisation, glyphes absents, contrôle de lisibilité contre un seuil fourni.
// OPEN, isolé : liste des polices et mesure (VR-08, SP-3), seuils minFontSizeMm / minStrokeMm (VR-08) — le fait atelier
// « 1 mm pour tout le caractère » n'est pas une règle. Aucun shaping implicite ; la taille effective est calculée ailleurs.
import type { Etat } from "./etat";
import { roundMm } from "./geometry";
import type { SegmentTrace } from "./production-svg";
import { MIN_CHARACTER_BOUNDING_BOX_HEIGHT_MM, MIN_STROKE_WIDTH_MM } from "./referentiels";
import { type DomainViolation, violation } from "./violation";

// Caractères de contrôle Unicode (Cc), hors espaces ordinaires traités à part.
const CONTROLES = /\p{Cc}/gu;

/** Normalisation §10 : NFC, suppression des contrôles, espaces multiples réduits, trim. Accents conservés. */
export function normaliserLigne(ligne: string): string {
  return ligne.normalize("NFC").replace(CONTROLES, "").replace(/\s+/gu, " ").trim();
}

export type TexteNormalise = {
  lines: string[];
  /** Vrai si la normalisation a changé le texte : la modification est signalée, jamais silencieuse. */
  modifie: boolean;
};

export function normaliserTexte(lines: readonly string[]): TexteNormalise {
  const normalisees = lines.map(normaliserLigne);
  return { lines: normalisees, modifie: normalisees.some((l, i) => l !== lines[i]) };
}

/** Glyphes absents de la police (§10) : `UNSUPPORTED_GLYPHS`, avec la liste des caractères concernés. */
export function glyphesAbsents(lines: readonly string[], glyphesDisponibles: ReadonlySet<string>): DomainViolation[] {
  const absents = new Set<string>();
  for (const ligne of lines) {
    for (const c of ligne) if (c !== " " && !glyphesDisponibles.has(c)) absents.add(c);
  }
  return absents.size > 0 ? [violation("UNSUPPORTED_GLYPHS", "design.text.lines", `glyphes absents : ${[...absents].join(" ")}`)] : [];
}

/** Lisibilité (§10) : taille < seuil ⇒ BELOW_LEGIBILITY ; seuil À VALIDER (VR-08) ⇒ VALIDATION_REQUIRED. */
export function evaluerLisibilite(effectiveFontSizeMm: number, minFontSizeMm: Etat<number>): DomainViolation[] {
  if (minFontSizeMm.etat === "A_VALIDER") return [violation("VALIDATION_REQUIRED", "designRules.minFontSizeMm", "taille minimale non validée (VR-08)")];
  if (minFontSizeMm.etat === "DEFINIE" && effectiveFontSizeMm < minFontSizeMm.valeur) {
    return [violation("BELOW_LEGIBILITY", "design.text", "taille de texte sous le seuil de lisibilité")];
  }
  return [];
}

// ---------- Texte converti en tracés (VR-08, F10) ----------
// Les tracés sont produits hors domaine par le moteur de polices et de composition (SP-3), en mm, dans le repère de la
// plaque, vue face. Le domaine les mesure et les contrôle ; il ne les modifie jamais (F11 : aucune compensation,
// simplification ni transformation additionnelle) et n'adapte jamais le texte (F6 : toute adaptation relève du client).

export type CaractereTrace = { caractere: string; contours: SegmentTrace[][] };
export type Boite = { xMin: number; yMin: number; xMax: number; yMax: number };

/** Racines dans ]0, 1[ de la dérivée d'une cubique de Bézier sur un axe. */
function extremaCubique(p0: number, p1: number, p2: number, p3: number): number[] {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = p1 - p0;
  const racines: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) racines.push(-c / b);
  } else {
    const d = b * b - 4 * a * c;
    if (d >= 0) racines.push((-b + Math.sqrt(d)) / (2 * a), (-b - Math.sqrt(d)) / (2 * a));
  }
  return racines.filter((t) => t > 0 && t < 1);
}

const cubique = (p0: number, p1: number, p2: number, p3: number, t: number) =>
  (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;

/** Boîte englobante exacte des contours (extrema des cubiques inclus) ; null si aucun contour. */
export function boiteEnglobante(contours: readonly SegmentTrace[][]): Boite | null {
  const xs: number[] = [];
  const ys: number[] = [];
  for (const contour of contours) {
    let cx = 0;
    let cy = 0;
    for (const s of contour) {
      if (s.op === "Z") continue;
      if (s.op === "C") {
        for (const t of extremaCubique(cx, s.x1, s.x2, s.x)) xs.push(cubique(cx, s.x1, s.x2, s.x, t));
        for (const t of extremaCubique(cy, s.y1, s.y2, s.y)) ys.push(cubique(cy, s.y1, s.y2, s.y, t));
      }
      xs.push(s.x);
      ys.push(s.y);
      cx = s.x;
      cy = s.y;
    }
  }
  if (xs.length === 0) return null;
  return { xMin: Math.min(...xs), yMin: Math.min(...ys), xMax: Math.max(...xs), yMax: Math.max(...ys) };
}

/** Hauteur de la boîte englobante d'un caractère (F2), arrondie par roundMm ; null si le caractère n'a pas de contour. */
export function hauteurBoiteEnglobanteMm(c: CaractereTrace): number | null {
  const b = boiteEnglobante(c.contours);
  return b === null ? null : roundMm(b.yMax - b.yMin);
}

const boiteTouCheCercle = (b: Boite, z: { cxMm: number; cyMm: number; rMm: number }) => {
  const px = Math.max(b.xMin, Math.min(z.cxMm, b.xMax));
  const py = Math.max(b.yMin, Math.min(z.cyMm, b.yMax));
  return (px - z.cxMm) ** 2 + (py - z.cyMm) ** 2 < z.rMm ** 2;
};

/**
 * Contrôles du texte tracé (§10, VR-08) :
 * - hauteur de boîte englobante < 1 mm ⇒ BELOW_LEGIBILITY (par caractère) ;
 * - caractère hors de la zone utile ⇒ TEXT_TOO_LONG. Zone utile = plaque − zones de trous : safe zone SANS_OBJET
 *   (arbitrage A2), aucune marge texte de 10 mm. Aucun redimensionnement ni correction (F6).
 */
export function evaluerTexteTrace(input: {
  caracteres: readonly CaractereTrace[];
  plaque: { widthMm: number; heightMm: number };
  zonesTrous: ReadonlyArray<{ cxMm: number; cyMm: number; rMm: number }>;
}): DomainViolation[] {
  const out: DomainViolation[] = [];
  let hors = false;
  input.caracteres.forEach((c, i) => {
    const boite = boiteEnglobante(c.contours);
    if (boite === null) return;
    if (roundMm(boite.yMax - boite.yMin) < MIN_CHARACTER_BOUNDING_BOX_HEIGHT_MM) {
      out.push(violation("BELOW_LEGIBILITY", `design.text.caracteres.${i}`, "hauteur de boîte englobante du caractère < 1 mm (VR-08)"));
    }
    const dansPlaque = boite.xMin >= 0 && boite.yMin >= 0 && boite.xMax <= input.plaque.widthMm && boite.yMax <= input.plaque.heightMm;
    if (!dansPlaque || input.zonesTrous.some((z) => boiteTouCheCercle(boite, z))) hors = true;
  });
  if (hors) out.push(violation("TEXT_TOO_LONG", "design.text", "le texte ne tient pas dans la zone utile ; adaptation soumise au client (F6)"));
  return out;
}

/**
 * Trait minimal de gravure (F3 : 1 mm). Les épaisseurs sont MESURÉES hors domaine : la méthode de mesure sur des tracés
 * vectoriels et le code / la sévérité du non-respect (§10 « avertissement / erreur ») ne sont pas arbitrés.
 * Cette fonction ne produit donc aucun code : elle renvoie les index non conformes.
 */
export function traitsSousMinimum(mesures: ReadonlyArray<{ index: number; epaisseurMinMm: number }>): number[] {
  return mesures.filter((m) => roundMm(m.epaisseurMinMm) < MIN_STROKE_WIDTH_MM).map((m) => m.index);
}

/** Évaluation du texte : normalisation puis glyphes, sur le texte normalisé. Aucune règle sur les lignes vides n'est définie. */
export function evaluerTexte(input: { lines: readonly string[]; glyphesDisponibles: ReadonlySet<string> }): { texte: TexteNormalise; violations: DomainViolation[] } {
  const texte = normaliserTexte(input.lines);
  return { texte, violations: glyphesAbsents(texte.lines, input.glyphesDisponibles) };
}
