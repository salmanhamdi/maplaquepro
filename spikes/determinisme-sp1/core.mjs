// SP-1 — noyau du spike de déterminisme (géométrie indépendante du texte, de R-1 et de VR-08).
// Code de spike : non normatif, jamais importé par src/. Aucune dépendance, aucune API
// dépendante de la locale, du fuseau horaire ou de l'horloge.

export const SP1_ENGINE_VERSION = "sp1-geometry-0.1.0";

// Arrondi à 3 décimales (§10 roundMm). Mode d'arrondi exact À DÉFINIR (ADR-0005) :
// convention de spike = Math.round (demi-valeur vers +∞), -0 normalisé en 0.
export function roundMm(value) {
  if (!Number.isFinite(value)) throw new Error(`valeur non finie : ${value}`);
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

// §11.3 : c = e (edge_to_center) ou c = e + d/2 (edge_to_rim).
function centerOffset(edgeDistanceMm, diameterMm, semantics) {
  if (semantics === "edge_to_center") return edgeDistanceMm;
  if (semantics === "edge_to_rim") return edgeDistanceMm + diameterMm / 2;
  throw new Error(`sémantique inconnue : ${semantics}`);
}

// §11.3 : seul count = 4 est couvert (la disposition de count = 2 relève de VR-24, INFERENCE).
// Aucune validation P11 (paramètres VR-22 à VR-24 non validés).
function holes(widthMm, heightMm, mounting, testParams) {
  if (mounting.count === 0) return [];
  if (mounting.count !== 4) throw new Error(`count hors SP-1 : ${mounting.count}`);
  const d = testParams.holeDiameterMm;
  const s = testParams.edgeDistanceSemantics;
  const eX = mounting.mode === "standard" ? mounting.edgeDistanceMm : mounting.edgeDistanceXMm;
  const eY = mounting.mode === "standard" ? mounting.edgeDistanceMm : mounting.edgeDistanceYMm;
  const cX = centerOffset(eX, d, s);
  const cY = centerOffset(eY, d, s);
  return [
    [cX, cY],
    [widthMm - cX, cY],
    [cX, heightMm - cY],
    [widthMm - cX, heightMm - cY],
  ].map(([cx, cy]) => ({ cxMm: roundMm(cx), cyMm: roundMm(cy), diameterMm: roundMm(d) }));
}

// Sous-ensemble SP-1 de CanonicalGeometry (§6) : plate, safeZoneMm, holes, engineVersions.
// Exclus : keepOutZones (forme non définie), layers (texte VR-08, artwork, politique d'impression).
export function buildGeometry(config) {
  const f = config.format;
  const widthMm = f.widthMm;
  const heightMm = f.heightMm;
  return {
    plate: {
      widthMm: roundMm(widthMm),
      heightMm: roundMm(heightMm),
      cornerRadiusMm: roundMm(f.cornerRadiusMm ?? 0),
      thicknessMm: roundMm(config.thicknessMm),
    },
    safeZoneMm: roundMm(config.testParams.safeZoneMm),
    holes: holes(widthMm, heightMm, config.mounting, config.testParams),
    engineVersions: { geometry: SP1_ENGINE_VERSION },
  };
}

// JSON canonique de spike (règles ADR-0005 À DÉFINIR) : clés triées par unités UTF-16,
// aucun espace, nombres finis au format ECMAScript (JSON.stringify), -0 → 0, undefined interdit.
export function canonicalJson(value) {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) throw new Error("nombre non fini");
      return JSON.stringify(Object.is(value, -0) ? 0 : value);
    case "string":
      return JSON.stringify(value);
    case "object":
      if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
      return `{${Object.keys(value)
        .sort()
        .map((k) => {
          if (value[k] === undefined) throw new Error(`undefined : ${k}`);
          return `${JSON.stringify(k)}:${canonicalJson(value[k])}`;
        })
        .join(",")}}`;
    default:
      throw new Error(`type non canonisable : ${typeof value}`);
  }
}

export function toHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// sha256Hex : fonction (Uint8Array) => Promise<string hex>, fournie par le runtime.
export async function runMatrix(matrix, sha256Hex) {
  const encoder = new TextEncoder();
  const results = [];
  for (const config of matrix) {
    const json = canonicalJson(buildGeometry(config));
    results.push({ id: config.id, sha256: await sha256Hex(encoder.encode(json)), json });
  }
  const summary = results.map(({ id, sha256 }) => ({ id, sha256 }));
  const globalSha256 = await sha256Hex(encoder.encode(canonicalJson(summary)));
  const matrixSha256 = await sha256Hex(encoder.encode(canonicalJson(matrix)));
  return { engine: SP1_ENGINE_VERSION, count: results.length, matrixSha256, globalSha256, results };
}
