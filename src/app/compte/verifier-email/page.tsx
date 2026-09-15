import type { Metadata } from "next";
import Link from "next/link";
import { FormulaireVerificationEmail } from "@/components/compte/Formulaires";
import "@/components/compte/compte.css";

// Le jeton n'est consommé que par la soumission POST : un scanner de liens ne peut pas le consommer.
export const metadata: Metadata = { title: "Confirmer mon adresse", robots: { index: false }, referrer: "no-referrer" };

export default async function VerifierEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { jeton } = await searchParams;
  return (
    <main className="container compte-page">
      <div className="compte-carte">
        <span className="eyebrow">Espace client</span>
        <h1>Confirmer mon adresse</h1>
        {typeof jeton === "string" ? (
          <FormulaireVerificationEmail jeton={jeton} />
        ) : (
          <p className="compte-intro">Ce lien est incomplet.</p>
        )}
        <div className="compte-liens">
          <Link href="/compte">Mon compte</Link>
        </div>
      </div>
    </main>
  );
}
