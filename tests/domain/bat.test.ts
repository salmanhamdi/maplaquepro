// Données de TEST uniquement : références, prix, dates et hash fictifs ; aucune valeur atelier ni commerciale.
import { describe, expect, it } from "vitest";
import {
  acceptTransformation,
  acknowledgeWarning,
  acknowledgeWorkflow,
  aValider,
  type BatBrouillon,
  batValidationViolations,
  type Catalog,
  confirmArtwork,
  createBatDraft,
  definie,
  evaluateFabricability,
  INITIAL_CATALOG,
  type MaterialVariant,
  resolveSpec,
  sansObjet,
  validateBat,
} from "../../src/domain";
import { catalogueTest, geometrieCanoniqueTest, referenceTest } from "./fixtures";

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

function specTest() {
  const base = catalogueTest();
  const catalog: Catalog = {
    ...base,
    references: [...base.references, plexi],
    products: base.products.map((p) => ({ ...p, allowedVariantIds: [...p.allowedVariantIds, plexi.id] })),
    dimensionRules: [
      { id: "test-dim-plexi", variantId: plexi.id, thicknessId: "th_3_0", minWidthMm: definie(50), maxWidthMm: definie(600), minHeightMm: definie(50), maxHeightMm: definie(600), statut: "active" },
    ],
    mountingRules: [...INITIAL_CATALOG.mountingRules],
  };
  const fab = evaluateFabricability(
    {
      configurationVersion: 4,
      productId: "test-produit",
      materialVariantId: plexi.id,
      thicknessId: "th_3_0",
      format: { mode: "custom", widthMm: 300, heightMm: 200 },
      design: { text: null, artwork: null },
      mounting: { count: 0 },
      quantity: 1,
    },
    catalog,
  );
  if (!fab.ok) throw new Error(JSON.stringify(fab.violations));
  const spec = resolveSpec(fab, catalog);
  if (!spec.ok) throw new Error(JSON.stringify(spec.violations));
  return spec.spec;
}

/** Brouillon dont tous les éléments OPEN sont fixés à des valeurs DE TEST, pour exercer la validation. */
const brouillon = (o: Partial<BatBrouillon> = {}): unknown => ({
  status: "draft",
  batId: "bat-test",
  contentHash: "h-contenu",
  createdAt: "2026-01-01T00:00:00Z",
  expiresAt: definie("2026-02-01T00:00:00Z"),
  versions: {
    configurationVersion: 4,
    catalogVersion: "0.1.0",
    pricingVersion: definie("test"),
    designRulesVersion: definie("test"),
    engineVersions: { design: "t", mounting: "t", geometry: "t", render: "t", production: "t" },
  },
  // Statuts DE TEST : validation atelier fictive, pour exercer les autres invariants
  productionContracts: [
    { contractId: "PRODUCTION_SVG_CONTRACT_v1", conformite: "conforme", validationAtelier: definie("validee"), preuveValidationAtelier: "preuve de test" },
    { contractId: "PRODUCTION_UV_CONTRACT_v1", conformite: "conforme", validationAtelier: definie("validee"), preuveValidationAtelier: "preuve de test" },
  ],
  spec: specTest(),
  holes: { pattern: { count: 0 } },
  text: null,
  artwork: null,
  geometryJson: geometrieCanoniqueTest(),
  geometryHash: "h-geo",
  previewSvg: "<svg/>",
  artifacts: [],
  price: definie({ totalCentimes: 1 }),
  warnings: [],
  confirmations: { warningsAcknowledged: [], transformationsAcceptees: [] },
  ...o,
});

const draft = (o: Partial<BatBrouillon> = {}): BatBrouillon => {
  const r = createBatDraft(brouillon(o));
  if (!r.ok) throw new Error(JSON.stringify(r.violations));
  return r.bat;
};

const artwork = (transformations: BatBrouillon["artwork"] extends infer A ? (A extends { transformations: infer T } ? T : never) : never) => ({
  artworkRef: "a",
  artworkHash: "h-original",
  normalizedHash: "h-normalise",
  mime: "image/svg+xml",
  placement: { artworkRef: "a", xMm: 10, yMm: 10, widthMm: 50, heightMm: 50, rotationDeg: 0 as const },
  modeCouleurApplique: "selon_politique_impression_reference" as const,
  transformations,
});

