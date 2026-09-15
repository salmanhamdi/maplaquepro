// Plaque affichée dans la scène : aperçu serveur (image du rendu issu de la géométrie canonique, avec ses cotes)
// si disponible, sinon illustration client. Ni l'un ni l'autre n'est un BAT ou un fichier de production.
import { PlaqueVisuel } from "@/components/plaque/PlaqueVisuel";
import { dimensionsApercu, type EtatConfigurateur, lireMm } from "./interpretation";

const fmt = (n: number) => String(n).replace(".", ",");

type Props = {
  etat: EtatConfigurateur;
  svgServeur: string | null;
  /** Dimensions utilisées par l'illustration (dernières valeurs lisibles). */
  illustration: { w: number; h: number };
  titre: string;
  miseAJour?: boolean;
};

export function ApercuPlaque({ etat, svgServeur, illustration, titre, miseAJour = false }: Props) {
  if (svgServeur) {
    const cotes = dimensionsApercu(svgServeur);
    return (
      <div className={`cfg-scene__plaque cfg-scene__plaque--serveur ${miseAJour ? "is-maj" : ""}`}>
        <div className="cfg-cotes" style={cotes ? ({ "--ratio": cotes.w / cotes.h } as React.CSSProperties) : undefined}>
          {/* Rendu calculé par le serveur : affiché comme image, jamais redessiné ici */}
          <img className="cfg-scene__serveur" src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgServeur)}`} alt={`Aperçu indicatif calculé par le serveur : ${titre}`} />
          {cotes && (
            <>
              <span className="cfg-cote cfg-cote--largeur mono" aria-hidden="true">
                <span>{fmt(cotes.w)} mm</span>
              </span>
              <span className="cfg-cote cfg-cote--hauteur mono" aria-hidden="true">
                <span>{fmt(cotes.h)} mm</span>
              </span>
            </>
          )}
        </div>
      </div>
    );
  }
  const texteSaisi = etat.lignes.some((l) => l.trim() !== "");
  const retrait = lireMm(etat.retrait);
  return (
    <div className="cfg-scene__plaque" key={etat.famille}>
      <PlaqueVisuel
        matiere={etat.famille}
        widthMm={illustration.w}
        heightMm={illustration.h}
        lignes={texteSaisi ? etat.lignes : ["Votre texte"]}
        exemple={!texteSaisi}
        alignement={etat.alignement}
        trous={etat.trous}
        retraitTrouMm={etat.trous > 0 && retrait ? retrait : undefined}
        cotes
        titre={`Illustration : ${titre}`}
      />
    </div>
  );
}
