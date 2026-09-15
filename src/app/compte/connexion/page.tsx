import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireConnexion } from "@/components/compte/Formulaires";
import "@/components/compte/compte.css";
import { cheminRetourSur } from "@/server/auth/validation";

export const metadata: Metadata = { title: "Connexion", robots: { index: false } };

export default async function ConnexionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { suite } = await searchParams;
  return (
    <main className="container compte-page">
      <div className="compte-carte">
        <span className="eyebrow">Espace client</span>
        <h1>Connexion</h1>
        <p className="compte-intro">Le compte est facultatif : vous pouvez configurer et commander sans compte.</p>
        <FormulaireConnexion suite={cheminRetourSur(suite)} />
        <div className="compte-liens">
          <Link href="/compte/mot-de-passe-oublie">Mot de passe oublié</Link>
          <Link href="/compte/inscription">Créer un compte</Link>
        </div>
      </div>
    </main>
  );
}
