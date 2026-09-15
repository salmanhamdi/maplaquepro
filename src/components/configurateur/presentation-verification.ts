// Étape « Vérification » : mise en forme de la saisie et du verdict du serveur. Module pur de présentation :
// aucune règle métier n'est évaluée ici et aucune confirmation ne modifie le verdict.
import { type EtatConfigurateur, lireMm, type Message, NOMS_FAMILLES, PROCEDES, type Verdict } from "./interpretation";

const fmt = (n: number) => String(n).replace(".", ",");

export type Ligne = { libelle: string; valeur: string; mono?: boolean };

/** Orientation de la plaque telle que saisie (largeur / hauteur). Sans rapport avec l'orientation de pose en machine. */
export function orientationPlaque(largeurMm: number, hauteurMm: number): string {
  if (largeurMm === hauteurMm) return "Carrée";
  return largeurMm > hauteurMm ? "Paysage · plus large que haute" : "Portrait · plus haute que large";
}

export function caracteristiques(etat: EtatConfigurateur): Ligne[] {
  const w = lireMm(etat.largeur);
  const h = lireMm(etat.hauteur);
  const dims = w !== null && h !== null && w > 0 && h > 0;
  return [
    { libelle: "Matière", valeur: NOMS_FAMILLES[etat.famille] },
    { libelle: "Dimensions", valeur: dims ? `${fmt(w)} × ${fmt(h)} mm` : "À renseigner", mono: true },
    { libelle: "Orientation", valeur: dims ? orientationPlaque(w, h) : "—" },
    { libelle: "Procédé", valeur: PROCEDES[etat.famille] },
  ];
}

export function contenu(etat: EtatConfigurateur): Ligne[] {
  const lignes = etat.lignes.filter((l) => l.trim() !== "");
  const retrait = lireMm(etat.retrait);
  return [
    { libelle: "Texte", valeur: lignes.length > 0 ? lignes.join("\n") : "Aucun texte" },
    ...(lignes.length > 0 ? [{ libelle: "Alignement", valeur: etat.alignement === "center" ? "Centré" : "À gauche" }] : []),
    { libelle: "Trous", valeur: etat.trous === 0 ? "Sans trou" : `${etat.trous} trous · ${retrait !== null ? fmt(retrait) : "—"} mm du bord` },
  ];
}

/** Messages du moteur répartis entre ce que le client doit corriger et ce qui attend l'atelier. */
export function groupesMessages(messages: readonly Message[]): { aCorriger: Message[]; enAttente: Message[] } {
  return { aCorriger: messages.filter((m) => m.niveau === "bloquant"), enAttente: messages.filter((m) => m.niveau === "validation") };
}

/** Ce qui se passe ensuite, selon le verdict du serveur. La préparation du BAT n'est ouverte dans aucun cas. */
export const SUITE_VERIFICATION: Record<Verdict["statut"], string> = {
  fabricable: "Votre plaque peut être fabriquée telle que décrite. Vous pouvez lancer la préparation du BAT : une étape technique, non contractuelle.",
  en_validation: "Rien à corriger de votre côté. Certains éléments attendent une validation de l'atelier : la préparation du BAT restera fermée jusque-là.",
  bloque: "Certains points empêchent la fabrication. Modifiez la configuration pour les corriger.",
};

export type Confirmation = { id: "caracteristiques" | "texte" | "trous"; libelle: string };

/** Relectures proposées au client, uniquement pour les éléments réellement présents. Elles n'ont aucun effet sur le verdict. */
export function confirmationsDisponibles(etat: EtatConfigurateur): Confirmation[] {
  const out: Confirmation[] = [{ id: "caracteristiques", libelle: "J'ai vérifié la matière, les dimensions et l'orientation." }];
  if (etat.lignes.some((l) => l.trim() !== "")) out.push({ id: "texte", libelle: "J'ai relu mon texte : orthographe, accents, majuscules." });
  if (etat.trous > 0) out.push({ id: "trous", libelle: "J'ai vérifié le nombre de trous et leur distance au bord." });
  return out;
}