const code = (r: { ok: boolean; violations?: { code: string }[] }) => (r.ok ? [] : r.violations!.map((v) => v.code));

describe("BAT — structure (§15, Annexe A)", () => {
  it("brouillon valide au schéma ; champ inconnu ou prix client refusé", () => {
    expect(createBatDraft(brouillon()).ok).toBe(true);
    expect(code(createBatDraft({ ...(brouillon() as object), prixClient: 1 }))).toContain("BAT_INVALID");
  });

  it("spécification résolue contenant un À VALIDER refusée dès la structure (P7)", () => {
    const spec = specTest();
    const r = createBatDraft(brouillon({ spec: { ...spec, apparence: { ...spec.apparence, finition: aValider() } } as never }));
    expect(r.ok).toBe(false);
  });
});

describe("BAT — validation (P7, §15)", () => {
  it("prix, expiration et version des règles de design À VALIDER ⇒ validation refusée, jamais présumée", () => {
    const b = draft({ price: aValider(), expiresAt: aValider(), versions: { ...draft().versions, designRulesVersion: aValider() } });
    const r = validateBat(acknowledgeWorkflow(b, "t").ok ? (acknowledgeWorkflow(b, "t") as { bat: BatBrouillon }).bat : b, "t");
    expect(!r.ok && r.violations.map((v) => v.path).sort()).toEqual(["expiresAt", "price", "versions.designRulesVersion"]);
  });

  it("G2-D12 : avec contexte, expiresAt calculé depuis validatedAt (15 j, ou 7 j client inscrit) ; sans contexte, À VALIDER refusé", () => {
    const b = (acknowledgeWorkflow(draft({ expiresAt: aValider() }), "t") as { bat: BatBrouillon }).bat;
    expect(code(validateBat(b, "2026-03-02T10:00:00.000Z"))).toEqual(["VALIDATION_REQUIRED"]);
    const standard = validateBat(b, "2026-03-02T10:00:00.000Z", { clientInscrit: false });
    expect(standard.ok && [standard.bat.validatedAt, standard.bat.expiresAt]).toEqual(["2026-03-02T10:00:00.000Z", { etat: "DEFINIE", valeur: "2026-03-17T10:00:00.000Z" }]);
    const inscrit = validateBat(b, "2026-03-02T10:00:00.000Z", { clientInscrit: true });
    expect(inscrit.ok && inscrit.bat.expiresAt).toEqual({ etat: "DEFINIE", valeur: "2026-03-09T10:00:00.000Z" });
    expect(code(validateBat(b, "t", { clientInscrit: false }))).toEqual(["HORODATAGE_INVALIDE"]);
    expect(b.expiresAt).toEqual({ etat: "A_VALIDER" });
  });

  it("validation atelier d'un contrat À VALIDER (VR-42) ⇒ BAT non validable", () => {
    const b = draft({ productionContracts: [{ contractId: "PRODUCTION_SVG_CONTRACT_v1", conformite: "conforme", validationAtelier: aValider() }] });
    expect(batValidationViolations(b).map((v) => v.path)).toContain("productionContracts.0.validationAtelier");
  });

  it("procédé non confirmé ⇒ WORKFLOW_NOT_ACKNOWLEDGED", () => {
    expect(code(validateBat(draft(), "t"))).toEqual(["WORKFLOW_NOT_ACKNOWLEDGED"]);
  });

  it("avertissement non accepté ⇒ refus ; accepté ⇒ validable", () => {
    const b = (acknowledgeWorkflow(draft({ warnings: ["w1"] }), "t") as { bat: BatBrouillon }).bat;
    expect(code(validateBat(b, "t"))).toEqual(["WARNING_NOT_ACKNOWLEDGED"]);
    const ok = acknowledgeWarning(b, "w1");
    expect(ok.ok && validateBat(ok.bat, "t").ok).toBe(true);
  });

  it("brouillon complet et confirmé ⇒ BAT validé, horodaté", () => {
    const b = (acknowledgeWorkflow(draft(), "2026-01-01T10:00:00Z") as { bat: BatBrouillon }).bat;
    const r = validateBat(b, "2026-01-01T10:05:00Z");
    expect(r.ok && [r.bat.status, r.bat.validatedAt]).toEqual(["validated", "2026-01-01T10:05:00Z"]);
  });
});

