// Moteur de trous (§11.1, §11.3, P11). Pur et déterministe.
// Les paramètres atelier (VR-22 à VR-24) viennent de MountingRules : tant qu'un paramètre requis est À VALIDER,
// les trous sont indisponibles. Aucune valeur n'est présumée ni corrigée (P11 × P13).
import { type PlaqueMm, roundMm } from "./geometry";
import type { MountingPattern, MountingRules } from "./mounting";
import { DEFAULT_EDGE_DISTANCE_TARGET_MM } from "./mounting";
import type { ThicknessId } from "./referentiels";
import { type DomainViolation, violation } from "./violation";

export type EdgeDistanceSemantics = "edge_to_center" | "edge_to_rim";

/** Paramètres de trous résolus (tous DEFINIE). */
export type ResolvedMountingRules = {
  holeDiameterMm: number;
  minEdgeDistanceMm: number;
  holeKeepOutMarginMm: number;
  edgeDistanceSemantics: EdgeDistanceSemantics;
  /** Requise uniquement pour 2 trous (VR-24) ; null si non définie. */
  twoHolesDisposition: "horizontal_centered" | null;
};

export type Hole = { cxMm: number; cyMm: number; diameterMm: number };

export type Resultat<T> = { ok: true; value: T } | { ok: false; violations: DomainViolation[] };

const PARAMS_REQUIS = ["holeDiameterMm", "minEdgeDistanceMm", "holeKeepOutMarginMm", "edgeDistanceSemantics"] as const;

/**
 * Applique la surcharge contextuelle correspondant à la référence et à l'épaisseur (P11 D6).
 * Aucune règle de priorité n'est définie entre surcharges : plusieurs surcharges applicables ⇒ rejet typé.
 */
export function resolveMountingRules(
  rules: MountingRules,
  context: { variantId: string; thicknessId: ThicknessId },
): Resultat<ResolvedMountingRules> {
  const applicables = (rules.overrides ?? []).filter(
    (o) => (o.variantId === undefined || o.variantId === context.variantId) && (o.thicknessId === undefined || o.thicknessId === context.thicknessId),
  );
  if (applicables.length > 1) {
    return { ok: false, violations: [violation("MOUNTING_OVERRIDE_AMBIGUOUS", `mountingRules.${rules.id}.overrides`, "plusieurs surcharges applicables, aucune priorité définie")] };
  }
  const effectives = { ...rules, ...Object.fromEntries(Object.entries(applicables[0] ?? {}).filter(([, v]) => v !== undefined)) } as MountingRules;

  const violations: DomainViolation[] = [];
  for (const param of PARAMS_REQUIS) {
    if (effectives[param].etat !== "DEFINIE") {
      violations.push(violation("MOUNTING_PARAMETER_NOT_VALIDATED", `mountingRules.${rules.id}.${param}`, "paramètre de trous non validé : trous indisponibles (§11.1)"));
    }
  }
  const { holeDiameterMm: d, minEdgeDistanceMm: m, holeKeepOutMarginMm: k, edgeDistanceSemantics: s, twoHolesDisposition: t } = effectives;
  if (violations.length > 0 || d.etat !== "DEFINIE" || m.etat !== "DEFINIE" || k.etat !== "DEFINIE" || s.etat !== "DEFINIE") {
    return { ok: false, violations };
  }
  return {
    ok: true,
    value: {
      holeDiameterMm: d.valeur,
      minEdgeDistanceMm: m.valeur,
      holeKeepOutMarginMm: k.valeur,
      edgeDistanceSemantics: s.valeur,
      twoHolesDisposition: t.etat === "DEFINIE" ? t.valeur : null,
    },
  };
}

/** Distance du bord au centre (§11.3) : c = e (edge_to_center) ou e + d/2 (edge_to_rim). */
export const centreDepuisBord = (e: number, rules: ResolvedMountingRules): number =>
  rules.edgeDistanceSemantics === "edge_to_center" ? e : e + rules.holeDiameterMm / 2;

const dansZoneArrondi = (x: number, y: number, p: PlaqueMm): boolean => {
  const r = p.cornerRadiusMm;
  if (r <= 0) return false;
  const presBordX = x < r || x > p.widthMm - r;
  const presBordY = y < r || y > p.heightMm - r;
  return presBordX && presBordY;
};

