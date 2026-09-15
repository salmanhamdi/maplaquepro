// G2-D12 — cycle de vie du BAT (arbitrage Supervisor du 15/09/2026). Moteur PUR et versionné : il décide des transitions
// et de l'action due à un instant donné. Il n'exécute aucune suppression, ne persiste rien et ne connaît ni commande ni
// paiement réels : persistance (bat_snapshots), domaine commande, checkout, paiement et worker de purge restent à construire.
// Toute modification de configuration crée un nouveau BAT ; aucune distinction mineure / majeure n'existe.
import { ajouterAnsCalendaires, ajouterJours, echeanceAtteinte, estAnterieur, estHorodatageUtc } from "./temps";
import { type DomainViolation, violation } from "./violation";

export const POLITIQUE_CYCLE_VIE_BAT = {
  version: "G2-D12-2026-09-15",
  validiteCommercialeStandardJours: 15,
  validiteCommercialeClientInscritNonPayeJours: 7,
  retentionBrouillonJours: 7,
  retentionOrphelinJours: 30,
  suspensionCheckoutMaxJours: 7,
  conservationFabricationAns: 2,
} as const;

const P = POLITIQUE_CYCLE_VIE_BAT;

export type ProfilValidite = "standard" | "client_inscrit_non_paye";

/** P4 : profil déterminé une seule fois, à la validation du BAT, puis figé (jamais réévalué). */
export const profilValidite = (clientInscrit: boolean): ProfilValidite => (clientInscrit ? "client_inscrit_non_paye" : "standard");

/** Validité commerciale : toujours depuis `validatedAt` ; 15 jours, ou 7 jours pour un client inscrit non payé. */
export function calculerExpirationCommerciale(validatedAt: string, profil: ProfilValidite): string {
  const jours = profil === "standard" ? P.validiteCommercialeStandardJours : P.validiteCommercialeClientInscritNonPayeJours;
  return ajouterJours(validatedAt, jours);
}

export type MotifSuppression = "brouillon_expire" | "expiration_commerciale" | "retention_orphelin_expiree" | "remplacement";

type Identite = { batId: string; politiqueVersion: string };
type Validation = { validatedAt: string; profil: ProfilValidite; expiresAt: string };

export type CycleVieBat =
  | Readonly<Identite & { etat: "brouillon"; createdAt: string; retentionFinAt: string }>
  | Readonly<Identite & Validation & { etat: "valide" }>
  /** Commande créée par startCheckout (PENDING_PAYMENT) : expiration commerciale suspendue, 7 jours au plus. */
  | Readonly<Identite & Validation & { etat: "commande_en_attente_paiement"; orderId: string; checkoutStartedAt: string; suspensionFinAt: string }>
  | Readonly<Identite & Validation & { etat: "commande_payee"; orderId: string; checkoutStartedAt: string; paidAt: string }>
  /** BAT de fabrication figé : conservation 2 ans depuis l'entrée en fabrication, même si la commande est annulée ensuite. */
  | Readonly<Identite & Validation & { etat: "fabrication"; orderId: string; paidAt: string; enteredProductionAt: string; conservationFinAt: string; commandeAnnuleeAt?: string }>
  /** P3 : cycle commercial abandonné ; rétention de 30 jours depuis `orphanedAt`, l'ancien `expiresAt` n'a plus d'effet. */
  | Readonly<Identite & Validation & { etat: "orphelin"; orphanedAt: string; retentionFinAt: string }>
  | Readonly<Identite & { etat: "supprime"; deletedAt: string; motif: MotifSuppression }>;

export type EvenementCycleVie =
  | Readonly<{ type: "VALIDATION"; at: string; clientInscrit: boolean }>
  | Readonly<{ type: "DEBUT_CHECKOUT"; at: string; orderId: string }>
  | Readonly<{ type: "PAIEMENT"; at: string }>
  | Readonly<{ type: "ENTREE_FABRICATION"; at: string }>
  | Readonly<{ type: "ANNULATION_COMMANDE"; at: string }>
  /** Constat d'échéance (futur worker) : applique l'action due à cet instant. */
  | Readonly<{ type: "CONSTAT_ECHEANCE"; at: string }>;

