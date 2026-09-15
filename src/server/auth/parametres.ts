// Paramètres d'authentification S2.
// DÉCIDÉ (Supervisor, S2-0) : Argon2id, argon2@0.45.1, m=19456 Kio, t=2, p=1.
// PROPOSÉ — NON NORMATIF, à arbitrer : toutes les autres valeurs ci-dessous (politique de mot de passe,
// durées, limites de débit, connexion avant vérification, révocation). Elles sont regroupées ici pour
// qu'un arbitrage ne modifie qu'un seul fichier.

export const ARGON2_PARAMETRES = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

const MINUTE = 60_000;
const HEURE = 60 * MINUTE;
const JOUR = 24 * HEURE;

export const PROPOSITIONS = {
  motDePasse: {
    longueurMin: 10,
    // Borne haute en octets UTF-8 : protège Argon2 contre des entrées démesurées.
    octetsMax: 256,
  },
  dureeSessionMs: 30 * JOUR,
  // Écriture de last_seen_at au plus une fois par intervalle.
  intervalleDerniereActiviteMs: 5 * MINUTE,
  dureeJetonVerificationEmailMs: 24 * HEURE,
  dureeJetonReinitialisationMs: 1 * HEURE,
  connexionAvantVerificationEmail: true,
  revoquerAutresSessionsApresChangement: true,
  limites: {
    connexionParEmail: { max: 5, fenetreMs: 15 * MINUTE },
    connexionParIp: { max: 30, fenetreMs: 15 * MINUTE },
    inscriptionParIp: { max: 5, fenetreMs: HEURE },
    reinitialisationParEmail: { max: 3, fenetreMs: HEURE },
    reinitialisationParIp: { max: 10, fenetreMs: HEURE },
    renvoiVerificationParCompte: { max: 3, fenetreMs: HEURE },
    changementMotDePasseParCompte: { max: 5, fenetreMs: 15 * MINUTE },
  },
} as const;

export type Limite = { max: number; fenetreMs: number };
