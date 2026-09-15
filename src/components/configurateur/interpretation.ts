// Configurateur : construction de la configuration client et traduction du verdict du moteur en messages lisibles.
// Module pur. Le moteur (evaluateFabricability) reste la seule source de vérité : aucune règle n'est recalculée ici,
// aucune valeur n'est corrigée. Les causes distinctes (bornes VR-25, capacité machine…) restent des messages distincts.
import { type Alternative, BORNES_DIMENSIONS_VR25, DEFAULT_EDGE_DISTANCE_TARGET_MM, type DomainViolation, MACHINE_CAPABILITIES, type MaterialFamily, PRODUCTION_WORKFLOWS, WORKFLOW_BY_FAMILY, zoneMachine } from "../../domain";

export const NOMS_FAMILLES: Record<MaterialFamily, string> = {
  trolase: "TroLase",
  trolase_metallic: "TroLase Metallic",
  plexiglass: "Plexiglass / TroGlass Clear",
  troglass_metallic: "TroGlass Metallic",
};

export const PROCEDES: Record<MaterialFamily, string> = {
  trolase: "Gravure laser",
  trolase_metallic: "Gravure laser",
  plexiglass: "Impression UV à l'envers → découpe",
  troglass_metallic: "Gravure envers + UV noir",
};

export const ORDRE_FAMILLES: readonly MaterialFamily[] = ["trolase", "trolase_metallic", "plexiglass", "troglass_metallic"];

export type EtatConfigurateur = {
  famille: MaterialFamily;
  largeur: string;
  hauteur: string;
  lignes: string[];
  alignement: "left" | "center";
  trous: 0 | 2 | 4;
  retrait: string;
};

export const ETAT_INITIAL: EtatConfigurateur = {
  famille: "plexiglass",
  largeur: "200",
  hauteur: "100",
  lignes: [""],
  alignement: "center",
  trous: 0,
  retrait: String(DEFAULT_EDGE_DISTANCE_TARGET_MM).replace(".", ","),
};

export type Champ = "matiere" | "dimensions" | "texte" | "fixations" | "general";
export type Niveau = "bloquant" | "validation";

export type Message = { id: string; champ: Champ; niveau: Niveau; titre: string; detail: string };

/** Aperçu serveur (T4-a) : rendu de la géométrie canonique, uniquement pour une configuration fabricable. */
export type ApercuServeur = { etat: "disponible"; svg: string } | { etat: "indisponible" } | { etat: "non_applicable" };

export type Verdict = {
  statut: "fabricable" | "bloque" | "en_validation";
  messages: Message[];
  alternatives: Alternative[];
  texteModifie: boolean;
  apercu: ApercuServeur;
};