export type ActionDue =
  | { action: "AUCUNE" }
  | { action: "SUPPRIMER"; motif: Exclude<MotifSuppression, "remplacement">; echeance: string }
  | { action: "RENDRE_ORPHELIN"; echeance: string }
  /** Fin de la conservation du dossier de fabrication : l'exécution relève du futur worker et des règles de rétention. */
  | { action: "FIN_CONSERVATION"; echeance: string };

export type ResultatCycle = { ok: true; cycle: CycleVieBat } | { ok: false; violations: DomainViolation[] };

const refus = (code: string, message: string): { ok: false; violations: DomainViolation[] } => ({ ok: false, violations: [violation(code, "cycleVieBat", message)] });

const supprimer = (c: Identite, deletedAt: string, motif: MotifSuppression): CycleVieBat => ({
  etat: "supprime",
  batId: c.batId,
  politiqueVersion: c.politiqueVersion,
  deletedAt,
  motif,
});

const orpheliner = (c: Identite & Validation, orphanedAt: string): CycleVieBat => ({
  etat: "orphelin",
  batId: c.batId,
  politiqueVersion: c.politiqueVersion,
  validatedAt: c.validatedAt,
  profil: c.profil,
  expiresAt: c.expiresAt,
  orphanedAt,
  retentionFinAt: ajouterJours(orphanedAt, P.retentionOrphelinJours),
});

const validation = (c: Identite & Validation) => ({ batId: c.batId, politiqueVersion: c.politiqueVersion, validatedAt: c.validatedAt, profil: c.profil, expiresAt: c.expiresAt });

/** Instant de la dernière transition : aucun événement antérieur n'est accepté. */
export function dernierInstant(c: CycleVieBat): string {
  switch (c.etat) {
    case "brouillon":
      return c.createdAt;
    case "valide":
      return c.validatedAt;
    case "commande_en_attente_paiement":
      return c.checkoutStartedAt;
    case "commande_payee":
      return c.paidAt;
    case "fabrication":
      return c.commandeAnnuleeAt ?? c.enteredProductionAt;
    case "orphelin":
      return c.orphanedAt;
    case "supprime":
      return c.deletedAt;
  }
}

/** Un BAT créé mais jamais validé est supprimé 7 jours après sa création. */
export function creerCycleBrouillon(batId: string, createdAt: string): ResultatCycle {
  if (batId.length === 0) return refus("BAT_ID_REQUIS", "identifiant de BAT requis");
  if (!estHorodatageUtc(createdAt)) return refus("HORODATAGE_INVALIDE", "horodatage UTC ISO 8601 attendu");
  return {
    ok: true,
    cycle: { etat: "brouillon", batId, politiqueVersion: P.version, createdAt, retentionFinAt: ajouterJours(createdAt, P.retentionBrouillonJours) },
  };
}

/** Décision d'action à l'instant `at` (pure) ; l'échéance est atteinte à l'instant exact qui l'égale. */
export function actionDue(c: CycleVieBat, at: string): ActionDue {
  switch (c.etat) {
    case "brouillon":
      return echeanceAtteinte(at, c.retentionFinAt) ? { action: "SUPPRIMER", motif: "brouillon_expire", echeance: c.retentionFinAt } : { action: "AUCUNE" };
    case "valide":
      return echeanceAtteinte(at, c.expiresAt) ? { action: "SUPPRIMER", motif: "expiration_commerciale", echeance: c.expiresAt } : { action: "AUCUNE" };
    case "commande_en_attente_paiement":
      return echeanceAtteinte(at, c.suspensionFinAt) ? { action: "RENDRE_ORPHELIN", echeance: c.suspensionFinAt } : { action: "AUCUNE" };
    case "commande_payee":
      return { action: "AUCUNE" };
    case "fabrication":
      return echeanceAtteinte(at, c.conservationFinAt) ? { action: "FIN_CONSERVATION", echeance: c.conservationFinAt } : { action: "AUCUNE" };
    case "orphelin":
      return echeanceAtteinte(at, c.retentionFinAt) ? { action: "SUPPRIMER", motif: "retention_orphelin_expiree", echeance: c.retentionFinAt } : { action: "AUCUNE" };
    case "supprime":
      return { action: "AUCUNE" };
  }
}

