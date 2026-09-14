// Évaluation d'un artwork placé (§9, §10, Annexe B étape 8) — parties décidées uniquement.
// Décidé : format et politique raster par workflow, maxPixels, destination de couche par workflow (jamais par couleur),
// placement dans la plaque, chevauchement des zones de trous, mode couleur dérivé, transformation imposée par la référence.
// OPEN, isolé : safe zone et zone utile complète (VR-08), maxBytes (OD-25), DPI minimal (VR-27), trait minimal (VR-08),
// catégorie ART-1 de la conversion bilevel (ART1-DOC). Aucune valeur n'est présumée.
import { acceptsArtworkFormat, type ArtworkPlacement, type ArtworkRules } from "./artwork";
import type { Hole } from "./holes";
import type { MaterialVariant } from "./reference";
import type { ProductionWorkflowId } from "./referentiels";
import { type DomainViolation, violation } from "./violation";

/** Métadonnées serveur du fichier original (issues du pipeline d'upload, jamais de la requête client). */
export type ArtworkMetadata = {
  format: ArtworkRules["formats"][number];
  bytes: number;
  /** Dimensions en pixels : raster uniquement. */
  pixels?: { width: number; height: number };
  /** Le contenu comporte des couleurs autres que le noir. */
  contientCouleur: boolean;
};

export type CoucheArtwork = "engrave" | "print" | "engrave_et_print";

/** Destination d'après le workflow (§10), jamais d'après les couleurs de l'artwork. */
export const COUCHE_PAR_WORKFLOW: Readonly<Record<ProductionWorkflowId, CoucheArtwork>> = {
  TROLASE_ENGRAVE: "engrave",
  TROLASE_METALLIC_ENGRAVE: "engrave",
  PLEXIGLASS_UV: "print",
  TROGLASS_METALLIC_HYBRID: "engrave_et_print",
};

/** Emprise du placement après rotation (rotation de 90° ou 270° : largeur et hauteur échangées). */
export function empriseArtwork(p: ArtworkPlacement): { xMin: number; yMin: number; xMax: number; yMax: number } {
  const tourne = p.rotationDeg === 90 || p.rotationDeg === 270;
  const w = tourne ? p.heightMm : p.widthMm;
  const h = tourne ? p.widthMm : p.heightMm;
  return { xMin: p.xMm, yMin: p.yMm, xMax: p.xMm + w, yMax: p.yMm + h };
}

/**
 * DPI effectif à la taille posée : pixels / (mm / 25,4), le plus faible des deux axes. `widthMm` / `heightMm` sont les
 * dimensions propres de l'image (avant rotation) : la rotation ne change pas le DPI. Aucun seuil ici (VR-27).
 */
export function dpiEffectif(pixels: { width: number; height: number }, p: ArtworkPlacement): number {
  return Math.min(pixels.width / (p.widthMm / 25.4), pixels.height / (p.heightMm / 25.4));
}

export type TransformationRequise = {
  kind: "monochrome_couleur_revelee" | "noir" | "bilevel";
  visible: boolean;
  /** Catégorie ART-1 : B pour une conversion couleur visible imposée (ART1-D1, D5) ; bilevel À VALIDER (ART1-DOC). */
  categorie: { etat: "DEFINIE"; valeur: "A" | "B" } | { etat: "A_VALIDER" };
};

export type EvaluationArtwork = {
  couche: CoucheArtwork;
  modeCouleur: ArtworkRules["modeCouleur"];
  transformations: TransformationRequise[];
  dpiEffectif: number | null;
  violations: DomainViolation[];
};

const RASTER = new Set(["png", "jpeg"]);

/** Transformation imposée par la référence et le workflow (§9.2, ART1-D1, ART1-D5). */
function transformations(workflowId: ProductionWorkflowId, reference: MaterialVariant, meta: ArtworkMetadata, out: DomainViolation[]): TransformationRequise[] {
  const raster = RASTER.has(meta.format);
  switch (workflowId) {
    case "TROLASE_ENGRAVE":
    case "TROLASE_METALLIC_ENGRAVE":
      // Version normalisée monochrome dans la couleur révélée ; visible si l'original comporte de la couleur.
      return meta.contientCouleur ? [{ kind: "monochrome_couleur_revelee", visible: true, categorie: { etat: "DEFINIE", valeur: "B" } }] : [];
    case "TROGLASS_METALLIC_HYBRID":
      if (raster) return [{ kind: "bilevel", visible: true, categorie: { etat: "A_VALIDER" } }];
      return meta.contientCouleur ? [{ kind: "noir", visible: true, categorie: { etat: "DEFINIE", valeur: "B" } }] : [];
    case "PLEXIGLASS_UV": {
      const politique = reference.politiqueImpression.valeur;
      if (politique.etat !== "DEFINIE") {
        out.push(violation("VALIDATION_REQUIRED", `references.${reference.id}.politiqueImpression.valeur`, "politique d'impression non validée"));
        return [];
      }
      if (politique.valeur === "noir_uniquement" && meta.contientCouleur) {
        return [{ kind: "noir", visible: true, categorie: { etat: "DEFINIE", valeur: "B" } }];
      }
      return [];
    }
  }
}

