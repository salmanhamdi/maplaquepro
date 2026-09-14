// Préparation du brouillon de BAT de bout en bout. Catalogue, hachage et identifiants de TEST fictifs.
import { describe, expect, it } from "vitest";
import {
  batValidationViolations,
  type Catalog,
  canonicalJson,
  definie,
  evaluateFabricability,
  findPendingValues,
  INITIAL_CATALOG,
  type MaterialVariant,
  preparerBat,
  sansObjet,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "./fixtures";

const plexi: MaterialVariant = referenceTest({
  id: "test-plexi",
  family: "plexiglass",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "PLEXIGLASS_UV",
  artworkRulesId: "artwork-PLEXIGLASS_UV",
  politiqueImpression: { valeur: definie("couleur"), cote: definie("envers") },
  apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  dimensionRulesIds: ["test-dim-plexi"],
  mountingRulesId: "mounting-default",
});

const troglass: MaterialVariant = referenceTest({
  id: "test-troglass",
  family: "troglass_metallic",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "TROGLASS_METALLIC_HYBRID",
  artworkRulesId: "artwork-TROGLASS_METALLIC_HYBRID",
  politiqueImpression: { valeur: definie("noir_uniquement"), cote: definie("envers") },
  capaciteGravure: { cote: definie("envers") },
  dimensionRulesIds: ["test-dim-troglass"],
  mountingRulesId: "mounting-default",
});

const bornes = (id: string, variantId: string) => ({
  id,
  variantId,
  thicknessId: "th_3_0" as const,
  minWidthMm: definie(50),
  maxWidthMm: definie(600),
  minHeightMm: definie(50),
  maxHeightMm: definie(600),
  statut: "active" as const,
});

const catalogue: Catalog = (() => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, plexi, troglass],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id, troglass.id] })),
    dimensionRules: [bornes("test-dim-plexi", plexi.id), bornes("test-dim-troglass", troglass.id)],
    mountingRules: [...INITIAL_CATALOG.mountingRules],
  };
})();

const fabricable = (ref: MaterialVariant, o: Record<string, unknown> = {}) => {
  const r = evaluateFabricability(
    { configurationVersion: 4, productId: "test-produit", materialVariantId: ref.id, thicknessId: "th_3_0", format: { mode: "custom", widthMm: 300, heightMm: 200 }, design: { text: null, artwork: null }, mounting: { count: 0 }, quantity: 1, ...o },
    catalogue,
  );
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r;
};

/** Hachage FICTIF de test (le domaine ne choisit aucun algorithme, P7). */
const hacher = (contenu: string) => `h${contenu.length}`;

const entree = (ref: MaterialVariant) => ({
  fabricable: fabricable(ref),
  catalog: catalogue,
  identite: { batId: "bat-test", createdAt: "2026-01-01T00:00:00Z", contentHash: "h-bat" },
  engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" },
  previewSvg: "<svg/>",
  hacher,
});

describe("preparerBat — chaîne complète jusqu'au brouillon de BAT", () => {
  it("Plexiglass : géométrie canonique dans le BAT, hash de géométrie par la fonction fournie, artefacts laser + UV contract_pending", () => {
    const r = preparerBat(entree(plexi));
    expect(r.ok).toBe(true);
    if (!r.ok || !r.geometry) return;
    expect(r.bat.geometryJson).toEqual(r.geometry);
    expect(r.bat.geometryHash).toBe(hacher(canonicalJson(r.geometry)));
    expect(r.bat.artifacts.map((a) => a.kind)).toEqual(["uv", "laser"]);
    const [uv, laser] = r.bat.artifacts;
    expect(laser?.kind === "laser" && laser.hash).toBe(laser?.kind === "laser" ? hacher(laser.svg) : "");
    expect(laser?.kind === "laser" && laser.svg).toContain(`data-geometry-hash="${r.bat.geometryHash}"`);
    expect(uv).toMatchObject({ kind: "uv", status: "contract_pending", cote: "envers", miroir: "x", encre: "couleur" });
    expect(laser).toMatchObject({ kind: "laser", cote: "envers", miroir: "none" });
  });

  it("TroGlass : artefact hybride (laser envers + UV noir envers), enregistrement À VALIDER ⇒ BAT non validable (P7)", () => {
    const r = preparerBat(entree(troglass));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const [hybride] = r.bat.artifacts;
    expect(hybride).toMatchObject({ kind: "hybrid", contractId: "HYBRID_TROGLASS_METALLIC", laserArtifact: { cote: "envers", miroir: "x" }, uvArtifact: { cote: "envers", encre: "noir_uniquement", status: "contract_pending" } });
    expect(findPendingValues(r.bat)).toContain("artifacts.0.metadata.registration");
    expect(batValidationViolations(r.bat).some((v) => v.code === "VALIDATION_REQUIRED")).toBe(true);
  });

  it("points ouverts conservés : expiration, prix, versions À VALIDER ; statuts de contrats absents", () => {
    const r = preparerBat(entree(plexi));
    expect(r.ok && r.enAttente?.sort()).toEqual(["expiresAt", "price", "versions.designRulesVersion", "versions.pricingVersion"]);
    expect(r.ok && batValidationViolations(r.bat).filter((v) => v.code === "CONTRACT_STATUS_MISSING")).toHaveLength(2);
  });

  it("texte présent sans tracés ⇒ VALIDATION_REQUIRED (géométrie), aucun BAT partiel", () => {
    const e = { ...entree(plexi), fabricable: { ...fabricable(plexi), configuration: { ...fabricable(plexi).configuration, design: { text: { lines: ["AB"], fontId: "test-font", layoutId: "test-layout", alignment: "center" as const }, artwork: null } } } };
    const r = preparerBat(e);
    expect(!r.ok && r.violations.map((v) => `${v.code}@${v.path}`)).toEqual(["VALIDATION_REQUIRED@layers.text"]);
  });

  it("déterministe ; résultat fabricable non modifié", () => {
    const e = entree(troglass);
    const avant = structuredClone(e.fabricable);
    expect(preparerBat(e)).toEqual(preparerBat(e));
    expect(e.fabricable).toEqual(avant);
  });
});
