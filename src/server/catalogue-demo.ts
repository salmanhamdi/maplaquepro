// CATALOGUE DE DÉMONSTRATION — interface du configurateur uniquement.
// Aucune référence réelle n'est validée (GATE 1) : les références ci-dessous sont FICTIVES et étiquetées « démonstration ».
// Aucune règle n'est inventée : les règles de dimensions du catalogue sont SANS_OBJET (seules les bornes VR-25 du moteur
// s'appliquent), les paramètres de fixation restent ceux du catalogue initial (À VALIDER), aucun prix, aucun format standard.
import { type Catalog, definie, INITIAL_CATALOG, type MaterialFamily, type MaterialVariant, sansObjet, type ThicknessId, WORKFLOW_BY_FAMILY } from "../domain";

export const PRODUIT_DEMO = "plaque-demonstration";
export const POLICE_DEMO = "police-demonstration";
export const COMPOSITION_DEMO = "composition-demonstration";

const couleur = (name: string, hex: string) => definie({ name: `${name} (démonstration)`, hex });

type Entree = Pick<MaterialVariant, "apparence" | "capaciteGravure" | "politiqueImpression"> & { thicknessId: ThicknessId; surface: string };

const ENTREES: Record<MaterialFamily, Entree> = {
  trolase: {
    thicknessId: "th_1_6",
    surface: "#27323D",
    apparence: { couleurSurface: couleur("Anthracite", "#27323D"), finition: definie("mate (démonstration)"), couleurRevelee: couleur("Ivoire", "#ECE6D9") },
    capaciteGravure: { cote: definie("face") },
    politiqueImpression: { valeur: definie("aucune"), cote: sansObjet() },
  },
  trolase_metallic: {
    thicknessId: "th_1_6",
    surface: "#C9CFD4",
    apparence: { couleurSurface: couleur("Argent", "#C9CFD4"), finition: definie("brossée (démonstration)"), couleurRevelee: couleur("Graphite", "#1D252D") },
    capaciteGravure: { cote: definie("face") },
    politiqueImpression: { valeur: definie("aucune"), cote: sansObjet() },
  },
  plexiglass: {
    thicknessId: "th_3_0",
    surface: "#F4F7F8",
    apparence: { couleurSurface: couleur("Transparent", "#F4F7F8"), finition: definie("brillante (démonstration)"), couleurRevelee: sansObjet() },
    capaciteGravure: { cote: sansObjet() },
    politiqueImpression: { valeur: definie("noir_uniquement"), cote: definie("envers") },
  },
  troglass_metallic: {
    thicknessId: "th_3_0",
    surface: "#C9A227",
    apparence: { couleurSurface: couleur("Gold", "#C9A227"), finition: definie("miroir (démonstration)"), couleurRevelee: couleur("Gold", "#E6CC82") },
    capaciteGravure: { cote: definie("envers") },
    politiqueImpression: { valeur: definie("noir_uniquement"), cote: definie("envers") },
  },
};

const FAMILLES = Object.keys(ENTREES) as MaterialFamily[];

export const referenceDemo = (family: MaterialFamily) => ({ variantId: `demo-${family}`, thicknessId: ENTREES[family].thicknessId });

const references: MaterialVariant[] = FAMILLES.map((family) => {
  const e = ENTREES[family];
  const workflow = WORKFLOW_BY_FAMILY[family];
  return {
    id: `demo-${family}`,
    manufacturer: definie("Démonstration"),
    reference: definie(`DEMO-${family.toUpperCase()}`),
    family,
    label: `Référence de démonstration ${family}`,
    thicknessIds: [e.thicknessId],
    apparence: e.apparence,
    capaciteGravure: e.capaciteGravure,
    politiqueImpression: e.politiqueImpression,
    productionWorkflowId: workflow,
    dimensionRulesIds: [`dim-demo-${family}`],
    mountingRulesId: "mounting-default",
    artworkRulesId: `artwork-${workflow}`,
    outdoorStatus: sansObjet(),
    swatch: { surface: e.surface },
    statut: "active",
  };
});

export const CATALOGUE_DEMO: Catalog = {
  ...INITIAL_CATALOG,
  catalogVersion: "demonstration-0",
  references,
  dimensionRules: FAMILLES.map((family) => ({
    id: `dim-demo-${family}`,
    variantId: `demo-${family}`,
    thicknessId: ENTREES[family].thicknessId,
    minWidthMm: sansObjet(),
    maxWidthMm: sansObjet(),
    minHeightMm: sansObjet(),
    maxHeightMm: sansObjet(),
    statut: "draft",
  })),
  products: [
    {
      id: PRODUIT_DEMO,
      slug: PRODUIT_DEMO,
      name: "Plaque personnalisée (démonstration)",
      allowedVariantIds: references.map((r) => r.id),
      allowedFormats: [],
      allowedLayouts: [COMPOSITION_DEMO],
      allowedFonts: [POLICE_DEMO],
      mountingRulesId: "mounting-default",
      statut: "active",
    },
  ],
};
