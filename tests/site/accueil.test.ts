// Accueil : le contenu reste conforme à l'état réel du produit (CR-2 ouverte : sur mesure TroLase non activé,
// aucun tarif ni format commercial validé). Contrôle de source, sans rendu.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BORNES_DIMENSIONS_VR25 } from "../../src/domain";

const racine = path.resolve(__dirname, "../..");
const lire = (f: string) => readFileSync(path.join(racine, f), "utf8");
const accueil = lire("src/app/page.tsx");
const vitrine = [accueil, lire("src/app/layout.tsx"), lire("src/components/site/SiteFooter.tsx"), lire("src/components/site/SiteHeader.tsx")];

describe("accueil — conformité du contenu", () => {
  it("n'annonce pas le sur mesure comme ouvert à la commande ; précise que le sur mesure TroLase ne l'est pas", () => {
    for (const source of vitrine) expect(source).not.toMatch(/sur[ -]mesure(?![^<]*n&apos;est pas encore ouvert)/i);
    expect(accueil).toMatch(/sur mesure en TroLase et TroLase Metallic n&apos;est pas encore ouvert à la commande/);
    expect(accueil).toMatch(/limites de fabrication/);
  });

  it("bornes affichées identiques aux bornes VR-25 du domaine, rattachées aux bonnes familles", () => {
    const b = BORNES_DIMENSIONS_VR25;
    expect(b.trolase).toEqual(b.trolase_metallic);
    expect(b.plexiglass).toEqual(b.troglass_metallic);
    for (const f of Object.values(b)) expect([f.minWidthMm, f.minHeightMm]).toEqual([10, 10]);
    const ligne = (libelle: string, l: number, h: number) => new RegExp(`${libelle}, jusqu&apos;à</dt>\\s*<dd>\\s*${l} <span>×</span> ${h}`);
    expect(accueil).toMatch(ligne("TroLase · TroLase Metallic", b.trolase.maxWidthMm, b.trolase.maxHeightMm));
    expect(accueil).toMatch(ligne("Plexiglass · TroGlass Metallic", b.troglass_metallic.maxWidthMm, b.troglass_metallic.maxHeightMm));
  });

  it("aucun prix, tarif ni photographie présentée comme réelle", () => {
    for (const source of vitrine) expect(source).not.toMatch(/€|\bEUR\b|\bTTC\b|\bHT\b|à partir de \d|<img(?![^>]*brand\/maplaquepro\.svg)/i);
  });

  it("logo officiel utilisé tel quel", () => {
    expect(lire("src/components/site/SiteHeader.tsx")).toMatch(/src="\/brand\/maplaquepro\.svg"/);
  });
});
