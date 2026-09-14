// BAT enregistré / finalisé (Phase 5, §15) : le BAT validé devient la source contractuelle figée.
// Enregistrement = BAT validé gelé + empreinte d'intégrité calculée par la fonction de hachage du serveur (P7 OPEN).
// Aucune modification possible : toute évolution passe par un nouveau BAT (G2-D1). L'immuabilité en base reste hors domaine.
import { verifierArtefacts } from "./artefacts-bat";
import type { Bat, BatValide } from "./bat";
import { canonicalJson } from "./geometrie-canonique";
import { type DomainViolation, violation } from "./violation";

export type BatEnregistre = Readonly<{ bat: BatValide; integrite: string }>;

export type ResultatEnregistrement = { ok: true; enregistre: BatEnregistre } | { ok: false; violations: DomainViolation[] };

function geler<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) geler(v);
  }
  return value;
}

/**
 * Enregistre un BAT validé : refus d'un brouillon ; artefacts stockés vérifiés contre leur régénération (§15) ;
 * empreinte d'intégrité sur le JSON canonique du BAT validé.
 */
export function enregistrerBat(bat: Bat, hacher: (contenu: string) => string): ResultatEnregistrement {
  if (bat.status !== "validated") {
    return { ok: false, violations: [violation("BAT_NOT_VALIDATED", "status", "seul un BAT validé peut être enregistré (§15)")] };
  }
  const artefacts = verifierArtefacts(bat, hacher);
  if (artefacts.length > 0) return { ok: false, violations: artefacts };
  const copie = structuredClone(bat) as BatValide;
  return { ok: true, enregistre: geler({ bat: copie, integrite: hacher(canonicalJson(copie)) }) };
}

/** Vérifie qu'un BAT enregistré n'a pas été altéré : empreinte d'intégrité et artefacts régénérés. */
export function verifierBatEnregistre(e: BatEnregistre, hacher: (contenu: string) => string): DomainViolation[] {
  if (hacher(canonicalJson(e.bat)) !== e.integrite) {
    return [violation("BAT_INTEGRITY_MISMATCH", "integrite", "le BAT enregistré ne correspond plus à son empreinte")];
  }
  return verifierArtefacts(e.bat, hacher);
}
