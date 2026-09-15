// Durées G2-D12 sur horodatages UTC ISO 8601 (arbitrage Supervisor du 15/09/2026). Fonctions pures : aucune lecture d'horloge.
// Conventions normatives : échéance atteinte à l'instant exact ; calculs et comparaisons en UTC (jours = 24 h exactes) ;
// années calendaires = même jour et même mois l'année cible, une date inexistante (29 février) tombe au 28 février.
import { z } from "zod";

export const horodatageUtcSchema = z.iso.datetime();
export const MS_PAR_JOUR = 86_400_000;

export const estHorodatageUtc = (valeur: string) => horodatageUtcSchema.safeParse(valeur).success;

const instantMs = (iso: string) => Date.parse(iso);

export const ajouterJours = (iso: string, jours: number) => new Date(instantMs(iso) + jours * MS_PAR_JOUR).toISOString();

export function ajouterAnsCalendaires(iso: string, ans: number): string {
  const d = new Date(instantMs(iso));
  const annee = d.getUTCFullYear() + ans;
  const mois = d.getUTCMonth();
  const dernierJourDuMois = new Date(Date.UTC(annee, mois + 1, 0)).getUTCDate();
  const jour = Math.min(d.getUTCDate(), dernierJourDuMois);
  return new Date(Date.UTC(annee, mois, jour, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds())).toISOString();
}

/** Échéance atteinte : l'instant est égal ou postérieur à l'échéance (une durée exacte est écoulée à l'instant qui l'égale). */
export const echeanceAtteinte = (at: string, echeance: string) => instantMs(at) >= instantMs(echeance);

export const estAnterieur = (a: string, b: string) => instantMs(a) < instantMs(b);
