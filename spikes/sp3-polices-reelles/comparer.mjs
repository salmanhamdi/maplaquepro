// SP-3 — comparaison des passes (ESSAI — NON NORMATIF) : déterminisme intra-environnement, inter-environnements,
// et différences entre moteurs (forme / position / géométrie). Écrit COMPARAISON.json (réécriture refusée).
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MODES } from "./core.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const sortie = path.join(dir, "COMPARAISON.json");
if (existsSync(sortie)) throw new Error("COMPARAISON.json existe déjà : aucune réécriture");

const ENVS = ["node", "chrome", "edge"];
const lire = (env, passe) => {
  const f = path.join(dir, "resultats", env, `passe-${passe}.json`);
  return existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : null;
};
const index = (run) => new Map(run.resultats.map((r) => [`${r.id}|${r.mode}`, r]));

const passes = Object.fromEntries(ENVS.map((e) => [e, [lire(e, 1), lire(e, 2)]]));
const rapport = {
  avertissement: "ESSAI SP-3 — NON NORMATIF",
  environnementsExecutes: ENVS.filter((e) => passes[e][0] && passes[e][1]),
  incomplets: { firefox: "INCOMPLETE — non installé sur le poste d'exécution", "safari-ios-reel": "INCOMPLETE — non pilotable depuis le poste d'exécution" },
  entrees: {},
  intraEnvironnement: {},
  interEnvironnements: {},
  interMoteurs: {},
};

for (const env of ENVS) {
  const [p1, p2] = passes[env];
  if (!p1 || !p2) {
    rapport.intraEnvironnement[env] = "passes manquantes";
    continue;
  }
  rapport.entrees[env] = { matrice: p1.matrice, polices: p1.polices, bibliotheques: p1.bibliotheques, environnement: p1.environnement };
  const i2 = index(p2);
  const ecarts = p1.resultats.filter((r) => i2.get(`${r.id}|${r.mode}`)?.empreintes.complete !== r.empreintes.complete).map((r) => `${r.id}|${r.mode}`);
  rapport.intraEnvironnement[env] = { comparaisons: p1.resultats.length, identiques: p1.resultats.length - ecarts.length, ecarts, globalesIdentiques: JSON.stringify(p1.globales) === JSON.stringify(p2.globales) };
}

const ref = passes.node[0];
for (const env of ENVS.filter((e) => e !== "node" && passes[e][0])) {
  const autre = index(passes[env][0]);
  const parMode = {};
  for (const mode of MODES) {
    const lignes = ref.resultats.filter((r) => r.mode === mode);
    const ecarts = lignes
      .map((r) => {
        const o = autre.get(`${r.id}|${mode}`);
        if (!o) return { id: r.id, manquant: true };
        const diff = ["forme", "position", "geometrie", "complete"].filter((k) => o.empreintes[k] !== r.empreintes[k]);
        return diff.length ? { id: r.id, differences: diff, statutNode: r.statut, statutEnv: o.statut } : null;
      })
      .filter(Boolean);
    parMode[mode] = { comparaisons: lignes.length, identiques: lignes.length - ecarts.length, ecarts, globalesIdentiques: passes[env][0].globales[mode] === ref.globales[mode] };
  }
  rapport.interEnvironnements[`node↔${env}`] = { memeMatrice: passes[env][0].matrice === ref.matrice, memesPolices: JSON.stringify(passes[env][0].polices) === JSON.stringify(ref.polices), memesBibliotheques: JSON.stringify(passes[env][0].bibliotheques) === JSON.stringify(ref.bibliotheques), parMode };
}

// Entre moteurs (Node, passe 1 détaillée).
const parId = new Map();
for (const r of ref.resultats) {
  if (!parId.has(r.id)) parId.set(r.id, {});
  parId.get(r.id)[r.mode] = r;
}
const paires = [[MODES[0], MODES[1]], [MODES[0], MODES[2]], [MODES[1], MODES[2]]];
for (const [a, b] of paires) {
  const cle = `${a} ↔ ${b}`;
  const stats = { comparaisons: 0, lesDeuxOk: 0, formeIdentique: 0, positionIdentique: 0, geometrieIdentique: 0, erreursA: 0, erreursB: 0, parFamille: {} };
  for (const [id, m] of parId) {
    const famille = id.split("-")[1];
    const f = (stats.parFamille[famille] ??= { comparaisons: 0, geometrieIdentique: 0, formeDifferente: [], positionDifferente: [] });
    stats.comparaisons++;
    f.comparaisons++;
    if (m[a].statut !== "ok") stats.erreursA++;
    if (m[b].statut !== "ok") stats.erreursB++;
    if (m[a].statut !== "ok" || m[b].statut !== "ok") continue;
    stats.lesDeuxOk++;
    if (m[a].empreintes.forme === m[b].empreintes.forme) stats.formeIdentique++;
    else f.formeDifferente.push(id);
    if (m[a].empreintes.position === m[b].empreintes.position) stats.positionIdentique++;
    else f.positionDifferente.push(id);
    if (m[a].empreintes.geometrie === m[b].empreintes.geometrie) {
      stats.geometrieIdentique++;
      f.geometrieIdentique++;
    }
  }
  rapport.interMoteurs[cle] = stats;
}

// Erreurs moteur et diagnostics de shaping (harfbuzzjs), Node passe 1.
rapport.erreursMoteur = ref.resultats.filter((r) => r.statut !== "ok").reduce((acc, r) => {
  (acc[r.mode] ??= {})[r.erreur] = [...((acc[r.mode] ?? {})[r.erreur] ?? []), r.id];
  return acc;
}, {});
rapport.diagnosticsHarfbuzz = Object.fromEntries(
  ["ccmp", "liga", "kern", "mark"].map((t) => [t, ref.resultats.filter((r) => r.mode === MODES[0] && r.diagnostics?.[t]).map((r) => r.id)]),
);

writeFileSync(sortie, `${JSON.stringify(rapport, null, 2)}\n`);
console.log(`environnements exécutés : ${rapport.environnementsExecutes.join(", ")}`);
for (const [e, v] of Object.entries(rapport.intraEnvironnement)) console.log(`intra ${e}: ${typeof v === "string" ? v : `${v.identiques}/${v.comparaisons}`}`);
for (const [k, v] of Object.entries(rapport.interEnvironnements)) for (const [m, s] of Object.entries(v.parMode)) console.log(`${k} ${m}: ${s.identiques}/${s.comparaisons}`);
for (const [k, s] of Object.entries(rapport.interMoteurs)) console.log(`${k}: ok=${s.lesDeuxOk}/${s.comparaisons} forme=${s.formeIdentique} position=${s.positionIdentique} géométrie=${s.geometrieIdentique} erreursA=${s.erreursA} erreursB=${s.erreursB}`);
for (const [t, l] of Object.entries(rapport.diagnosticsHarfbuzz)) console.log(`hb -${t} modifie le résultat : ${l.length} configurations`);