/** Transition pure : jamais de mutation, refus typé pour tout événement impossible, expiré ou antérieur. */
export function appliquerEvenement(c: CycleVieBat, e: EvenementCycleVie): ResultatCycle {
  if (!estHorodatageUtc(e.at)) return refus("HORODATAGE_INVALIDE", "horodatage UTC ISO 8601 attendu");
  if (c.etat === "supprime") return refus("BAT_SUPPRIME", "BAT supprimé : aucune transition possible");
  if (estAnterieur(e.at, dernierInstant(c))) return refus("EVENEMENT_ANTERIEUR", "événement antérieur à la dernière transition du BAT");
  const interdit = () => refus("TRANSITION_INTERDITE", `${e.type} impossible depuis l'état ${c.etat}`);

  switch (e.type) {
    case "CONSTAT_ECHEANCE": {
      const a = actionDue(c, e.at);
      if (a.action === "SUPPRIMER") return { ok: true, cycle: supprimer(c, e.at, a.motif) };
      if (a.action === "RENDRE_ORPHELIN" && c.etat === "commande_en_attente_paiement") return { ok: true, cycle: orpheliner(c, e.at) };
      return { ok: true, cycle: c };
    }
    case "VALIDATION": {
      if (c.etat !== "brouillon") return interdit();
      if (echeanceAtteinte(e.at, c.retentionFinAt)) return refus("BROUILLON_EXPIRE", "brouillon non validé dans les 7 jours : suppression due");
      const profil = profilValidite(e.clientInscrit);
      return {
        ok: true,
        cycle: { etat: "valide", batId: c.batId, politiqueVersion: c.politiqueVersion, validatedAt: e.at, profil, expiresAt: calculerExpirationCommerciale(e.at, profil) },
      };
    }
    case "DEBUT_CHECKOUT": {
      if (c.etat === "orphelin") return refus("BAT_ORPHELIN_NON_REPRENABLE", "BAT orphelin : toute reprise impose un nouveau BAT");
      if (c.etat !== "valide") return interdit();
      if (e.orderId.length === 0) return refus("COMMANDE_REQUISE", "identifiant de commande requis");
      if (echeanceAtteinte(e.at, c.expiresAt)) return refus("BAT_EXPIRE", "validité commerciale échue : suppression due");
      return {
        ok: true,
        cycle: {
          ...validation(c),
          etat: "commande_en_attente_paiement",
          orderId: e.orderId,
          checkoutStartedAt: e.at,
          suspensionFinAt: ajouterJours(e.at, P.suspensionCheckoutMaxJours),
        },
      };
    }
    case "PAIEMENT": {
      if (c.etat !== "commande_en_attente_paiement") return interdit();
      if (echeanceAtteinte(e.at, c.suspensionFinAt)) return refus("SUSPENSION_CHECKOUT_TERMINEE", "suspension de 7 jours écoulée : le BAT redevient orphelin");
      return { ok: true, cycle: { ...validation(c), etat: "commande_payee", orderId: c.orderId, checkoutStartedAt: c.checkoutStartedAt, paidAt: e.at } };
    }
    case "ENTREE_FABRICATION": {
      if (c.etat !== "commande_payee") return interdit();
      return {
        ok: true,
        cycle: {
          ...validation(c),
          etat: "fabrication",
          orderId: c.orderId,
          paidAt: c.paidAt,
          enteredProductionAt: e.at,
          conservationFinAt: ajouterAnsCalendaires(e.at, P.conservationFabricationAns),
        },
      };
    }
    case "ANNULATION_COMMANDE": {
      if (c.etat === "commande_en_attente_paiement" || c.etat === "commande_payee") return { ok: true, cycle: orpheliner(c, e.at) };
      if (c.etat === "fabrication" && c.commandeAnnuleeAt === undefined) return { ok: true, cycle: { ...c, commandeAnnuleeAt: e.at } };
      return interdit();
    }
  }
}

export type ResultatRemplacement =
  | { ok: true; ancien: CycleVieBat; nouveau: CycleVieBat }
  | { ok: false; violations: DomainViolation[]; nouvelleCommandeRequise: boolean };

const refusRemplacement = (code: string, message: string, nouvelleCommandeRequise = false): ResultatRemplacement => ({
  ...refus(code, message),
  nouvelleCommandeRequise,
});

/**
 * Modification de configuration ⇒ nouveau BAT. Ancien BAT non protégé (brouillon, validé, orphelin) : supprimé immédiatement.
 * Avant fabrication : le nouveau BAT (validé) remplace l'ancien dans la commande, qui conserve son paiement et sa fenêtre de checkout.
 * Après fabrication : refus ; nouvelle commande avec le nouveau BAT, BAT de fabrication inchangé.
 */
