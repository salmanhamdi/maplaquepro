import Link from "next/link";
import { type Matiere, PlaqueVisuel } from "@/components/plaque/PlaqueVisuel";
import { ArrowRight } from "@/components/site/ArrowRight";
import "./accueil.css";

// Contenu issu des décisions validées : 4 familles, procédés du Master Plan v1.6 (§7.2), bornes VR-25, message §23.
// Aucun prix, aucune référence commerciale ni photographie n'est présentée tant qu'elles ne sont pas validées.
const MATIERES: ReadonlyArray<{ id: Matiere; nom: string; procede: string; description: string; dimensions: string; exemple: readonly string[] }> = [
  {
    id: "trolase",
    nom: "TroLase",
    procede: "Gravure laser",
    description: "Matière bicouche : le laser retire la surface et révèle la couche de dessous. Un contraste net, durable, sans encre.",
    dimensions: "10 × 10 → 594 × 294 mm",
    exemple: ["Cabinet Durand"],
  },
  {
    id: "trolase_metallic",
    nom: "TroLase Metallic",
    procede: "Gravure laser",
    description: "Le même principe de gravure, sur une surface à l'aspect métallique. Même procédé que le TroLase, rendu plus précieux.",
    dimensions: "10 × 10 → 594 × 294 mm",
    exemple: ["Salle 204"],
  },
  {
    id: "plexiglass",
    nom: "Plexiglass / TroGlass Clear",
    procede: "Impression UV à l'envers → découpe",
    description: "Support transparent imprimé au dos, en miroir : votre visuel se lit à travers la matière, protégé par son épaisseur.",
    dimensions: "10 × 10 → 347 × 490 mm",
    exemple: ["Atelier Nord"],
  },
  {
    id: "troglass_metallic",
    nom: "TroGlass Metallic",
    procede: "Gravure envers + UV noir",
    description: "Face Gold ou Silver. Gravure au dos, puis noir imprimé à l'envers : le marquage apparaît sous la surface.",
    dimensions: "10 × 10 → 347 × 490 mm",
    exemple: ["Maison Arlet"],
  },
];

const ETAPES = [
  {
    numero: "01",
    titre: "Composez",
    texte: "Matière, dimensions au millimètre, texte et fixations. Seules les options réellement fabricables vous sont proposées.",
  },
  {
    numero: "02",
    titre: "Visualisez",
    texte: "Votre plaque apparaît à l'échelle pendant que vous la composez. Si une combinaison n'est pas réalisable, nous vous expliquons pourquoi.",
  },
  {
    numero: "03",
    titre: "Validez le BAT",
    texte: "Dimensions, texte, position, matière : le bon à tirer récapitule exactement ce qui sera fabriqué. Rien ne part en production sans votre accord.",
  },
] as const;