/** Nombre saisi en mm (virgule ou point) ; null si vide ou non numérique. Aucune valeur n'est arrondie. */
export function lireMm(saisie: string): number | null {
  const t = saisie.trim().replace(",", ".");
  if (t === "" || !/^\d+(\.\d+)?$/.test(t)) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Erreurs de saisie avant tout envoi : champ vide ou non numérique. Les bornes sont évaluées par le moteur. */
export function erreursDeSaisie(etat: EtatConfigurateur): Message[] {
  const out: Message[] = [];
  const mm = (valeur: string, id: string, nom: string, champ: Champ) => {
    const n = lireMm(valeur);
    if (n === null || n <= 0) out.push({ id, champ, niveau: "bloquant", titre: `${nom} à renseigner`, detail: `Indiquez ${nom.toLowerCase()} en millimètres, par exemple 120.` });
  };
  mm(etat.largeur, "saisie-largeur", "La largeur", "dimensions");
  mm(etat.hauteur, "saisie-hauteur", "La hauteur", "dimensions");
  if (etat.trous > 0) mm(etat.retrait, "saisie-retrait", "La distance au bord", "fixations");
  return out;
}

/** Configuration client v4 construite depuis la saisie ; les lignes sont transmises telles que saisies (normalisation = moteur). */
export function versConfiguration(etat: EtatConfigurateur, ids: { productId: string; variantId: string; thicknessId: string; fontId: string; layoutId: string }) {
  const lignesSaisies = etat.lignes.some((l) => l.trim() !== "");
  return {
    configurationVersion: 4,
    productId: ids.productId,
    materialVariantId: ids.variantId,
    thicknessId: ids.thicknessId,
    format: { mode: "custom", widthMm: lireMm(etat.largeur), heightMm: lireMm(etat.hauteur) },
    design: {
      text: lignesSaisies ? { lines: etat.lignes, fontId: ids.fontId, layoutId: ids.layoutId, alignment: etat.alignement } : null,
      artwork: null,
    },
    mounting: etat.trous === 0 ? { count: 0 } : { count: etat.trous, mode: "standard", edgeDistanceMm: lireMm(etat.retrait) },
    quantity: 1,
  };
}

const fmt = (n: number) => String(n).replace(".", ",");

function machinePourChemin(path: string): { nom: string; zone: string; tournee: boolean } | null {
  const m = /^workflows\.(\w+)\.operations\.(\d+)$/.exec(path);
  const op = m && PRODUCTION_WORKFLOWS.find((w) => w.id === m[1])?.operations.find((o) => o.sequence === Number(m[2]));
  const machine = op && MACHINE_CAPABILITIES.find((c) => c.machineId === op.machineId);
  const zone = machine && zoneMachine(machine);
  if (!op || !machine || !zone) return null;
  return { nom: op.type === "uv_print" ? "notre imprimante UV" : "notre machine laser", zone: `${fmt(zone.widthMm)} × ${fmt(zone.heightMm)} mm`, tournee: machine.orientationDePoseTourneeAutorisee };
}

function messageVr25(v: DomainViolation, famille: MaterialFamily): Message | null {
  const m = /^vr25\.(\w+)\.(min|max)(Width|Height)Mm$/.exec(v.path);
  if (!m) return null;
  const b = BORNES_DIMENSIONS_VR25[famille];
  const [, , sens, axe] = m;
  const nom = axe === "Width" ? "Largeur" : "Hauteur";
  const valeur = sens === "min" ? (axe === "Width" ? b.minWidthMm : b.minHeightMm) : axe === "Width" ? b.maxWidthMm : b.maxHeightMm;
  const plage = `De ${fmt(b.minWidthMm)} × ${fmt(b.minHeightMm)} à ${fmt(b.maxWidthMm)} × ${fmt(b.maxHeightMm)} mm pour ${NOMS_FAMILLES[famille]}${b.deuxOrientations ? ", dans un sens ou dans l'autre" : ""}.`;
  return {
    id: `vr25-${sens}-${axe}`,
    champ: "dimensions",
    niveau: "bloquant",
    titre: sens === "min" ? `${nom} trop petite : ${fmt(valeur)} mm minimum` : `${nom} trop grande : ${fmt(valeur)} mm maximum`,
    detail: plage,
  };
}

/** Traduit une violation du moteur en message client. Toute violation non reconnue reste visible (jamais masquée). */
export function traduire(v: DomainViolation, famille: MaterialFamily): Message {
  const vr25 = messageVr25(v, famille);
  if (vr25) return vr25;

  switch (v.code) {
    case "EXCEEDS_MACHINE": {
      const machine = machinePourChemin(v.path);
      return {
        id: `machine-${v.path}`,
        champ: "dimensions",
        niveau: "bloquant",
        titre: machine ? `Trop grande pour ${machine.nom}` : "Trop grande pour nos machines",
        detail: machine ? `Zone utile : ${machine.zone}${machine.tournee ? ", dans un sens ou dans l'autre" : ""}.` : v.message,
      };
    }
    case "MOUNTING_PARAMETER_NOT_VALIDATED":
    case "HOLES_UNAVAILABLE":
      return {
        id: "fixations-validation",
        champ: "fixations",
        niveau: "validation",
        titre: "Perçage en cours de validation",
        detail: "Le diamètre et les distances de perçage sont en cours de validation par l'atelier. Une plaque percée ne peut pas encore être commandée.",
      };
    case "HOLE_EDGE_DISTANCE_BELOW_MINIMUM":
    case "HOLE_KEEP_OUT_MARGIN_VIOLATED":
    case "HOLES_DO_NOT_FIT_PLATE":
    case "HOLE_IN_CORNER_RADIUS_ZONE":
      return { id: `fixations-${v.code}`, champ: "fixations", niveau: "bloquant", titre: "Position des trous impossible", detail: "Les trous ne tiennent pas à cette distance du bord sur cette plaque. Modifiez la distance ou les dimensions." };
    case "UNSUPPORTED_GLYPHS":
      return { id: "texte-glyphes", champ: "texte", niveau: "bloquant", titre: "Caractères non disponibles", detail: `Certains caractères ne peuvent pas être gravés ou imprimés : ${v.message.replace(/^glyphes absents : /, "")}.` };
    case "BELOW_LEGIBILITY":
    case "TEXT_TOO_LONG":
      return { id: `texte-${v.code}`, champ: "texte", niveau: "bloquant", titre: v.code === "TEXT_TOO_LONG" ? "Texte trop long pour la plaque" : "Texte trop petit pour être lisible", detail: "Raccourcissez le texte ou agrandissez la plaque." };
    case "VALIDATION_REQUIRED": {
      if (v.path === "format.mode") {
        return {
          id: "matiere-sur-mesure",
          champ: "matiere",
          niveau: "validation",
          titre: "Pas encore ouvert à la commande",
          detail: `Le sur-mesure en ${NOMS_FAMILLES[famille]} n'est pas encore ouvert. Vous pouvez composer votre plaque ou choisir une autre matière.`,
        };
      }
      if (v.path.startsWith("design.text")) {
        return {
          id: "texte-validation",
          champ: "texte",
          niveau: "validation",
          titre: "Texte en cours de validation",
          detail: "Les polices et le contrôle de lisibilité sont en cours de validation par l'atelier. Une plaque avec texte ne peut pas encore être commandée.",
        };
      }
      return { id: `validation-${v.path}`, champ: "general", niveau: "validation", titre: "Élément en cours de validation par l'atelier", detail: v.message };
    }
    default:
      return { id: `${v.code}-${v.path}`, champ: "general", niveau: "bloquant", titre: "Configuration non réalisable", detail: v.message };
  }
}

/** Messages dédoublonnés par identifiant (une même cause signalée sur plusieurs chemins n'apparaît qu'une fois). */
export function interpreter(violations: readonly DomainViolation[], famille: MaterialFamily): Message[] {
  const vus = new Map<string, Message>();
  for (const v of violations) {
    const m = traduire(v, famille);
    if (!vus.has(m.id)) vus.set(m.id, m);
  }
  return [...vus.values()];
}

export const statutDepuis = (ok: boolean, messages: readonly Message[]): Verdict["statut"] =>
  ok ? "fabricable" : messages.some((m) => m.niveau === "bloquant") ? "bloque" : "en_validation";

export const procedeDe = (famille: MaterialFamily) => WORKFLOW_BY_FAMILY[famille];

// ---------- Présentation (aucune règle métier) ----------

export type StatutAffiche = Verdict["statut"] | "saisie" | "verification";

/** Textes du verdict affiché. Ils reformulent l'état renvoyé par le moteur ; ils n'en créent aucun. */
export const TEXTES_STATUT: Record<StatutAffiche, { titre: string; detail: string }> = {
  fabricable: { titre: "Fabricable", detail: "Notre moteur de fabrication accepte cette configuration. Vous vérifierez le BAT avant toute fabrication." },
  bloque: { titre: "Non fabricable en l'état", detail: "Corrigez les points signalés pour poursuivre." },
  en_validation: {
    titre: "En attente de validation atelier",
    detail: "Certains éléments ne peuvent pas encore être commandés. Aucune correction n'est attendue de votre part.",
  },
  saisie: { titre: "Configuration incomplète", detail: "Renseignez les dimensions pour lancer la vérification." },
  verification: { titre: "Vérification en cours", detail: "Nous contrôlons votre configuration auprès du moteur de fabrication." },
};

export type EtatEtape = "renseigne" | "facultatif" | "a_renseigner" | "a_corriger" | "attente";

/**
 * État d'affichage d'une étape du configurateur : dérivé de la saisie et des messages du moteur uniquement.
 * « renseigné » signifie qu'une valeur est choisie, jamais qu'elle est validée par le métier.
 */
export function etatEtape(champ: Champ, messages: readonly Message[], rempli: boolean, facultatif = false): EtatEtape {
  const duChamp = messages.filter((m) => m.champ === champ);
  if (duChamp.some((m) => m.niveau === "bloquant")) return "a_corriger";
  if (duChamp.some((m) => m.niveau === "validation")) return "attente";
  if (rempli) return "renseigne";
  return facultatif ? "facultatif" : "a_renseigner";
}

export const LIBELLES_ETAPE: Record<EtatEtape, string> = {
  renseigne: "Renseigné",
  facultatif: "Facultatif",
  a_renseigner: "À renseigner",
  a_corriger: "À corriger",
  attente: "En attente atelier",
};
