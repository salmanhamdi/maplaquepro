// Vérification serveur d'une configuration du configurateur (§16bis : le serveur fait autorité). Catalogue de DÉMONSTRATION.
// Fabricabilité par le moteur ; aperçu serveur uniquement si la configuration est fabricable (T4-a).
import { type EtatConfigurateur, interpreter, statutDepuis, type Verdict, versConfiguration } from "../components/configurateur/interpretation";
import { evaluateFabricability, proposeAlternatives } from "../domain";
import { construireApercuServeur } from "./apercu";
import { CATALOGUE_DEMO, COMPOSITION_DEMO, POLICE_DEMO, PRODUIT_DEMO, referenceDemo } from "./catalogue-demo";

export function verifier(etat: EtatConfigurateur): Verdict {
  const ref = referenceDemo(etat.famille);
  const configuration = versConfiguration(etat, { productId: PRODUIT_DEMO, variantId: ref.variantId, thicknessId: ref.thicknessId, fontId: POLICE_DEMO, layoutId: COMPOSITION_DEMO });
  const resultat = evaluateFabricability(configuration, CATALOGUE_DEMO);
  if (resultat.ok) {
    let apercu: Verdict["apercu"];
    try {
      apercu = construireApercuServeur(resultat, CATALOGUE_DEMO);
    } catch {
      apercu = { etat: "indisponible" };
    }
    return { statut: "fabricable", messages: [], alternatives: [], texteModifie: resultat.texte?.modifie ?? false, apercu };
  }
  const messages = interpreter(resultat.violations, etat.famille);
  return {
    statut: statutDepuis(false, messages),
    messages,
    alternatives: proposeAlternatives(configuration, CATALOGUE_DEMO),
    texteModifie: false,
    apercu: { etat: "non_applicable" },
  };
}
