// Brouillon local du configurateur (§8) : sérialisation, restauration, refus des brouillons corrompus ou incompatibles.
import { describe, expect, it } from "vitest";
import { CLE_BROUILLON, chargerBrouillon, effacerBrouillon, enregistrerBrouillon, lireBrouillon, PRODUIT_CONFIGURATEUR, type Stockage, serialiserBrouillon } from "../../src/components/configurateur/brouillon";
import { ETAT_INITIAL, ORDRE_FAMILLES } from "../../src/components/configurateur/interpretation";
import { PRODUIT_DEMO } from "../../src/server/catalogue-demo";

const memoire = (initial: Record<string, string> = {}) => {
  const d = new Map(Object.entries(initial));
  const s: Stockage & { d: Map<string, string> } = { d, getItem: (k) => d.get(k) ?? null, setItem: (k, v) => void d.set(k, v), removeItem: (k) => void d.delete(k) };
  return s;
};
const etat = { ...ETAT_INITIAL, famille: "troglass_metallic" as const, largeur: "120,5", hauteur: "60", lignes: ["Maison Arlet", "  Atelier  "], alignement: "left" as const, trous: 4 as const, retrait: "3" };

describe("brouillon local — clé et contenu", () => {
  it("clé du Master Plan §8 : mpp.draft.v4.<productId>, produit identique au catalogue serveur", () => {
    expect(CLE_BROUILLON).toBe("mpp.draft.v4.plaque-demonstration");
    expect(PRODUIT_CONFIGURATEUR).toBe(PRODUIT_DEMO);
  });

  it("ne contient que l'état de saisie : aucun verdict, aperçu, prix, BAT ni empreinte", () => {
    const brut = serialiserBrouillon(etat, new Date("2026-09-15T10:00:00.000Z"));
    const objet = JSON.parse(brut);
    expect(Object.keys(objet).sort()).toEqual(["enregistreLe", "etat", "productId", "version"]);
    expect(Object.keys(objet.etat).sort()).toEqual(Object.keys(ETAT_INITIAL).sort());
    expect(brut).not.toMatch(/verdict|apercu|svg|price|prix|batId|hash|statut/i);
  });
});

describe("brouillon local — restauration", () => {
  it("aller-retour exact, saisie conservée telle quelle (virgule, espaces)", () => {
    const r = lireBrouillon(serialiserBrouillon(etat, new Date("2026-09-15T10:00:00.000Z")));
    expect(r).toEqual({ statut: "restaure", etat, enregistreLe: "2026-09-15T10:00:00.000Z" });
  });

  it("chaque famille est restaurable", () => {
    for (const famille of ORDRE_FAMILLES) expect(lireBrouillon(serialiserBrouillon({ ...ETAT_INITIAL, famille })).statut).toBe("restaure");
  });

  it("absent ⇒ « absent » ; stockage indisponible ou en erreur ⇒ « absent », sans exception", () => {
    expect(lireBrouillon(null)).toEqual({ statut: "absent" });
    expect(chargerBrouillon(null)).toEqual({ statut: "absent" });
    const panne: Stockage = {
      getItem: () => {
        throw new Error("refusé");
      },
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => {
        throw new Error("refusé");
      },
    };
    expect(chargerBrouillon(panne)).toEqual({ statut: "absent" });
    expect(() => enregistrerBrouillon(panne, etat)).not.toThrow();
    expect(() => effacerBrouillon(panne)).not.toThrow();
  });

  it("enregistrer puis charger ; effacer supprime la clé", () => {
    const s = memoire();
    enregistrerBrouillon(s, etat);
    expect(chargerBrouillon(s)).toMatchObject({ statut: "restaure", etat });
    effacerBrouillon(s);
    expect(s.d.has(CLE_BROUILLON)).toBe(false);
  });
});

describe("brouillon local — corrompu ou incompatible", () => {
  const base = JSON.parse(serialiserBrouillon(etat));
  const variantes: Record<string, unknown> = {
    "JSON illisible": "{pas du json",
    "autre version": { ...base, version: 2 },
    "autre produit": { ...base, productId: "autre-produit" },
    "champ inconnu": { ...base, prix: 12 },
    "champ inconnu dans l'état": { ...base, etat: { ...base.etat, statut: "fabricable" } },
    "famille inconnue": { ...base, etat: { ...base.etat, famille: "bois" } },
    "5 lignes": { ...base, etat: { ...base.etat, lignes: ["a", "b", "c", "d", "e"] } },
    "aucune ligne": { ...base, etat: { ...base.etat, lignes: [] } },
    "3 trous": { ...base, etat: { ...base.etat, trous: 3 } },
    "dimension non textuelle": { ...base, etat: { ...base.etat, largeur: 200 } },
    "date absente": { ...base, enregistreLe: undefined },
  };

  it.each(Object.entries(variantes))("%s ⇒ invalide", (_, valeur) => {
    expect(lireBrouillon(typeof valeur === "string" ? valeur : JSON.stringify(valeur)).statut).toBe("invalide");
  });

  it("un brouillon invalide est effacé du stockage au chargement", () => {
    const s = memoire({ [CLE_BROUILLON]: "{pas du json" });
    expect(chargerBrouillon(s)).toEqual({ statut: "invalide" });
    expect(s.d.has(CLE_BROUILLON)).toBe(false);
  });

  it("dimensions hors bornes : restaurées telles quelles, jamais corrigées (le serveur tranche)", () => {
    expect(lireBrouillon(serialiserBrouillon({ ...etat, largeur: "900" }))).toMatchObject({ statut: "restaure", etat: { largeur: "900" } });
  });
});
