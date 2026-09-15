"use client";
// Configurateur v1 : l'aperçu est un visuel client ; la fabricabilité vient du moteur, via l'action serveur.
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { verifierConfiguration } from "@/app/configurateur/actions";
import { PlaqueVisuel } from "@/components/plaque/PlaqueVisuel";
import { ArrowRight } from "@/components/site/ArrowRight";
import { BORNES_DIMENSIONS_VR25, type MaterialFamily } from "@/domain";
import { type Champ, ETAT_INITIAL, type EtatConfigurateur, erreursDeSaisie, lireMm, type Message, NOMS_FAMILLES, ORDRE_FAMILLES, PROCEDES, type Verdict } from "./interpretation";
import "./configurateur.css";

const DESCRIPTIONS: Record<MaterialFamily, string> = {
  trolase: "Bicouche : la gravure révèle la couche de dessous.",
  trolase_metallic: "Même gravure, surface à l'aspect métallique.",
  plexiglass: "Transparent, visuel imprimé au dos en miroir.",
  troglass_metallic: "Face Gold ou Silver, marquage sous la surface.",
};

const LIGNES_MAX = 4;

const fmt = (n: number) => String(n).replace(".", ",");

function Pastille({ statut, verification }: { statut: Verdict["statut"] | "saisie"; verification: boolean }) {
  const libelle = verification
    ? "Vérification…"
    : statut === "fabricable"
      ? "Fabricable"
      : statut === "en_validation"
        ? "En attente de validation atelier"
        : statut === "bloque"
          ? "À corriger"
          : "Saisie incomplète";
  return (
    <span className={`cfg-pastille cfg-pastille--${verification ? "verification" : statut}`}>
      <span className="cfg-pastille__point" aria-hidden="true" />
      {libelle}
    </span>
  );
}

