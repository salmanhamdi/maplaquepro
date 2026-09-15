// Étape « Vérification » : données présentées, états issus du verdict serveur, absence de logique métier client.
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ETAT_INITIAL } from "../../src/components/configurateur/interpretation";
import { caracteristiques, confirmationsDisponibles, contenu, groupesMessages, orientationPlaque, SUITE_VERIFICATION } from "../../src/components/configurateur/presentation-verification";
import { verifier } from "../../src/server/verification";

const source = (f: string) => readFileSync(f, "utf8");
const valeurs = (lignes: { libelle: string; valeur: string }[]) => Object.fromEntries(lignes.map((l) => [l.libelle, l.valeur]));

describe("vérification — données présentées", () => {
  it("caractéristiques : matière, dimensions, orientation, procédé", () => {
    expect(valeurs(caracteristiques({ ...ETAT_INITIAL, largeur: "347", hauteur: "490" }))).toEqual({
      Matière: "Plexiglass / TroGlass Clear",
      Dimensions: "347 × 490 mm",
      Orientation: "Portrait · plus haute que large",
      Procédé: "Impression UV à l'envers → découpe",
    });
    expect(orientationPlaque(200, 100)).toMatch(/^Paysage/);
    expect(orientationPlaque(50, 50)).toBe("Carrée");
    expect(valeurs(caracteristiques({ ...ETAT_INITIAL, famille: "troglass_metallic", largeur: "120,5", hauteur: "60" })).Dimensions).toBe("120,5 × 60 mm");
  });

  it("contenu : texte ligne à ligne tel que saisi, alignement, trous et distance au bord", () => {
    expect(valeurs(contenu({ ...ETAT_INITIAL, lignes: ["Cabinet Durand", "", "Avocats"], trous: 4, retrait: "3" }))).toEqual({
      Texte: "Cabinet Durand\nAvocats",
      Alignement: "Centré",
      Trous: "4 trous · 3 mm du bord",
    });
    expect(valeurs(contenu(ETAT_INITIAL))).toEqual({ Texte: "Aucun texte", Trous: "Sans trou" });
  });

  it("relectures proposées uniquement pour les éléments présents", () => {
    expect(confirmationsDisponibles(ETAT_INITIAL).map((c) => c.id)).toEqual(["caracteristiques"]);
    expect(confirmationsDisponibles({ ...ETAT_INITIAL, lignes: ["A"], trous: 2 }).map((c) => c.id)).toEqual(["caracteristiques", "texte", "trous"]);
  });
});

describe("vérification — états issus du verdict serveur", () => {
  it("fabricable : aucun message, aperçu serveur disponible", () => {
    const v = verifier(ETAT_INITIAL);
    expect(v.statut).toBe("fabricable");
    expect(groupesMessages(v.messages)).toEqual({ aCorriger: [], enAttente: [] });
    expect(v.apercu.etat).toBe("disponible");
  });

  it("validation atelier (texte, trous) : rien à corriger, éléments en attente ; la relecture ne change pas le verdict", () => {
    const etat = { ...ETAT_INITIAL, lignes: ["Atelier"], trous: 4 as const };
    const v = verifier(etat);
    expect(v.statut).toBe("en_validation");
    const g = groupesMessages(v.messages);
    expect(g.aCorriger).toEqual([]);
    expect(g.enAttente.map((m) => m.id).sort()).toEqual(["fixations-validation", "texte-validation"]);
    expect(verifier(etat).statut).toBe("en_validation");
  });

  it("CR-2 (TroLase) : en attente, jamais fabricable", () => {
    expect(verifier({ ...ETAT_INITIAL, famille: "trolase" }).statut).toBe("en_validation");
  });

  it("non fabricable (hors VR-25) : points à corriger, aucun aperçu serveur", () => {
    const v = verifier({ ...ETAT_INITIAL, largeur: "600" });
    expect(v.statut).toBe("bloque");
    expect(groupesMessages(v.messages).aCorriger.length).toBeGreaterThan(0);
    expect(v.apercu).toEqual({ etat: "non_applicable" });
  });

  it("suite annoncée : la préparation du BAT n'est ouverte dans aucun état", () => {
    expect(SUITE_VERIFICATION.fabricable).toMatch(/pas encore ouverte/);
    expect(SUITE_VERIFICATION.en_validation).toMatch(/restera fermée/);
    expect(SUITE_VERIFICATION.bloque).toMatch(/Modifiez/);
  });
});

describe("vérification — parcours et frontières", () => {
  const client = source("src/components/configurateur/Verification.tsx");
  const configurateur = source("src/components/configurateur/Configurateur.tsx");

  it("route /configurateur/verification ; le configurateur y conduit en enregistrant le brouillon", () => {
    expect(existsSync("src/app/configurateur/verification/page.tsx")).toBe(true);
    expect(configurateur).toMatch(/router\.push\("\/configurateur\/verification"\)/);
    expect(configurateur).toMatch(/enregistrerBrouillon\(stockageNavigateur\(\), etat\);\s*router\.push/);
    expect(client).toMatch(/href="\/configurateur"/);
  });

  it("verdict obtenu uniquement par l'action serveur existante ; aucun calcul métier ni BAT côté client", () => {
    expect(client).toMatch(/verifierConfiguration\(etat\)/);
    for (const f of [client, configurateur, source("src/components/configurateur/ApercuPlaque.tsx"), source("src/components/configurateur/brouillon.ts"), source("src/components/configurateur/presentation-verification.ts")]) {
      expect(f).not.toMatch(/evaluateFabricability|proposeAlternatives|renderPreviewSvg|buildCanonicalGeometry|resolveSpec|ENGINE_VERSIONS|createBat|preparerBat|buildBatDraft|validateBat|enregistrerBat|computePrice|contentHash/);
    }
    expect(client).not.toMatch(/from "@\/domain"/);
  });

  it("aucun prix, commande, paiement ni BAT présenté comme existant ; « Préparer le BAT » toujours désactivé", () => {
    expect(client).not.toMatch(/€|\bTTC\b|\bHT\b|Stripe|checkout|panier|Commander|BAT validé|bon pour fabrication/i);
    expect(client).toMatch(/<button type="button" className="btn btn--accent" disabled>\s*Préparer le BAT/);
    expect(client).toMatch(/Aperçu indicatif/);
    expect(client).toMatch(/Ce n'est pas un BAT/);
  });

  it("les confirmations restent locales : non envoyées au serveur, non stockées dans le brouillon", () => {
    expect(client).not.toMatch(/verifierConfiguration\([^)]*confirm/);
    expect(client).not.toMatch(/enregistrerBrouillon/);
  });
});
