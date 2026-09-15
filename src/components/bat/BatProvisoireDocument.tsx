// Document « BAT provisoire » de DÉMONSTRATION (T4-b) : présentation uniquement, à partir de données d'exemple.
// Aucun appel au moteur BAT, aucune validation, aucun prix, aucune expiration, aucun hash, aucune version de moteur.
import { PlaqueVisuel } from "../plaque/PlaqueVisuel";
import { BoutonImprimer } from "./BoutonImprimer";
import type { BatProvisoireDemo } from "./demo-bat";
import "./bat.css";

const fmt = (n: number) => String(n).replace(".", ",");

export function BatProvisoireDocument({ demo }: { demo: BatProvisoireDemo }) {
  const texte = demo.lignes.filter((l) => l.trim() !== "");
  return (
    <article className="batp" aria-labelledby="batp-titre">
      <p className="batp-bandeau" role="note">
        <span className="batp-bandeau__etiquette mono">Démonstration</span>
        Document d&apos;exemple, sans valeur contractuelle. Aucune commande, aucune validation, aucune fabrication.
      </p>

      <div className="batp-feuille">
        <span className="batp-filigrane" aria-hidden="true">
          DÉMO
        </span>

        <header className="batp-entete">
          <div>
            <p className="eyebrow">Document de vérification</p>
            <h1 id="batp-titre" className="batp-titre">
              {demo.libelle}
            </h1>
          </div>
          <dl className="batp-identite">
            <div>
              <dt>Numéro</dt>
              <dd>
                <span className="mono">{demo.numeroAffiche}</span>
                <span className="batp-fictif">numéro fictif</span>
              </dd>
            </div>
            <div>
              <dt>Statut</dt>
              <dd>
                <span className="batp-statut">
                  <span className="batp-statut__point" aria-hidden="true" />
                  {demo.statutProduction}
                </span>
              </dd>
            </div>
          </dl>
        </header>

        <div className="batp-corps">
          <figure className="batp-visuel">
            <div className="batp-visuel__plan" aria-hidden="true" />
            <PlaqueVisuel
              matiere={demo.matiere}
              widthMm={demo.widthMm}
              heightMm={demo.heightMm}
              lignes={demo.lignes}
              alignement={demo.alignement}
              trous={demo.trous}
              retraitTrouMm={demo.retraitTrouMm}
              cotes
              titre={`Illustration d'exemple : plaque ${demo.nomMatiere} de ${fmt(demo.widthMm)} × ${fmt(demo.heightMm)} mm`}
            />
            <figcaption className="batp-legende mono">Illustration non contractuelle · vue face</figcaption>
          </figure>

          <section className="batp-spec" aria-labelledby="batp-spec-titre">
            <h2 id="batp-spec-titre" className="batp-section">
              Configuration
            </h2>
            <dl className="batp-table">
              <div>
                <dt>Matière</dt>
                <dd>{demo.nomMatiere}</dd>
              </div>
              <div>
                <dt>Procédé</dt>
                <dd>{demo.procede}</dd>
              </div>
              <div>
                <dt>Dimensions</dt>
                <dd className="mono">
                  {fmt(demo.widthMm)} × {fmt(demo.heightMm)} mm
                </dd>
              </div>
              <div>
                <dt>Texte</dt>
                <dd>
                  {texte.map((l) => (
                    <span key={l} className="batp-ligne">
                      {l}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Alignement</dt>
                <dd>{demo.alignement === "center" ? "Centré" : "À gauche"}</dd>
              </div>
              <div>
                <dt>Fixations</dt>
                <dd>{demo.trous === 0 ? "Sans trou" : `${demo.trous} trous, ${fmt(demo.retraitTrouMm)} mm du bord`}</dd>
              </div>
            </dl>
          </section>
        </div>

        <div className="batp-annexes">
          <section aria-labelledby="batp-verif-titre">
            <h2 id="batp-verif-titre" className="batp-section">
              À vérifier
            </h2>
            <ul className="batp-liste">
              {demo.pointsAVerifier.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="batp-com-titre">
            <h2 id="batp-com-titre" className="batp-section">
              Informations commerciales
            </h2>
            <dl className="batp-table batp-table--compact">
              <div>
                <dt>Prix</dt>
                <dd className="batp-avenir">À venir</dd>
              </div>
              <div>
                <dt>Validité</dt>
                <dd className="batp-avenir">À venir</dd>
              </div>
            </dl>
          </section>
          <section aria-labelledby="batp-fab-titre">
            <h2 id="batp-fab-titre" className="batp-section">
              Fabrication
            </h2>
            <p className="batp-texte">
              Fichiers de fabrication : <strong>{demo.statutProduction.toLowerCase()}</strong>. Aucune fabrication n&apos;est lancée depuis ce document.
            </p>
          </section>
        </div>

        <footer className="batp-pied">
          <p className="batp-texte">
            Un BAT réel récapitulera votre propre configuration. Il vous sera présenté avant toute fabrication, lorsque cette étape sera ouverte.
          </p>
          <div className="batp-actions">
            <a href="/configurateur" className="btn btn--ink">
              Composer ma plaque
            </a>
            <BoutonImprimer />
          </div>
        </footer>
      </div>
    </article>
  );
}
