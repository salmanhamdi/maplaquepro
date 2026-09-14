// Phase 5 (domaine) — BAT brouillon → validation → BAT enregistré → immutabilité ; artefacts régénérables ; fiche de production.
// Les valeurs ouvertes (prix, expiration, versions, statuts de contrats) sont fixées à des valeurs DE TEST fictives,
// uniquement pour exercer le chemin validé : aucune valeur réelle n'est présumée.
import { describe, expect, it } from "vitest";
import {
  acknowledgeWorkflow,
  type BatBrouillon,
  type BatValide,
  type Catalog,
  createBat,
  createBatDraft,
  definie,
  enregistrerBat,
  ficheProduction,
  INITIAL_CATALOG,
  type MaterialVariant,
  regenererArtefacts,
  sansObjet,
  validateBat,
  verifierArtefacts,
  verifierBatEnregistre,
} from "../../src/domain";
import { catalogueTest, referenceTest } from "./fixtures";

const plexi: MaterialVariant = referenceTest({
  id: "test-plexi",
  family: "plexiglass",
  thicknessIds: ["th_3_0"],
  productionWorkflowId: "PLEXIGLASS_UV",
  artworkRulesId: "artwork-PLEXIGLASS_UV",
  politiqueImpression: { valeur: definie("couleur"), cote: definie("face") },
  apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
  capaciteGravure: { cote: sansObjet() },
  dimensionRulesIds: ["test-dim-plexi"],
  mountingRulesId: "mounting-default",
});

const catalogue: Catalog = (() => {
  const base = catalogueTest();
  return {
    ...base,
    references: [...base.references, plexi],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id] })),
    dimensionRules: [
      { id: "test-dim-plexi", variantId: plexi.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" },
    ],
    mountingRules: [...INITIAL_CATALOG.mountingRules],
  };
})();

const hacher = (s: string) => `h${s.length}-${[...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1_000_000_007, 7)}`;

function brouillon(): BatBrouillon {
  const r = createBat({
    input: { configurationVersion: 4, productId: "test-produit", materialVariantId: plexi.id, thicknessId: "th_3_0", format: { mode: "custom", widthMm: 300, heightMm: 200 }, design: { text: null, artwork: null }, mounting: { count: 0 }, quantity: 1 },
    catalog: catalogue,
    identite: { batId: "bat-test", createdAt: "2026-01-01T00:00:00Z", contentHash: "h-bat" },
    engineVersions: { design: "d", mounting: "m", geometry: "g", render: "r", production: "p" },
    previewSvg: "<svg/>",
    hacher,
  });
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.bat;
}

/** Valeurs ouvertes remplacées par des valeurs DE TEST pour exercer la validation. */
function valide(): BatValide {
  const b = brouillon();
  const d = createBatDraft({
    ...b,
    expiresAt: definie("2026-02-01T00:00:00Z"),
    price: definie({ test: true }),
    versions: { ...b.versions, pricingVersion: definie("test"), designRulesVersion: definie("test") },
    productionContracts: [
      { contractId: "PRODUCTION_SVG_CONTRACT_v1", conformite: "conforme", validationAtelier: definie("validee"), preuveValidationAtelier: "preuve de test" },
      { contractId: "PRODUCTION_UV_CONTRACT_v1", conformite: "conforme", validationAtelier: definie("validee"), preuveValidationAtelier: "preuve de test" },
    ],
  });
  if (!d.ok) throw new Error(JSON.stringify(d.violations));
  const ack = acknowledgeWorkflow(d.bat, "2026-01-01T10:00:00Z");
  if (!ack.ok) throw new Error("ack");
  const v = validateBat(ack.bat, "2026-01-01T10:05:00Z");
  if (!v.ok) throw new Error(JSON.stringify(v.violations));
  return v.bat;
}

describe("Phase 5 — artefacts régénérables depuis le BAT (§15)", () => {
  it("régénération ≡ artefacts stockés, à partir des seules données du BAT", () => {
    const b = brouillon();
    const r = regenererArtefacts(b, hacher);
    expect(r.ok && r.artifacts).toEqual(b.artifacts);
    expect(verifierArtefacts(b, hacher)).toEqual([]);
  });

  it("indépendante du catalogue courant : aucun paramètre catalogue n'est utilisé", () => {
    expect(regenererArtefacts.length).toBeLessThanOrEqual(3);
    const b = brouillon();
    const catalogueMute = { ...catalogue, catalogVersion: "9.9.9", machines: [] };
    expect(catalogueMute.catalogVersion).not.toBe(b.versions.catalogVersion);
    expect(verifierArtefacts(b, hacher)).toEqual([]);
  });

  it("artefact stocké altéré ⇒ BAT_ARTIFACTS_MISMATCH ; géométrie altérée ⇒ BAT_GEOMETRY_HASH_MISMATCH", () => {
    const b = brouillon();
    const [laser] = b.artifacts;
    const altere = { ...b, artifacts: [{ ...laser!, hash: "autre" }, ...b.artifacts.slice(1)] } as BatBrouillon;
    expect(verifierArtefacts(altere, hacher).map((v) => v.code)).toEqual(["BAT_ARTIFACTS_MISMATCH"]);
    const geo = b.geometryJson as { plate: { widthMm: number } };
    const geoAlteree = { ...b, geometryJson: { ...(b.geometryJson as object), plate: { ...geo.plate, widthMm: 301 } } } as BatBrouillon;
    expect(verifierArtefacts(geoAlteree, hacher).map((v) => v.code)).toEqual(["BAT_GEOMETRY_HASH_MISMATCH"]);
  });
});

