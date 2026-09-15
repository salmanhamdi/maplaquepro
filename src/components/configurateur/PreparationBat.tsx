"use client";
// Préparation du BAT : affichage du résultat éphémère calculé par le serveur. Ce n'est pas un BAT : aucun identifiant,
// aucune empreinte, aucun prix, aucune expiration, aucune fabrication. Rien n'est enregistré.
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { preparerLeBat } from "@/app/configurateur/actions";
import { chargerBrouillon, type LectureBrouillon, stockageNavigateur } from "./brouillon";
import type { EtatConfigurateur, Message } from "./interpretation";
import { type ElementPreparation, DECISIONS_BAT_A_FINALISER, LIBELLES_STATUT_ELEMENT, type Preparation } from "./preparation";
import "./configurateur.css";
import "./verification.css";
import "./preparation.css";

function Parcours() {
  return (
    <ol className="vrf-parcours" aria-label="Étapes du parcours">
      <li className="is-fait">
        <Link href="/configurateur">Configuration</Link>
      </li>
      <li className="is-fait">
        <Link href="/configurateur/verification">Vérification</Link>
      </li>
      <li className="is-courant" aria-current="step">
        Préparation du BAT
      </li>
    </ol>
  );
}

function Pastille({ statut }: { statut: ElementPreparation["statut"] }) {
  return <span className={`prp-pastille prp-pastille--${statut}`}>{LIBELLES_STATUT_ELEMENT[statut]}</span>;
}

