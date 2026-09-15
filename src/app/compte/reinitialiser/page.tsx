import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireReinitialisation } from "@/components/compte/Formulaires";
import "@/components/compte/compte.css";

// Le jeton arrive dans l'URL du lien email : la page ne le consomme pas (aucune mutation par GET)
// et n'émet aucun Referer.
export const metadata: Metadata = { title: "Nouveau mot de passe", robots: { index: false }, referrer: "no-referrer" };

export default async function ReinitialiserPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { jeton } = await searchParams;
  return (
    <main className="container compte-page">
      <div className="compte-carte">
        <span className="eyebrow">Espace client</span>
        <h1>Nouveau mot de passe</h1>
        {typeof jeton === "string" ? (
          <FormulaireReinitialisation jeton={jeton} />
        ) : (
          <p className="compte-intro">Ce lien est incomplet. Faites une nouvelle demande.</p>
        )}
        <div className="compte-liens">
          <Link href="/compte/connexion">Se connecter</Link>
          <Link href="/compte/mot-de-passe-oublie">Nouvelle demande</Link>
        </div>
      </div>
    </main>
  );
}
