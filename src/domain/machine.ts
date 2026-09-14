// Capacités machine (§4.1, §7.3, P7 D1). Le repère exact des axes des zones reste À ARBITRER (R-1) :
// ces valeurs ne décident d'aucune orientation de pose.
import { z } from "zod";
import { machineIdSchema, operationTypeSchema } from "./referentiels";

export const zoneMmSchema = z.strictObject({
  widthMm: z.number().positive(),
  heightMm: z.number().positive(),
});
export type ZoneMm = z.infer<typeof zoneMmSchema>;

export const machineCapabilitySchema = z
  .strictObject({
    machineId: machineIdSchema,
    operationTypes: z.array(operationTypeSchema).min(1),
    printableArea: zoneMmSchema.optional(),
    workingArea: zoneMmSchema.optional(),
    /** Autorisation générale (§7.3). Pour l'ArtisJet, les conditions « géométrie et workflow » ne sont pas définies. */
    orientationDePoseTourneeAutorisee: z.boolean(),
    statut: z.enum(["validated", "validation_required"]),
  })
  .refine((m) => m.printableArea !== undefined || m.workingArea !== undefined, {
    message: "une zone machine (workingArea ou printableArea) est requise",
  });
export type MachineCapability = z.infer<typeof machineCapabilitySchema>;

export const MACHINE_CAPABILITIES: readonly MachineCapability[] = [
  {
    machineId: "SPEEDY_400",
    operationTypes: ["laser_engrave", "laser_cut"],
    workingArea: { widthMm: 1010, heightMm: 610 },
    orientationDePoseTourneeAutorisee: true,
    statut: "validated",
  },
  {
    machineId: "ARTISJET_3000U",
    operationTypes: ["uv_print"],
    printableArea: { widthMm: 347, heightMm: 490 },
    orientationDePoseTourneeAutorisee: true,
    statut: "validated",
  },
];
