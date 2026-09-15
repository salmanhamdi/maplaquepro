"use client";
// Étape « Vérification » : relecture de la plaque avant la préparation du BAT.
// La configuration vient du brouillon local (jamais source de vérité) ; le verdict vient du serveur, par la même
// action que le configurateur. Aucun BAT, aucun prix, aucune commande ; les confirmations n'ouvrent rien.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { verifierConfiguration } from "@/app/configurateur/actions";
import { ApercuPlaque } from "./ApercuPlaque";
import { chargerBrouillon, type LectureBrouillon, stockageNavigateur } from "./brouillon";
import { erreursDeSaisie, type EtatConfigurateur, lireMm, NOMS_FAMILLES, TEXTES_STATUT, type Verdict } from "./interpretation";
import { caracteristiques, confirmationsDisponibles, contenu, groupesMessages, type Ligne, SUITE_VERIFICATION } from "./presentation-verification";
import "./configurateur.css";
import "./verification.css";

function FlecheRetour() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 8H3m0 0 4-4M3 8l4 4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function Fiche({ lignes }: { lignes: readonly Ligne[] }) {
  return (
    <dl className="vrf-fiche">
      {lignes.map((l) => (
        <div key={l.libelle}>
          <dt>{l.libelle}</dt>
          <dd className={l.mono ? "mono" : undefined}>{l.valeur}</dd>
        </div>
      ))}
    </dl>
  );
}

function Parcours() {
  return (
    <ol className="vrf-parcours" aria-label="Étapes du parcours">
      <li className="is-fait">
        <Link href="/configurateur">Configuration</Link>
      </li>
      <li className="is-courant" aria-current="step">
        Vérification
      </li>
      <li className="is-a-venir">BAT</li>
    </ol>
  );
}

function EtatVide({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="container vrf-vide">
      <Parcours />
      <h1 className="vrf-titre">{titre}</h1>
      <p className="vrf-intro">{texte}</p>
      <Link href="/configurateur" className="btn btn--accent">
        Composer ma plaque
      </Link>
    </div>
  );
}

