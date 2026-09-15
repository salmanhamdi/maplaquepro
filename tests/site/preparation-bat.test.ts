// BAT-PREP : préparation éphémère côté serveur, composée des fonctions du domaine. Ce n'est pas un BAT.
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ETAT_INITIAL, versConfiguration } from "../../src/components/configurateur/interpretation";
import type { ElementPreparation, Preparation } from "../../src/components/configurateur/preparation";
import { buildCanonicalGeometry, ENGINE_VERSIONS, evaluateFabricability, planArtifacts, resolveSpec } from "../../src/domain";
import { CATALOGUE_DEMO, COMPOSITION_DEMO, POLICE_DEMO, PRODUIT_DEMO, referenceDemo } from "../../src/server/catalogue-demo";
import { construirePreparationBat as preparerBatServeur } from "../../src/server/preparation-bat";

const racine = path.resolve(__dirname, "../..");
const source = (f: string) => readFileSync(path.join(racine, f), "utf8");
const valeurs = (l: readonly ElementPreparation[]) => Object.fromEntries(l.map((e) => [e.libelle, [e.valeur, e.statut]]));
const preparee = (p: Preparation) => {
  if (p.etat !== "preparee") throw new Error(`préparation attendue, reçu ${p.etat}`);
  return p;
};

describe("BAT-PREP — configuration fabricable", () => {
  it("Plexiglass 200 × 100 : spécification résolue, dimensions de la géométrie canonique, workflow et fichiers prévus", () => {
    const p = preparee(preparerBatServeur(ETAT_INITIAL));
    const spec = valeurs(p.specification);
    expect(spec.Famille).toEqual(["Plexiglass / TroGlass Clear", "determine"]);
    expect(spec.Dimensions).toEqual(["200 × 100 mm", "determine"]);
    expect(spec.Format).toEqual(["Sur mesure", "determine"]);
    expect(spec.Procédé?.[0]).toBe("Impression UV à l'envers → découpe");
    expect(spec.Gravure).toEqual(["Sans objet", "sans_objet"]);
    expect(valeurs(p.contenu)).toEqual({ Texte: ["Aucun texte", "sans_objet"], Visuel: ["Aucun visuel", "sans_objet"], Trous: ["Sans trou", "sans_objet"] });
    expect(p.operations.map((o) => o.valeur)).toEqual(["Impression UV · Envers · Noir uniquement", "Découpe laser · Envers"]);
    expect(p.artefacts.map((a) => a.titre)).toEqual(["Couche d'impression UV", "Fichier laser"]);
    expect(valeurs(p.artefacts[0]!.elements)["Contrat de fichier UV"]).toEqual(["En attente", "a_valider"]);
    expect(valeurs(p.artefacts[1]!.elements).Opérations).toEqual(["Découpe", "determine"]);
  });

  it("résultat identique à la chaîne du domaine (resolveSpec → géométrie → planArtifacts) : aucune règle recréée", () => {
    const r = referenceDemo("troglass_metallic");
    const etat = { ...ETAT_INITIAL, famille: "troglass_metallic" as const, largeur: "347", hauteur: "490" };
    const fab = evaluateFabricability(versConfiguration(etat, { productId: PRODUIT_DEMO, variantId: r.variantId, thicknessId: r.thicknessId, fontId: POLICE_DEMO, layoutId: COMPOSITION_DEMO }), CATALOGUE_DEMO);
    if (!fab.ok) throw new Error("fabricable attendu");
    const spec = resolveSpec(fab, CATALOGUE_DEMO);
    if (!spec.ok) throw new Error("spécification attendue");
    const geo = buildCanonicalGeometry({ spec: spec.spec, artwork: null, textePresent: false, engineVersions: ENGINE_VERSIONS });
    if (!geo.ok) throw new Error("géométrie attendue");
    const plan = planArtifacts(spec.spec.workflow.id, spec.spec.workflow.operations, spec.spec.holes.length);
    if (!plan.ok) throw new Error("plan attendu");

    const p = preparee(preparerBatServeur(etat));
    expect(valeurs(p.specification).Dimensions?.[0]).toBe(`${geo.geometry.plate.widthMm} × ${geo.geometry.plate.heightMm} mm`);
    expect(p.operations).toHaveLength(spec.spec.workflow.operations.length);
    expect(plan.plan.map((x) => x.kind)).toEqual(["hybrid"]);
    expect(p.artefacts.map((a) => a.titre)).toEqual(["Fichier hybride · partie laser", "Fichier hybride · partie UV"]);
    expect(valeurs(p.artefacts[0]!.elements).Miroir?.[0]).toMatch(/^Horizontal/);
  });

  it("À VALIDER réellement lisibles : statut atelier des contrats de fichiers requis (non renseigné dans le catalogue de démonstration)", () => {
    const p = preparee(preparerBatServeur(ETAT_INITIAL));
    expect(p.aValider.length).toBeGreaterThan(0);
    expect(p.aValider.every((e) => e.statut === "a_valider" || e.statut === "bloquant")).toBe(true);
    expect(p.aValider.map((e) => e.valeur)).toContain("Statut atelier non renseigné");
  });
});

