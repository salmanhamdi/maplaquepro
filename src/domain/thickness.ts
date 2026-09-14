// Épaisseurs : exactement quatre valeurs référentielles (§7.5).
import { z } from "zod";
import { aValider, definie, type Etat } from "./etat";
import { type MaterialFamily, statutSchema, thicknessIdSchema, type ThicknessId } from "./referentiels";

export const thicknessSchema = z.strictObject({
  id: thicknessIdSchema,
  mm: z.number().positive(),
  label: z.string().min(1),
  statut: statutSchema,
});
export type Thickness = z.infer<typeof thicknessSchema>;

export const THICKNESSES: readonly Thickness[] = [
  { id: "th_0_8", mm: 0.8, label: "0,8 mm", statut: "active" },
  { id: "th_1_6", mm: 1.6, label: "1,6 mm", statut: "active" },
  { id: "th_3_0", mm: 3.0, label: "3,0 mm", statut: "active" },
  { id: "th_5_0", mm: 5.0, label: "5,0 mm", statut: "active" },
];

/** Épaisseurs autorisées par famille (§7.5). TroGlass : « selon références validées » → À VALIDER. */
export const THICKNESSES_BY_FAMILY: Readonly<Record<MaterialFamily, Etat<readonly ThicknessId[]>>> = {
  trolase: definie(["th_0_8", "th_1_6", "th_3_0"]),
  trolase_metallic: definie(["th_0_8", "th_1_6", "th_3_0"]),
  plexiglass: definie(["th_3_0", "th_5_0"]),
  troglass_metallic: aValider(),
};
