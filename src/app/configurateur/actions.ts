"use server";
// Vérification serveur de la configuration (§16bis : le serveur fait autorité). Catalogue de DÉMONSTRATION.
import { evaluateFabricability, proposeAlternatives } from "@/domain";
import { type EtatConfigurateur, interpreter, statutDepuis, type Verdict, versConfiguration } from "@/components/configurateur/interpretation";
import { CATALOGUE_DEMO, COMPOSITION_DEMO, POLICE_DEMO, PRODUIT_DEMO, referenceDemo } from "@/server/catalogue-demo";

export async function verifierConfiguration(etat: EtatConfigurateur): Promise<Verdict> {
  const ref = referenceDemo(etat.famille);
  const configuration = versConfiguration(etat, { productId: PRODUIT_DEMO, variantId: ref.variantId, thicknessId: ref.thicknessId, fontId: POLICE_DEMO, layoutId: COMPOSITION_DEMO });
  const resultat = evaluateFabricability(configuration, CATALOGUE_DEMO);
  if (resultat.ok) {
    return { statut: "fabricable", messages: [], alternatives: [], texteModifie: resultat.texte?.modifie ?? false };
  }
  const messages = interpreter(resultat.violations, etat.famille);
  return {
    statut: statutDepuis(false, messages),
    messages,
    alternatives: proposeAlternatives(configuration, CATALOGUE_DEMO),
    texteModifie: false,
  };
}