function Messages({ messages, champ }: { messages: readonly Message[]; champ: Champ }) {
  const liste = messages.filter((m) => m.champ === champ);
  if (liste.length === 0) return null;
  return (
    <ul className="cfg-messages">
      {liste.map((m) => (
        <li key={m.id} className={`cfg-message cfg-message--${m.niveau}`} id={`msg-${m.id}`}>
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
  const statut: Verdict["statut"] | "saisie" = saisie.length > 0 ? "saisie" : (verdict?.statut ?? "saisie");
  const texteSaisi = etat.lignes.some((l) => l.trim() !== "");
  const bornes = BORNES_DIMENSIONS_VR25[etat.famille];
  const pret = statut === "fabricable" && !verification;
  const erreurChamp = (champ: Champ) => messages.some((m) => m.champ === champ && m.niveau === "bloquant");

  const apercu = (
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
      titre={`Aperçu : plaque ${NOMS_FAMILLES[etat.famille]} de ${fmt(dernieres.current.w)} × ${fmt(dernieres.current.h)} mm${texteSaisi ? `, texte « ${etat.lignes.join(" ")} »` : ""}${etat.trous ? `, ${etat.trous} trous` : ""}`}
      className="cfg-apercu__plaque"
    />
  );

  return (
    <div className="cfg">
      <div className="container cfg__grille">
        {/* ---------- Aperçu ---------- */}
        <section className="cfg-apercu" aria-label="Aperçu de votre plaque">
          <div className="cfg-apercu__scene">
            <div className="cfg-apercu__plan" aria-hidden="true" />
            <div className="cfg-apercu__cadre" key={etat.famille}>
              {apercu}
            </div>
          </div>
          <div className="cfg-apercu__infos">
            <div>
              <p className="cfg-apercu__matiere">{NOMS_FAMILLES[etat.famille]}</p>
              <p className="cfg-apercu__procede mono">{PROCEDES[etat.famille].toUpperCase()}</p>
            </div>
            <div aria-live="polite">
              <Pastille statut={statut} verification={verification} />
            </div>
          </div>
          <p className="cfg-apercu__note">Aperçu indicatif. Le BAT présentera le rendu exact avant fabrication.</p>
        </section>

        {/* ---------- Configuration ---------- */}
        <form className="cfg-panneau" onSubmit={(e) => e.preventDefault()} noValidate>
          <header className="cfg-panneau__entete">
            <p className="eyebrow">Configurateur</p>
            <h1 className="cfg-panneau__titre">Composez votre plaque</h1>
            <p className="cfg-demo">
              <span className="mono">DÉMONSTRATION</span>
              Matières d&apos;exemple, en attente de validation des références réelles. Aucune commande possible.
            </p>
          </header>

          {/* 01 Matière */}
          <fieldset className="cfg-etape">
            <legend className="cfg-etape__titre">
              <span className="mono">01</span> Matière
            </legend>
            <div className="cfg-matieres" role="radiogroup" aria-label="Matière">
              {ORDRE_FAMILLES.map((f) => (
                <label key={f} className={`cfg-matiere ${etat.famille === f ? "is-actif" : ""}`}>
                  <input type="radio" name="matiere" value={f} checked={etat.famille === f} onChange={() => maj({ famille: f })} />
                  <span className={`cfg-matiere__pastille cfg-matiere__pastille--${f}`} aria-hidden="true" />
                  <span className="cfg-matiere__texte">
                    <span className="cfg-matiere__nom">{NOMS_FAMILLES[f]}</span>
                    <span className="cfg-matiere__procede">{PROCEDES[f]}</span>
                    <span className="cfg-matiere__description">{DESCRIPTIONS[f]}</span>
                  </span>
                </label>
              ))}
            </div>
            <Messages messages={messages} champ="matiere" />
          </fieldset>

          {/* 02 Dimensions */}
          <fieldset className="cfg-etape">
            <legend className="cfg-etape__titre">
              <span className="mono">02</span> Dimensions
            </legend>
            <div className={`cfg-dimensions ${erreurChamp("dimensions") ? "has-erreur" : ""}`}>
              <label className="cfg-champ">
                <span className="cfg-champ__libelle">Largeur</span>
                <span className="cfg-champ__saisie">
                  <input inputMode="decimal" autoComplete="off" value={etat.largeur} onChange={(e) => maj({ largeur: e.target.value })} aria-invalid={erreurChamp("dimensions")} aria-describedby="aide-dimensions" />
                  <span className="cfg-champ__unite mono">mm</span>
                </span>
              </label>
              <button
                type="button"
                className="cfg-inverser"
                onClick={() => maj({ largeur: etat.hauteur, hauteur: etat.largeur })}
                aria-label="Inverser largeur et hauteur"
                title="Inverser largeur et hauteur"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M4 6h10m0 0-3-3m3 3-3 3M14 12H4m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
              <label className="cfg-champ">
                <span className="cfg-champ__libelle">Hauteur</span>
                <span className="cfg-champ__saisie">
                  <input inputMode="decimal" autoComplete="off" value={etat.hauteur} onChange={(e) => maj({ hauteur: e.target.value })} aria-invalid={erreurChamp("dimensions")} aria-describedby="aide-dimensions" />
                  <span className="cfg-champ__unite mono">mm</span>
                </span>
              </label>
            </div>
            <p className="cfg-aide" id="aide-dimensions">
              {NOMS_FAMILLES[etat.famille]} : de {fmt(bornes.minWidthMm)} × {fmt(bornes.minHeightMm)} à {fmt(bornes.maxWidthMm)} × {fmt(bornes.maxHeightMm)} mm
              {bornes.deuxOrientations ? ", dans un sens ou dans l'autre." : "."}
            </p>
            <Messages messages={messages} champ="dimensions" />
            {verdict && saisie.length === 0 && verdict.alternatives.length > 0 && (
              <div className="cfg-alternatives">
                <p>Suggestions :</p>
                {verdict.alternatives.map((a) =>
                  a.kind === "max_dimensions" ? (
                    <button key={`${a.widthMm}x${a.heightMm}`} type="button" className="cfg-puce" onClick={() => maj({ largeur: fmt(a.widthMm), hauteur: fmt(a.heightMm) })}>
                      Passer à {fmt(a.widthMm)} × {fmt(a.heightMm)} mm
                    </button>
                  ) : (
                    <button key={a.toFamily} type="button" className="cfg-puce" onClick={() => maj({ famille: a.toFamily })}>
                      Essayer {NOMS_FAMILLES[a.toFamily]}
                    </button>
                  ),
                )}
              </div>
            )}
          </fieldset>

          {/* 03 Texte */}
          <fieldset className="cfg-etape">
            <legend className="cfg-etape__titre">
              <span className="mono">03</span> Texte
            </legend>
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
              {etat.lignes.length < LIGNES_MAX && (
                <button type="button" className="cfg-lien" onClick={() => maj({ lignes: [...etat.lignes, ""] })}>
                  + Ajouter une ligne
                </button>
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
            {verdict?.texteModifie && <p className="cfg-aide">Espaces superflus détectés : ils seront retirés, le texte affiché sur le BAT fera foi.</p>}
            <Messages messages={messages} champ="texte" />
          </fieldset>

          {/* 04 Fixations */}
          <fieldset className="cfg-etape">
            <legend className="cfg-etape__titre">
              <span className="mono">04</span> Fixations
            </legend>
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
                  <input inputMode="decimal" autoComplete="off" value={etat.retrait} onChange={(e) => maj({ retrait: e.target.value })} aria-invalid={erreurChamp("fixations")} />
                  <span className="cfg-champ__unite mono">mm</span>
                </span>
              </label>
            )}
            <Messages messages={messages} champ="fixations" />
          </fieldset>

          {/* Résumé */}
          <section className="cfg-resume" aria-labelledby="resume-titre">
            <h2 id="resume-titre" className="cfg-etape__titre">
              <span className="mono">05</span> Récapitulatif
            </h2>
            <dl className="cfg-resume__liste">
              <div>
                <dt>Matière</dt>
                <dd>{NOMS_FAMILLES[etat.famille]}</dd>
              </div>
              <div>
                <dt>Procédé</dt>
                <dd>{PROCEDES[etat.famille]}</dd>
              </div>
              <div>
                <dt>Dimensions</dt>
                <dd className="mono">{largeur && hauteur ? `${fmt(largeur)} × ${fmt(hauteur)} mm` : "—"}</dd>
              </div>
              <div>
                <dt>Texte</dt>
                <dd>{texteSaisi ? etat.lignes.filter((l) => l.trim() !== "").join(" · ") : "Aucun"}</dd>
              </div>
              <div>
                <dt>Fixations</dt>
                <dd>{etat.trous === 0 ? "Sans trou" : `${etat.trous} trous à ${retrait ? fmt(retrait) : "—"} mm du bord`}</dd>
              </div>
            </dl>
            <Messages messages={messages} champ="general" />
            <div className="cfg-resume__action">
              <button type="button" className="btn btn--accent cfg-cta" disabled={!pret} onClick={() => setSuite(true)}>
                Continuer vers le BAT
                <ArrowRight />
              </button>
              <p className="cfg-aide" aria-live="polite">
                {suite
                  ? "Configuration conforme. La préparation du BAT est la prochaine étape du parcours ; elle n'est pas encore disponible."
                  : pret
                    ? "Votre plaque est fabricable. Vous vérifierez le BAT avant toute fabrication."
                    : statut === "en_validation"
                      ? "Certains éléments attendent la validation de l'atelier."
                      : "Complétez ou corrigez la configuration pour continuer."}
              </p>
            </div>
          </section>
        </form>
      </div>

      {/* ---------- Barre mobile ---------- */}
      <div className="cfg-barre" aria-hidden="false">
        <div className="cfg-barre__texte">
          <span className="cfg-barre__resume">
            {NOMS_FAMILLES[etat.famille]} · <span className="mono">{largeur && hauteur ? `${fmt(largeur)}×${fmt(hauteur)}` : "—"}</span>
          </span>
          <Pastille statut={statut} verification={verification} />
        </div>
        <button type="button" className="btn btn--accent" disabled={!pret} onClick={() => setSuite(true)}>
          Continuer
          <ArrowRight />
        </button>
      </div>
    </div>
  );
}
