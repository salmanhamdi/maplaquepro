// BAT (§15, Annexe A) : entité serveur, immuable après validation. Structure, états, confirmations et invariants.
// Règles appliquées : P7 (aucun À VALIDER), G-2 (G2-D1 à G2-D4), ART-1 (D1, D3, D4, D6, D8).
// Expiration commerciale arbitrée (G2-D12) : calculée à la validation (cycle-vie-bat.ts) ; conservation et purge hors BAT.
// Restent OPEN et ne sont jamais présumés : prix (VR-07), catégorie ART-1 d'une
// transformation (ART1-DOC), version des règles de design (VR-08), contrat UV (VR-33), validation atelier (VR-42).
// Tant qu'un de ces éléments est À VALIDER dans un BAT, sa validation est refusée (P7). Les hash sont reçus en entrée.
import { z } from "zod";
import { artworkPlacementSchema } from "./artwork";
import { textSpecSchema } from "./configuration";
import { statutContratSchema } from "./contrats";
import { calculerExpirationCommerciale, profilValidite } from "./cycle-vie-bat";
import { definie, etatSchema } from "./etat";
import { canonicalGeometrySchema } from "./geometrie-canonique";
import { mountingPatternSchema } from "./mounting";
import { productionArtifactSchema } from "./production";
import { CONFIGURATION_VERSION } from "./referentiels";
import { findPendingValues, resolvedSpecSchema } from "./resolved-spec";
import { estHorodatageUtc } from "./temps";
import { type DomainViolation, violation } from "./violation";

const horodatage = z.string().min(1);
const hash = z.string().min(1);

/** Transformation d'artwork (ART1-D6). La catégorie n'est jamais présumée : À VALIDER tant qu'elle n'est pas confirmée. */
export const transformationArtworkSchema = z.strictObject({
  id: z.string().min(1),
  description: z.string().min(1),
  /** Transformation visible du rendu (ART1-D8). */
  visible: z.boolean(),
  categorie: etatSchema(z.enum(["A", "B", "C"])),
});
export type TransformationArtwork = z.infer<typeof transformationArtworkSchema>;

export const batConfirmationsSchema = z.strictObject({
  spellCheckConfirmedAt: horodatage.optional(),
  artworkConfirmedAt: horodatage.optional(),
  /** Procédé affiché et confirmé (§15). */
  workflowAcknowledgedAt: horodatage.optional(),
  warningsAcknowledged: z.array(z.string().min(1)),
  /** Acceptation des transformations visibles d'artwork (ART1-D1), par identifiant. */
  transformationsAcceptees: z.array(z.string().min(1)),
});
export type BatConfirmations = z.infer<typeof batConfirmationsSchema>;

const batContenu = {
  batId: z.string().min(1),
  contentHash: hash,
  createdAt: horodatage,
  /** Expiration commerciale : durée À DÉFINIR (G2-D12), distincte de la conservation RGPD. */
  expiresAt: etatSchema(horodatage),
  versions: z.strictObject({
    configurationVersion: z.literal(CONFIGURATION_VERSION),
    catalogVersion: z.string().min(1),
    pricingVersion: etatSchema(z.string().min(1)),
    designRulesVersion: etatSchema(z.string().min(1)),
    engineVersions: z.strictObject({
      design: z.string().min(1),
      mounting: z.string().min(1),
      geometry: z.string().min(1),
      render: z.string().min(1),
      production: z.string().min(1),
    }),
  }),
  /** Statuts des contrats au moment du BAT (P12) : conformité ≠ validation atelier. */
  productionContracts: z.array(statutContratSchema),
  spec: resolvedSpecSchema,
  holes: z.strictObject({ pattern: mountingPatternSchema }),
  text: textSpecSchema.extend({ fontHash: hash, effectiveFontSizeMm: z.number().positive() }).nullable(),
  /** ART1-D3 : original client ≠ version normalisée ≠ fichier machine. */
  artwork: z
    .strictObject({
      artworkRef: z.string().min(1),
      artworkHash: hash,
      normalizedHash: hash,
      mime: z.string().min(1),
      placement: artworkPlacementSchema,
      modeCouleurApplique: z.enum(["monochrome", "noir_uniquement", "selon_politique_impression_reference"]),
      transformations: z.array(transformationArtworkSchema),
    })
    .nullable(),
  /** Géométrie canonique (§6, §12), structurellement vérifiée ; porte notamment la safe zone (décision L1). */
  geometryJson: canonicalGeometrySchema,
  geometryHash: hash,
  previewSvg: z.string().min(1),
  artifacts: z.array(productionArtifactSchema),
  /** Prix commercial figé au BAT validé (G2-D7) ; modèle tarifaire À VALIDER (VR-07). */
  price: etatSchema(z.unknown()),
  warnings: z.array(z.string().min(1)),
  confirmations: batConfirmationsSchema,
};

