import type { Metadata } from "next";
import { PreparationBat } from "@/components/configurateur/PreparationBat";

export const metadata: Metadata = {
  title: "Préparation du BAT",
  description: "Préparation technique de votre plaque avant le BAT : spécification résolue, workflow, fichiers prévus et éléments à valider. Non contractuelle.",
  robots: { index: false },
};

export default function PreparationPage() {
  return (
    <main>
      <PreparationBat />
    </main>
  );
}
