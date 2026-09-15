// BAT PROVISOIRE — DONNÉES DE DÉMONSTRATION (T4-b). Ce n'est PAS un BAT du domaine : aucun objet `Bat`, aucun appel au
// moteur BAT, aucun batId, aucun hash, aucune version de moteur, aucun prix, aucune expiration, aucune validation.
// Le numéro affiché est purement visuel et ne doit jamais être utilisé comme identifiant métier.
import type { Matiere } from "../plaque/PlaqueVisuel";

export type BatProvisoireDemo = {
  numeroAffiche: string;
  libelle: string;
  statutProduction: string;
  matiere: Matiere;
  nomMatiere: string;
  procede: string;
  widthMm: number;
  heightMm: number;
  lignes: readonly string[];
  alignement: "left" | "center";
  trous: 0 | 2 | 4;
  retraitTrouMm: number;
  pointsAVerifier: readonly string[];
};

export const BAT_PROVISOIRE_DEMO: BatProvisoireDemo = {
  numeroAffiche: "BAT-DEMO-0001",
  libelle: "BAT provisoire",
  statutProduction: "En cours de validation atelier",
  matiere: "plexiglass",
  nomMatiere: "Plexiglass / TroGlass Clear",
  procede: "Impression UV à l'envers → découpe",
  widthMm: 300,
  heightMm: 120,
  lignes: ["Atelier Nord", "SALLE DE RÉUNION"],
  alignement: "center",
  trous: 4,
  retraitTrouMm: 10,
  pointsAVerifier: [
    "Orthographe et ponctuation du texte",
    "Dimensions de la plaque",
    "Position et nombre des fixations",
    "Matière et rendu attendus",
  ],
};
