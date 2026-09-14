// Référence (MaterialVariant) : unité de vente (§7.1). Invariants de l'Annexe A (spécification).
import { z } from "zod";
import { apparenceSchema, capaciteGravureSchema, politiqueImpressionSchema } from "./apparence";
import { type Etat, etatSchema, vaut } from "./etat";
import {
  materialFamilySchema,
  statutSchema,
  thicknessIdSchema,
  WORKFLOW_BY_FAMILY,
  workflowIdSchema,
} from "./referentiels";
import { THICKNESSES_BY_FAMILY } from "./thickness";
import { type DomainViolation, violation } from "./violation";

export const materialVariantSchema = z.strictObject({
  id: z.string().min(1),
  manufacturer: etatSchema(z.string().min(1)),
  reference: etatSchema(z.string().min(1)),
  family: materialFamilySchema,
  label: z.string().min(1),
  thicknessIds: z.array(thicknessIdSchema).min(1),
  apparence: apparenceSchema,
  capaciteGravure: capaciteGravureSchema,
  politiqueImpression: politiqueImpressionSchema,
  productionWorkflowId: workflowIdSchema,
  dimensionRulesIds: z.array(z.string().min(1)),
  mountingRulesId: z.string().min(1),
  artworkRulesId: z.string().min(1),
  outdoorStatus: etatSchema(z.enum(["outdoor", "indoor"])),
  swatch: z.strictObject({ surface: z.string().min(1), reveal: z.string().min(1).optional() }),
  statut: statutSchema,
});
export type MaterialVariant = z.infer<typeof materialVariantSchema>;

/** Propriétés obligatoires d'une référence : aucune ne peut rester À VALIDER si la référence est active (INV-02). */
function proprietesObligatoires(ref: MaterialVariant): Array<[string, Etat<unknown>]> {
  return [
    ["manufacturer", ref.manufacturer],
    ["reference", ref.reference],
    ["apparence.couleurSurface", ref.apparence.couleurSurface],
    ["apparence.finition", ref.apparence.finition],
    ["apparence.couleurRevelee", ref.apparence.couleurRevelee],
    ["capaciteGravure.cote", ref.capaciteGravure.cote],
    ["politiqueImpression.valeur", ref.politiqueImpression.valeur],
    ["politiqueImpression.cote", ref.politiqueImpression.cote],
    ["outdoorStatus", ref.outdoorStatus],
  ];
}

export function validateReference(ref: MaterialVariant): DomainViolation[] {
  const out: DomainViolation[] = [];
  const base = `references.${ref.id}`;
  const add = (code: string, path: string, message: string) => out.push(violation(code, `${base}.${path}`, message));
  const { apparence, capaciteGravure, politiqueImpression } = ref;

  // INV-02
  if (ref.statut === "active") {
    for (const [path, e] of proprietesObligatoires(ref)) {
      if (e.etat === "A_VALIDER") add("ACTIVE_REFERENCE_WITH_PENDING_PROPERTY", path, "référence active avec propriété À VALIDER");
    }
  }

  // Workflow issu de la famille, jamais d'une couleur (INV-07)
  if (WORKFLOW_BY_FAMILY[ref.family] !== ref.productionWorkflowId) {
    add("WORKFLOW_FAMILY_MISMATCH", "productionWorkflowId", "workflow incohérent avec la famille (P3)");
  }

  // INV-03
  const autorisees = THICKNESSES_BY_FAMILY[ref.family];
  if (autorisees.etat === "DEFINIE") {
    for (const t of ref.thicknessIds) {
      if (!autorisees.valeur.includes(t)) add("THICKNESS_NOT_ALLOWED_FOR_FAMILY", "thicknessIds", `épaisseur ${t} hors famille`);
    }
  } else if (ref.statut === "active") {
    add("ACTIVE_REFERENCE_WITH_PENDING_FAMILY_THICKNESSES", "thicknessIds", "épaisseurs de la famille À VALIDER");
  }
  if (new Set(ref.thicknessIds).size !== ref.thicknessIds.length) add("DUPLICATE_THICKNESS", "thicknessIds", "épaisseur en double");

  // La politique d'impression n'est jamais SANS_OBJET : « aucune » est une valeur (P7)
  if (politiqueImpression.valeur.etat === "SANS_OBJET") {
    add("PRINT_POLICY_VALUE_CANNOT_BE_NOT_APPLICABLE", "politiqueImpression.valeur", "politique d'impression SANS_OBJET interdite");
  }

  switch (ref.family) {
    case "trolase":
    case "trolase_metallic": {
      // INV-04
      if (!(vaut(politiqueImpression.valeur, "aucune") || politiqueImpression.valeur.etat === "A_VALIDER")) {
        add("ENGRAVE_FAMILY_PRINT_POLICY", "politiqueImpression.valeur", "gravure laser : politique d'impression « aucune »");
      }
      if (!(vaut(capaciteGravure.cote, "face") || capaciteGravure.cote.etat === "A_VALIDER")) {
        add("ENGRAVE_FAMILY_ENGRAVING_SIDE", "capaciteGravure.cote", "gravure laser : gravure côté face");
      }
      if (apparence.couleurRevelee.etat === "SANS_OBJET") {
        add("ENGRAVE_FAMILY_REVEALED_COLOR", "apparence.couleurRevelee", "gravure laser : couleur révélée requise");
      }
      break;
    }
    case "plexiglass": {
      // INV-05
      if (vaut(politiqueImpression.valeur, "aucune")) {
        add("PLEXIGLASS_WITHOUT_PRINT_FORBIDDEN", "politiqueImpression.valeur", "Plexiglass sans impression interdit en MVP (P7 D4)");
      }
      if (apparence.couleurRevelee.etat !== "SANS_OBJET") {
        add("PLEXIGLASS_REVEALED_COLOR_NOT_APPLICABLE", "apparence.couleurRevelee", "couleur révélée SANS_OBJET (workflow MVP)");
      }
      break;
    }
    case "troglass_metallic": {
      // INV-06
      if (!(vaut(politiqueImpression.valeur, "noir_uniquement") || politiqueImpression.valeur.etat === "A_VALIDER")) {
        add("TROGLASS_PRINT_POLICY", "politiqueImpression.valeur", "TroGlass : noir uniquement");
      }
      if (!(vaut(capaciteGravure.cote, "envers") || capaciteGravure.cote.etat === "A_VALIDER")) {
        add("TROGLASS_ENGRAVING_SIDE", "capaciteGravure.cote", "TroGlass : gravure envers");
      }
      if (!(vaut(politiqueImpression.cote, "envers") || politiqueImpression.cote.etat === "A_VALIDER")) {
        add("TROGLASS_PRINT_SIDE", "politiqueImpression.cote", "TroGlass : impression envers");
      }
      break;
    }
  }

  return out;
}
