import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireInscription } from "@/components/compte/Formulaires";
import "@/components/compte/compte.css";

export const metadata: Metadata = { title: "Créer un compte", robots: { index: false } };

export default function InscriptionPage() {
  return (
    <main className="container compte-page">
      <div className="compte-carte">
        <span className="eyebrow">Espace client</span>
        <h1>Créer un compte</h1>
        <p className="compte-intro">Facultatif : un compte n&apos;est pas nécessaire pour configurer ou commander une plaque.</p>
        <FormulaireInscription />
        <div className="compte-liens">
          <Link href="/compte/connexion">J&apos;ai déjà un compte</Link>
        </div>
      </div>
    </main>
  );
}
