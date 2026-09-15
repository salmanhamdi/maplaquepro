// G2-D12 — avoirs (arbitrage Supervisor du 15/09/2026). Domaine PUR en centimes TTC entiers : aucune persistance,
// aucun encaissement, aucun lien avec un prestataire de paiement. Le futur domaine commande appliquera ces décisions ;
// le futur checkout encaissera les compléments et exécutera les remboursements.
import { ajouterAnsCalendaires, echeanceAtteinte, estAnterieur, estHorodatageUtc } from "./temps";
import { type DomainViolation, violation } from "./violation";

export const POLITIQUE_AVOIRS = { version: "G2-D12-2026-09-15", validiteAns: 1 } as const;

export type Avoir = Readonly<{
  id: string;
  politiqueVersion: string;
  createdAt: string;
  /** 1 an calendaire depuis `createdAt` ; jamais prolongé, y compris après recrédit. */
  expiresAt: string;
  montantInitialTtcCentimes: number;
  soldeTtcCentimes: number;
}>;

/** Un seul avoir par commande. */
export type UtilisationAvoir = Readonly<{ avoirId: string; consommeTtcCentimes: number }>;
export type Recredit = Readonly<{ avoirId: string; montantTtcCentimes: number }>;
export type MomentFabrication = "avant_fabrication" | "apres_fabrication";

type Refus = { ok: false; violations: DomainViolation[] };
const refus = (code: string, message: string): Refus => ({ ok: false, violations: [violation(code, "avoir", message)] });
const centimes = (n: number) => Number.isInteger(n) && n >= 0;

export function creerAvoir(e: { id: string; montantTtcCentimes: number; createdAt: string }): { ok: true; avoir: Avoir } | Refus {
  if (e.id.length === 0) return refus("AVOIR_ID_REQUIS", "identifiant d'avoir requis");
  if (!centimes(e.montantTtcCentimes) || e.montantTtcCentimes === 0) return refus("MONTANT_INVALIDE", "montant TTC en centimes entiers strictement positif attendu");
  if (!estHorodatageUtc(e.createdAt)) return refus("HORODATAGE_INVALIDE", "horodatage UTC ISO 8601 attendu");
  return {
    ok: true,
    avoir: {
      id: e.id,
      politiqueVersion: POLITIQUE_AVOIRS.version,
      createdAt: e.createdAt,
      expiresAt: ajouterAnsCalendaires(e.createdAt, POLITIQUE_AVOIRS.validiteAns),
      montantInitialTtcCentimes: e.montantTtcCentimes,
      soldeTtcCentimes: e.montantTtcCentimes,
    },
  };
}

/** Utilisable : solde positif et échéance non atteinte. À l'échéance, le reliquat est définitivement perdu. */
export const estAvoirUtilisable = (a: Avoir, at: string) => a.soldeTtcCentimes > 0 && !estAnterieur(at, a.createdAt) && !echeanceAtteinte(at, a.expiresAt);

/** Avoirs parmi lesquels le client choisit librement. */
export const avoirsUtilisables = (avoirs: readonly Avoir[], at: string) => avoirs.filter((a) => estAvoirUtilisable(a, at));

export function utiliserAvoir(e: {
  avoirs: readonly Avoir[];
  avoirChoisiId: string;
  montantCommandeTtcCentimes: number;
  at: string;
  utilisationExistante: UtilisationAvoir | null;
}): { ok: true; avoir: Avoir; utilisation: UtilisationAvoir; resteAPayerTtcCentimes: number } | Refus {
  if (!estHorodatageUtc(e.at)) return refus("HORODATAGE_INVALIDE", "horodatage UTC ISO 8601 attendu");
  if (e.utilisationExistante !== null) return refus("UN_SEUL_AVOIR_PAR_COMMANDE", "un seul avoir peut être utilisé par commande");
  if (!centimes(e.montantCommandeTtcCentimes) || e.montantCommandeTtcCentimes === 0) return refus("MONTANT_INVALIDE", "montant de commande TTC strictement positif attendu");
  const avoir = e.avoirs.find((a) => a.id === e.avoirChoisiId);
  if (!avoir) return refus("AVOIR_INCONNU", "avoir introuvable");
  if (estAnterieur(e.at, avoir.createdAt)) return refus("EVENEMENT_ANTERIEUR", "utilisation antérieure à la création de l'avoir");
  if (echeanceAtteinte(e.at, avoir.expiresAt)) return refus("AVOIR_EXPIRE", "avoir expiré : reliquat perdu");
  if (avoir.soldeTtcCentimes === 0) return refus("AVOIR_EPUISE", "avoir sans solde");
  const consomme = Math.min(avoir.soldeTtcCentimes, e.montantCommandeTtcCentimes);
  return {
    ok: true,
    avoir: { ...avoir, soldeTtcCentimes: avoir.soldeTtcCentimes - consomme },
    utilisation: { avoirId: avoir.id, consommeTtcCentimes: consomme },
    resteAPayerTtcCentimes: e.montantCommandeTtcCentimes - consomme,
  };
}

