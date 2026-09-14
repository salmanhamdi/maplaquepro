// SP-1 — matrice d'entrée : 4 workflows × 15 combinaisons = 60 configurations.
// TOUTES les valeurs numériques (dimensions « standard », rayons, épaisseurs, safe zone, trous)
// sont des PARAMÈTRES D'ESSAI NON ATELIER : jamais repris dans src/ ni docs/catalog.md.
// Aucune orientation de pose, zone machine, admissibilité, police ou texte (R-1, VR-08).

const WORKFLOWS = [
  "TROLASE_ENGRAVE",
  "TROLASE_METALLIC_ENGRAVE",
  "PLEXIGLASS_UV",
  "TROGLASS_METALLIC_HYBRID",
];

// Épaisseurs : valeurs référentielles §7.5 utilisées comme paramètres d'essai (aucune
// correspondance famille ↔ épaisseur n'est affirmée).
const THICKNESSES = [0.8, 1.6, 3.0, 5.0];

const NO_HOLES = { count: 0 };
const std = (e) => ({ count: 4, mode: "standard", edgeDistanceMm: e });
const adv = (x, y) => ({ count: 4, mode: "advanced", edgeDistanceXMm: x, edgeDistanceYMm: y, symmetry: true });

// [mode, largeur, hauteur, rayon, trous, sémantique, diamètre, safe zone]
const BASE = [
  ["standard", 300, 200, 0, NO_HOLES, "edge_to_center", 4.5, 2],
  ["standard", 400, 250, 5, std(10), "edge_to_center", 4.5, 2],
  ["standard", 210, 148.5, 3, std(8.25), "edge_to_rim", 5.2, 2.5],
  ["custom", 347, 490, 0, std(12.3), "edge_to_center", 4.1, 2],
  ["custom", 490, 347, 0, adv(15.05, 9.95), "edge_to_rim", 4.1, 2],
  ["custom", 347.1, 490, 2, NO_HOLES, "edge_to_center", 3.3, 1.75],
  ["custom", 347, 490.1, 2, std(7.7), "edge_to_rim", 3.3, 1.75],
  ["custom", 1010, 610, 10, adv(20.1, 30.3), "edge_to_center", 6.35, 3],
  ["custom", 1010.1, 610.2, 10, std(0.1), "edge_to_rim", 6.35, 3],
  ["custom", 123.456, 78.9, 1.234, std(5.555), "edge_to_center", 3.333, 1.111],
  ["custom", 99.999, 33.333, 0.5, adv(3.1, 4.2), "edge_to_rim", 2.9, 0.3],
  ["custom", 0.1, 0.2, 0, NO_HOLES, "edge_to_center", 1, 0.05],
  ["custom", 1e3 / 3, 2e3 / 7, 2 / 3, adv(1 / 3, 2 / 9), "edge_to_rim", 10 / 3, 1 / 7],
  ["custom", 250.0005, 180.0015, 4.9995, std(11.0005), "edge_to_center", 4.0005, 2.0005],
  ["custom", 600.4445, 400.5555, 0, adv(17.4999, 22.5001), "edge_to_rim", 5.0025, 2.2225],
];

export const MATRIX = WORKFLOWS.flatMap((workflowId, w) =>
  BASE.map(([mode, widthMm, heightMm, cornerRadiusMm, mounting, semantics, d, safe], i) => ({
    id: `SP1-${String(w * BASE.length + i + 1).padStart(3, "0")}`,
    workflowId,
    format: { mode, widthMm, heightMm, cornerRadiusMm },
    thicknessMm: THICKNESSES[(w + i) % THICKNESSES.length],
    mounting,
    testParams: { holeDiameterMm: d, edgeDistanceSemantics: semantics, safeZoneMm: safe },
  })),
);
