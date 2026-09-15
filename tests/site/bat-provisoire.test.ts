// T4-b : BAT provisoire de DÉMONSTRATION. Présentation uniquement : aucun BAT du domaine, aucune validation,
// aucun prix, aucune expiration, aucun hash, aucune version de moteur.
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BatProvisoireDocument } from "../../src/components/bat/BatProvisoireDocument";
import { BAT_PROVISOIRE_DEMO } from "../../src/components/bat/demo-bat";

const html = renderToStaticMarkup(createElement(BatProvisoireDocument, { demo: BAT_PROVISOIRE_DEMO }));
const texte = html.replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/\s+/g, " ");

describe("BAT provisoire — démonstration", () => {
  it("identification DEMO impossible à manquer : bandeau, filigrane, numéro fictif", () => {
    expect(texte).toContain("Démonstration");
    expect(texte).toContain("sans valeur contractuelle");
    expect(texte).toContain("DÉMO");
    expect(texte).toContain("BAT-DEMO-0001");
    expect(texte).toContain("numéro fictif");
  });

  it("libellé « BAT provisoire » et statut « En cours de validation atelier »", () => {
    expect(texte).toContain("BAT provisoire");
    expect(texte).toContain("En cours de validation atelier");
  });

  it("aucun statut validé, prêt à fabriquer, BAT final ni signature ; aucun bouton de validation ou de commande", () => {
    expect(texte).not.toMatch(/\bvalidé\b|BAT final|prêt à fabriquer|bon pour fabrication|signature|signé/i);
    expect(html).not.toMatch(/<button[^>]*>[^<]*(Valider|Commander|Lancer)/i);
  });

  it("aucun prix ni expiration inventés : « À venir » uniquement", () => {
    expect(texte).not.toMatch(/€|\bEUR\b|\bHT\b|\bTTC\b|expire|jusqu'au/i);
    expect(texte).toMatch(/Prix À venir/);
    expect(texte).toMatch(/Validité À venir/);
  });

  it("aucun hash, empreinte ni version de moteur présentés", () => {
    expect(texte).not.toMatch(/hash|empreinte|fingerprint|sha-?256|version de moteur/i);
  });

  it("aucun appel au moteur BAT ni au domaine dans le document, ses données et la page", () => {
    for (const f of ["src/components/bat/BatProvisoireDocument.tsx", "src/components/bat/demo-bat.ts", "src/app/bat-provisoire/page.tsx"]) {
      const source = readFileSync(f, "utf8");
      expect(source).not.toMatch(/createBat|validateBat|enregistrerBat|preparerBat|buildBatDraft|@\/domain|src\/domain|\.\.\/domain/);
    }
    expect(Object.keys(BAT_PROVISOIRE_DEMO)).not.toContain("batId");
  });
});
