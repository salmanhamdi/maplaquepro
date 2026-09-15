"use client";
import { useActionState } from "react";
import {
  actionChangementMotDePasse,
  actionConnexion,
  actionInscription,
  actionMotDePasseOublie,
  actionReinitialisation,
  actionRenvoiVerification,
  actionVerificationEmail,
  type EtatFormulaire,
} from "@/app/compte/actions";

const INITIAL: EtatFormulaire = { statut: "initial" };

function Retour({ etat }: { etat: EtatFormulaire }) {
  if (etat.statut === "initial" || !etat.message) return null;
  return (
    <p className={`compte-retour compte-retour--${etat.statut}`} role={etat.statut === "erreur" ? "alert" : "status"}>
      {etat.message}
    </p>
  );
}

function ChampEmail({ etat }: { etat: EtatFormulaire }) {
  return (
    <label className="compte-champ">
      <span>Adresse email</span>
      <input type="email" name="email" autoComplete="email" required maxLength={254} defaultValue={etat.email} />
    </label>
  );
}

function ChampMotDePasse({ nom, libelle, nouveau }: { nom: string; libelle: string; nouveau?: boolean }) {
  return (
    <label className="compte-champ">
      <span>{libelle}</span>
      <input type="password" name={nom} autoComplete={nouveau ? "new-password" : "current-password"} required minLength={nouveau ? 10 : undefined} maxLength={256} />
      {nouveau ? <small>10 caractères minimum.</small> : null}
    </label>
  );
}

function Bouton({ enCours, children }: { enCours: boolean; children: string }) {
  return (
    <button type="submit" className="btn btn--ink" disabled={enCours}>
      {enCours ? "Veuillez patienter…" : children}
    </button>
  );
}

export function FormulaireInscription() {
  const [etat, action, enCours] = useActionState(actionInscription, INITIAL);
  return (
    <form action={action} className="compte-form">
      <ChampEmail etat={etat} />
      <ChampMotDePasse nom="motDePasse" libelle="Mot de passe" nouveau />
      <Retour etat={etat} />
      <Bouton enCours={enCours}>Créer mon compte</Bouton>
    </form>
  );
}

export function FormulaireConnexion({ suite }: { suite: string }) {
  const [etat, action, enCours] = useActionState(actionConnexion, INITIAL);
  return (
    <form action={action} className="compte-form">
      <input type="hidden" name="suite" value={suite} />
      <ChampEmail etat={etat} />
      <ChampMotDePasse nom="motDePasse" libelle="Mot de passe" />
      <Retour etat={etat} />
      <Bouton enCours={enCours}>Se connecter</Bouton>
    </form>
  );
}

export function FormulaireMotDePasseOublie() {
  const [etat, action, enCours] = useActionState(actionMotDePasseOublie, INITIAL);
  return (
    <form action={action} className="compte-form">
      <ChampEmail etat={etat} />
      <Retour etat={etat} />
      <Bouton enCours={enCours}>Recevoir un lien</Bouton>
    </form>
  );
}

export function FormulaireReinitialisation({ jeton }: { jeton: string }) {
  const [etat, action, enCours] = useActionState(actionReinitialisation, INITIAL);
  if (etat.statut === "succes") return <Retour etat={etat} />;
  return (
    <form action={action} className="compte-form">
      <input type="hidden" name="jeton" value={jeton} />
      <ChampMotDePasse nom="motDePasse" libelle="Nouveau mot de passe" nouveau />
      <Retour etat={etat} />
      <Bouton enCours={enCours}>Enregistrer le mot de passe</Bouton>
    </form>
  );
}

export function FormulaireVerificationEmail({ jeton }: { jeton: string }) {
  const [etat, action, enCours] = useActionState(actionVerificationEmail, INITIAL);
  if (etat.statut === "succes") return <Retour etat={etat} />;
  return (
    <form action={action} className="compte-form">
      <input type="hidden" name="jeton" value={jeton} />
      <Retour etat={etat} />
      <Bouton enCours={enCours}>Confirmer mon adresse</Bouton>
    </form>
  );
}

export function FormulaireRenvoiVerification() {
  const [etat, action, enCours] = useActionState(actionRenvoiVerification, INITIAL);
  return (
    <form action={action} className="compte-form compte-form--ligne">
      <Retour etat={etat} />
      <button type="submit" className="btn btn--ghost" disabled={enCours}>
        Renvoyer l&apos;email de confirmation
      </button>
    </form>
  );
}

export function FormulaireChangementMotDePasse() {
  const [etat, action, enCours] = useActionState(actionChangementMotDePasse, INITIAL);
  return (
    <form action={action} className="compte-form">
      <ChampMotDePasse nom="actuel" libelle="Mot de passe actuel" />
      <ChampMotDePasse nom="nouveau" libelle="Nouveau mot de passe" nouveau />
      <Retour etat={etat} />
      <Bouton enCours={enCours}>Modifier le mot de passe</Bouton>
    </form>
  );
}