export const batBrouillonSchema = z.strictObject({ status: z.literal("draft"), ...batContenu });
export const batValideSchema = z.strictObject({ status: z.literal("validated"), validatedAt: horodatage, ...batContenu });
export const batSchema = z.discriminatedUnion("status", [batBrouillonSchema, batValideSchema]);

export type BatBrouillon = z.infer<typeof batBrouillonSchema>;
export type BatValide = Readonly<z.infer<typeof batValideSchema>>;
export type Bat = BatBrouillon | BatValide;

export type ResultatBat<T> = { ok: true; bat: T } | { ok: false; violations: DomainViolation[] };

const immuable = (): ResultatBat<never> => ({
  ok: false,
  violations: [violation("BAT_IMMUTABLE", "status", "BAT validé immuable : toute modification crée une nouvelle décision et un nouveau BAT (G2-D1)")],
});

function geler<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const v of Object.values(value)) geler(v);
  }
  return value;
}

/** Crée un brouillon de BAT à partir de données serveur ; rejet typé si la structure est invalide. */
export function createBatDraft(input: unknown): ResultatBat<BatBrouillon> {
  const parsed = batBrouillonSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, violations: parsed.error.issues.map((i) => violation("BAT_INVALID", i.path.map(String).join(".") || "(racine)", i.message)) };
  }
  return { ok: true, bat: parsed.data };
}

const confirmer = (bat: Bat, patch: (c: BatConfirmations) => BatConfirmations): ResultatBat<BatBrouillon> =>
  bat.status === "validated" ? immuable() : { ok: true, bat: { ...bat, confirmations: patch(bat.confirmations) } };

const ajouter = (liste: readonly string[], id: string) => (liste.includes(id) ? [...liste] : [...liste, id]);

export const acknowledgeWorkflow = (bat: Bat, at: string) => confirmer(bat, (c) => ({ ...c, workflowAcknowledgedAt: at }));
export const confirmSpellCheck = (bat: Bat, at: string) => confirmer(bat, (c) => ({ ...c, spellCheckConfirmedAt: at }));
export const confirmArtwork = (bat: Bat, at: string) => confirmer(bat, (c) => ({ ...c, artworkConfirmedAt: at }));
export const acknowledgeWarning = (bat: Bat, warning: string) => confirmer(bat, (c) => ({ ...c, warningsAcknowledged: ajouter(c.warningsAcknowledged, warning) }));

/** Acceptation client d'une transformation visible (ART1-D1), avant validation du BAT uniquement. */
export function acceptTransformation(bat: Bat, transformationId: string): ResultatBat<BatBrouillon> {
  if (bat.status === "validated") return immuable();
  if (!bat.artwork?.transformations.some((t) => t.id === transformationId)) {
    return { ok: false, violations: [violation("TRANSFORMATION_UNKNOWN", "artwork.transformations", "transformation inconnue")] };
  }
  return confirmer(bat, (c) => ({ ...c, transformationsAcceptees: ajouter(c.transformationsAcceptees, transformationId) }));
}

