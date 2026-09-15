// Versions des 5 moteurs (Master Plan v1.6 §6 — décision Supervisor du 15/09/2026, option A).
// Source UNIQUE : aucune autre valeur de version de moteur ne doit être déclarée ailleurs.
//
// Une version identifie l'implémentation contractuelle d'un moteur ; elle n'est ni dérivée du SHA Git, ni calculée, ni
// fournie par le client. Valeurs initiales « 1 » = implémentation présente dans main = 9290cf1.
//
// Règle de montée : une version est incrémentée ("1" → "2" → "3") lorsqu'une modification peut changer une sortie
// déterminante pour la reproductibilité du moteur. Un refactor démontré sémantiquement et déterministiquement équivalent
// ne la fait pas monter. Un changement de catalogue (catalogVersion), de workflow (workflow.version), de contrat
// (version portée par l'identifiant) ou de règle métier (ex. designRulesVersion) ne fait PAS automatiquement monter une
// version de moteur : ces éléments ont leurs propres versions.
//
// Périmètres (implémentation actuelle) :
// - design     : texte (texte.ts) et artwork (artwork-evaluation.ts), répartition dans les couches de la géométrie.
//                Déterminant si un texte ou un artwork est présent.
// - mounting   : trous (holes.ts : résolution des règles, génération, distance par défaut) et zones de garde.
//                Déterminant si la plaque comporte des trous.
// - geometry   : géométrie canonique (buildCanonicalGeometry, roundMm, canonicalJson). Toujours déterminant.
// - render     : preview serveur (renderPreviewSvg, comparerPreviewProduction). Non déterminant pour la géométrie actuelle.
// - production : plan et artefacts de production (planArtifacts, productionSvg, buildLaserArtifact, construireArtefacts).
//                Non déterminant pour la géométrie actuelle.
// Dans le modèle MVP, les 5 versions restent renseignées : elles font partie de la chaîne de reproductibilité portée par
// la géométrie canonique (engineVersions) et par le BAT.
import type { EngineVersions } from "./geometrie-canonique";

export const ENGINE_VERSIONS: Readonly<EngineVersions> = Object.freeze({
  design: "1",
  mounting: "1",
  geometry: "1",
  render: "1",
  production: "1",
});
