import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormulaireChangementMotDePasse, FormulaireRenvoiVerification } from "@/components/compte/Formulaires";
import "@/components/compte/compte.css";
import { clientConnecte } from "@/server/auth/requete";
import { actionDeconnexion } from "./actions";

export const metadata: Metadata = { title: "Mon compte", robots: { index: false } };

export default async function ComptePage() {
  const client = await clientConnecte();
  if (!client) redirect("/compte/connexion");

  return (
    <main className="container compte-page">
      <div className="compte-carte compte-carte--large">
        <span className="eyebrow">Espace client</span>
        <h1>Mon compte</h1>
        <p className="compte-intro">Le compte est facultatif : il n&apos;est pas nécessaire pour configurer ou commander une plaque.</p>

        <dl className="compte-fiche">
          <dt>Email</dt>
          <dd>{client.email}</dd>
          <dt>Confirmation</dt>
          <dd>{client.emailVerifiedAt ? "Adresse confirmée" : "Adresse non confirmée"}</dd>
        </dl>
        {client.emailVerifiedAt ? null : (
          <div className="compte-section">
            <FormulaireRenvoiVerification />
          </div>
        )}

        <section className="compte-section" aria-labelledby="titre-mot-de-passe">
          <h2 id="titre-mot-de-passe">Mot de passe</h2>
          <FormulaireChangementMotDePasse />
        </section>

        <section className="compte-section">
          <form action={actionDeconnexion}>
            <button type="submit" className="btn btn--ghost">
              Se déconnecter
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
