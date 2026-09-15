import type { Metadata } from "next";
import { BatProvisoireDocument } from "@/components/bat/BatProvisoireDocument";
import { BAT_PROVISOIRE_DEMO } from "@/components/bat/demo-bat";

export const metadata: Metadata = {
  title: "BAT provisoire — démonstration",
  description: "Exemple de document de vérification (BAT provisoire), à titre de démonstration.",
  robots: { index: false },
};

export default function BatProvisoirePage() {
  return (
    <main className="container batp-page">
      <BatProvisoireDocument demo={BAT_PROVISOIRE_DEMO} />
    </main>
  );
}
