"use client";
// Configurateur : l'aperçu est un visuel client ; la fabricabilité vient du moteur, via l'action serveur.
// Aucun état métier n'est créé ici : les états d'étape reflètent la saisie et les messages du moteur.
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { verifierConfiguration } from "@/app/configurateur/actions";
import { PlaqueVisuel } from "@/components/plaque/PlaqueVisuel";
import { ArrowRight } from "@/components/site/ArrowRight";
import { BORNES_DIMENSIONS_VR25, type MaterialFamily } from "@/domain";
import {
  type Champ,
  ETAT_INITIAL,
  type EtatConfigurateur,
  type EtatEtape,
  erreursDeSaisie,
  etatEtape,
  LIBELLES_ETAPE,
  lireMm,
  type Message,
  NOMS_FAMILLES,
  ORDRE_FAMILLES,
  PROCEDES,
  type StatutAffiche,
  TEXTES_STATUT,
  type Verdict,
} from "./interpretation";
import "./configurateur.css";

const DESCRIPTIONS: Record<MaterialFamily, string> = {
  trolase: "Bicouche : la gravure révèle la couche de dessous.",
  trolase_metallic: "Même gravure, surface à l'aspect métallique.",
  plexiglass: "Transparent, visuel imprimé au dos en miroir.",
  troglass_metallic: "Face Gold ou Silver, marquage sous la surface.",
};

const LIGNES_MAX = 4;
const fmt = (n: number) => String(n).replace(".", ",");

function IconeStatut({ statut }: { statut: StatutAffiche }) {
  if (statut === "fabricable") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M5 10.5l3.2 3L15 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (statut === "bloque") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 5.5v5.5M10 13.6v.9" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="1.3" fill="currentColor" />
      <circle cx="5.5" cy="10" r="1.3" fill="currentColor" opacity="0.55" />
      <circle cx="14.5" cy="10" r="1.3" fill="currentColor" opacity="0.55" />
    </svg>
  );
}

function Etape({ numero, titre, etat, children }: { numero: string; titre: string; etat: EtatEtape; children: React.ReactNode }) {
  return (
    <fieldset className={`cfg-etape cfg-etape--${etat}`}>
      <legend className="cfg-etape__entete">
        <span className="cfg-etape__numero mono" aria-hidden="true">
          {numero}
        </span>
        <span className="cfg-etape__titre">{titre}</span>
        <span className="cfg-etape__etat">{LIBELLES_ETAPE[etat]}</span>
      </legend>
      <div className="cfg-etape__corps">{children}</div>
    </fieldset>
  );
}

function MessagesChamp({ messages, champ }: { messages: readonly Message[]; champ: Champ }) {
  const liste = messages.filter((m) => m.champ === champ);
  if (liste.length === 0) return null;
  return (
    <ul className="cfg-messages">
      {liste.map((m) => (
        <li key={m.id} className={`cfg-message cfg-message--${m.niveau}`}>
          <strong>{m.titre}</strong>
          <span>{m.detail}</span>
        </li>
      ))}
    </ul>
  );
}

