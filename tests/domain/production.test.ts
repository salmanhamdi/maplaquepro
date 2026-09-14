import { describe, expect, it } from "vitest";
import {
  aValider,
  checkInkForReference,
  definie,
  mirrorX,
  planArtifacts,
  PRODUCTION_WORKFLOWS,
  productionArtifactSchema,
  resolveWorkflow,
  sansObjet,
} from "../../src/domain";
import { referenceTest } from "./fixtures";

const workflow = (id: string) => PRODUCTION_WORKFLOWS.find((w) => w.id === id)!;

const plexi = (valeur: "noir_uniquement" | "couleur") =>
  referenceTest({
    id: "test-plexi",
    family: "plexiglass",
    productionWorkflowId: "PLEXIGLASS_UV",
    politiqueImpression: { valeur: definie(valeur), cote: definie("face") },
    apparence: { couleurSurface: definie({ name: "t", hex: "#FFFFFF" }), finition: definie("t"), couleurRevelee: sansObjet() },
    capaciteGravure: { cote: sansObjet() },
  });
const troglass = (valeur: "noir_uniquement" | "couleur" = "noir_uniquement") =>
  referenceTest({
    id: "test-troglass",
    family: "troglass_metallic",
    productionWorkflowId: "TROGLASS_METALLIC_HYBRID",
    politiqueImpression: { valeur: definie(valeur), cote: definie("envers") },
    capaciteGravure: { cote: definie("envers") },
  });

describe("resolveWorkflow (Annexe B étape 2, P7 D5)", () => {
  it("encre UV dérivée de la politique de la référence ; aucune encre sur le laser", () => {
    const r = resolveWorkflow(workflow("PLEXIGLASS_UV"), plexi("couleur"));
    expect(r.ok && r.operations.map((o) => [o.type, o.encre])).toEqual([
      ["laser_cut", null],
      ["uv_print", "couleur"],
    ]);
    const n = resolveWorkflow(workflow("PLEXIGLASS_UV"), plexi("noir_uniquement"));
    expect(n.ok && n.operations[1]!.encre).toBe("noir_uniquement");
  });

  it("politique À VALIDER ⇒ VALIDATION_REQUIRED, aucune encre présumée", () => {
    const ref = { ...plexi("couleur"), politiqueImpression: { valeur: aValider<"couleur">(), cote: definie("face" as const) } };
    const r = resolveWorkflow(workflow("PLEXIGLASS_UV"), ref);
    expect(!r.ok && r.violations.map((v) => v.code)).toEqual(["VALIDATION_REQUIRED"]);
  });

  it("TroGlass : encre couleur ⇒ INVALID_INK_POLICY, jamais corrigée", () => {
    expect(resolveWorkflow(workflow("TROGLASS_METALLIC_HYBRID"), troglass()).ok).toBe(true);
    const r = resolveWorkflow(workflow("TROGLASS_METALLIC_HYBRID"), troglass("couleur"));
    expect(!r.ok && r.violations.map((v) => v.code)).toEqual(["INVALID_INK_POLICY"]);
    expect(checkInkForReference(troglass(), "couleur").map((v) => v.code)).toEqual(["INVALID_INK_POLICY"]);
    expect(checkInkForReference(plexi("couleur"), "couleur")).toEqual([]);
  });

  it("le workflow vient de la référence", () => {
    const r = resolveWorkflow(workflow("PLEXIGLASS_UV"), referenceTest());
    expect(!r.ok && r.violations.map((v) => v.code)).toContain("WORKFLOW_REFERENCE_MISMATCH");
  });

  it("gravure laser : aucune impression, aucune encre", () => {
    const r = resolveWorkflow(workflow("TROLASE_ENGRAVE"), referenceTest());
    expect(r.ok && r.operations.every((o) => o.encre === null)).toBe(true);
  });
});

describe("planArtifacts (§13, §14.3) — sélection par workflow", () => {
  it("TroLase : découpe non confirmée (VR-34) ⇒ VALIDATION_REQUIRED", () => {
    const r = resolveWorkflow(workflow("TROLASE_ENGRAVE"), referenceTest());
    const p = planArtifacts("TROLASE_ENGRAVE", r.ok ? r.operations : [], 2);
    expect(!p.ok && p.violations.map((v) => v.code)).toEqual(["VALIDATION_REQUIRED"]);
  });

  it("Plexiglass : laser face (CUT + HOLES) + UV face contract_pending avec encre dérivée", () => {
    const r = resolveWorkflow(workflow("PLEXIGLASS_UV"), plexi("couleur"));
    expect(planArtifacts("PLEXIGLASS_UV", r.ok ? r.operations : [], 4)).toEqual({
      ok: true,
      plan: [
        { kind: "laser", cote: "face", miroir: "none", groupes: ["CUT", "HOLES"] },
        { kind: "uv", cote: "face", miroir: "none", encre: "couleur", status: "contract_pending" },
      ],
    });
  });

  it("TroGlass : 1 artefact hybride, laser et UV côté envers, miroir X, noir uniquement ; sans trous ⇒ pas de HOLES", () => {
    const r = resolveWorkflow(workflow("TROGLASS_METALLIC_HYBRID"), troglass());
    expect(planArtifacts("TROGLASS_METALLIC_HYBRID", r.ok ? r.operations : [], 0)).toEqual({
      ok: true,
      plan: [
        {
          kind: "hybrid",
          laser: { kind: "laser", cote: "envers", miroir: "x", groupes: ["ENGRAVE", "CUT"] },
          uv: { kind: "uv", cote: "envers", miroir: "x", encre: "noir_uniquement", status: "contract_pending" },
          sequence: [1, 2, 3],
        },
      ],
    });
  });

  it("miroir X : x' = W − x", () => {
    expect(mirrorX(10, 200)).toBe(190);
    expect(mirrorX(mirrorX(37.5, 200), 200)).toBe(37.5);
  });
});

describe("schéma ProductionArtifact (Annexe A)", () => {
  const laser = { kind: "laser", contractId: "PRODUCTION_SVG_CONTRACT_v1", cote: "envers", miroir: "x", svg: "<svg/>", hash: "h" };
  const uv = { kind: "uv", contractId: "PRODUCTION_UV_CONTRACT_v1", status: "contract_pending", cote: "envers", miroir: "x", encre: "noir_uniquement", canonicalPrintLayer: {}, hash: "h" };

  it("accepte laser, UV contract_pending et hybride ; enregistrement À VALIDER", () => {
    expect(productionArtifactSchema.safeParse(laser).success).toBe(true);
    expect(productionArtifactSchema.safeParse(uv).success).toBe(true);
    const hybrid = { kind: "hybrid", contractId: "HYBRID_TROGLASS_METALLIC", laserArtifact: laser, uvArtifact: uv, metadata: { sequence: [1, 2, 3], registration: { etat: "A_VALIDER" }, batId: "b" } };
    expect(productionArtifactSchema.safeParse(hybrid).success).toBe(true);
  });

  it("rejette un contrat incohérent ou un champ inconnu", () => {
    expect(productionArtifactSchema.safeParse({ ...laser, contractId: "PRODUCTION_UV_CONTRACT_v1" }).success).toBe(false);
    expect(productionArtifactSchema.safeParse({ ...uv, couleurs: ["#FF0000"] }).success).toBe(false);
  });
});
