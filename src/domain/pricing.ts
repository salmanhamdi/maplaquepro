// Structure tarifaire (§7.5, §16). VR-07 arbitré : paliers de dimensions (plus grand côté × plus petit côté, orientation
// neutralisée, bornes inclusives), quantité / texte / options SANS OBJET en MVP, TVA 20 % sur montants saisis HT, grille unique
// sélectionnée côté serveur, identifiée par id + version. AUCUN montant ni aucune grille n'est défini ici. Centimes entiers (§27).
import { z } from "zod";
import { etatSchema } from "./etat";
import { statutSchema } from "./referentiels";

const centimes = etatSchema(z.number().int().nonnegative());

/** Non défini en MVP (VR-07) : jamais DEFINIE, uniquement A_VALIDER ou SANS_OBJET. */
const nonDefini = z.discriminatedUnion("etat", [
  z.strictObject({ etat: z.literal("A_VALIDER") }),
  z.strictObject({ etat: z.literal("SANS_OBJET") }),
]);

/** Taux de TVA arbitré (VR-07, MVP). Les montants de grille sont saisis HT. */
export const TAUX_TVA_POURCENT = 20;

const borneMm = z.number().nonnegative();

/** Palier de dimensions : bornes inclusives sur le plus grand et le plus petit côté de la plaque (orientation neutralisée). */
export const palierDimensionsSchema = z
  .strictObject({
    id: z.string().min(1),
    grandCoteMinMm: borneMm,
    grandCoteMaxMm: borneMm,
    petitCoteMinMm: borneMm,
    petitCoteMaxMm: borneMm,
    montant: centimes,
  })
  .refine((p) => p.grandCoteMinMm <= p.grandCoteMaxMm && p.petitCoteMinMm <= p.petitCoteMaxMm, { message: "bornes de palier incohérentes" });
export type PalierDimensions = z.infer<typeof palierDimensionsSchema>;

/** Tarification des dimensions sur mesure : uniquement par paliers (aucun tarif libre au cm²). */
const tarificationDimensions = z.discriminatedUnion("etat", [
  z.strictObject({ etat: z.literal("A_VALIDER") }),
  z.strictObject({ etat: z.literal("SANS_OBJET") }),
  z.strictObject({
    etat: z.literal("DEFINIE"),
    valeur: z.strictObject({ modele: z.literal("paliers_dimensions"), paliers: z.array(palierDimensionsSchema).min(1) }),
  }),
]);

/** Statut de validation commerciale d'une grille (arbitrage Supervisor VR-07) : exactement deux valeurs. */
export const COMMERCIAL_VALIDATIONS = ["pending", "validated"] as const;

export const priceRulesSchema = z.strictObject({
  id: z.string().min(1),
  /** Version de la grille : toute modification tarifaire crée une nouvelle version ; une grille utilisée n'est jamais réécrite. */
  version: z.string().min(1),
  base: centimes,
  byVariant: z.record(z.string().min(1), centimes),
  byThickness: z.record(z.string().min(1), centimes),
  byFormat: z.record(z.string().min(1), centimes),
  customDimensionPricing: tarificationDimensions,
  byWorkflow: z.record(z.string().min(1), centimes),
  byMounting: z.record(z.string().min(1), centimes),
  artworkProcessingFee: centimes,
  /** Paliers de quantité : SANS OBJET en MVP (VR-07). */
  quantityTiers: nonDefini,
  vatRate: etatSchema(z.number().min(0).max(1)),
  /** État technique : `active` rend la grille sélectionnable par le moteur. */
  pricingStatus: statutSchema,
  /** Validation commerciale, distincte de `pricingStatus` (GATE 6) : applicable seulement si `active` ET `validated`. */
  commercialValidation: z.enum(COMMERCIAL_VALIDATIONS),
});
export type PriceRules = z.infer<typeof priceRulesSchema>;
