// Frontière serveur de la vérification : l'entrée d'une Server Action est revalidée à l'exécution (dette technique résorbée).
// Aucune règle métier n'est modifiée : une entrée conforme donne exactement le verdict de verifier().
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ETAT_INITIAL } from "../../src/components/configurateur/interpretation";
import { verifier, verifierEntree } from "../../src/server/verification";

const source = (f: string) => readFileSync(f, "utf8");

describe("vérification — revalidation de l'entrée serveur", () => {
  it.each([
    ["undefined", undefined],
    ["null", null],
    ["chaîne", "fabricable"],
    ["tableau", [ETAT_INITIAL]],
    ["objet vide", {}],
    ["famille inconnue", { ...ETAT_INITIAL, famille: "bois" }],
    ["lignes non tableau", { ...ETAT_INITIAL, lignes: "Atelier" }],
    ["5 lignes", { ...ETAT_INITIAL, lignes: ["a", "b", "c", "d", "e"] }],
    ["3 trous", { ...ETAT_INITIAL, trous: 3 }],
    ["dimension numérique", { ...ETAT_INITIAL, largeur: 200 }],
    ["champ inconnu (verdict client)", { ...ETAT_INITIAL, statut: "fabricable" }],
    ["champ inconnu (prix)", { ...ETAT_INITIAL, prix: 1 }],
    ["largeur vide", { ...ETAT_INITIAL, largeur: "" }],
    ["hauteur non numérique", { ...ETAT_INITIAL, hauteur: "12 mm" }],
  ])("%s ⇒ saisie invalide, sans exception", (_, entree) => {
    expect(() => verifierEntree(entree)).not.toThrow();
    expect(verifierEntree(entree)).toEqual({ statut: "saisie_invalide" });
  });

  it("entrée conforme : verdict strictement identique à verifier() (fabricable, bloqué, en validation)", () => {
    for (const etat of [ETAT_INITIAL, { ...ETAT_INITIAL, largeur: "600" }, { ...ETAT_INITIAL, lignes: ["Atelier"] }, { ...ETAT_INITIAL, famille: "trolase" as const }]) {
      expect(verifierEntree(etat)).toEqual(verifier(etat));
    }
  });

  it("action serveur : entrée non typée, déléguée à verifierEntree ; les clients traitent la saisie invalide", () => {
    const action = source("src/app/configurateur/actions.ts");
    expect(action).toMatch(/export async function verifierConfiguration\(entree: unknown\): Promise<Verdict \| SaisieInvalide>/);
    expect(action).toMatch(/return verifierEntree\(entree\);/);
    expect(action).not.toMatch(/return verifier\(/);
    expect(source("src/components/configurateur/Configurateur.tsx")).toMatch(/v\.statut === "saisie_invalide" \? null : v/);
    expect(source("src/components/configurateur/Verification.tsx")).toMatch(/v\.statut === "saisie_invalide" \? setEchec\(true\) : setVerdict\(v\)/);
  });
});
