import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  dimensionRulesSchema,
  etatSchema,
  machineCapabilitySchema,
  mountingPatternSchema,
  politiqueImpressionSchema,
  statutContratSchema,
} from "../../src/domain";

describe("trois états normatifs (P5 D4)", () => {
  const schema = etatSchema(z.number());

  it("accepte SANS_OBJET, DEFINIE et A_VALIDER", () => {
    expect(schema.safeParse({ etat: "SANS_OBJET" }).success).toBe(true);
    expect(schema.safeParse({ etat: "DEFINIE", valeur: 3 }).success).toBe(true);
    expect(schema.safeParse({ etat: "A_VALIDER" }).success).toBe(true);
  });

  it("refuse l'absence implicite, un état inconnu et une valeur sur un état non défini (INV-01)", () => {
    expect(schema.safeParse(undefined).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
    expect(schema.safeParse({ etat: "INCONNU" }).success).toBe(false);
    expect(schema.safeParse({ etat: "A_VALIDER", valeur: 3 }).success).toBe(false);
    expect(schema.safeParse({ etat: "DEFINIE" }).success).toBe(false);
  });
});

describe("schémas du domaine", () => {
  it("politique « aucune » : côté SANS_OBJET obligatoire (P7)", () => {
    expect(politiqueImpressionSchema.safeParse({ valeur: { etat: "DEFINIE", valeur: "aucune" }, cote: { etat: "SANS_OBJET" } }).success).toBe(true);
    expect(politiqueImpressionSchema.safeParse({ valeur: { etat: "DEFINIE", valeur: "aucune" }, cote: { etat: "DEFINIE", valeur: "face" } }).success).toBe(false);
  });

  it("une machine sans zone est refusée, et aucun champ inconnu n'est accepté", () => {
    expect(machineCapabilitySchema.safeParse({ machineId: "SPEEDY_400", operationTypes: ["laser_cut"], orientationDePoseTourneeAutorisee: true, statut: "validated" }).success).toBe(false);
    expect(
      machineCapabilitySchema.safeParse({ machineId: "SPEEDY_400", operationTypes: ["laser_cut"], workingArea: { widthMm: 1, heightMm: 1 }, orientationDePoseTourneeAutorisee: true, statut: "validated", extra: 1 }).success,
    ).toBe(false);
  });

  it("trous : symétrie obligatoire en mode avancé, pas de 0,1 mm, diamètre jamais choisi par le client (INV-13, INV-14)", () => {
    expect(mountingPatternSchema.safeParse({ count: 0 }).success).toBe(true);
    expect(mountingPatternSchema.safeParse({ count: 4, mode: "standard", edgeDistanceMm: 3 }).success).toBe(true);
    expect(mountingPatternSchema.safeParse({ count: 4, mode: "standard", edgeDistanceMm: 3.05 }).success).toBe(false);
    expect(mountingPatternSchema.safeParse({ count: 2, mode: "advanced", edgeDistanceXMm: 5, edgeDistanceYMm: 7.5, symmetry: true }).success).toBe(true);
    expect(mountingPatternSchema.safeParse({ count: 2, mode: "advanced", edgeDistanceXMm: 5, edgeDistanceYMm: 7.5, symmetry: false }).success).toBe(false);
    expect(mountingPatternSchema.safeParse({ count: 4, mode: "standard", edgeDistanceMm: 3, holeDiameterMm: 5 }).success).toBe(false);
    expect(mountingPatternSchema.safeParse({ count: 3, mode: "standard", edgeDistanceMm: 3 }).success).toBe(false);
  });

  it("règles de dimensions : borne minimale ≤ maximale lorsque les deux sont définies", () => {
    const base = {
      id: "d",
      variantId: "v",
      thicknessId: "th_1_6",
      minWidthMm: { etat: "DEFINIE", valeur: 100 },
      maxWidthMm: { etat: "DEFINIE", valeur: 50 },
      minHeightMm: { etat: "A_VALIDER" },
      maxHeightMm: { etat: "A_VALIDER" },
      statut: "validation_required",
    };
    expect(dimensionRulesSchema.safeParse(base).success).toBe(false);
    expect(dimensionRulesSchema.safeParse({ ...base, maxWidthMm: { etat: "A_VALIDER" } }).success).toBe(true);
  });

  it("contrat : validation atelier jamais DEFINIE sans preuve (INV-16)", () => {
    const base = { contractId: "PRODUCTION_SVG_CONTRACT_v1", conformite: "conforme", validationAtelier: { etat: "DEFINIE", valeur: "validee" } };
    expect(statutContratSchema.safeParse(base).success).toBe(false);
    expect(statutContratSchema.safeParse({ ...base, preuveValidationAtelier: "preuve" }).success).toBe(true);
    expect(statutContratSchema.safeParse({ ...base, validationAtelier: { etat: "A_VALIDER" } }).success).toBe(true);
  });
});
