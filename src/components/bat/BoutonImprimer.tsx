"use client";

export function BoutonImprimer() {
  return (
    <button type="button" className="btn btn--ghost" onClick={() => window.print()}>
      Imprimer l&apos;exemple
    </button>
  );
}
