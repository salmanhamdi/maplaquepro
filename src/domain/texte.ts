// Texte (§10) — parties décidées : normalisation, glyphes absents, contrôle de lisibilité contre un seuil fourni.
// OPEN, isolé : liste des polices et mesure (VR-08, SP-3), seuils minFontSizeMm / minStrokeMm (VR-08) — le fait atelier
// « 1 mm pour tout le caractère » n'est pas une règle. Aucun shaping implicite ; la taille effective est calculée ailleurs.
import type { Etat } from "./etat";
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

/** Évaluation du texte : normalisation puis glyphes, sur le texte normalisé. Aucune règle sur les lignes vides n'est définie. */
export function evaluerTexte(input: { lines: readonly string[]; glyphesDisponibles: ReadonlySet<string> }): { texte: TexteNormalise; violations: DomainViolation[] } {
  const texte = normaliserTexte(input.lines);
  return { texte, violations: glyphesAbsents(texte.lines, input.glyphesDisponibles) };
}