export function evaluateArtwork(input: {
  placement: ArtworkPlacement;
  meta: ArtworkMetadata;
  rules: ArtworkRules;
  reference: MaterialVariant;
  plaque: { widthMm: number; heightMm: number };
  holes: readonly Hole[];
  holeKeepOutMarginMm: number | null;
}): EvaluationArtwork {
  const { placement, meta, rules, reference, plaque, holes } = input;
  const out: DomainViolation[] = [];
  const workflowId = reference.productionWorkflowId;

  if (rules.workflowId !== workflowId) out.push(violation("ARTWORK_RULES_MISSING", "artworkRules.workflowId", "règles d'artwork d'un autre workflow"));

  // Format et politique raster (VR-28, décision TroGlass)
  const raster = RASTER.has(meta.format);
  if (!rules.formats.includes(meta.format)) {
    out.push(violation("ARTWORK_FORMAT_NOT_ALLOWED", "artwork.format", "format non autorisé (OD-08)"));
  } else if (!acceptsArtworkFormat(rules, meta.format)) {
    out.push(
      rules.rasterPolicy.etat === "DEFINIE"
        ? violation("ARTWORK_RASTER_REJECTED", "artwork.format", "raster refusé pour ce workflow (VR-28)")
        : violation("VALIDATION_REQUIRED", `artworkRules.${rules.id}.rasterPolicy`, "politique raster non validée"),
    );
  }

  // Pixels (décision ADR-0003)
  if (raster) {
    if (!meta.pixels) out.push(violation("ARTWORK_PIXELS_UNKNOWN", "artwork.pixels", "dimensions en pixels requises pour un raster"));
    else if (meta.pixels.width * meta.pixels.height > rules.maxPixels) out.push(violation("ARTWORK_TOO_MANY_PIXELS", "artwork.pixels", "maxPixels dépassé"));
  }

  // Taille du fichier : OD-25 ouvert
  if (rules.maxBytes.etat === "A_VALIDER") out.push(violation("VALIDATION_REQUIRED", `artworkRules.${rules.id}.maxBytes`, "taille maximale non validée (OD-25)"));
  else if (rules.maxBytes.etat === "DEFINIE" && meta.bytes > rules.maxBytes.valeur) out.push(violation("ARTWORK_TOO_LARGE", "artwork.bytes", "taille maximale dépassée"));

  // DPI à la taille posée : seuil VR-27 ouvert (le fait atelier « 300 DPI » n'est pas une règle)
  const dpi = raster && meta.pixels ? dpiEffectif(meta.pixels, placement) : null;
  if (dpi !== null) {
    if (rules.minDpiAtPlacedSize.etat === "A_VALIDER") out.push(violation("VALIDATION_REQUIRED", `artworkRules.${rules.id}.minDpiAtPlacedSize`, "DPI minimal non validé (VR-27)"));
    else if (rules.minDpiAtPlacedSize.etat === "DEFINIE" && dpi < rules.minDpiAtPlacedSize.valeur) out.push(violation("ARTWORK_DPI_TOO_LOW", "artwork.placement", "résolution insuffisante à la taille posée"));
  }

  // Placement : dans la plaque (condition nécessaire ; la safe zone VR-08 n'est pas appliquée)
  const e = empriseArtwork(placement);
  if (e.xMin < 0 || e.yMin < 0 || e.xMax > plaque.widthMm || e.yMax > plaque.heightMm) {
    out.push(violation("ARTWORK_OUT_OF_BOUNDS", "design.artwork", "artwork hors de la plaque"));
  }

  // Chevauchement des zones de trous (§10) : disque de rayon d/2 + marge
  if (holes.length > 0) {
    if (input.holeKeepOutMarginMm === null) {
      out.push(violation("VALIDATION_REQUIRED", "mountingRules.holeKeepOutMarginMm", "marge autour des trous non validée"));
    } else {
      const marge = input.holeKeepOutMarginMm;
      const touche = holes.some((h) => {
        const r = h.diameterMm / 2 + marge;
        const px = Math.max(e.xMin, Math.min(h.cxMm, e.xMax));
        const py = Math.max(e.yMin, Math.min(h.cyMm, e.yMax));
        return (px - h.cxMm) ** 2 + (py - h.cyMm) ** 2 < r * r;
      });
      if (touche) out.push(violation("ARTWORK_KEEPOUT", "design.artwork", "artwork sur la zone d'un trou"));
    }
  }

  return { couche: COUCHE_PAR_WORKFLOW[workflowId], modeCouleur: rules.modeCouleur, transformations: transformations(workflowId, reference, meta, out), dpiEffectif: dpi, violations: out };
}
