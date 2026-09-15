// Journal d'audit de l'authentification : type d'événement, horodatage, customerId si disponible.
// Jamais de mot de passe, jeton, cookie, secret ni URL contenant un secret. Aucun email par défaut.
export const EVENEMENTS_AUTH = [
  "compte_cree",
  "email_verifie",
  "connexion_reussie",
  "connexion_echouee",
  "deconnexion",
  "reinitialisation_demandee",
  "reinitialisation_effectuee",
  "mot_de_passe_change",
  "sessions_revoquees",
  "limite_atteinte",
] as const;

export type EvenementAuth = (typeof EVENEMENTS_AUTH)[number];

export type EntreeAudit = {
  evenement: EvenementAuth;
  horodatage: string;
  customerId?: string;
  detail?: string;
};

export type JournalAudit = (entree: EntreeAudit) => void;

export const journalConsole: JournalAudit = (entree) => {
  console.info(JSON.stringify({ canal: "auth", ...entree }));
};

export function tracer(journal: JournalAudit, maintenant: Date, evenement: EvenementAuth, extra: { customerId?: string; detail?: string } = {}) {
  journal({ evenement, horodatage: maintenant.toISOString(), ...extra });
}