export function Configurateur() {
  const [etat, setEtat] = useState<EtatConfigurateur>(ETAT_INITIAL);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [verification, demarrer] = useTransition();
  const [suite, setSuite] = useState(false);
  const requete = useRef(0);

  const saisie = useMemo(() => erreursDeSaisie(etat), [etat]);
  const largeur = lireMm(etat.largeur);
  const hauteur = lireMm(etat.hauteur);
  const retrait = lireMm(etat.retrait);

  // Dernières dimensions lisibles : l'aperçu ne disparaît pas pendant la frappe.
  const dernieres = useRef({ w: 200, h: 100 });
  if (largeur && hauteur) dernieres.current = { w: largeur, h: hauteur };

  useEffect(() => {
    setSuite(false);
    if (saisie.length > 0) {
      setVerdict(null);
      return;
    }
    const numero = ++requete.current;
    const minuterie = setTimeout(() => {
      demarrer(async () => {
        const v = await verifierConfiguration(etat);
        if (numero === requete.current) setVerdict(v);
      });
    }, 260);
    return () => clearTimeout(minuterie);
  }, [etat, saisie.length]);

  const maj = (partiel: Partial<EtatConfigurateur>) => setEtat((e) => ({ ...e, ...partiel }));
  const messages = saisie.length > 0 ? saisie : (verdict?.messages ?? []);
  const statut: StatutAffiche = saisie.length > 0 ? "saisie" : verification || !verdict ? "verification" : verdict.statut;
  const texteSaisi = etat.lignes.some((l) => l.trim() !== "");
  const bornes = BORNES_DIMENSIONS_VR25[etat.famille];
  const pret = statut === "fabricable";
  const alternatives = saisie.length === 0 && verdict ? verdict.alternatives : [];

  const etats = {
    matiere: etatEtape("matiere", messages, true),
    dimensions: etatEtape("dimensions", messages, largeur !== null && hauteur !== null),
    texte: etatEtape("texte", messages, texteSaisi, true),
    fixations: etatEtape("fixations", messages, true),
  };
  const erreurDimensions = etats.dimensions === "a_corriger";

  const libelleDimensions = largeur && hauteur ? `${fmt(largeur)} × ${fmt(hauteur)} mm` : "—";
  const titreApercu = `Aperçu : plaque ${NOMS_FAMILLES[etat.famille]} de ${fmt(dernieres.current.w)} × ${fmt(dernieres.current.h)} mm${texteSaisi ? `, texte « ${etat.lignes.join(" ")} »` : ""}${etat.trous ? `, ${etat.trous} trous` : ""}`;

  const continuer = () => setSuite(true);

  return (
    <div className="cfg">
      <div className="container cfg__grille">
        {/* ---------- Aperçu ---------- */}
        <section className="cfg-apercu" aria-label="Aperçu de votre plaque">
          <div className="cfg-scene">
            <div className="cfg-scene__plan" aria-hidden="true" />
            <p className="cfg-scene__repere mono" aria-hidden="true">
              APERÇU INDICATIF
            </p>
            <div className={`cfg-scene__statut cfg-scene__statut--${statut}`} aria-hidden="true">
              <span className="cfg-scene__point" />
              {TEXTES_STATUT[statut].titre}
            </div>
            <div className="cfg-scene__plaque" key={etat.famille}>
              <PlaqueVisuel
                matiere={etat.famille}
                widthMm={dernieres.current.w}
                heightMm={dernieres.current.h}
                lignes={texteSaisi ? etat.lignes : ["Votre texte"]}
                exemple={!texteSaisi}
                alignement={etat.alignement}
                trous={etat.trous}
                retraitTrouMm={etat.trous > 0 && retrait ? retrait : undefined}
                cotes
                titre={titreApercu}
              />
            </div>
          </div>
          <dl className="cfg-fiche">
            <div>
              <dt>Matière</dt>
              <dd>{NOMS_FAMILLES[etat.famille]}</dd>
            </div>
            <div>
              <dt>Procédé</dt>
              <dd>{PROCEDES[etat.famille]}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd className="mono">{libelleDimensions}</dd>
            </div>
          </dl>
          <p className="cfg-apercu__note">Rendu d&apos;illustration. Le BAT présentera le rendu exact avant fabrication.</p>
        </section>

        {/* ---------- Configuration ---------- */}
        <form className="cfg-panneau" onSubmit={(e) => e.preventDefault()} noValidate>
          <header className="cfg-panneau__entete">
            <p className="eyebrow">Configurateur</p>
            <h1 className="cfg-panneau__titre">Composez votre plaque</h1>
            <p className="cfg-demo">
              <span className="cfg-demo__etiquette mono">Démonstration</span>
              <span>Aucune commande possible. Matières d&apos;exemple, en attente de validation des références réelles.</span>
            </p>
            <ol className="cfg-progression" aria-label="Progression">
              {(
                [
                  ["Matière", etats.matiere],
                  ["Dimensions", etats.dimensions],
                  ["Texte", etats.texte],
                  ["Fixations", etats.fixations],
                ] as const
              ).map(([nom, e]) => (
                <li key={nom} className={`cfg-progression__pas cfg-progression__pas--${e}`}>
                  <span className="cfg-progression__barre" aria-hidden="true" />
                  <span className="cfg-progression__nom">{nom}</span>
                  <span className="visually-hidden">{LIBELLES_ETAPE[e]}</span>
                </li>
              ))}
            </ol>
          </header>

          <Etape numero="01" titre="Matière" etat={etats.matiere}>
            <div className="cfg-matieres" role="radiogroup" aria-label="Matière">
              {ORDRE_FAMILLES.map((f) => (
                <label key={f} className={`cfg-matiere ${etat.famille === f ? "is-actif" : ""}`}>
                  <input type="radio" name="matiere" value={f} checked={etat.famille === f} onChange={() => maj({ famille: f })} />
                  <span className={`cfg-matiere__pastille cfg-matiere__pastille--${f}`} aria-hidden="true" />
                  <span className="cfg-matiere__texte">
                    <span className="cfg-matiere__nom">{NOMS_FAMILLES[f]}</span>
                    <span className="cfg-matiere__description">{DESCRIPTIONS[f]}</span>
                  </span>
                  <span className="cfg-matiere__procede mono">{PROCEDES[f]}</span>
                </label>
              ))}
            </div>
            <MessagesChamp messages={messages} champ="matiere" />
          </Etape>

          <Etape numero="02" titre="Dimensions" etat={etats.dimensions}>
            <div className="cfg-dimensions">
              <label className="cfg-champ">
                <span className="cfg-champ__libelle">Largeur</span>
                <span className="cfg-champ__saisie">
                  <input inputMode="decimal" autoComplete="off" value={etat.largeur} onChange={(e) => maj({ largeur: e.target.value })} aria-invalid={erreurDimensions} aria-describedby="aide-dimensions" />
                  <span className="cfg-champ__unite mono">mm</span>
                </span>
              </label>
              <button type="button" className="cfg-inverser" onClick={() => maj({ largeur: etat.hauteur, hauteur: etat.largeur })} aria-label="Inverser largeur et hauteur" title="Inverser largeur et hauteur">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M4 6h10m0 0-3-3m3 3-3 3M14 12H4m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <label className="cfg-champ">
                <span className="cfg-champ__libelle">Hauteur</span>
                <span className="cfg-champ__saisie">
                  <input inputMode="decimal" autoComplete="off" value={etat.hauteur} onChange={(e) => maj({ hauteur: e.target.value })} aria-invalid={erreurDimensions} aria-describedby="aide-dimensions" />
                  <span className="cfg-champ__unite mono">mm</span>
                </span>
              </label>
            </div>
            <p className="cfg-bornes" id="aide-dimensions">
              <span className="mono">
                {fmt(bornes.minWidthMm)} × {fmt(bornes.minHeightMm)} → {fmt(bornes.maxWidthMm)} × {fmt(bornes.maxHeightMm)} mm
              </span>
              <span>{bornes.deuxOrientations ? `${NOMS_FAMILLES[etat.famille]}, dans un sens ou dans l'autre` : NOMS_FAMILLES[etat.famille]}</span>
            </p>
            <MessagesChamp messages={messages} champ="dimensions" />
          </Etape>

          <Etape numero="03" titre="Texte" etat={etats.texte}>
            <div className="cfg-lignes">
              {etat.lignes.map((ligne, i) => (
                <div key={i} className="cfg-ligne">
                  <label className="cfg-champ cfg-champ--plein">
                    <span className="cfg-champ__libelle">{i === 0 ? "Ligne principale" : `Ligne ${i + 1}`}</span>
                    <span className="cfg-champ__saisie">
                      <input
                        value={ligne}
                        maxLength={80}
                        placeholder={i === 0 ? "Ex. Cabinet Durand" : "Ex. Avocats associés"}
                        onChange={(e) => maj({ lignes: etat.lignes.map((l, j) => (j === i ? e.target.value : l)) })}
                      />
                    </span>
                  </label>
                  {etat.lignes.length > 1 && (
                    <button type="button" className="cfg-retirer" onClick={() => maj({ lignes: etat.lignes.filter((_, j) => j !== i) })} aria-label={`Retirer la ligne ${i + 1}`}>
                      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="cfg-texte-actions">
              {etat.lignes.length < LIGNES_MAX ? (
                <button type="button" className="cfg-lien" onClick={() => maj({ lignes: [...etat.lignes, ""] })}>
                  + Ajouter une ligne
                </button>
              ) : (
                <span />
              )}
              <div className="cfg-segments" role="radiogroup" aria-label="Alignement du texte">
                {(["center", "left"] as const).map((a) => (
                  <label key={a} className={`cfg-segment ${etat.alignement === a ? "is-actif" : ""}`}>
                    <input type="radio" name="alignement" checked={etat.alignement === a} onChange={() => maj({ alignement: a })} />
                    {a === "center" ? "Centré" : "À gauche"}
                  </label>
                ))}
              </div>
            </div>
            {verdict?.texteModifie && <p className="cfg-note">Espaces superflus détectés : ils seront retirés. Le texte du BAT fera foi.</p>}
            <MessagesChamp messages={messages} champ="texte" />
          </Etape>

          <Etape numero="04" titre="Fixations" etat={etats.fixations}>
            <div className="cfg-segments cfg-segments--large" role="radiogroup" aria-label="Nombre de trous">
              {([0, 2, 4] as const).map((n) => (
                <label key={n} className={`cfg-segment ${etat.trous === n ? "is-actif" : ""}`}>
                  <input type="radio" name="trous" checked={etat.trous === n} onChange={() => maj({ trous: n })} />
                  {n === 0 ? "Sans trou" : `${n} trous`}
                </label>
              ))}
            </div>
            {etat.trous > 0 && (
              <label className="cfg-champ cfg-champ--court">
                <span className="cfg-champ__libelle">Distance au bord</span>
                <span className="cfg-champ__saisie">
                  <input inputMode="decimal" autoComplete="off" value={etat.retrait} onChange={(e) => maj({ retrait: e.target.value })} aria-invalid={etats.fixations === "a_corriger"} />
                  <span className="cfg-champ__unite mono">mm</span>
                </span>
              </label>
            )}
            <MessagesChamp messages={messages} champ="fixations" />
          </Etape>

          {/* ---------- Résultat ---------- */}
          <section className="cfg-resultat" aria-labelledby="resultat-titre">
            <h2 id="resultat-titre" className="cfg-resultat__surtitre mono">
              Récapitulatif
            </h2>
            <dl className="cfg-recap">
              <div>
                <dt>Matière</dt>
                <dd>{NOMS_FAMILLES[etat.famille]}</dd>
              </div>
              <div>
                <dt>Dimensions</dt>
                <dd className="mono">{libelleDimensions}</dd>
              </div>
              <div>
                <dt>Texte</dt>
                <dd>{texteSaisi ? etat.lignes.filter((l) => l.trim() !== "").join(" · ") : "Aucun"}</dd>
              </div>
              <div>
                <dt>Fixations</dt>
                <dd>{etat.trous === 0 ? "Sans trou" : `${etat.trous} trous, ${retrait ? fmt(retrait) : "—"} mm du bord`}</dd>
              </div>
            </dl>

            <div className={`cfg-verdict cfg-verdict--${statut}`} role="status" aria-live="polite">
              <span className="cfg-verdict__icone">
                <IconeStatut statut={statut} />
              </span>
              <div className="cfg-verdict__texte">
                <p className="cfg-verdict__titre">{TEXTES_STATUT[statut].titre}</p>
                <p className="cfg-verdict__detail">{TEXTES_STATUT[statut].detail}</p>
              </div>
            </div>

            <MessagesChamp messages={messages} champ="general" />

            {alternatives.length > 0 && (
              <div className="cfg-alternatives">
                <p className="cfg-alternatives__titre">Suggestions du moteur de fabrication</p>
                <div className="cfg-alternatives__liste">
                  {alternatives.map((a) =>
                    a.kind === "max_dimensions" ? (
                      <button key={`${a.widthMm}x${a.heightMm}`} type="button" className="cfg-puce" onClick={() => maj({ largeur: fmt(a.widthMm), hauteur: fmt(a.heightMm) })}>
                        Appliquer {fmt(a.widthMm)} × {fmt(a.heightMm)} mm
                      </button>
                    ) : (
                      <button key={a.toFamily} type="button" className="cfg-puce" onClick={() => maj({ famille: a.toFamily })}>
                        Essayer {NOMS_FAMILLES[a.toFamily]}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="cfg-action">
              <button type="button" className="btn btn--accent cfg-cta" disabled={!pret} onClick={continuer}>
                Continuer vers le BAT
                <ArrowRight />
              </button>
              <p className="cfg-note" aria-live="polite">
                {suite ? "Configuration conforme. La préparation du BAT est la prochaine étape du parcours ; elle n'est pas encore disponible." : pret ? "Étape suivante : vérification du BAT." : "Disponible dès que la configuration est fabricable."}
              </p>
              <a href="/bat-provisoire" className="cfg-lien cfg-exemple">
                Voir un exemple de BAT provisoire
              </a>
            </div>
          </section>
        </form>
      </div>

      {/* ---------- Barre mobile ---------- */}
      <div className="cfg-barre">
        <div className="cfg-barre__texte">
          <span className="cfg-barre__resume">
            {NOMS_FAMILLES[etat.famille]} · <span className="mono">{largeur && hauteur ? `${fmt(largeur)}×${fmt(hauteur)}` : "—"}</span>
          </span>
          <span className={`cfg-barre__statut cfg-barre__statut--${statut}`}>
            <span className="cfg-scene__point" aria-hidden="true" />
            {TEXTES_STATUT[statut].titre}
          </span>
        </div>
        <button type="button" className="btn btn--accent" disabled={!pret} onClick={continuer}>
          Continuer
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