describe("BAT — transformations d'artwork (ART-1)", () => {
  const avec = (categorie: ReturnType<typeof definie<"A" | "B" | "C">> | ReturnType<typeof aValider>, visible = true) =>
    (acknowledgeWorkflow(draft({ artwork: artwork([{ id: "t1", description: "conversion", visible, categorie: categorie as never }]) }), "t") as { bat: BatBrouillon }).bat;

  it("catégorie À VALIDER (ART1-DOC) ⇒ validation refusée, aucune catégorie présumée", () => {
    expect(code(validateBat(avec(aValider()), "t"))).toEqual(["VALIDATION_REQUIRED"]);
  });

  it("catégorie B visible : acceptation client obligatoire avant validation (ART1-D1)", () => {
    const b = avec(definie("B"));
    expect(code(validateBat(b, "t"))).toEqual(["TRANSFORMATION_NOT_ACCEPTED"]);
    const accepte = acceptTransformation(b, "t1");
    expect(accepte.ok && validateBat(accepte.bat, "t").ok).toBe(true);
  });

  it("catégorie C ⇒ refus (aucun traitement automatique) ; catégorie A visible ⇒ incohérente", () => {
    expect(code(validateBat(avec(definie("C")), "t"))).toEqual(["TRANSFORMATION_NOT_ALLOWED"]);
    expect(code(validateBat(avec(definie("A"), true), "t"))).toEqual(["TRANSFORMATION_CATEGORY_INCONSISTENT"]);
    expect(validateBat(avec(definie("A"), false), "t").ok).toBe(true);
  });

  it("transformation inconnue ⇒ rejet", () => {
    expect(code(acceptTransformation(avec(definie("B")), "inconnue"))).toEqual(["TRANSFORMATION_UNKNOWN"]);
  });

  it("original et version normalisée distincts conservés au BAT (ART1-D3)", () => {
    const b = avec(definie("A"), false);
    expect([b.artwork?.artworkHash, b.artwork?.normalizedHash]).toEqual(["h-original", "h-normalise"]);
  });
});

describe("BAT — immuabilité après validation (G-2, ART1-D4)", () => {
  const valide = () => {
    const r = validateBat((acknowledgeWorkflow(draft(), "t") as { bat: BatBrouillon }).bat, "t");
    if (!r.ok) throw new Error("attendu validé");
    return r.bat;
  };

  it("toute confirmation ou modification sur un BAT validé ⇒ BAT_IMMUTABLE", () => {
    const v = valide();
    expect(code(acknowledgeWorkflow(v, "t2"))).toEqual(["BAT_IMMUTABLE"]);
    expect(code(confirmArtwork(v, "t2"))).toEqual(["BAT_IMMUTABLE"]);
    expect(code(acceptTransformation(v, "t1"))).toEqual(["BAT_IMMUTABLE"]);
    expect(code(validateBat(v, "t2"))).toEqual(["BAT_IMMUTABLE"]);
  });

  it("BAT validé gelé en profondeur : aucune mutation possible", () => {
    const v = valide();
    expect(Object.isFrozen(v)).toBe(true);
    expect(Object.isFrozen(v.spec.plate)).toBe(true);
    expect(() => {
      (v.spec.plate as { widthMm: number }).widthMm = 999;
    }).toThrow();
  });

  it("la validation ne modifie pas le brouillon d'origine", () => {
    const b = (acknowledgeWorkflow(draft(), "t") as { bat: BatBrouillon }).bat;
    validateBat(b, "t");
    expect(b.status).toBe("draft");
    expect(Object.isFrozen(b)).toBe(false);
  });
});