describe("Phase 5 — BAT enregistré / finalisé (§15, G2-D1)", () => {
  it("brouillon ⇒ BAT_NOT_VALIDATED ; aucun enregistrement", () => {
    expect(enregistrerBat(brouillon(), hacher)).toEqual({ ok: false, violations: [expect.objectContaining({ code: "BAT_NOT_VALIDATED" })] });
  });

  it("BAT validé ⇒ enregistré, gelé en profondeur, empreinte vérifiable", () => {
    const r = enregistrerBat(valide(), hacher);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(Object.isFrozen(r.enregistre) && Object.isFrozen(r.enregistre.bat) && Object.isFrozen(r.enregistre.bat.spec.plate)).toBe(true);
    expect(verifierBatEnregistre(r.enregistre, hacher)).toEqual([]);
    expect(() => {
      (r.enregistre.bat.spec.plate as { widthMm: number }).widthMm = 1;
    }).toThrow();
  });

  it("altération d'un BAT enregistré (copie modifiée) ⇒ BAT_INTEGRITY_MISMATCH", () => {
    const r = enregistrerBat(valide(), hacher);
    if (!r.ok) throw new Error("attendu enregistré");
    const copie = structuredClone(r.enregistre) as { bat: BatValide; integrite: string };
    (copie.bat.spec.plate as { widthMm: number }).widthMm = 301;
    expect(verifierBatEnregistre(copie, hacher).map((v) => v.code)).toEqual(["BAT_INTEGRITY_MISMATCH"]);
  });

  it("BAT validé immuable : toute modification ⇒ BAT_IMMUTABLE (nouveau BAT requis)", () => {
    const v = valide();
    expect(acknowledgeWorkflow(v, "t").ok).toBe(false);
  });

  it("artefacts altérés avant enregistrement ⇒ refus", () => {
    const v = valide();
    const altere = structuredClone(v) as BatValide & { artifacts: Array<{ hash: string }> };
    altere.artifacts[0]!.hash = "autre";
    expect(enregistrerBat(altere, hacher)).toEqual({ ok: false, violations: [expect.objectContaining({ code: "BAT_ARTIFACTS_MISMATCH" })] });
  });
});

describe("Phase 5 — fiche de production dérivée du BAT validé", () => {
  it("brouillon ⇒ BAT_NOT_VALIDATED", () => {
    expect(ficheProduction(brouillon()).ok).toBe(false);
  });

  it("projection exacte des données figées du BAT (plaque, opérations, poses, artefacts, hash), gelée", () => {
    const v = valide();
    const r = ficheProduction(v);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const f = r.fiche;
    expect(Object.isFrozen(f)).toBe(true);
    expect(f.batId).toBe("bat-test");
    expect(f.plaque).toEqual({ widthMm: 300, heightMm: 200, cornerRadiusMm: 0, formatMode: "custom" });
    expect(f.operations.map((o) => [o.sequence, o.type, o.machineId, o.cote, o.encre])).toEqual([
      [1, "laser_cut", "SPEEDY_400", "face", null],
      [2, "uv_print", "ARTISJET_3000U", "face", "couleur"],
    ]);
    expect(f.poses).toEqual(v.spec.posesParOperation);
    expect(f.artefacts).toEqual([
      { kind: "laser", contractId: "PRODUCTION_SVG_CONTRACT_v1", cote: "face", miroir: "none", hash: (v.artifacts[0] as { hash: string }).hash },
      { kind: "uv", contractId: "PRODUCTION_UV_CONTRACT_v1", cote: "face", status: "contract_pending", hash: (v.artifacts[1] as { hash: string }).hash },
    ]);
    expect([f.geometryHash, f.workflowAcknowledgedAt, f.validatedAt]).toEqual([v.geometryHash, "2026-01-01T10:00:00Z", "2026-01-01T10:05:00Z"]);
  });

  it("déterministe ; BAT source non modifié", () => {
    const v = valide();
    expect(ficheProduction(v)).toEqual(ficheProduction(v));
  });
});
