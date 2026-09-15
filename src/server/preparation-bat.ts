// BAT-PREP : préparation technique ÉPHÉMÈRE du BAT, côté serveur. Composition des fonctions existantes du domaine :
// evaluateFabricability → resolveSpec → buildCanonicalGeometry → planArtifacts → findPendingValues.
// N'utilise pas createBat (qui exige batId / createdAt / contentHash) : aucun identifiant, aucune empreinte, aucun prix,
// aucune expiration, aucun artefact de production généré, aucune persistance. Catalogue de DÉMONSTRATION.
import { interpreter, NOMS_FAMILLES, PROCEDES, statutDepuis, versConfiguration } from "../components/configurateur/interpretation";
import { lireEtatSaisie } from "../components/configurateur/brouillon";
import { erreursDeSaisie } from "../components/configurateur/interpretation";
import type { ArtefactPrevu, ElementPreparation, Preparation, StatutElement } from "../components/configurateur/preparation";
import { buildCanonicalGeometry, ENGINE_VERSIONS, evaluateFabricability, findPendingValues, planArtifacts, resolveSpec, type DomainViolation } from "../domain";
import { CATALOGUE_DEMO, COMPOSITION_DEMO, POLICE_DEMO, PRODUIT_DEMO, referenceDemo } from "./catalogue-demo";

const fmt = (n: number) => String(n).replace(".", ",");
const el = (libelle: string, valeur: string, statut: StatutElement = "determine", mono = false): ElementPreparation => ({ libelle, valeur, statut, ...(mono ? { mono } : {}) });

type EtatResolu<T> = { etat: "SANS_OBJET" } | { etat: "DEFINIE"; valeur: T };
const resolu = <T>(libelle: string, e: EtatResolu<T>, texte: (v: T) => string) => (e.etat === "DEFINIE" ? el(libelle, texte(e.valeur)) : el(libelle, "Sans objet", "sans_objet"));
const nomCouleur = (c: unknown) => (c && typeof c === "object" && "name" in c && typeof c.name === "string" ? c.name : "—");

const COTES: Record<string, string> = { face: "Face", envers: "Envers" };
const MIROIRS: Record<string, string> = { none: "Aucun", x: "Horizontal (lecture à travers la matière)" };
const GROUPES: Record<string, string> = { ENGRAVE: "Gravure", CUT: "Découpe", HOLES: "Perçage" };
const ENCRES: Record<string, string> = { noir_uniquement: "Noir uniquement", couleur: "Couleur" };
const OPERATIONS: Record<string, string> = { laser_engrave: "Gravure laser", laser_cut: "Découpe laser", uv_print: "Impression UV" };
const libelle = (table: Record<string, string>, cle: string) => table[cle] ?? cle;

const seulementValidation = (violations: readonly DomainViolation[]) => violations.length > 0 && violations.every((v) => v.code === "VALIDATION_REQUIRED");

