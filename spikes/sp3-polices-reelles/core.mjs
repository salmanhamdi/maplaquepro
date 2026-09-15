// SP-3 — noyau expérimental commun Node / navigateurs (ESSAI — NON NORMATIF). Aucun import Node : les dépendances
// (harfbuzzjs, opentype.js, octets des polices, SHA-256) sont injectées. Aucun choix de bibliothèque n'est impliqué.
export const NOYAU = "sp3-polices-reelles-0.1.0";
export const MODES = ["harfbuzzjs-1.6.1", "opentypejs-2.0.0-shaping", "opentypejs-2.0.0-cmap"];

const r3 = (x) => {
  const v = Math.round(x * 1000) / 1000;
  return Object.is(v, -0) ? 0 : v;
};

/** Copie à l'identique de canonicalJson du domaine (clés triées, undefined exclus) : l'équivalence est vérifiée par domaine.test.mjs. */
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

const CONTROLES = /\p{Cc}/gu;
/** H-NORM : identique à normaliserLigne (src/domain/texte.ts). */
export const normaliser = (ligne) => ligne.normalize("NFC").replace(CONTROLES, "").replace(/\s+/gu, " ").trim();

const uplus = (cp) => "U+" + cp.toString(16).toUpperCase().padStart(4, "0");

// ---------- Moteurs ----------

export function moteurHarfbuzz(hb, octets) {
  const face = new hb.Face(new hb.Blob(octets));
  const font = new hb.Font(face);
  const ext = font.hExtents();
  return {
    upem: face.upem,
    ascendant: ext.ascender,
    descendant: ext.descender,
    gidPour: (cp) => font.nominalGlyph(cp) ?? 0,
    formes(cps, features = []) {
      const buf = new hb.Buffer();
      buf.addCodePoints(cps);
      buf.guessSegmentProperties();
      hb.shape(font, buf, features.map((f) => hb.Feature.fromString(f)));
      return buf.getGlyphInfosAndPositions().map((g) => ({ gid: g.codepoint, cl: g.cluster, ax: g.xAdvance, dx: g.xOffset ?? 0, dy: g.yOffset ?? 0 }));
    },
    contour: (gid) => font.glyphToJson(gid).map((c) => ({ op: c.type, v: c.values })),
  };
}

export function moteurOpentype(ot, buffer, mode) {
  const font = ot.parse(buffer);
  const tablesKerning = (() => {
    try {
      return font.position.getKerningTables(font.position.getDefaultScriptName());
    } catch {
      return undefined;
    }
  })();
  const kerning = (a, b) => (tablesKerning ? font.position.getKerningValue(tablesKerning, a, b) : font.getKerningValue(a, b)) || 0;
  return {
    upem: font.unitsPerEm,
    ascendant: font.ascender,
    descendant: font.descender,
    gidPour: (cp) => font.charToGlyphIndex(String.fromCodePoint(cp)),
    formes(cps) {
      let gids;
      let clusters;
      if (mode === "shaping") {
        gids = font.stringToGlyphs(String.fromCodePoint(...cps)).map((g) => g.index);
        // opentype.js n'expose pas les clusters : attribution possible seulement si un glyphe par point de code.
        clusters = gids.length === cps.length ? gids.map((_, i) => i) : gids.map(() => null);
      } else {
        gids = cps.map((cp) => font.charToGlyphIndex(String.fromCodePoint(cp)));
        clusters = gids.map((_, i) => i);
      }
      return gids.map((gid, i) => ({
        gid,
        cl: clusters[i],
        ax: (font.glyphs.get(gid).advanceWidth ?? 0) + (i < gids.length - 1 ? kerning(gid, gids[i + 1]) : 0),
        dx: 0,
        dy: 0,
      }));
    },
    contour: (gid) =>
      font.glyphs.get(gid).path.commands.map((c) =>
        c.type === "M" || c.type === "L"
          ? { op: c.type, v: [c.x, c.y] }
          : c.type === "Q"
            ? { op: "Q", v: [c.x1, c.y1, c.x, c.y] }
            : c.type === "C"
              ? { op: "C", v: [c.x1, c.y1, c.x2, c.y2, c.x, c.y] }
              : { op: "Z", v: [] },
      ),
  };
}

// ---------- Conversion en TextGlyphPaths (mm, repère plaque vue face, y vers le bas) ----------

/** Unités de police (y vers le haut) → mm (y vers le bas) ; quadratiques converties exactement en cubiques (le domaine n'a pas de Q). */
export function versSegments(commandes, gx, gy, echelle) {
  const contours = [];
  let courant = null;
  let pt = [0, 0];
  let depart = [0, 0];
  const P = (x, y) => ({ x: r3(gx + x * echelle), y: r3(gy - y * echelle) });
  for (const { op, v } of commandes) {
    if (op === "M") {
      courant = [{ op: "M", ...P(v[0], v[1]) }];
      contours.push(courant);
      pt = [v[0], v[1]];
      depart = pt;
    } else if (op === "L") {
      courant.push({ op: "L", ...P(v[0], v[1]) });
      pt = [v[0], v[1]];
    } else if (op === "Q") {
      const [qx, qy, x, y] = v;
      const a = P(pt[0] + (2 / 3) * (qx - pt[0]), pt[1] + (2 / 3) * (qy - pt[1]));
      const b = P(x + (2 / 3) * (qx - x), y + (2 / 3) * (qy - y));
      const e = P(x, y);
      courant.push({ op: "C", x1: a.x, y1: a.y, x2: b.x, y2: b.y, x: e.x, y: e.y });
      pt = [x, y];
    } else if (op === "C") {
      const [x1, y1, x2, y2, x, y] = v;
      const a = P(x1, y1);
      const b = P(x2, y2);
      const e = P(x, y);
      courant.push({ op: "C", x1: a.x, y1: a.y, x2: b.x, y2: b.y, x: e.x, y: e.y });
      pt = [x, y];
    } else if (op === "Z") {
      courant?.push({ op: "Z" });
      pt = depart;
    }
  }
  return contours;
}

