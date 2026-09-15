import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireMotDePasseOublie } from "@/components/compte/Formulaires";
import "@/components/compte/compte.css";

export const metadata: Metadata = { title: "Mot de passe oublié", robots: { index: false } };

export default function MotDePasseOubliePage() {
  return (
    <main className="container compte-page">
      <div className="compte-carte">
        <span className="eyebrow">Espace client</span>
        <h1>Mot de passe oublié</h1>
        <p className="compte-intro">Indiquez l&apos;adresse de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
        <FormulaireMotDePasseOublie />
        <div className="compte-liens">
          <Link href="/compte/connexion">Retour à la connexion</Link>
        </div>
      </div>
    </main>
  );
}
