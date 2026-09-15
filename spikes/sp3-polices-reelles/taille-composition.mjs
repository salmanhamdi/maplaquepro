// SP-3 — exploration de candidats taille effective / composition (ESSAI — NON NORMATIF). A7 reste OPEN : les bornes,
// pas, interlignes et positions ci-dessous sont des paramètres d'expérience, jamais des règles VR-08. Écrit TAILLE-COMPOSITION.json.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as hb from "./vendor/harfbuzzjs-1.6.1/package/dist/index.mjs";
import * as ot from "./vendor/opentype.js-2.0.0/opentype.mjs";
import { moteurHarfbuzz, moteurOpentype, normaliser, versSegments } from "./core.mjs";
import { POLICES } from "./polices.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const sortie = path.join(dir, "TAILLE-COMPOSITION.json");
if (existsSync(sortie)) throw new Error("TAILLE-COMPOSITION.json existe déjà : aucune réécriture");

const PARAMETRES = { tailleMinMm: 1, tailleMaxMm: 60, pasMm: 0.1, interlignes: [1.0, 1.2, 1.5], positionVerticale: "bloc centré verticalement (hypothèse)" };
const PLAQUES = [
  { id: "300x200-sans-trou", widthMm: 300, heightMm: 200, trous: [] },
  { id: "200x100-4-trous-essai", widthMm: 200, heightMm: 100, trous: [10, 190].flatMap((x) => [10, 90].map((y) => ({ cxMm: x, cyMm: y, rMm: 3.5 }))) },
];
const TEXTES = [["Cabinet Durand"], ["Cabinet Durand", "Avocats associés"], ["Dr Martin", "Médecin généraliste", "Sur rendez-vous", "2e étage"]];

/** Boîte des points de contrôle (enveloppe conservative de la courbe) — approximation d'expérience, ≠ boiteEnglobante exacte du domaine. */
function boite(contours) {
  const xs = [];
  const ys = [];
  for (const c of contours) for (const s of c) for (const [kx, ky] of [["x", "y"], ["x1", "y1"], ["x2", "y2"]]) if (s[kx] !== undefined) (xs.push(s[kx]), ys.push(s[ky]));
  return xs.length ? { xMin: Math.min(...xs), xMax: Math.max(...xs), yMin: Math.min(...ys), yMax: Math.max(...ys) } : null;
}
const toucheCercle = (b, z) => {
  const px = Math.max(b.xMin, Math.min(z.cxMm, b.xMax));
  const py = Math.max(b.yMin, Math.min(z.cyMm, b.yMax));
  return (px - z.cxMm) ** 2 + (py - z.cyMm) ** 2 < z.rMm ** 2;
};

function disposer(m, lignes, tailleMm, interligne, plaque, parLigne = null) {
  const elements = [];
  const n = lignes.length;
  const tailles = lignes.map((_, i) => parLigne?.[i] ?? tailleMm);
  const hauteurBloc = tailles.reduce((a, t, i) => a + (i === 0 ? ((m.ascendant - m.descendant) / m.upem) * t : interligne * t), 0);
  let y = plaque.heightMm / 2 - hauteurBloc / 2;
  lignes.forEach((ligne, i) => {
    const t = tailles[i];
    const s = t / m.upem;
    if (i > 0) y += interligne * t;
    const base = y + m.ascendant * s;
    const cps = [...normaliser(ligne)].map((c) => c.codePointAt(0));
    const g = m.formes(cps);
    const largeur = g.reduce((a, x) => a + x.ax, 0) * s;
    let x = plaque.widthMm / 2 - largeur / 2;
    for (const gl of g) {
      if (gl.gid !== 0) elements.push(boite(versSegments(m.contour(gl.gid), x + gl.dx * s, base - gl.dy * s, s)));
      x += gl.ax * s;
    }
    if (i === 0) y = base - m.ascendant * s;
  });
  return elements.filter(Boolean);
}
const tient = (boites, plaque) => boites.every((b) => b.xMin >= 0 && b.yMin >= 0 && b.xMax <= plaque.widthMm && b.yMax <= plaque.heightMm && !plaque.trous.some((z) => toucheCercle(b, z)));

function tailleMaxUniforme(m, lignes, interligne, plaque) {
  for (let t = PARAMETRES.tailleMaxMm; t >= PARAMETRES.tailleMinMm - 1e-9; t = Math.round((t - PARAMETRES.pasMm) * 10) / 10) {
    const b = disposer(m, lignes, t, interligne, plaque);
    if (tient(b, plaque)) return { tailleMm: t, hauteurCaractereMinMm: Math.round(Math.min(...b.map((x) => x.yMax - x.yMin)) * 1000) / 1000 };
  }
  return { tailleMm: null, motif: "aucune taille dans l'intervalle d'expérience" };
}

const resultat = { avertissement: "ESSAI SP-3 — NON NORMATIF ; A7 OPEN ; aucun candidat retenu", parametres: PARAMETRES, candidats: {
  C1: "taille fixe (valeur de configuration), aucun ajustement ; dépassement signalé (F6)",
  C2: "plus grande taille uniforme de l'intervalle d'expérience telle que tout le bloc tienne dans la plaque hors zones de trous",
  C3: "plus grande taille par ligne indépendamment (lignes de tailles différentes)",
}, cas: [] };

for (const p of POLICES) {
  const octets = new Uint8Array(readFileSync(path.join(dir, p.fichier)));
  const moteurs = { harfbuzz: moteurHarfbuzz(hb, octets), "opentype-cmap": moteurOpentype(ot, octets.buffer.slice(octets.byteOffset, octets.byteOffset + octets.byteLength), "cmap") };
  for (const plaque of PLAQUES)
    for (const lignes of TEXTES)
      for (const interligne of PARAMETRES.interlignes) {
        const cas = { police: p.id, plaque: plaque.id, lignes, interligne, moteurs: {} };
        for (const [nom, m] of Object.entries(moteurs)) {
          const c1 = tient(disposer(m, lignes, 10, interligne, plaque), plaque);
          const c2 = tailleMaxUniforme(m, lignes, interligne, plaque);
          const c3 = lignes.map((l) => tailleMaxUniforme(m, [l], interligne, plaque).tailleMm);
          cas.moteurs[nom] = { C1_10mm_tient: c1, C2: c2, C3_parLigne: c3 };
        }
        resultat.cas.push(cas);
      }
}
writeFileSync(sortie, `${JSON.stringify(resultat, null, 2)}\n`);
const ecarts = resultat.cas.filter((c) => c.moteurs.harfbuzz.C2.tailleMm !== c.moteurs["opentype-cmap"].C2.tailleMm).length;
console.log(`${resultat.cas.length} cas — écarts de taille C2 entre moteurs : ${ecarts}`);
for (const c of resultat.cas.filter((x) => x.interligne === 1.2)) console.log(`  ${c.police} ${c.plaque} ${c.lignes.length} ligne(s) : C2 hb=${c.moteurs.harfbuzz.C2.tailleMm} mm (h min ${c.moteurs.harfbuzz.C2.hauteurCaractereMinMm}) ot=${c.moteurs["opentype-cmap"].C2.tailleMm} ; C3 hb=${c.moteurs.harfbuzz.C3_parLigne.join("/")}`);
