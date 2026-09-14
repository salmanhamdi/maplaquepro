// SP-2 — noyau expérimental : géométrie textuelle (métriques, positions, contours de glyphes).
// ESSAI — NON NORMATIF. Jamais importé par src/. Aucune règle produit n'en découle.
// opentype.js et la police sont injectés par le runner (octets identiques pour tous les environnements).

export const SP2_ENGINE_VERSION = "sp2-text-geometry-0.1.0";
export const NORMALIZATION_ID = "EXPERIMENTAL_NORM_V1";

// Convention expérimentale reprise à l'identique de SP-1 (non normative, ADR-0005 à arbitrer).
export function roundMm(value) {
  if (!Number.isFinite(value)) throw new Error(`valeur non finie : ${value}`);
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
}

// Canonisation expérimentale reprise à l'identique de SP-1.
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

// Normalisation EXPÉRIMENTALE (inspirée de §10, non normative) :
// 1. suppression des caractères de contrôle (Cc) ; 2. suites d'U+0020 réduites à une ;
// 3. suppression des U+0020 en début et fin ; 4. NFC. Les autres espaces (ex. U+00A0) sont conservés.
export function normalizeExperimental(text) {
  return Array.from(text)
    .filter((ch) => !/\p{Cc}/u.test(ch))
    .join("")
    .replace(/ {2,}/g, " ")
    .replace(/^ +| +$/g, "")
    .normalize("NFC");
}

const PATH_KEYS = ["x", "y", "x1", "y1", "x2", "y2"];

function roundPath(commands) {
  return commands.map((c) => {
    const out = { type: c.type };
    for (const k of PATH_KEYS) if (c[k] !== undefined) out[k] = roundMm(c[k]);
    return out;
  });
}

function boundingBox(path) {
  if (path.commands.length === 0) return null;
  const bb = path.getBoundingBox();
  const values = [bb.x1, bb.y1, bb.x2, bb.y2];
  if (!values.every(Number.isFinite)) return null;
  return { x1: roundMm(bb.x1), y1: roundMm(bb.y1), x2: roundMm(bb.x2), y2: roundMm(bb.y2) };
}

function mergeBox(a, b) {
  if (!a) return b;
  if (!b) return a;
  return { x1: Math.min(a.x1, b.x1), y1: Math.min(a.y1, b.y1), x2: Math.max(a.x2, b.x2), y2: Math.max(a.y2, b.y2) };
}

// Positionnement expérimental : origine (originXMm, 0), repère y vers le bas (convention opentype.js getPath),
// ligne n : ligne de base = ascender·échelle + n·lineAdvanceMm. Aucune substitution OpenType (charToGlyph
// par point de code) ; crénage GPOS « kern » explicite pour le script kerningScript si kerning = true.
export function buildTextGeometry(config, font) {
  const p = config.params;
  const scale = p.fontSizeMm / font.unitsPerEm;
  const lookups = p.kerning ? font.position.getKerningTables(p.kerningScript) ?? [] : [];
  const unsupported = [];

  const lines = config.lines.map((raw, lineIndex) => {
    const chars = Array.from(normalizeExperimental(raw));
    const glyphs = chars.map((ch) => font.charToGlyph(ch));
    const baselineY = font.ascender * scale + lineIndex * p.lineAdvanceMm;
    let x = p.originXMm;
    let lineBox = null;
    const out = glyphs.map((glyph, i) => {
      const next = glyphs[i + 1];
      const kern = next && lookups.length ? font.position.getKerningValue(lookups, glyph.index, next.index) : 0;
      const advance = glyph.advanceWidth ?? 0;
      const path = glyph.getPath(x, baselineY, p.fontSizeMm);
      const box = boundingBox(path);
      lineBox = mergeBox(lineBox, box);
      const codePoint = chars[i].codePointAt(0);
      if (glyph.index === 0 && !unsupported.includes(codePoint)) unsupported.push(codePoint);
      const entry = {
        codePoint,
        glyphIndex: glyph.index,
        xMm: roundMm(x),
        advanceMm: roundMm(advance * scale),
        kerningMm: roundMm(kern * scale),
        bbox: box,
        path: roundPath(path.commands),
      };
      x += advance * scale + kern * scale;
      return entry;
    });
    return {
      codePoints: chars.map((ch) => ch.codePointAt(0)),
      baselineYMm: roundMm(baselineY),
      widthMm: roundMm(x - p.originXMm),
      bbox: lineBox,
      glyphs: out,
    };
  });

  return {
    engineVersion: SP2_ENGINE_VERSION,
    normalization: NORMALIZATION_ID,
    font: { unitsPerEm: font.unitsPerEm, ascender: font.ascender, descender: font.descender },
    params: p,
    lines,
    errors: unsupported.length ? [{ code: "EXPERIMENTAL_UNSUPPORTED_GLYPH", codePoints: unsupported }] : [],
  };
}

// env : { ot, fontBytes: ArrayBuffer, opentypeBytes: Uint8Array, sha256Hex: (Uint8Array) => Promise<string> }
export async function runMatrix(matrix, env) {
  const encoder = new TextEncoder();
  const artefacts = {
    fontSha256: await env.sha256Hex(new Uint8Array(env.fontBytes)),
    opentypeSha256: await env.sha256Hex(env.opentypeBytes),
  };
  const font = env.ot.parse(env.fontBytes);
  const results = [];
  for (const config of matrix) {
    let geometry;
    try {
      geometry = buildTextGeometry(config, font);
    } catch (e) {
      geometry = { engineVersion: SP2_ENGINE_VERSION, errors: [{ code: "EXPERIMENTAL_RUNTIME_ERROR", message: String(e?.message ?? e) }] };
    }
    const json = canonicalJson(geometry);
    results.push({ id: config.id, ok: geometry.errors.length === 0, sha256: await env.sha256Hex(encoder.encode(json)), json });
  }
  const summary = results.map(({ id, sha256 }) => ({ id, sha256 }));
  return {
    engine: SP2_ENGINE_VERSION,
    count: results.length,
    artefacts,
    matrixSha256: await env.sha256Hex(encoder.encode(canonicalJson(matrix))),
    globalSha256: await env.sha256Hex(encoder.encode(canonicalJson(summary))),
    results,
  };
}