describe("BAT-PREP — configurations non préparables", () => {
  it("VALIDATION_REQUIRED (texte, trous, CR-2) ⇒ « validation requise », jamais préparée", () => {
    for (const etat of [
      { ...ETAT_INITIAL, lignes: ["Atelier"] },
      { ...ETAT_INITIAL, trous: 4 as const },
      { ...ETAT_INITIAL, famille: "trolase" as const },
    ]) {
      const p = preparerBatServeur(etat);
      expect(p.etat).toBe("validation_requise");
      expect(p.etat === "validation_requise" && p.messages.every((m) => m.niveau === "validation")).toBe(true);
    }
  });

  it("non fabricable (hors VR-25) ⇒ « non fabricable » avec messages à corriger", () => {
    const p = preparerBatServeur({ ...ETAT_INITIAL, largeur: "600" });
    expect(p.etat).toBe("non_fabricable");
    expect(p.etat === "non_fabricable" && p.messages.some((m) => m.niveau === "bloquant")).toBe(true);
  });

  it("entrée absente, incomplète ou hostile ⇒ « saisie invalide » (revalidation serveur, aucun verdict client accepté)", () => {
    for (const entree of [undefined, null, "x", {}, { ...ETAT_INITIAL, largeur: "" }, { ...ETAT_INITIAL, famille: "bois" }, { ...ETAT_INITIAL, statut: "fabricable" }, { ...ETAT_INITIAL, trous: 3 }, { ...ETAT_INITIAL, verdict: { statut: "fabricable" } }]) {
      expect(preparerBatServeur(entree)).toEqual({ etat: "saisie_invalide" });
    }
  });

  it("action serveur : entrée non typée transmise telle quelle à la composition ; erreur interne ⇒ « impossible » sans détail", () => {
    const action = source("src/app/configurateur/actions.ts");
    expect(action).toMatch(/export async function preparerLeBat\(entree: unknown\): Promise<Preparation>/);
    expect(action).toMatch(/return construirePreparationBat\(entree\);/);
    expect(action).toMatch(/catch \{\s*return \{ etat: "impossible" \};/);
  });
});

describe("BAT-PREP — ce n'est pas un BAT", () => {
  const resultats = [ETAT_INITIAL, { ...ETAT_INITIAL, famille: "troglass_metallic" as const }, { ...ETAT_INITIAL, largeur: "600" }, { ...ETAT_INITIAL, lignes: ["A"] }].map((e) => JSON.stringify(preparerBatServeur(e)));

  it("aucun identifiant, numéro, empreinte, prix, expiration, SVG ni version interne dans la réponse", () => {
    for (const r of resultats) {
      expect(r).not.toMatch(/batId|contentHash|geometryHash|integrite|hash|"price"|prix|€|expiresAt|expiration|validatedAt|createdAt|<svg|engineVersions|catalogVersion|ULID|[A-Z]:\\\\|\/home\/|DATABASE_URL|process\.env/i);
    }
  });

  it("aucun appel à createBat / validateBat / enregistrerBat, aucune persistance ni hachage dans la chaîne", () => {
    const serveur = source("src/server/preparation-bat.ts");
    const code = serveur.replace(/^\s*\/\/.*$/gm, "");
    expect(code).not.toMatch(/createBat|preparerBat\(|buildBatDraft|validateBat|enregistrerBat|computePrice|construireArtefacts|buildLaserArtifact|hacher|createHash|nouvelId|drizzle|baseDeDonnees|insert\(|writeFile|localStorage|cookies\(/);
    expect(code).toMatch(/evaluateFabricability/);
    expect(code).toMatch(/resolveSpec/);
    expect(code).toMatch(/buildCanonicalGeometry/);
    expect(code).toMatch(/planArtifacts/);
    expect(code).toMatch(/findPendingValues/);
  });

  it("interface : libellé « Préparation du BAT », mentions non enregistrée / non contractuelle / aucune fabrication, décisions génériques", () => {
    const ui = source("src/components/configurateur/PreparationBat.tsx");
    expect(ui).toMatch(/Préparation du BAT/);
    expect(ui).toMatch(/Validation atelier requise/);
    expect(ui).toMatch(/non enregistrée/);
    expect(ui).toMatch(/Non contractuelle/);
    expect(ui).toMatch(/Aucune fabrication/);
    expect(ui).toMatch(/DECISIONS_BAT_A_FINALISER/);
    expect(ui).not.toMatch(/BAT validé|BAT provisoire|numéro de BAT|N° BAT|bon pour fabrication|Commander|€|Stripe/i);
    expect(source("src/components/configurateur/preparation.ts")).toMatch(/tarification, durée de validité et règles de design/);
  });

  it("aucune table, migration ni route API ajoutée par BAT-PREP", () => {
    const tables = source("src/server/db/schema.ts").match(/mysqlTable\("([a-z_]+)"/g) ?? [];
    expect(tables.join(" ")).not.toMatch(/bat|order|preparation/);
    const fichiers = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = path.join(dir, f);
        return statSync(p).isDirectory() ? fichiers(p) : [p];
      });
    expect(fichiers(path.join(racine, "src/app")).some((f) => /route\.(t|j)sx?$/.test(f))).toBe(false);
    expect(readdirSync(path.join(racine, "drizzle")).filter((f) => f.endsWith(".sql"))).toEqual(["0000_init.sql", "0001_s2_comptes.sql"]);
  });
});
