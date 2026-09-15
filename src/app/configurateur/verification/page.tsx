import type { Metadata } from "next";
import { Verification } from "@/components/configurateur/Verification";

export const metadata: Metadata = {
  title: "Vérifier ma plaque",
  description: "Relisez votre plaque avant la préparation du BAT : matière, dimensions, contenu et verdict du moteur de fabrication.",
  robots: { index: false },
};

export default function VerificationPage() {
  return (
    <main>
      <Verification />
    </main>
  );
}