function Contenu({ etat }: { etat: EtatConfigurateur }) {
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [echec, setEchec] = useState(false);
  const [confirmees, setConfirmees] = useState<Record<string, boolean>>({});

  const lancer = useCallback(() => {
    setEchec(false);
    setVerdict(null);
    verifierConfiguration(etat)
      .then(setVerdict)
      .catch(() => setEchec(true));
  }, [etat]);

  useEffect(() => {
    lancer();
  }, [lancer]);

  const statut = echec ? null : verdict ? verdict.statut : "verification";
  const svgServeur = verdict?.statut === "fabricable" && verdict.apercu.etat === "disponible" ? verdict.apercu.svg : null;
  const w = lireMm(etat.largeur) ?? 1;
  const h = lireMm(etat.hauteur) ?? 1;
  const { aCorriger, enAttente } = groupesMessages(verdict?.messages ?? []);
  const confirmations = confirmationsDisponibles(etat);
  const titre = `plaque ${NOMS_FAMILLES[etat.famille]} de ${String(w).replace(".", ",")} × ${String(h).replace(".", ",")} mm`;
  const raisonBat = !verdict
    ? "Disponible après la vérification."
    : verdict.statut === "bloque"
      ? "Corrigez la configuration pour poursuivre."
      : verdict.statut === "en_validation"
        ? "Disponible lorsque l'atelier aura terminé ses validations."
        : "La préparation du BAT n'est pas encore ouverte.";

  return (
    <div className="vrf">
      <div className="container vrf__grille">
        {/* ---------- Plaque ---------- */}
        <section className="vrf-apercu" aria-label="Votre plaque">
          <div className="cfg-scene">
            <div className="cfg-scene__plan" aria-hidden="true" />
            <p className={`cfg-scene__repere mono ${svgServeur ? "is-serveur" : ""}`}>{svgServeur ? "Aperçu indicatif · rendu serveur" : "Illustration"}</p>
            {statut && (
              <div className={`cfg-scene__statut cfg-scene__statut--${statut}`} aria-hidden="true">
                <span className="cfg-scene__point" />
                {TEXTES_STATUT[statut].titre}
              </div>
            )}
            <ApercuPlaque etat={etat} svgServeur={svgServeur} illustration={{ w, h }} titre={titre} />
          </div>
          <p className="vrf-note">
            {svgServeur
              ? "Aperçu indicatif calculé par notre moteur à partir de la géométrie de fabrication. Ce n'est pas un BAT : le texte n'y figure pas encore."
              : "Illustration de votre configuration. Ce n'est pas un BAT ; l'aperçu calculé par le serveur s'affiche lorsque la plaque est fabricable."}
          </p>
        </section>

        {/* ---------- Relecture ---------- */}
        <div className="vrf-panneau">
          <header className="vrf-entete">
            <Parcours />
            <h1 className="vrf-titre">Vérifiez votre plaque</h1>
            <p className="vrf-intro">Relisez chaque élément tel qu&apos;il sera transmis à l&apos;atelier. Pour changer quoi que ce soit, revenez à la configuration.</p>
          </header>

          <section className="vrf-bloc" aria-labelledby="vrf-caracteristiques">
            <h2 id="vrf-caracteristiques" className="vrf-bloc__titre mono">
              Caractéristiques
            </h2>
            <Fiche lignes={caracteristiques(etat)} />
          </section>

          <section className="vrf-bloc" aria-labelledby="vrf-contenu">
            <h2 id="vrf-contenu" className="vrf-bloc__titre mono">
              Contenu
            </h2>
            <Fiche lignes={contenu(etat)} />
          </section>

          <section className="vrf-bloc" aria-labelledby="vrf-verification">
            <h2 id="vrf-verification" className="vrf-bloc__titre mono">
              Vérification
            </h2>
            {echec ? (
              <div className="vrf-statut vrf-statut--bloque" role="alert">
                <p className="vrf-statut__titre">La vérification n&apos;a pas abouti</p>
                <p className="vrf-statut__detail">Votre configuration est conservée. Réessayez dans un instant.</p>
                <button type="button" className="btn btn--ghost vrf-reessayer" onClick={lancer}>
                  Réessayer
                </button>
              </div>
            ) : (
              <div className={`vrf-statut vrf-statut--${statut}`} role="status" aria-live="polite">
                <p className="vrf-statut__titre">{TEXTES_STATUT[statut ?? "verification"].titre}</p>
                <p className="vrf-statut__detail">{verdict ? SUITE_VERIFICATION[verdict.statut] : TEXTES_STATUT.verification.detail}</p>
              </div>
            )}
            {verdict?.texteModifie && <p className="vrf-remarque">Espaces superflus détectés dans le texte : ils seront retirés. Le texte du BAT fera foi.</p>}
            {aCorriger.length > 0 && (
              <div className="vrf-groupe">
                <p className="vrf-groupe__titre">À corriger</p>
                <ul className="cfg-messages">
                  {aCorriger.map((m) => (
                    <li key={m.id} className="cfg-message cfg-message--bloquant">
                      <strong>{m.titre}</strong>
                      <span>{m.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {enAttente.length > 0 && (
              <div className="vrf-groupe">
                <p className="vrf-groupe__titre">En attente de l&apos;atelier</p>
                <ul className="cfg-messages">
                  {enAttente.map((m) => (
                    <li key={m.id} className="cfg-message cfg-message--validation">
                      <strong>{m.titre}</strong>
                      <span>{m.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {verdict && verdict.statut !== "bloque" && (
            <section className="vrf-bloc" aria-labelledby="vrf-relecture">
              <h2 id="vrf-relecture" className="vrf-bloc__titre mono">
                Votre relecture
              </h2>
              <ul className="vrf-confirmations">
                {confirmations.map((c) => (
                  <li key={c.id}>
                    <label className="vrf-case">
                      <input type="checkbox" checked={confirmees[c.id] === true} onChange={(e) => setConfirmees((p) => ({ ...p, [c.id]: e.target.checked }))} />
                      <span>{c.libelle}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="vrf-remarque">Ces cases attestent votre relecture. Elles ne remplacent pas les validations de l&apos;atelier et ne sont pas enregistrées.</p>
            </section>
          )}

          <div className="vrf-actions">
            <Link href="/configurateur" className="btn btn--ghost vrf-modifier">
              <FlecheRetour />
              Modifier la configuration
            </Link>
            <div className="vrf-suite">
              <button type="button" className="btn btn--accent" disabled>
                Préparer le BAT
              </button>
              <p className="vrf-remarque" aria-live="polite">
                {raisonBat}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Barre mobile ---------- */}
      <div className="vrf-barre">
        <Link href="/configurateur" className="btn btn--ghost">
          <FlecheRetour />
          Modifier
        </Link>
        {statut && (
          <span className={`cfg-barre__statut cfg-barre__statut--${statut}`}>
            <span className="cfg-scene__point" aria-hidden="true" />
            {TEXTES_STATUT[statut].titre}
          </span>
        )}
      </div>
    </div>
  );
}

export function Verification() {
  const [lecture, setLecture] = useState<LectureBrouillon | null>(null);
  // Lecture unique : un brouillon invalide est effacé dès la première lecture ; le relire donnerait « absent ».
  const dejaLu = useRef(false);

  useEffect(() => {
    if (dejaLu.current) return;
    dejaLu.current = true;
    setLecture(chargerBrouillon(stockageNavigateur()));
  }, []);

  if (lecture === null) {
    return (
      <div className="container vrf-vide" aria-busy="true">
        <p className="vrf-intro">Chargement de votre configuration…</p>
      </div>
    );
  }
  if (lecture.statut === "absent") {
    return <EtatVide titre="Aucune plaque à vérifier" texte="Composez d'abord votre plaque : elle apparaîtra ici pour une relecture complète avant la préparation du BAT." />;
  }
  if (lecture.statut === "invalide") {
    return <EtatVide titre="Configuration illisible" texte="Votre configuration précédente n'a pas pu être relue (version ancienne ou données endommagées). Elle a été effacée : recomposez votre plaque." />;
  }
  if (erreursDeSaisie(lecture.etat).length > 0) {
    return <EtatVide titre="Configuration incomplète" texte="Des informations manquent encore, par exemple les dimensions. Complétez la configuration pour pouvoir la vérifier." />;
  }
  return <Contenu etat={lecture.etat} />;
}
