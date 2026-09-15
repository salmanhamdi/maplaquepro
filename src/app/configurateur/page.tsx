import type { Metadata } from "next";
import { Configurateur } from "@/components/configurateur/Configurateur";

export const metadata: Metadata = {
  title: "Créer ma plaque",
  description: "Composez votre plaque personnalisée : matière, dimensions, texte et fixations, avec aperçu en direct.",
  robots: { index: false },
};

export default function ConfigurateurPage() {
  return (
    <main>
      <Configurateur />
    </main>
  );
}
