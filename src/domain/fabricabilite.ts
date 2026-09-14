// Moteur de fabricabilité (Annexe B, étapes 0 à 8). Fonction pure, autorité côté serveur (§16bis).
// Étape 8 : artwork et texte. Les données issues du traitement des fichiers (métadonnées d'artwork, jeu de glyphes de la
// police) sont fournies par le serveur, jamais par la requête client. Les dépendances ouvertes (VR-08, VR-27, ART1-DOC)
// produisent VALIDATION_REQUIRED ; aucune valeur n'est présumée.
import { type ArtworkMetadata, COUCHE_PAR_WORKFLOW, type EvaluationArtwork, evaluateArtwork } from "./artwork-evaluation";
import type { Catalog } from "./catalog";
import { type Configuration, parseConfiguration, validateConfigurationAgainstCatalog } from "./configuration";
import { evaluerDimensions, evaluerPoses, type PoseOperation } from "./fabricabilite-machine";
import type { PlaqueMm } from "./geometry";
import { generateHoles, type Hole, resolveMountingRules } from "./holes";
import { type ResolvedOperation, resolveWorkflow } from "./production";
import { type CaractereTrace, evaluerTexte, evaluerTexteTrace, type TexteNormalise } from "./texte";
import { type DomainViolation, violation } from "./violation";

/** Données serveur issues du traitement des fichiers (hors requête client, P13). */
export type DonneesServeur = {
  artwork?: ArtworkMetadata;
  /** Glyphes de la police choisie ; la liste des polices reste OPEN (VR-08). */
  glyphesDisponibles?: ReadonlySet<string>;
  /** Texte composé et converti en tracés par le moteur de polices (SP-3, hors domaine), en mm, repère plaque vue face. */
  texteTrace?: readonly CaractereTrace[];
};

export type Fabricable = {
  ok: true;
  configuration: Configuration;
  plaque: PlaqueMm & { thicknessMm: number; formatMode: "standard" | "custom"; formatId?: string };
  operations: ResolvedOperation[];
  posesParOperation: PoseOperation[];
  holes: Hole[];
  artwork: EvaluationArtwork | null;
  texte: TexteNormalise | null;
  /** Tracés du texte reçus et contrôlés (SP-3), transmis tels quels à la géométrie canonique ; null sans tracés. */
  texteTrace: readonly CaractereTrace[] | null;
};

export type NonFabricable = {
  ok: false;
  /** `request` : requête non conforme (P13) ; `catalog` : résolution impossible ; `fabrication` : contraintes non satisfaites. */
  stage: "request" | "catalog" | "fabrication";
  violations: DomainViolation[];
};

export type FabricabilityResult = Fabricable | NonFabricable;