const DIAGNOSTICS = ["ccmp", "liga", "kern", "mark"];

function composer(m, cfg, avecDiagnostics) {
  const echelle = cfg.tailleMm / m.upem;
  const avance = cfg.interligne * cfg.tailleMm;
  const lignes = cfg.lignes.map(normaliser);
  const absents = new Set();
  const formes = [];
  const positions = [];
  const caracteres = [];
  const diagnostics = avecDiagnostics ? Object.fromEntries(DIAGNOSTICS.map((t) => [t, false])) : undefined;
  lignes.forEach((ligne, i) => {
    const cps = [...ligne].map((c) => c.codePointAt(0));
    for (const cp of cps) if (m.gidPour(cp) === 0) absents.add(uplus(cp));
    const glyphes = m.formes(cps);
    if (diagnostics) {
      const signature = (g) => JSON.stringify(g.map((x) => [x.gid, x.ax, x.dx, x.dy]));
      for (const t of DIAGNOSTICS) if (signature(m.formes(cps, [`-${t}`])) !== signature(glyphes)) diagnostics[t] = true;
    }
    const largeur = glyphes.reduce((a, g) => a + g.ax, 0) * echelle;
    const x0 = cfg.alignement === "center" ? cfg.plaque.widthMm / 2 - largeur / 2 : cfg.origine.xMm;
    const base = cfg.origine.yMm + m.ascendant * echelle + i * avance;
    const distincts = [...new Set(glyphes.map((g) => g.cl).filter((c) => c !== null))].sort((a, b) => a - b);
    formes.push(glyphes.map((g) => [g.gid, g.cl]));
    let x = x0;
    let courant = null;
    const pos = [];
    for (const g of glyphes) {
      const gx = x + g.dx * echelle;
      const gy = base - g.dy * echelle;
      pos.push([r3(gx), r3(gy), r3(g.ax * echelle)]);
      const contours = g.gid === 0 ? [] : versSegments(m.contour(g.gid), gx, gy, echelle);
      if (g.cl !== null && courant && courant.cl === g.cl) {
        courant.element.contours.push(...contours);
      } else {
        let caractere = "";
        if (g.cl !== null) caractere = String.fromCodePoint(...cps.slice(g.cl, distincts.find((c) => c > g.cl) ?? cps.length));
        const element = { caractere, contours };
        caracteres.push(element);
        courant = { cl: g.cl, element };
      }
      x += g.ax * echelle;
    }
    positions.push({ x0: r3(x0), ligneDeBase: r3(base), largeur: r3(largeur), glyphes: pos });
  });
  return { lignesNormalisees: lignes, absents: [...absents].sort(), formes, positions, caracteres, diagnostics };
}

export async function executer({ hb, ot, polices, bibliotheques, sha256Hex, matrice, details }) {
  const H = (v) => sha256Hex(new TextEncoder().encode(canonicalJson(v)));
  const empreintesPolices = {};
  const moteurs = {};
  for (const [id, octets] of Object.entries(polices)) {
    empreintesPolices[id] = await sha256Hex(octets);
    const buffer = octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength);
    moteurs[id] = {
      [MODES[0]]: moteurHarfbuzz(hb, new Uint8Array(buffer.slice(0))),
      [MODES[1]]: moteurOpentype(ot, buffer.slice(0), "shaping"),
      [MODES[2]]: moteurOpentype(ot, buffer.slice(0), "cmap"),
    };
  }
  const empreintesBibliotheques = {};
  for (const [nom, octets] of Object.entries(bibliotheques)) empreintesBibliotheques[nom] = await sha256Hex(octets);

  const resultats = [];
  const parMode = Object.fromEntries(MODES.map((m) => [m, []]));
  for (const cfg of matrice) {
    for (const mode of MODES) {
      let r;
      try {
        r = { id: cfg.id, mode, statut: "ok", ...composer(moteurs[cfg.police][mode], cfg, mode === MODES[0]) };
      } catch (e) {
        r = { id: cfg.id, mode, statut: "erreur_moteur", erreur: String(e?.message ?? e) };
      }
      const empreintes = {
        forme: await H(r.formes ?? null),
        position: await H(r.positions ?? null),
        geometrie: await H(r.caracteres ?? null),
      };
      empreintes.complete = await H({ ...r, empreintes });
      const resume = { id: r.id, mode, statut: r.statut, erreur: r.erreur, absents: r.absents, elements: r.caracteres?.length ?? 0, diagnostics: r.diagnostics, empreintes };
      resultats.push(details ? { ...r, empreintes } : resume);
      parMode[mode].push({ id: r.id, complete: empreintes.complete });
    }
  }
  const globales = {};
  for (const mode of MODES) globales[mode] = await H(parMode[mode]);
  return {
    noyau: NOYAU,
    matrice: await H(matrice),
    configurations: matrice.length,
    polices: empreintesPolices,
    bibliotheques: empreintesBibliotheques,
    globales,
    resultats,
  };
}