function Liste({ elements }: { elements: readonly ElementPreparation[] }) {
  return (
    <dl className="prp-liste">
      {elements.map((e, i) => (
        <div key={`${e.libelle}-${i}`} className={`prp-ligne prp-ligne--${e.statut}`}>
          <dt className={e.statut === "a_valider" || e.statut === "bloquant" ? "mono" : undefined}>{e.libelle}</dt>
          <dd>
            <span className={e.mono ? "mono" : undefined}>{e.valeur}</span>
            <Pastille statut={e.statut} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="vrf-bloc">
      <h2 className="vrf-bloc__titre mono">{titre}</h2>
      {children}
    </section>
  );
}

function Messages({ messages }: { messages: readonly Message[] }) {
  return (
    <ul className="cfg-messages">
      {messages.map((m) => (
        <li key={m.id} className={`cfg-message cfg-message--${m.niveau}`}>
          <strong>{m.titre}</strong>
          <span>{m.detail}</span>
        </li>
      ))}
    </ul>
  );
}

function Entete({ titre, intro }: { titre: string; intro: string }) {
  return (
    <header className="vrf-entete">
      <Parcours />
      <h1 className="vrf-titre">{titre}</h1>
      <p className="vrf-intro">{intro}</p>
    </header>
  );
}

function Retours() {
  return (
    <div className="prp-retours">
      <Link href="/configurateur/verification" className="btn btn--ghost">
        Revenir à la vérification
      </Link>
      <Link href="/configurateur" className="cfg-lien">
        Modifier la configuration
      </Link>
    </div>
  );
}

function Resultat({ etat }: { etat: EtatConfigurateur }) {
  const [preparation, setPreparation] = useState<Preparation | null>(null);
  const [echec, setEchec] = useState(false);

  const lancer = useCallback(() => {
    setEchec(false);
    setPreparation(null);
    preparerLeBat(etat)
      .then(setPreparation)
      .catch(() => setEchec(true));
  }, [etat]);

  useEffect(() => {
    lancer();
  }, [lancer]);

  if (echec) {
    return (
      <div className="container prp">
        <Entete titre="Préparation du BAT" intro="La préparation n'a pas abouti à cause d'une erreur de communication. Votre configuration est conservée." />
        <button type="button" className="btn btn--accent" onClick={lancer}>
          Réessayer
        </button>
        <Retours />
      </div>
    );
  }
  if (!preparation) {
    return (
      <div className="container prp" aria-busy="true">
        <Entete titre="Préparation du BAT" intro="Préparation en cours : notre moteur résout la spécification de fabrication de votre plaque…" />
      </div>
    );
  }
  if (preparation.etat === "saisie_invalide") {
    return (
      <div className="container prp">
        <Entete titre="Préparation impossible" intro="La configuration reçue est incomplète ou illisible. Revenez à la configuration pour la compléter." />
        <Retours />
      </div>
    );
  }
  if (preparation.etat === "impossible") {
    return (
      <div className="container prp">
        <Entete titre="Préparation impossible" intro="Notre moteur n'a pas pu préparer cette plaque. Aucune donnée n'a été enregistrée. Vous pouvez revenir à la vérification ou modifier la configuration." />
        <Retours />
      </div>
    );
  }
  if (preparation.etat === "non_fabricable" || preparation.etat === "validation_requise") {
    const bloque = preparation.etat === "non_fabricable";
    return (
      <div className="container prp">
        <Entete
          titre="Préparation du BAT"
          intro={bloque ? "Votre configuration n'est plus fabricable en l'état : la préparation ne peut pas être lancée." : "Des validations de l'atelier sont nécessaires avant de préparer cette plaque. Rien n'est à corriger de votre côté."}
        />
        <div className={`vrf-statut vrf-statut--${bloque ? "bloque" : "en_validation"}`} role="status">
          <p className="vrf-statut__titre">{bloque ? "Non fabricable en l'état" : "Validation atelier requise"}</p>
        </div>
        <Messages messages={preparation.messages} />
        <Retours />
      </div>
    );
  }

  return (
    <div className="container prp">
      <Entete titre="Préparation du BAT" intro="Voici ce que notre moteur a déterminé pour fabriquer votre plaque, et ce qui doit encore être validé avant l'émission d'un BAT réel." />

      <div className="prp-bandeau" role="status">
        <p className="prp-bandeau__titre">Validation atelier requise</p>
        <ul>
          <li>Préparation technique non enregistrée : elle est recalculée à chaque ouverture.</li>
          <li>Non contractuelle : ce n&apos;est pas un BAT et aucun numéro n&apos;est attribué.</li>
          <li>Aucune fabrication n&apos;est lancée et aucune validation définitive n&apos;a lieu.</li>
        </ul>
      </div>

      <div className="prp-legende" aria-label="Légende">
        {(["determine", "a_valider", "bloquant", "sans_objet"] as const).map((s) => (
          <Pastille key={s} statut={s} />
        ))}
      </div>

      <div className="prp-grille">
        <div>
          <Bloc titre="Spécification résolue">
            <Liste elements={preparation.specification} />
          </Bloc>
          <Bloc titre="Contenu">
            <Liste elements={preparation.contenu} />
          </Bloc>
        </div>
        <div>
          <Bloc titre="Workflow de fabrication">
            <Liste elements={preparation.operations} />
          </Bloc>
          <Bloc titre="Fichiers prévus">
            {preparation.artefacts.map((a) => (
              <div key={a.titre} className="prp-artefact">
                <p className="prp-artefact__titre">{a.titre}</p>
                <Liste elements={a.elements} />
              </div>
            ))}
            <p className="vrf-remarque">Résumé des fichiers que produira l&apos;atelier. Aucun fichier de production n&apos;est généré à cette étape.</p>
          </Bloc>
          <Bloc titre="À valider avant le BAT">
            {preparation.aValider.length > 0 ? <Liste elements={preparation.aValider} /> : <p className="vrf-remarque">Aucun élément À VALIDER remonté par la spécification.</p>}
            <p className="prp-decisions">{DECISIONS_BAT_A_FINALISER}</p>
          </Bloc>
        </div>
      </div>

      <Retours />
    </div>
  );
}

export function PreparationBat() {
  const [lecture, setLecture] = useState<LectureBrouillon | null>(null);
  const dejaLu = useRef(false);

  useEffect(() => {
    if (dejaLu.current) return;
    dejaLu.current = true;
    setLecture(chargerBrouillon(stockageNavigateur()));
  }, []);

  if (lecture === null) {
    return (
      <div className="container prp" aria-busy="true">
        <p className="vrf-intro">Chargement de votre configuration…</p>
      </div>
    );
  }
  if (lecture.statut !== "restaure") {
    return (
      <div className="container prp">
        <Entete
          titre={lecture.statut === "invalide" ? "Configuration illisible" : "Aucune plaque à préparer"}
          intro={lecture.statut === "invalide" ? "Votre configuration précédente n'a pas pu être relue et a été effacée. Recomposez votre plaque." : "Composez puis vérifiez votre plaque avant de préparer le BAT."}
        />
        <Link href="/configurateur" className="btn btn--accent">
          Composer ma plaque
        </Link>
      </div>
    );
  }
  return <Resultat etat={lecture.etat} />;
}
