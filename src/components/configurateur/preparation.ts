// Préparation du BAT (BAT-PREP) : forme du résultat renvoyé par le serveur. Ce n'est PAS un BAT :
// aucun identifiant, aucune empreinte, aucun prix, aucune expiration, aucune persistance.
import type { Message } from "./interpretation";

export type StatutElement = "determine" | "a_valider" | "bloquant" | "sans_objet";

export type ElementPreparation = { libelle: string; valeur: string; statut: StatutElement; mono?: boolean };

export type ArtefactPrevu = { titre: string; elements: ElementPreparation[] };

export type Preparation =
  | {
      etat: "preparee";
      specification: ElementPreparation[];
      contenu: ElementPreparation[];
      operations: ElementPreparation[];
      artefacts: ArtefactPrevu[];
      aValider: ElementPreparation[];
    }
  | { etat: "validation_requise"; messages: Message[] }
  | { etat: "non_fabricable"; messages: Message[] }
  | { etat: "saisie_invalide" }
  | { etat: "impossible" };

export const LIBELLES_STATUT_ELEMENT: Record<StatutElement, string> = {
  determine: "Déterminé",
  a_valider: "À valider",
  bloquant: "Bloquant",
  sans_objet: "Sans objet",
};

/** Mention générique (non issue du moteur) des décisions de niveau BAT encore ouvertes. */
export const DECISIONS_BAT_A_FINALISER =
  "Certaines décisions restent à finaliser avant l'émission du BAT réel : tarification, durée de validité et règles de design.";