export default function HomePage() {
  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="hero" aria-labelledby="hero-titre">
        <div className="container hero__grid">
          <div className="hero__texte">
            <p className="eyebrow">Plaques personnalisées · Sur mesure</p>
            <h1 id="hero-titre" className="hero__titre">
              Votre plaque,
              <br />
              exacte au <span className="hero__accent">millimètre</span>.
            </h1>
            <p className="hero__intro">
              Choisissez la matière, composez votre texte et vérifiez le BAT. Nous fabriquons exactement ce que vous avez validé.
            </p>
            <div className="hero__actions">
              <Link href="/configurateur" className="btn btn--accent">
                Créer ma plaque
                <ArrowRight />
              </Link>
              <Link href="#matieres" className="btn btn--ghost">
                Découvrir les matières
              </Link>
            </div>
            <ul className="hero__preuves" aria-label="Nos engagements">
              <li>BAT à valider avant fabrication</li>
              <li>Gravure laser &amp; impression UV</li>
              <li>Fabrication dans notre atelier</li>
            </ul>
          </div>

          <figure className="hero__visuel">
            <div className="hero__plan" aria-hidden="true" />
            <PlaqueVisuel
              matiere="trolase"
              widthMm={240}
              heightMm={80}
              lignes={["Studio Lumen", "ARCHITECTURE INTÉRIEURE"]}
              trous={4}
              cotes
              titre="Exemple de plaque TroLase gravée, 240 × 80 mm, quatre trous de fixation"
              className="hero__plaque"
            />
            <figcaption className="hero__legende">
              <span className="mono">TROLASE · GRAVURE LASER</span>
              <span className="mono">240 × 80 MM · 4 TROUS</span>
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ---------- Matières ---------- */}
      <section id="matieres" className="section" aria-labelledby="matieres-titre">
        <div className="container">
          <header className="section__entete">
            <p className="eyebrow">Matières</p>
            <h2 id="matieres-titre" className="section__titre">
              Quatre matières.
              <br />
              Chacune a son procédé.
            </h2>
            <p className="section__intro">Le rendu dépend de la matière et de la façon dont elle est travaillée. Choisissez l&apos;aspect ; nous appliquons le bon procédé.</p>
          </header>

          <ol className="matieres">
            {MATIERES.map((m, i) => (
              <li key={m.id} className="matiere">
                <div className={`matiere__visuel matiere__visuel--${m.id}`}>
                  <PlaqueVisuel matiere={m.id} widthMm={120} heightMm={48} lignes={m.exemple} trous={2} titre={`Illustration ${m.nom}`} />
                </div>
                <div className="matiere__corps">
                  <p className="matiere__index mono">{String(i + 1).padStart(2, "0")}</p>
                  <h3 className="matiere__nom">{m.nom}</h3>
                  <p className="matiere__procede">{m.procede}</p>
                  <p className="matiere__description">{m.description}</p>
                  <p className="matiere__dimensions">
                    <span className="mono">DIMENSIONS</span>
                    <span className="mono">{m.dimensions}</span>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Fonctionnement ---------- */}
      <section id="fonctionnement" className="section section--surface" aria-labelledby="fonctionnement-titre">
        <div className="container">
          <header className="section__entete">
            <p className="eyebrow">Fonctionnement</p>
            <h2 id="fonctionnement-titre" className="section__titre">
              Vous voyez ce que
              <br />
              vous allez recevoir.
            </h2>
          </header>
          <ol className="etapes">
            {ETAPES.map((e) => (
              <li key={e.numero} className="etape">
                <span className="etape__numero mono">{e.numero}</span>
                <h3 className="etape__titre">{e.titre}</h3>
                <p className="etape__texte">{e.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------- Précision ---------- */}
      <section id="precision" className="precision" aria-labelledby="precision-titre">
        <div className="container precision__grid">
          <div>
            <p className="eyebrow eyebrow--sombre">Précision</p>
            <h2 id="precision-titre" className="precision__titre">
              Chaque matière
              <br />
              a ses limites.
            </h2>
            <p className="precision__message">
              Voici les dimensions que notre atelier sait fabriquer pour chaque type de plaque. Les matières et formats ouverts à la commande sont indiqués dans le configurateur.
            </p>
          </div>
          <dl className="mesures">
            <div className="mesure">
              <dt className="mono">Plus petite plaque</dt>
              <dd>
                10 <span>×</span> 10 <small>mm</small>
              </dd>
            </div>
            <div className="mesure">
              <dt className="mono">Plaques gravées, jusqu&apos;à</dt>
              <dd>
                594 <span>×</span> 294 <small>mm</small>
              </dd>
            </div>
            <div className="mesure">
              <dt className="mono">Plaques imprimées, jusqu&apos;à</dt>
              <dd>
                347 <span>×</span> 490 <small>mm</small>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ---------- Appel final ---------- */}
      <section className="section appel" aria-labelledby="appel-titre">
        <div className="container appel__inner">
          <h2 id="appel-titre" className="appel__titre">Composez votre plaque.</h2>
          <p className="appel__texte">Quelques minutes suffisent. Vous validez le BAT avant toute fabrication.</p>
          <Link href="/configurateur" className="btn btn--accent">
            Créer ma plaque
            <ArrowRight />
          </Link>
        </div>
      </section>
    </main>
  );
}