export function evaluateFabricability(input: unknown, catalog: Catalog, donnees: DonneesServeur = {}): FabricabilityResult {
  // 0. Contrat de requête (P13) : rejet typé, rien n'est ignoré ni recalculé
  const parsed = parseConfiguration(input);
  if (!parsed.ok) return { ok: false, stage: "request", violations: parsed.violations };
  const config = parsed.value;

  // 1. Catalogue
  const catalogue = validateConfigurationAgainstCatalog(config, catalog);
  if (catalogue.length > 0) return { ok: false, stage: "catalog", violations: catalogue };
  const reference = catalog.references.find((r) => r.id === config.materialVariantId)!;
  const thickness = catalog.thicknesses.find((t) => t.id === config.thicknessId);
  const workflow = catalog.workflows.find((w) => w.id === reference.productionWorkflowId);
  if (!thickness || !workflow) {
    return { ok: false, stage: "catalog", violations: [violation("CATALOG_RESOLUTION_FAILED", "catalog", "épaisseur ou workflow introuvable")] };
  }
  const dimensionRules = catalog.dimensionRules.find((d) => reference.dimensionRulesIds.includes(d.id) && d.variantId === reference.id && d.thicknessId === config.thicknessId);
  const mountingRules = catalog.mountingRules.find((m) => m.id === reference.mountingRulesId);

  // 2. Workflow (encre dérivée, INVALID_INK_POLICY)
  const resolu = resolveWorkflow(workflow, reference);
  if (!resolu.ok) return { ok: false, stage: "fabrication", violations: resolu.violations };

  // 3. Géométrie de la plaque : valeurs reçues, jamais modifiées
  let plaque: Fabricable["plaque"];
  if (config.format.mode === "standard") {
    const formatId = config.format.formatId;
    const format = catalog.formats.find((f) => f.id === formatId)!;
    plaque = { widthMm: format.widthMm, heightMm: format.heightMm, cornerRadiusMm: format.cornerRadiusMm, thicknessMm: thickness.mm, formatMode: "standard", formatId };
  } else {
    // CONVENTION TECHNIQUE déterministe (arbitrage Supervisor P2), pas une règle normative : rayon non fourni ⇒ coins droits (0).
    const { widthMm, heightMm, cornerRadiusMm = 0 } = config.format;
    plaque = { widthMm, heightMm, cornerRadiusMm, thicknessMm: thickness.mm, formatMode: "custom" };
  }

  const violations: DomainViolation[] = [];

  // CR-2 (Master Plan v1.6 §7.2) : VR-34 close, mais le sur mesure TroLase / TroLase Metallic reste non activé
  // (VR-25, VR-02, GATE 1, conditions commerciales). Aucun format n'est activé par la seule découpe systématique.
  if (plaque.formatMode === "custom" && (reference.family === "trolase" || reference.family === "trolase_metallic")) {
    violations.push(violation("VALIDATION_REQUIRED", "format.mode", "sur mesure TroLase non activé (CR-2)"));
  }

  // 4-5. Opérations et orientation de pose, sur tout le workflow
  const poses = evaluerPoses(workflow, catalog.machines, plaque.widthMm, plaque.heightMm);
  if (!poses.ok) violations.push(...poses.violations);

  // 6. Dimensions (référence × épaisseur)
  if (!dimensionRules) {
    violations.push(violation("VALIDATION_REQUIRED", `references.${reference.id}.dimensionRulesIds`, "aucune règle de dimensions pour cette épaisseur (VR-25)"));
  } else {
    violations.push(...evaluerDimensions(dimensionRules, plaque));
  }

  // 7. Trous : valeurs reçues validées, jamais adaptées (G.5)
  let holes: Hole[] = [];
  let holeKeepOutMarginMm: number | null = null;
  if (config.mounting.count > 0) {
    if (!mountingRules) {
      violations.push(violation("MOUNTING_RULES_MISSING", `references.${reference.id}.mountingRulesId`, "règles de trous introuvables"));
    } else {
      const regles = resolveMountingRules(mountingRules, { variantId: reference.id, thicknessId: config.thicknessId });
      if (!regles.ok) {
        violations.push(...regles.violations);
      } else {
        holeKeepOutMarginMm = regles.value.holeKeepOutMarginMm;
        const generes = generateHoles(config.mounting, plaque, regles.value);
        if (generes.ok) holes = generes.value;
        else violations.push(...generes.violations);
      }
    }
  }

  // 8a. Artwork
  let artwork: EvaluationArtwork | null = null;
  if (config.design.artwork !== null) {
    const rules = catalog.artworkRules.find((a) => a.id === reference.artworkRulesId);
    if (!rules) {
      violations.push(violation("ARTWORK_RULES_MISSING", `references.${reference.id}.artworkRulesId`, "règles d'artwork introuvables"));
    } else if (!donnees.artwork) {
      violations.push(violation("ARTWORK_METADATA_MISSING", "design.artwork.artworkRef", "métadonnées serveur du fichier absentes"));
    } else {
      artwork = evaluateArtwork({ placement: config.design.artwork, meta: donnees.artwork, rules, reference, plaque, holes, holeKeepOutMarginMm: config.mounting.count > 0 ? holeKeepOutMarginMm : null });
      violations.push(...artwork.violations);
    }
  }

  // 8b. Texte : normalisation et glyphes ; mesure et lisibilité dépendent de VR-08 / SP-3 (non codées)
  let texte: TexteNormalise | null = null;
  if (config.design.text !== null) {
    if (!donnees.glyphesDisponibles) {
      violations.push(violation("VALIDATION_REQUIRED", "design.text.fontId", "police et glyphes non validés (VR-08)"));
      texte = evaluerTexte({ lines: config.design.text.lines, glyphesDisponibles: new Set() }).texte;
    } else {
      const r = evaluerTexte({ lines: config.design.text.lines, glyphesDisponibles: donnees.glyphesDisponibles });
      texte = r.texte;
      violations.push(...r.violations);
    }
    if (!donnees.texteTrace) {
      violations.push(violation("VALIDATION_REQUIRED", "design.text.effectiveFontSizeMm", "tracés du texte non fournis (SP-3)"));
    } else {
      // VR-08 : hauteur de boîte englobante et zone utile (plaque − zones de trous ; safe zone SANS_OBJET, arbitrage A2)
      const zonesTrous = holeKeepOutMarginMm === null ? [] : holes.map((h) => ({ cxMm: h.cxMm, cyMm: h.cyMm, rMm: h.diameterMm / 2 + holeKeepOutMarginMm! }));
      violations.push(...evaluerTexteTrace({ caracteres: donnees.texteTrace, plaque, zonesTrous }));
      // Trait minimal 1 mm (F3) pour la gravure : méthode de mesure et code non arbitrés ⇒ reste à valider
      const couche = COUCHE_PAR_WORKFLOW[reference.productionWorkflowId];
      if (couche === "engrave" || couche === "engrave_et_print") {
        violations.push(violation("VALIDATION_REQUIRED", "design.text.traits", "contrôle du trait minimal 1 mm : mesure et code non arbitrés"));
      }
    }
  }

  if (violations.length > 0 || !poses.ok) return { ok: false, stage: "fabrication", violations };
  return { ok: true, configuration: config, plaque, operations: resolu.operations, posesParOperation: poses.poses, holes, artwork, texte, texteTrace: config.design.text !== null ? (donnees.texteTrace ?? null) : null };
}