/** Recrédit : l'avoir conserve sa date d'expiration originale (un avoir déjà expiré reste inutilisable). */
export function recrediterAvoir(avoir: Avoir, recredit: Recredit): { ok: true; avoir: Avoir } | Refus {
  if (recredit.avoirId !== avoir.id) return refus("AVOIR_INCONNU", "recrédit destiné à un autre avoir");
  if (!centimes(recredit.montantTtcCentimes)) return refus("MONTANT_INVALIDE", "montant TTC en centimes entiers attendu");
  if (avoir.soldeTtcCentimes + recredit.montantTtcCentimes > avoir.montantInitialTtcCentimes) return refus("RECREDIT_EXCESSIF", "le solde ne peut dépasser le montant initial de l'avoir");
  return { ok: true, avoir: { ...avoir, soldeTtcCentimes: avoir.soldeTtcCentimes + recredit.montantTtcCentimes } };
}

const recreditUtilisation = (utilisation: UtilisationAvoir | null, plafond: number): Recredit | null => {
  if (utilisation === null) return null;
  const montant = Math.min(utilisation.consommeTtcCentimes, plafond);
  return montant > 0 ? { avoirId: utilisation.avoirId, montantTtcCentimes: montant } : null;
};

export type EcartPrix =
  | { type: "AUCUN_ECART" }
  /** Hausse : complément dû avant fabrication, encaissé par le futur checkout ; VR-07 inchangé. */
  | { type: "COMPLEMENT_DU"; complementTtcCentimes: number }
  /** Baisse : recrédit de l'avoir consommé d'abord, puis nouvel avoir pour la différence restante. */
  | { type: "RESTITUTION"; differenceTtcCentimes: number; recredit: Recredit | null; nouvelAvoir: Avoir | null; utilisation: UtilisationAvoir | null };

/** Écart de prix TTC entre deux BAT d'une commande déjà payée, modifiée avant fabrication (montants figés aux BAT). */
export function ecartPrixCommandePayee(e: {
  ancienTtcCentimes: number;
  nouveauTtcCentimes: number;
  utilisation: UtilisationAvoir | null;
  at: string;
  nouvelAvoirId: string;
}): { ok: true; ecart: EcartPrix } | Refus {
  if (!centimes(e.ancienTtcCentimes) || !centimes(e.nouveauTtcCentimes)) return refus("MONTANT_INVALIDE", "montants TTC en centimes entiers attendus");
  if (e.nouveauTtcCentimes === e.ancienTtcCentimes) return { ok: true, ecart: { type: "AUCUN_ECART" } };
  if (e.nouveauTtcCentimes > e.ancienTtcCentimes) return { ok: true, ecart: { type: "COMPLEMENT_DU", complementTtcCentimes: e.nouveauTtcCentimes - e.ancienTtcCentimes } };

  const difference = e.ancienTtcCentimes - e.nouveauTtcCentimes;
  const recredit = recreditUtilisation(e.utilisation, difference);
  const reste = difference - (recredit?.montantTtcCentimes ?? 0);
  let nouvelAvoir: Avoir | null = null;
  if (reste > 0) {
    const cree = creerAvoir({ id: e.nouvelAvoirId, montantTtcCentimes: reste, createdAt: e.at });
    if (!cree.ok) return cree;
    nouvelAvoir = cree.avoir;
  }
  const utilisation = e.utilisation && { ...e.utilisation, consommeTtcCentimes: e.utilisation.consommeTtcCentimes - (recredit?.montantTtcCentimes ?? 0) };
  return { ok: true, ecart: { type: "RESTITUTION", differenceTtcCentimes: difference, recredit, nouvelAvoir, utilisation } };
}

/** Annulation : avant fabrication, avoir utilisé recrédité (échéance originale) ; après fabrication, aucun recrédit automatique. */
export function annulerCommande(e: { moment: MomentFabrication; utilisation: UtilisationAvoir | null }): { recredit: Recredit | null } {
  return { recredit: e.moment === "avant_fabrication" ? recreditUtilisation(e.utilisation, Number.MAX_SAFE_INTEGER) : null };
}

export type NatureIncident = "ECHEC_TECHNIQUE_INTERNE" | "DEFAUT_ATELIER" | "ERREUR_CLIENT" | "CONTESTATION_CONFORME_BAT";

export type TraitementIncident =
  | { traitement: "AUTOMATIQUE"; recredit: Recredit | null; remboursementPaiementComplementaireTtcCentimes: number }
  /** SAV manuel : aucun remboursement, recrédit ni remplacement automatique. */
  | { traitement: "SAV_MANUEL" };

/** Échec technique interne : avoir recrédité + paiement complémentaire remboursé, avant comme après fabrication (Q65). */
export function traiterIncident(e: {
  nature: NatureIncident;
  moment: MomentFabrication;
  utilisation: UtilisationAvoir | null;
  paiementComplementaireTtcCentimes: number;
}): { ok: true; traitement: TraitementIncident } | Refus {
  if (!centimes(e.paiementComplementaireTtcCentimes)) return refus("MONTANT_INVALIDE", "montant TTC en centimes entiers attendu");
  if (e.nature !== "ECHEC_TECHNIQUE_INTERNE") return { ok: true, traitement: { traitement: "SAV_MANUEL" } };
  return {
    ok: true,
    traitement: {
      traitement: "AUTOMATIQUE",
      recredit: recreditUtilisation(e.utilisation, Number.MAX_SAFE_INTEGER),
      remboursementPaiementComplementaireTtcCentimes: e.paiementComplementaireTtcCentimes,
    },
  };
}
