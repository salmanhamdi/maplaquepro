// Point d'entrée serveur de création d'un brouillon de BAT (§15, Annexe B) : createBat n'aboutit que si la requête est
// conforme (P13) et la configuration fabricable ; sinon rejet typé avec l'étape en cause et, pour une non-fabricabilité,
// les alternatives elles-mêmes fabricables (étape 9). Aucune valeur n'est inventée : tout élément À VALIDER reste tel quel
// et le brouillon n'est pas validable (P7). Aucun BAT partiel n'est renvoyé.
import { type Alternative, proposeAlternatives } from "./alternatives";
import type { BatBrouillon } from "./bat";
import type { Catalog } from "./catalog";
import { type DonneesServeur, evaluateFabricability } from "./fabricabilite";
import type { CanonicalGeometry } from "./geometrie-canonique";
import { type EntreePreparationBat, preparerBat } from "./preparation-bat";
import type { DomainViolation } from "./violation";

export type ResultatCreateBat =
  | { ok: true; bat: BatBrouillon; enAttente: string[]; geometry: CanonicalGeometry }
  | { ok: false; stage: "request" | "catalog" | "fabrication" | "bat"; violations: DomainViolation[]; alternatives: Alternative[] };

export function createBat(
  e: { input: unknown; catalog: Catalog; donnees?: DonneesServeur } & Omit<EntreePreparationBat, "fabricable" | "catalog">,
): ResultatCreateBat {
  const donnees = e.donnees ?? {};
  const fab = evaluateFabricability(e.input, e.catalog, donnees);
  if (!fab.ok) {
    const alternatives = fab.stage === "fabrication" ? proposeAlternatives(e.input as Record<string, unknown>, e.catalog, donnees) : [];
    return { ok: false, stage: fab.stage, violations: fab.violations, alternatives };
  }
  const { input: _input, donnees: _donnees, ...preparation } = e;
  const r = preparerBat({ ...preparation, fabricable: fab });
  if (!r.ok || !r.geometry) return { ok: false, stage: "bat", violations: r.ok ? [] : r.violations, alternatives: [] };
  return { ok: true, bat: r.bat, enAttente: r.enAttente ?? [], geometry: r.geometry };
}
