// Aperçu serveur (T4-a) : configuration fabricable → spécification résolue → géométrie canonique → renderPreviewSvg.
// Aucune seconde logique de rendu : la preview dérive de la géométrie canonique du domaine (§12).
// Les versions des moteurs viennent exclusivement de ENGINE_VERSIONS, côté serveur ; le client ne les fournit jamais.
// Aucun BAT créé, aucune persistance, aucun prix, aucun hash. Ce n'est ni un BAT ni un fichier de production.
import { buildCanonicalGeometry, type Catalog, ENGINE_VERSIONS, type Fabricable, renderPreviewSvg, resolveSpec } from "../domain";

export type ResultatApercuServeur = { etat: "disponible"; svg: string } | { etat: "indisponible" };

export function construireApercuServeur(fabricable: Fabricable, catalog: Catalog): ResultatApercuServeur {
  const spec = resolveSpec(fabricable, catalog);
  if (!spec.ok) return { etat: "indisponible" };
  const geometrie = buildCanonicalGeometry({
    spec: spec.spec,
    artwork: fabricable.configuration.design.artwork,
    textePresent: fabricable.configuration.design.text !== null,
    ...(fabricable.texteTrace ? { texteTrace: fabricable.texteTrace } : {}),
    engineVersions: ENGINE_VERSIONS,
  });
  if (!geometrie.ok) return { etat: "indisponible" };
  const preview = renderPreviewSvg({ geometry: geometrie.geometry, spec: spec.spec });
  return preview.ok ? { etat: "disponible", svg: preview.svg } : { etat: "indisponible" };
}
