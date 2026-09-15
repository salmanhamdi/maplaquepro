// Calcul du prix (§16, VR-07 arbitré). Serveur = autorité ; centimes entiers ; aucun prix client (P13).
// Composantes : base, référence, épaisseur, dimensions (format standard ou palier sur mesure), workflow (découpe incluse
// telle que définie par la grille), trous, traitement d'artwork ; × quantité (paliers SANS OBJET en MVP).
// TVA 20 % calculée une seule fois sur le total HT, arrondie au centime ; TTC = HT + TVA.
// Une composante non définie, un palier absent ou ambigu, une TVA non conforme ⇒ prix À VALIDER : jamais de prix partiel.
// Livraison (VR-09) hors prix du BAT.
import type { FormatSpec } from "./dimensions";
import { type PriceRules, TAUX_TVA_POURCENT } from "./pricing";
import type { ProductionWorkflowId, ThicknessId } from "./referentiels";
import { type DomainViolation, violation } from "./violation";

export type ComposantePrix = "base" | "reference" | "epaisseur" | "dimensions" | "workflow" | "artwork" | "trous";

export type PriceBreakdown = {
  /** Grille appliquée, figée avec le prix dans le BAT validé. */
  grille: { id: string; version: string };
  composantes: Record<ComposantePrix, number>;
  unitaireHtCentimes: number;
  quantite: number;
  totalHtCentimes: number;
  tauxTvaPourcent: number;
  tvaCentimes: number;
  totalTtcCentimes: number;
  pricingStatus: PriceRules["pricingStatus"];
};

export type ResultatPrix = { etat: "DEFINIE"; valeur: PriceBreakdown } | { etat: "A_VALIDER"; violations: DomainViolation[] };

type Montant = PriceRules["base"] | undefined;

/** Référence de grille portée par `pricingVersion` du BAT. */
export const referenceGrille = (grille: Pick<PriceRules, "id" | "version">) => `${grille.id}@${grille.version}`;

export type ResultatSelectionGrille = { ok: true; grille: PriceRules } | { ok: false; violations: DomainViolation[] };

/** Grille commercialement applicable : techniquement active ET commercialement validée. */
export const estGrilleApplicable = (g: PriceRules) => g.pricingStatus === "active" && g.commercialValidation === "validated";

/** Sélection serveur de la grille applicable : exactement une grille applicable ; zéro ou plusieurs ⇒ VALIDATION_REQUIRED. */
export function selectionnerGrillePrix(grilles: readonly PriceRules[]): ResultatSelectionGrille {
  const actives = grilles.filter(estGrilleApplicable);
  if (actives.length === 1) return { ok: true, grille: actives[0]! };
  const message = actives.length === 0 ? "aucune grille tarifaire applicable (VR-07)" : "plusieurs grilles tarifaires applicables (VR-07)";
  return { ok: false, violations: [violation("VALIDATION_REQUIRED", "priceRules", message)] };
}

/** TVA sur un total HT en centimes : arrondi au centime le plus proche, en arithmétique entière (déterministe). */
export function calculerTvaCentimes(totalHtCentimes: number): number {
  return Math.floor((totalHtCentimes * TAUX_TVA_POURCENT + 50) / 100);
}

const tauxConforme = (taux: PriceRules["vatRate"]) => taux.etat === "DEFINIE" && Math.round(taux.valeur * 10000) === TAUX_TVA_POURCENT * 100;

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
  const chemin = (path: string) => `priceRules.${rules.id}.${path}`;

  const lire = (nom: ComposantePrix, montant: Montant, path: string) => {
    if (montant === undefined || montant.etat === "A_VALIDER") {
      violations.push(violation("VALIDATION_REQUIRED", chemin(path), "montant non validé (VR-07)"));
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
    violations.push(violation("VALIDATION_REQUIRED", chemin("customDimensionPricing"), "tarification sur mesure non définie (VR-07)"));
  } else if (rules.customDimensionPricing.etat === "SANS_OBJET") {
    violations.push(violation("CUSTOM_DIMENSIONS_NOT_PRICED", chemin("customDimensionPricing"), "sur mesure sans objet dans ces règles"));
  } else {
    // Orientation neutralisée : plus grand côté × plus petit côté ; bornes inclusives.
    const grand = Math.max(input.format.widthMm, input.format.heightMm);
    const petit = Math.min(input.format.widthMm, input.format.heightMm);
    const candidats = rules.customDimensionPricing.valeur.paliers.filter(
      (p) => grand >= p.grandCoteMinMm && grand <= p.grandCoteMaxMm && petit >= p.petitCoteMinMm && petit <= p.petitCoteMaxMm,
    );
    if (candidats.length === 1) {
      lire("dimensions", candidats[0]!.montant, `customDimensionPricing.paliers.${candidats[0]!.id}.montant`);
    } else {
      const message = candidats.length === 0 ? `aucun palier ne couvre ${grand} × ${petit} mm (VR-07)` : `plusieurs paliers couvrent ${grand} × ${petit} mm (VR-07)`;
      violations.push(violation("VALIDATION_REQUIRED", chemin("customDimensionPricing.paliers"), message));
    }
  }

  lire("workflow", rules.byWorkflow[input.workflowId], `byWorkflow.${input.workflowId}`);
  if (input.artworkPresent) lire("artwork", rules.artworkProcessingFee, "artworkProcessingFee");
  else composantes.artwork = 0;
  lire("trous", rules.byMounting[String(input.mountingCount)], `byMounting.${input.mountingCount}`);
  if (rules.quantityTiers.etat === "A_VALIDER") {
    violations.push(violation("VALIDATION_REQUIRED", chemin("quantityTiers"), "paliers de quantité non définis (VR-07)"));
  }
  if (!tauxConforme(rules.vatRate)) {
    violations.push(violation("VALIDATION_REQUIRED", chemin("vatRate"), `taux de TVA absent ou différent de ${TAUX_TVA_POURCENT} % (VR-07)`));
  }

  if (violations.length > 0) return { etat: "A_VALIDER", violations };
  const unitaire = Object.values(composantes).reduce((a, b) => a + b, 0);
  const totalHt = unitaire * input.quantity;
  const tva = calculerTvaCentimes(totalHt);
  return {
    etat: "DEFINIE",
    valeur: {
      grille: { id: rules.id, version: rules.version },
      composantes,
      unitaireHtCentimes: unitaire,
      quantite: input.quantity,
      totalHtCentimes: totalHt,
      tauxTvaPourcent: TAUX_TVA_POURCENT,
      tvaCentimes: tva,
      totalTtcCentimes: totalHt + tva,
      pricingStatus: rules.pricingStatus,
    },
  };
}

/** Un prix envoyé par le client est un champ interdit (P13) ; un prix validé au BAT n'est jamais recalculé (G2-D7). */
export function checkPriceUnchanged(prixBatCentimes: number, montantApplicableCentimes: number): DomainViolation[] {
  return prixBatCentimes === montantApplicableCentimes ? [] : [violation("PRICE_MISMATCH", "price", "divergence de montant : blocage explicite (G2-D7)")];
}
