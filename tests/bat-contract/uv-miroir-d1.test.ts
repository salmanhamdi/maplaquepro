// Arbitrage D1 (§14.3) : l'artefact UV porte explicitement son miroir, repris du plan d'artefacts. V-3 : D1 étendue à PLEXIGLASS_UV
// (UV envers en miroir) ; V-2 : la découpe Plexiglass côté envers ne porte aucun miroir (côté ≠ miroir).
// Aucun contenu ni format UV inventé (VR-33 ouvert) ; calage hybride À VALIDER inchangé. Données de TEST fictives.
import { describe, expect, it } from "vitest";
import { type BatBrouillon, type Catalog, createBat, definie, INITIAL_CATALOG, type MaterialVariant, productionArtifactSchema, regenererArtefacts, sansObjet } from "../../src/domain";
import { catalogueTest, referenceTest } from "../domain/fixtures";

const plexi: MaterialVariant = referenceTest({
  id: "test-plexi",
  family: "plexiglass",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "PLEXIGLASS_UV",
  artworkRulesId: "artwork-PLEXIGLASS_UV",
  politiqueImpression: { valeur: definie("couleur"), cote: definie("envers") },
  apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  dimensionRulesIds: ["dim-plexi"],
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
  dimensionRulesIds: ["dim-troglass"],
  mountingRulesId: "mounting-default",
});
const bornes = (id: string, variantId: string) => ({ id, variantId, thicknessId: "th_3_0" as const, minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" as const });
const catalogue: Catalog = (() => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, plexi, troglass],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id, troglass.id] })),
    dimensionRules: [bornes("dim-plexi", plexi.id), bornes("dim-troglass", troglass.id)],
    mountingRules: [...INITIAL_CATALOG.mountingRules],
  };
})();
const hacher = (s: string) => `h${s.length}-${[...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1_000_000_007, 7)}`;

const bat = (ref: MaterialVariant): BatBrouillon => {
  const r = createBat({
    input: { configurationVersion: 4, productId: "test-produit", materialVariantId: ref.id, thicknessId: "th_3_0", format: { mode: "custom", widthMm: 300, heightMm: 200 }, design: { text: null, artwork: null }, mounting: { count: 0 }, quantity: 1 },
    catalog: catalogue,
    identite: { batId: "bat-d1", createdAt: "2026-01-01T00:00:00Z", contentHash: "h" },
    engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" },
    previewSvg: "<svg/>",
    hacher,
  });
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.bat;
};

describe("D1 — miroir porté par l'artefact UV", () => {
  it("TroGlass hybride : UV et laser côté envers avec le même miroir X, calage toujours À VALIDER", () => {
    const [h] = bat(troglass).artifacts;
    if (h?.kind !== "hybrid") throw new Error("artefact hybride attendu");
    expect([h.laserArtifact.cote, h.laserArtifact.miroir]).toEqual(["envers", "x"]);
    expect([h.uvArtifact.cote, h.uvArtifact.miroir]).toEqual(["envers", "x"]);
    expect(h.uvArtifact.miroir).toBe(h.laserArtifact.miroir);
    expect(h.metadata.registration).toEqual({ etat: "A_VALIDER" });
  });

  it("Plexiglass (V-3, V-2) : UV envers en miroir X ; découpe laser côté envers sans miroir ; ordre UV puis laser", () => {
    const artefacts = bat(plexi).artifacts;
    expect(artefacts.map((a) => a.kind)).toEqual(["uv", "laser"]);
    const [uv, laser] = artefacts;
    if (laser?.kind !== "laser" || uv?.kind !== "uv") throw new Error("artefacts attendus");
    expect([uv.cote, uv.miroir]).toEqual(["envers", "x"]);
    expect([laser.cote, laser.miroir]).toEqual(["envers", "none"]);
    expect(laser.svg).toContain('data-side="reverse" data-mirrored="none"');
  });

  it("Plexiglass : déterminisme et régénération depuis le BAT identiques, miroir UV compris", () => {
    const b = bat(plexi);
    const r = regenererArtefacts(b, hacher);
    expect(r.ok && r.artifacts).toEqual(b.artifacts);
    expect(bat(plexi).artifacts).toEqual(b.artifacts);
  });

  it("contenu UV inchangé : statut contract_pending, aucun payload, couche d'impression canonique", () => {
    const [h] = bat(troglass).artifacts;
    if (h?.kind !== "hybrid") throw new Error("artefact hybride attendu");
    expect(h.uvArtifact.status).toBe("contract_pending");
    expect("payload" in h.uvArtifact).toBe(false);
  });

  it("schéma : artefact UV sans miroir ou avec un miroir inconnu refusé", () => {
    const uv = { kind: "uv", contractId: "PRODUCTION_UV_CONTRACT_v1", status: "contract_pending", cote: "envers", miroir: "x", encre: "noir_uniquement", canonicalPrintLayer: [], hash: "h" };
    expect(productionArtifactSchema.safeParse(uv).success).toBe(true);
    const { miroir: _m, ...sansMiroir } = uv;
    expect(productionArtifactSchema.safeParse(sansMiroir).success).toBe(false);
    expect(productionArtifactSchema.safeParse({ ...uv, miroir: "y" }).success).toBe(false);
  });

  it("déterminisme et régénération : artefacts régénérés depuis le BAT identiques, miroir compris", () => {
    const b = bat(troglass);
    const r = regenererArtefacts(b, hacher);
    expect(r.ok && r.artifacts).toEqual(b.artifacts);
    expect(bat(troglass).artifacts).toEqual(b.artifacts);
  });
});
