// Primitives géométriques (§10, §11.3). Unités : mm.

/** Arrondi unique des cotes (§10) : 3 décimales. */
export function roundMm(v: number): number {
  const r = Math.round((v + Number.EPSILON * Math.sign(v)) * 1000) / 1000;
  return Object.is(r, -0) ? 0 : r;
}

/** Plaque rectangulaire (MVP = rectangle, §7.4). */
export type PlaqueMm = { widthMm: number; heightMm: number; cornerRadiusMm: number };
