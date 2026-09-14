// Calcul du prix (§16) — structure décidée, aucun tarif. Centimes entiers ; serveur = autorité.
// Décidé : composantes (base, référence, épaisseur, dimensions, workflow, traitement d'artwork, trous) × quantité ;
// prix figé au BAT validé (G2-D7) ; aucun prix client (P13) ; aucune correction silencieuse.
// OPEN, isolé : tous les montants (VR-07, GATE 6), tarification sur mesure (VR-07 / OD-37), paliers (VR-07),
// TVA (VR-10) et son arrondi, livraison (VR-09). Une composante non définie ⇒ prix À VALIDER, jamais de prix partiel.
import type { FormatSpec } from "./dimensions";
import type { Etat } from "./etat";
import type { PriceRules } from "./pricing";
import type { ProductionWorkflowId, ThicknessId } from "./referentiels";
import { type DomainViolation, violation } from "./violation";

export type ComposantePrix = "base" | "reference" | "epaisseur" | "dimensions" | "workflow" | "artwork" | "trous";

export type PriceBreakdown = {
  composantes: Record<ComposantePrix, number>;
  unitaireHtCentimes: number;
  quantite: number;
  totalHtCentimes: number;
  /** TVA non appliquée ici : taux et arrondi VR-10. */
  vatRate: Etat<number>;
  pricingStatus: PriceRules["pricingStatus"];
};

export type ResultatPrix = { etat: "DEFINIE"; valeur: PriceBreakdown } | { etat: "A_VALIDER"; violations: DomainViolation[] };

type Montant = Etat<number> | undefined;

export function computePrice(input: {
  rules: PriceRules;
  variantId: string;
  thicknessId: ThicknessId;
  workflowId: ProductionWorkflowId;
  format: FormatSpec;
  mountingCount: 0 | 2 | 4;
  artworkPresent: boolean;
  quantity: number;
}): ResultatPrix {
  const { rules } = input;
  const violations: DomainViolation[] = [];
  const composantes = {} as Record<ComposantePrix, number>;

  const lire = (nom: ComposantePrix, montant: Montant, path: string) => {
    if (montant === undefined || montant.etat === "A_VALIDER") {
      violations.push(violation("VALIDATION_REQUIRED", `priceRules.${rules.id}.${path}`, "montant non validé (VR-07)"));
      return;
    }
    composantes[nom] = montant.etat === "DEFINIE" ? montant.valeur : 0; // SANS_OBJET : composante non applicable
  };

  lire("base", rules.base, "base");
  lire("reference", rules.byVariant[input.variantId], `byVariant.${input.variantId}`);
  lire("epaisseur", rules.byThickness[input.thicknessId], `byThickness.${input.thicknessId}`);
  if (input.format.mode === "standard") {
    lire("dimensions", rules.byFormat[input.format.formatId], `byFormat.${input.format.formatId}`);
  } else if (rules.customDimensionPricing.etat === "A_VALIDER") {
    violations.push(violation("VALIDATION_REQUIRED", `priceRules.${rules.id}.customDimensionPricing`, "tarification sur mesure non définie (VR-07)"));
  } else {
    violations.push(violation("CUSTOM_DIMENSIONS_NOT_PRICED", `priceRules.${rules.id}.customDimensionPricing`, "sur mesure sans objet dans ces règles"));
  }
  lire("workflow", rules.byWorkflow[input.workflowId], `byWorkflow.${input.workflowId}`);
  if (input.artworkPresent) lire("artwork", rules.artworkProcessingFee, "artworkProcessingFee");
  else composantes.artwork = 0;
  lire("trous", rules.byMounting[String(input.mountingCount)], `byMounting.${input.mountingCount}`);
  if (rules.quantityTiers.etat === "A_VALIDER") {
    violations.push(violation("VALIDATION_REQUIRED", `priceRules.${rules.id}.quantityTiers`, "paliers de quantité non définis (VR-07)"));
  }

  if (violations.length > 0) return { etat: "A_VALIDER", violations };
  const unitaire = Object.values(composantes).reduce((a, b) => a + b, 0);
  return {
    etat: "DEFINIE",
    valeur: {
      composantes,
      unitaireHtCentimes: unitaire,
      quantite: input.quantity,
      totalHtCentimes: unitaire * input.quantity,
      vatRate: rules.vatRate,
      pricingStatus: rules.pricingStatus,
    },
  };
}

/** Un prix envoyé par le client est un champ interdit (P13) ; un prix validé au BAT n'est jamais recalculé (G2-D7). */
export function checkPriceUnchanged(prixBatCentimes: number, montantApplicableCentimes: number): DomainViolation[] {
  return prixBatCentimes === montantApplicableCentimes ? [] : [violation("PRICE_MISMATCH", "price", "divergence de montant : blocage explicite (G2-D7)")];
}