export function remplacerBat(ancien: CycleVieBat, nouveau: CycleVieBat, at: string): ResultatRemplacement {
  if (!estHorodatageUtc(at)) return refusRemplacement("HORODATAGE_INVALIDE", "horodatage UTC ISO 8601 attendu");
  if (ancien.etat === "supprime" || nouveau.etat === "supprime") return refusRemplacement("BAT_SUPPRIME", "BAT supprimé : remplacement impossible");
  if (nouveau.batId === ancien.batId) return refusRemplacement("NOUVEAU_BAT_REQUIS", "toute modification de configuration crée un nouveau BAT");
  if (ancien.etat === "fabrication") {
    return refusRemplacement("MODIFICATION_APRES_FABRICATION", "BAT de fabrication figé : la modification crée une nouvelle commande et un nouveau BAT", true);
  }
  if (estAnterieur(at, dernierInstant(ancien)) || estAnterieur(at, dernierInstant(nouveau))) {
    return refusRemplacement("EVENEMENT_ANTERIEUR", "remplacement antérieur à la dernière transition d'un des BAT");
  }
  if (nouveau.etat !== "brouillon" && nouveau.etat !== "valide") return refusRemplacement("NOUVEAU_BAT_INVALIDE", "le nouveau BAT doit être un brouillon ou un BAT validé");

  if (ancien.etat === "brouillon" || ancien.etat === "valide" || ancien.etat === "orphelin") {
    return { ok: true, ancien: supprimer(ancien, at, "remplacement"), nouveau };
  }

  if (nouveau.etat !== "valide") return refusRemplacement("NOUVEAU_BAT_NON_VALIDE", "seul un BAT validé par le client peut être rattaché à une commande");
  if (echeanceAtteinte(at, nouveau.expiresAt)) return refusRemplacement("BAT_EXPIRE", "validité commerciale du nouveau BAT échue");

  if (ancien.etat === "commande_en_attente_paiement") {
    if (echeanceAtteinte(at, ancien.suspensionFinAt)) return refusRemplacement("SUSPENSION_CHECKOUT_TERMINEE", "suspension de 7 jours écoulée");
    return {
      ok: true,
      ancien: supprimer(ancien, at, "remplacement"),
      nouveau: { ...validation(nouveau), etat: "commande_en_attente_paiement", orderId: ancien.orderId, checkoutStartedAt: ancien.checkoutStartedAt, suspensionFinAt: ancien.suspensionFinAt },
    };
  }
  return {
    ok: true,
    ancien: supprimer(ancien, at, "remplacement"),
    nouveau: { ...validation(nouveau), etat: "commande_payee", orderId: ancien.orderId, checkoutStartedAt: ancien.checkoutStartedAt, paidAt: ancien.paidAt },
  };
}

export type OrigineCorrection = "client" | "atelier" | "systeme";
export type PropositionCorrection = Readonly<{ origine: OrigineCorrection; batPropose: CycleVieBat }>;
export type ReponseClientCorrection = Readonly<{ reponse: "refusee" }> | Readonly<{ reponse: "acceptee"; at: string }>;

export type ResultatCorrection =
  | { ok: true; applicable: CycleVieBat; initial: CycleVieBat }
  | { ok: false; violations: DomainViolation[]; nouvelleCommandeRequise: boolean };

/**
 * Correction (client, atelier ou système) : un nouveau BAT soumis à la validation du client ; aucune correction n'est acceptée
 * sans cette validation. Refus : le BAT initial reste utilisable et poursuit son cycle normal.
 */
export function resoudreCorrection(initial: CycleVieBat, proposition: PropositionCorrection, reponse: ReponseClientCorrection): ResultatCorrection {
  if (reponse.reponse === "refusee") return { ok: true, applicable: initial, initial };
  if (proposition.batPropose.etat !== "valide") {
    return { ...refus("CORRECTION_NON_VALIDEE_PAR_CLIENT", "une correction n'est acceptée qu'après validation client du nouveau BAT"), nouvelleCommandeRequise: false };
  }
  const r = remplacerBat(initial, proposition.batPropose, reponse.at);
  return r.ok ? { ok: true, applicable: r.nouveau, initial: r.ancien } : r;
}