export function construirePreparationBat(entree: unknown): Preparation {
  // Frontière : l'état reçu est revalidé ; aucun verdict ni donnée métier du client n'est pris en compte.
  const etat = lireEtatSaisie(entree);
  if (!etat || erreursDeSaisie(etat).length > 0) return { etat: "saisie_invalide" };

  const ref = referenceDemo(etat.famille);
  const configuration = versConfiguration(etat, { productId: PRODUIT_DEMO, variantId: ref.variantId, thicknessId: ref.thicknessId, fontId: POLICE_DEMO, layoutId: COMPOSITION_DEMO });

  const fab = evaluateFabricability(configuration, CATALOGUE_DEMO);
  if (!fab.ok) {
    const messages = interpreter(fab.violations, etat.famille);
    return statutDepuis(false, messages) === "bloque" ? { etat: "non_fabricable", messages } : { etat: "validation_requise", messages };
  }

  const spec = resolveSpec(fab, CATALOGUE_DEMO);
  if (!spec.ok) return seulementValidation(spec.violations) ? { etat: "validation_requise", messages: interpreter(spec.violations, etat.famille) } : { etat: "impossible" };
  const s = spec.spec;

  const geo = buildCanonicalGeometry({
    spec: s,
    artwork: fab.configuration.design.artwork,
    textePresent: fab.configuration.design.text !== null,
    ...(fab.texteTrace ? { texteTrace: fab.texteTrace } : {}),
    engineVersions: ENGINE_VERSIONS,
  });
  if (!geo.ok) return seulementValidation(geo.violations) ? { etat: "validation_requise", messages: interpreter(geo.violations, etat.famille) } : { etat: "impossible" };
  const plaque = geo.geometry.plate;

  const plan = planArtifacts(s.workflow.id, s.workflow.operations, s.holes.length);
  if (!plan.ok) return seulementValidation(plan.violations) ? { etat: "validation_requise", messages: interpreter(plan.violations, etat.famille) } : { etat: "impossible" };

  const specification: ElementPreparation[] = [
    el("Produit", s.product.name),
    el("Famille", NOMS_FAMILLES[s.reference.family]),
    el("Référence", s.reference.label),
    el("Épaisseur", `${fmt(s.thickness.mm)} mm`, "determine", true),
    el("Dimensions", `${fmt(plaque.widthMm)} × ${fmt(plaque.heightMm)} mm`, "determine", true),
    el("Coins", plaque.cornerRadiusMm === 0 ? "Droits" : `Rayon ${fmt(plaque.cornerRadiusMm)} mm`),
    el("Format", s.plate.formatMode === "custom" ? "Sur mesure" : "Standard"),
    el("Procédé", PROCEDES[s.reference.family]),
    el("Surface", nomCouleur(s.apparence.couleurSurface)),
    resolu("Finition", s.apparence.finition, (v) => v),
    resolu("Couleur révélée", s.apparence.couleurRevelee, nomCouleur),
    resolu("Gravure", s.capaciteGravure.cote, (v) => libelle(COTES, v)),
    s.politiqueImpression.valeur === "aucune" ? el("Impression", "Aucune", "sans_objet") : el("Impression", `${libelle(ENCRES, s.politiqueImpression.valeur)}${s.politiqueImpression.cote.etat === "DEFINIE" ? ` · ${libelle(COTES, s.politiqueImpression.cote.valeur)}` : ""}`),
  ];

  const contenu: ElementPreparation[] = [
    fab.configuration.design.text === null ? el("Texte", "Aucun texte", "sans_objet") : el("Texte", "Présent"),
    fab.configuration.design.artwork === null ? el("Visuel", "Aucun visuel", "sans_objet") : el("Visuel", "Présent"),
    s.holes.length === 0 ? el("Trous", "Sans trou", "sans_objet") : el("Trous", `${s.holes.length} trous`),
  ];

  const operations = s.workflow.operations.map((o) =>
    el(`Étape ${o.sequence}`, `${libelle(OPERATIONS, o.type)} · ${libelle(COTES, o.cote)}${o.encre ? ` · ${libelle(ENCRES, o.encre)}` : ""}${o.condition === "always" ? "" : " · si la géométrie l'exige"}`),
  );

  const laser = (titre: string, p: { cote: string; miroir: string; groupes: readonly string[] }): ArtefactPrevu => ({
    titre,
    elements: [el("Côté", libelle(COTES, p.cote)), el("Miroir", libelle(MIROIRS, p.miroir)), el("Opérations", p.groupes.map((g) => libelle(GROUPES, g)).join(" · "))],
  });
  const uv = (titre: string, p: { cote: string; miroir: string; encre: string }): ArtefactPrevu => ({
    titre,
    elements: [el("Côté", libelle(COTES, p.cote)), el("Miroir", libelle(MIROIRS, p.miroir)), el("Encre", libelle(ENCRES, p.encre)), el("Contrat de fichier UV", "En attente", "a_valider")],
  });
  const artefacts: ArtefactPrevu[] = plan.plan.flatMap((p) =>
    p.kind === "laser" ? [laser("Fichier laser", p)] : p.kind === "uv" ? [uv("Couche d'impression UV", p)] : [laser("Fichier hybride · partie laser", p.laser), uv("Fichier hybride · partie UV", p.uv)],
  );

  // Éléments À VALIDER réellement lisibles : spécification résolue et statut atelier des contrats de fichiers requis.
  const aValider: ElementPreparation[] = findPendingValues(s).map((chemin) => el("Spécification", chemin, "a_valider", true));
  for (const contractId of s.productionContractIds) {
    const statut = CATALOGUE_DEMO.productionContracts.find((c) => c.contractId === contractId);
    if (!statut) {
      aValider.push(el(contractId, "Statut atelier non renseigné", "a_valider", true));
      continue;
    }
    if (statut.conformite === "non_conforme") aValider.push(el(contractId, "Non conforme", "bloquant", true));
    for (const chemin of findPendingValues(statut)) aValider.push(el(contractId, `${chemin} à valider`, "a_valider", true));
  }

  return { etat: "preparee", specification, contenu, operations, artefacts, aValider };
}
