// Alternatives d'une configuration non fabricable (Annexe B, étape 9). Une alternative n'est proposée que si elle passe
// elle-même les étapes 1 à 8 ; aucune n'est appliquée automatiquement (P13) : le choix appartient au client.
// Aucune référence n'est choisie à la place du client (ART1-D5) : `switch_family` désigne une famille, pas une référence.
import type { Catalog } from "./catalog";
import { type DonneesServeur, evaluateFabricability } from "./fabricabilite";
import { orientationDePose, zoneMachine } from "./fabricabilite-machine";
import type { MaterialFamily, ProductionOperationType } from "./referentiels";

export type Alternative = { kind: "max_dimensions"; widthMm: number; heightMm: number } | { kind: "switch_family"; toFamily: MaterialFamily };

type ConfigurationBrute = Record<string, unknown> & { materialVariantId?: unknown; format?: unknown; thicknessId?: unknown };

/** Opérations du workflow de la référence dont la zone machine n'admet pas (W, H), dans aucune orientation de pose. */
export function operationsHorsZone(catalog: Catalog, variantId: string, widthMm: number, heightMm: number): Array<{ type: ProductionOperationType; widthMm: number; heightMm: number; tourneeAutorisee: boolean }> {
  const ref = catalog.references.find((r) => r.id === variantId);
  const workflow = ref && catalog.workflows.find((w) => w.id === ref.productionWorkflowId);
  if (!workflow) return [];
  const out: Array<{ type: ProductionOperationType; widthMm: number; heightMm: number; tourneeAutorisee: boolean }> = [];
  for (const op of [...workflow.operations].sort((a, b) => a.sequence - b.sequence)) {
    const machine = catalog.machines.find((m) => m.machineId === op.machineId);
    const zone = machine && zoneMachine(machine);
    if (!machine || !zone) continue;
    if (orientationDePose(widthMm, heightMm, zone, machine.orientationDePoseTourneeAutorisee) === null) {
      out.push({ type: op.type, ...zone, tourneeAutorisee: machine.orientationDePoseTourneeAutorisee });
    }
  }
  return out;
}

/**
 * Alternatives pour un dépassement de zone machine (EXCEEDS_MACHINE). Ordre déterministe :
 * max_dimensions « tel quel » puis « tournée », puis switch_family dans l'ordre des familles du référentiel.
 */
export function proposeAlternatives(config: ConfigurationBrute, catalog: Catalog, donnees: DonneesServeur = {}): Alternative[] {
  const initial = evaluateFabricability(config, catalog, donnees);
  if (initial.ok || !initial.violations.some((v) => v.code === "EXCEEDS_MACHINE")) return [];

  const ref = catalog.references.find((r) => r.id === config.materialVariantId);
  const format = config.format as { mode: string; widthMm?: number; heightMm?: number; formatId?: string };
  const dims =
    format.mode === "custom"
      ? { widthMm: format.widthMm!, heightMm: format.heightMm! }
      : catalog.formats.find((f) => f.id === format.formatId);
  if (!ref || !dims) return [];

  const passe = (candidat: ConfigurationBrute) => evaluateFabricability(candidat, catalog, donnees).ok;
  const alternatives: Alternative[] = [];
  const horsZone = operationsHorsZone(catalog, ref.id, dims.widthMm, dims.heightMm);

  // max_dimensions : plus grand rectangle admissible pour l'opération fautive, dans les deux orientations de pose
  const vus = new Set<string>();
  for (const op of horsZone) {
    const candidats = [{ widthMm: op.widthMm, heightMm: op.heightMm }, ...(op.tourneeAutorisee ? [{ widthMm: op.heightMm, heightMm: op.widthMm }] : [])];
    for (const c of candidats) {
      const cle = `${c.widthMm}x${c.heightMm}`;
      if (vus.has(cle)) continue;
      vus.add(cle);
      const cornerRadiusMm = format.mode === "custom" ? (config.format as { cornerRadiusMm?: number }).cornerRadiusMm : undefined;
      const candidat = { ...config, format: { mode: "custom", ...c, ...(cornerRadiusMm !== undefined ? { cornerRadiusMm } : {}) } };
      if (passe(candidat)) alternatives.push({ kind: "max_dimensions", ...c });
    }
  }

  // switch_family : famille dont le procédé n'inclut pas l'opération fautive, avec au moins une référence qui passe
  const typesFautifs = new Set(horsZone.map((o) => o.type));
  const familles: MaterialFamily[] = [];
  for (const candidate of catalog.references) {
    if (candidate.family === ref.family || familles.includes(candidate.family)) continue;
    const workflow = catalog.workflows.find((w) => w.id === candidate.productionWorkflowId);
    if (!workflow || workflow.operations.some((o) => typesFautifs.has(o.type))) continue;
    if (passe({ ...config, materialVariantId: candidate.id })) familles.push(candidate.family);
  }
  const ordre: readonly MaterialFamily[] = ["trolase", "trolase_metallic", "plexiglass", "troglass_metallic"];
  for (const f of ordre) if (familles.includes(f)) alternatives.push({ kind: "switch_family", toFamily: f });

  return alternatives;
}
