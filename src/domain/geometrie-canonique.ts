// Géométrie canonique (§6 CanonicalGeometry, §11.3, §12) — représentation DÉRIVÉE de la spécification résolue.
// Elle ne modifie jamais la requête ni la spécification : les valeurs sources restent intactes ; seul l'objet canonique
// est arrondi par roundMm (§6 : « mm, arrondi roundMm (3 décimales) »).
// Isolés, non résolus : safe zone et zones de bord (VR-08), tracés et shaping du texte (SP-3), hash (arbitrage P7),
// transformation de fichier liée à l'orientation de pose (VR-41). Les versions des moteurs sont reçues, jamais présumées.
import { z } from "zod";
import { COUCHE_PAR_WORKFLOW } from "./artwork-evaluation";
import { artworkPlacementSchema, type ArtworkPlacement } from "./artwork";
import { roundMm } from "./geometry";
import type { ResolvedSpec } from "./resolved-spec";
import { type DomainViolation, violation } from "./violation";

const mm = z.number();

export const engineVersionsSchema = z.strictObject({
  design: z.string().min(1),
  mounting: z.string().min(1),
  geometry: z.string().min(1),
  render: z.string().min(1),
  production: z.string().min(1),
});
export type EngineVersions = z.infer<typeof engineVersionsSchema>;

/** Élément d'artwork d'une couche : référence de l'artwork et placement ; aucun tracé (version normalisée hors domaine). */
const elementArtworkSchema = z.strictObject({ kind: z.literal("artwork"), artworkRef: z.string().min(1), placement: artworkPlacementSchema });

export const canonicalGeometrySchema = z.strictObject({
  plate: z.strictObject({ widthMm: mm, heightMm: mm, cornerRadiusMm: mm, thicknessMm: mm }),
  /** VR-08 : non défini ; aucune valeur présumée. */
  safeZoneMm: z.strictObject({ etat: z.literal("A_VALIDER") }),
  holes: z.array(z.strictObject({ cxMm: mm, cyMm: mm, diameterMm: mm })),
  /** Zones autour des trous uniquement ; zones de bord absentes tant que VR-08 est ouvert. */
  keepOutZones: z.array(z.strictObject({ kind: z.literal("hole"), shape: z.strictObject({ type: z.literal("circle"), cxMm: mm, cyMm: mm, rMm: mm }) })),
  layers: z.strictObject({
    engrave: z.array(elementArtworkSchema),
    /** null si la politique d'impression de la référence est « aucune » (§6). */
    print: z.array(elementArtworkSchema).nullable(),
  }),
  engineVersions: engineVersionsSchema,
});
export type CanonicalGeometry = z.infer<typeof canonicalGeometrySchema>;

export type ResultatGeometrie = { ok: true; geometry: CanonicalGeometry } | { ok: false; violations: DomainViolation[] };

const arrondirPlacement = (p: ArtworkPlacement): ArtworkPlacement => ({
  ...p,
  xMm: roundMm(p.xMm),
  yMm: roundMm(p.yMm),
  widthMm: roundMm(p.widthMm),
  heightMm: roundMm(p.heightMm),
});

export function buildCanonicalGeometry(input: {
  spec: ResolvedSpec;
  /** Placement de l'artwork de la configuration (null si aucun). */
  artwork: ArtworkPlacement | null;
  /** Texte présent : tracés non définis (SP-3). */
  textePresent: boolean;
  engineVersions: unknown;
}): ResultatGeometrie {
  const { spec } = input;
  const violations: DomainViolation[] = [];

  // Versions des moteurs : reçues, complètes, sans valeur de repli
  const versions = engineVersionsSchema.safeParse(input.engineVersions);
  if (!versions.success) {
    for (const i of versions.error.issues) violations.push(violation("ENGINE_VERSION_MISSING", `engineVersions.${i.path.map(String).join(".") || "(racine)"}`, "version de moteur absente ou invalide"));
  }

  // Texte : tracés et shaping non définis (SP-3, VR-08)
  if (input.textePresent) violations.push(violation("VALIDATION_REQUIRED", "layers.text", "tracés du texte non définis (SP-3)"));

  // Zones autour des trous : disque de rayon d/2 + marge résolue ; aucune marge inventée
  if (spec.holes.length > 0 && spec.mountingRules === null) {
    violations.push(violation("VALIDATION_REQUIRED", "mountingRules", "trous sans règles résolues"));
  }

  if (violations.length > 0 || !versions.success) return { ok: false, violations };

  const rules = spec.mountingRules;
  const couche = COUCHE_PAR_WORKFLOW[spec.workflow.id];
  const element = input.artwork ? [{ kind: "artwork" as const, artworkRef: input.artwork.artworkRef, placement: arrondirPlacement(input.artwork) }] : [];

  const geometry: CanonicalGeometry = {
    plate: {
      widthMm: roundMm(spec.plate.widthMm),
      heightMm: roundMm(spec.plate.heightMm),
      cornerRadiusMm: roundMm(spec.plate.cornerRadiusMm),
      thicknessMm: roundMm(spec.thickness.mm),
    },
    safeZoneMm: { etat: "A_VALIDER" },
    holes: spec.holes.map((h) => ({ cxMm: roundMm(h.cxMm), cyMm: roundMm(h.cyMm), diameterMm: roundMm(h.diameterMm) })),
    // Trous présents ⇒ règles résolues (contrôlé ci-dessus) ; aucune marge de repli.
    keepOutZones:
      rules === null
        ? []
        : spec.holes.map((h) => ({ kind: "hole" as const, shape: { type: "circle" as const, cxMm: roundMm(h.cxMm), cyMm: roundMm(h.cyMm), rMm: roundMm(h.diameterMm / 2 + rules.holeKeepOutMarginMm) } })),
    layers: {
      engrave: couche === "engrave" || couche === "engrave_et_print" ? element : [],
      print: spec.politiqueImpression.valeur === "aucune" ? null : couche === "print" || couche === "engrave_et_print" ? element : [],
    },
    engineVersions: versions.data,
  };
  return { ok: true, geometry: canonicalGeometrySchema.parse(geometry) };
}

/** JSON canonique (§12) : clés triées, sans espace ; déterministe. Le hash n'est pas calculé ici (arbitrage P7). */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}
