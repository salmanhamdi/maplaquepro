// Versions des 5 moteurs (option A) : source unique, valeurs initiales, transport vers la géométrie canonique.
// Aucun snapshot exhaustif des sorties internes : seules les sorties contractuelles déterminantes sont protégées.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildCanonicalGeometry, canonicalJson, ENGINE_VERSIONS, engineVersionsSchema, evaluateFabricability, parseConfiguration, resolveSpec } from "../../src/domain";
import { CATALOGUE_DEMO, referenceDemo } from "../../src/server/catalogue-demo";

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

const ref = referenceDemo("plexiglass");
const configuration = {
  configurationVersion: 4,
  productId: "plaque-demonstration",
  materialVariantId: ref.variantId,
  thicknessId: ref.thicknessId,
  format: { mode: "custom", widthMm: 200, heightMm: 100 },
  design: { text: null, artwork: null },
  mounting: { count: 0 },
  quantity: 1,
};

function spec() {
  const fab = evaluateFabricability(configuration, CATALOGUE_DEMO);
  if (!fab.ok) throw new Error(JSON.stringify(fab.violations));
  const r = resolveSpec(fab, CATALOGUE_DEMO);
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.spec;
}

const geometrie = (engineVersions: unknown) => buildCanonicalGeometry({ spec: spec(), artwork: null, textePresent: false, engineVersions });

describe("ENGINE_VERSIONS — source unique", () => {
  it("complet : exactement les 5 moteurs, accepté par le schéma de la géométrie canonique", () => {
    expect(Object.keys(ENGINE_VERSIONS).sort()).toEqual(["design", "geometry", "mounting", "production", "render"]);
    expect(engineVersionsSchema.safeParse(ENGINE_VERSIONS).success).toBe(true);
  });

  it("valeurs initiales « 1 » pour les 5 moteurs, non modifiables", () => {
    expect(ENGINE_VERSIONS).toEqual({ design: "1", mounting: "1", geometry: "1", render: "1", production: "1" });
    expect(Object.isFrozen(ENGINE_VERSIONS)).toBe(true);
  });

  it("aucune autre déclaration de ces valeurs dans src/domain (pas de duplication)", () => {
    const dossier = "src/domain";
    const fichiers = readdirSync(dossier).filter((f) => f.endsWith(".ts") && f !== "versions-moteurs.ts");
    for (const f of fichiers) {
      expect(readFileSync(join(dossier, f), "utf8")).not.toMatch(/ENGINE_VERSIONS\s*[:=]|design:\s*"1"/);
    }
  });
});

describe("ENGINE_VERSIONS — transport vers la géométrie canonique", () => {
  it("la géométrie canonique reçoit et porte les versions de la source unique", () => {
    const r = geometrie(ENGINE_VERSIONS);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.geometry.engineVersions).toEqual(ENGINE_VERSIONS);
  });

  it("déterministe : même entrée ⇒ même JSON canonique et même geometryHash (SHA-256)", () => {
    const a = geometrie(ENGINE_VERSIONS);
    const b = geometrie(ENGINE_VERSIONS);
    if (!a.ok || !b.ok) throw new Error("géométrie attendue");
    expect(canonicalJson(a.geometry)).toBe(canonicalJson(b.geometry));
    expect(sha256(canonicalJson(a.geometry))).toBe(sha256(canonicalJson(b.geometry)));
    expect(sha256(canonicalJson(a.geometry))).toMatch(/^[0-9a-f]{64}$/);
  });

  it("entrée explicitement incomplète ⇒ ENGINE_VERSION_MISSING, aucune valeur de repli depuis la source", () => {
    const { render: _r, ...sansRender } = ENGINE_VERSIONS;
    const incomplet = geometrie(sansRender);
    expect(!incomplet.ok && incomplet.violations.map((v) => `${v.code}@${v.path}`)).toEqual(["ENGINE_VERSION_MISSING@engineVersions.render"]);
    const vide = geometrie({ ...ENGINE_VERSIONS, design: "" });
    expect(!vide.ok && vide.violations.map((v) => v.code)).toEqual(["ENGINE_VERSION_MISSING"]);
    const absent = geometrie(undefined);
    expect(absent.ok).toBe(false);
  });

  it("aucune version de moteur ne provient du client : champ refusé par le contrat de configuration", () => {
    const r = parseConfiguration({ ...configuration, engineVersions: ENGINE_VERSIONS });
    expect(!r.ok && r.violations.map((v) => `${v.code}@${v.path}`)).toEqual(["UNKNOWN_FIELD@engineVersions"]);
  });
});