/** Invariants de validation d'un brouillon (§15, P7, ART-1). Liste vide ⇒ validable. */
export function batValidationViolations(bat: BatBrouillon): DomainViolation[] {
  const out: DomainViolation[] = [];

  // P7 : aucune propriété À VALIDER
  for (const path of findPendingValues(bat)) out.push(violation("VALIDATION_REQUIRED", path, "propriété À VALIDER : BAT non validable (P7)"));

  // Statut de chaque contrat de production au moment du BAT (§15, P12)
  for (const id of bat.spec.productionContractIds) {
    if (!bat.productionContracts.some((c) => c.contractId === id)) {
      out.push(violation("CONTRACT_STATUS_MISSING", "productionContracts", `statut du contrat ${id} absent du BAT (§15)`));
    }
  }

  // Procédé affiché et confirmé
  if (bat.confirmations.workflowAcknowledgedAt === undefined) {
    out.push(violation("WORKFLOW_NOT_ACKNOWLEDGED", "confirmations.workflowAcknowledgedAt", "procédé non confirmé par le client (§15)"));
  }

  // Avertissements acceptés
  for (const w of bat.warnings) {
    if (!bat.confirmations.warningsAcknowledged.includes(w)) {
      out.push(violation("WARNING_NOT_ACKNOWLEDGED", "confirmations.warningsAcknowledged", `avertissement non accepté : ${w}`));
    }
  }

  // ART-1 : transformations d'artwork
  bat.artwork?.transformations.forEach((t, i) => {
    const path = `artwork.transformations.${i}`;
    if (t.categorie.etat === "SANS_OBJET") {
      out.push(violation("TRANSFORMATION_CATEGORY_REQUIRED", `${path}.categorie`, "catégorie ART-1 requise pour une transformation (ART1-D6)"));
      return;
    }
    if (t.categorie.etat !== "DEFINIE") return; // À VALIDER : déjà signalé par P7
    const categorie = t.categorie.valeur;
    if (categorie === "C") {
      out.push(violation("TRANSFORMATION_NOT_ALLOWED", path, "catégorie C : aucun traitement automatique (ART1-D6)"));
    } else if (categorie === "A" && t.visible) {
      out.push(violation("TRANSFORMATION_CATEGORY_INCONSISTENT", path, "catégorie A : transformation non perceptible uniquement (ART1-D8)"));
    } else if (categorie === "B" && !bat.confirmations.transformationsAcceptees.includes(t.id)) {
      out.push(violation("TRANSFORMATION_NOT_ACCEPTED", path, "transformation visible non acceptée avant BAT (ART1-D1)"));
    }
  });

  return out;
}

/**
 * Validation client du BAT : refusée si un invariant n'est pas satisfait ; le BAT validé est gelé (immuable).
 * G2-D12 : avec `contexte`, `expiresAt` = `at` (validatedAt) + 15 jours, ou 7 jours pour un client inscrit (profil figé à la validation).
 */
export function validateBat(bat: Bat, at: string, contexte?: { clientInscrit: boolean }): ResultatBat<BatValide> {
  if (bat.status === "validated") return immuable();
  let cible: BatBrouillon = bat;
  if (contexte) {
    if (!estHorodatageUtc(at)) return { ok: false, violations: [violation("HORODATAGE_INVALIDE", "validatedAt", "horodatage UTC ISO 8601 attendu (G2-D12)")] };
    cible = { ...bat, expiresAt: definie(calculerExpirationCommerciale(at, profilValidite(contexte.clientInscrit))) };
  }
  const violations = batValidationViolations(cible);
  if (violations.length > 0) return { ok: false, violations };
  const valide = batValideSchema.parse({ ...structuredClone(cible), status: "validated", validatedAt: at });
  return { ok: true, bat: geler(valide) };
}