/** Validation d'une cote sur un axe (§11.3). */
function validerAxe(e: number, longueurMm: number, axe: "X" | "Y", rules: ResolvedMountingRules, path: string): DomainViolation[] {
  const out: DomainViolation[] = [];
  const d = rules.holeDiameterMm;
  const c = centreDepuisBord(e, rules);
  if (e < rules.minEdgeDistanceMm) out.push(violation("HOLE_EDGE_DISTANCE_BELOW_MINIMUM", path, `cote ${axe} inférieure à la distance minimale`));
  if (c < d / 2 + rules.holeKeepOutMarginMm) out.push(violation("HOLE_KEEP_OUT_MARGIN_VIOLATED", path, `marge autour du trou non respectée (${axe})`));
  if (!(2 * c + d < longueurMm)) out.push(violation("HOLES_DO_NOT_FIT_PLATE", path, `trous incompatibles avec la dimension ${axe} de la plaque`));
  return out;
}

/**
 * Génère les trous d'un motif soumis (§11.3). Une cote invalide est rejetée, jamais ramenée à une valeur valide (§16bis).
 */
export function generateHoles(pattern: MountingPattern, plaque: PlaqueMm, rules: ResolvedMountingRules): Resultat<Hole[]> {
  if (pattern.count === 0) return { ok: true, value: [] };
  const [eX, eY, pathX, pathY] =
    pattern.mode === "standard"
      ? [pattern.edgeDistanceMm, pattern.edgeDistanceMm, "mounting.edgeDistanceMm", "mounting.edgeDistanceMm"]
      : [pattern.edgeDistanceXMm, pattern.edgeDistanceYMm, "mounting.edgeDistanceXMm", "mounting.edgeDistanceYMm"];
  const W = plaque.widthMm;
  const H = plaque.heightMm;
  const d = rules.holeDiameterMm;
  const cX = centreDepuisBord(eX, rules);
  const violations: DomainViolation[] = [...validerAxe(eX, W, "X", rules, pathX)];

  let centres: Array<[number, number]>;
  if (pattern.count === 2) {
    if (rules.twoHolesDisposition !== "horizontal_centered") {
      return { ok: false, violations: [violation("MOUNTING_PARAMETER_NOT_VALIDATED", "mountingRules.twoHolesDisposition", "disposition à 2 trous non validée (VR-24)")] };
    }
    centres = [
      [cX, H / 2],
      [W - cX, H / 2],
    ];
  } else {
    violations.push(...validerAxe(eY, H, "Y", rules, pathY));
    const cY = centreDepuisBord(eY, rules);
    centres = [
      [cX, cY],
      [W - cX, cY],
      [cX, H - cY],
      [W - cX, H - cY],
    ];
  }
  if (centres.some(([x, y]) => dansZoneArrondi(x, y, plaque))) {
    violations.push(violation("HOLE_IN_CORNER_RADIUS_ZONE", "mounting", "centre de trou dans la zone d'arrondi (§11.3)"));
  }
  if (violations.length > 0) return { ok: false, violations };
  return { ok: true, value: centres.map(([x, y]) => ({ cxMm: roundMm(x), cyMm: roundMm(y), diameterMm: roundMm(d) })) };
}

export type DefaultEdgeDistance =
  | { disponible: true; edgeDistanceMm: number; adapte: boolean }
  | { disponible: false; violations: DomainViolation[] };

/**
 * Règle P11 (mode standard) : 3,0 mm si toutes les contraintes sont satisfaites ; sinon la plus petite valeur
 * supérieure valide au pas de 0,1 mm, signalée (`adapte`) ; sinon trous indisponibles. Déterministe.
 */
export function resolveDefaultEdgeDistance(count: 2 | 4, plaque: PlaqueMm, rules: ResolvedMountingRules): DefaultEdgeDistance {
  const debut = Math.round(DEFAULT_EDGE_DISTANCE_TARGET_MM * 10);
  const fin = Math.ceil((Math.max(plaque.widthMm, plaque.heightMm) / 2) * 10);
  let dernier: DomainViolation[] = [];
  for (let dixiemes = debut; dixiemes <= fin; dixiemes++) {
    const e = dixiemes / 10;
    const r = generateHoles({ count, mode: "standard", edgeDistanceMm: e }, plaque, rules);
    if (r.ok) return { disponible: true, edgeDistanceMm: e, adapte: dixiemes !== debut };
    dernier = r.violations;
  }
  return { disponible: false, violations: [violation("HOLES_UNAVAILABLE", "mounting", "aucune distance au bord valide pour cette configuration (P11)"), ...dernier] };
}
