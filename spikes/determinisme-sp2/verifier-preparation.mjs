// SP-2 — contrôles de PRÉPARATION (n'exécute pas la matrice). Usage : node spikes/determinisme-sp2/verifier-preparation.mjs
// 1. artefacts (SHA-256) ; 2. matrice gelée ; 3. couverture des caractères par la police (cmap) ;
// 4. auto-test des critères sur données SYNTHÉTIQUES (jamais écrites) ; 5. séparation produit.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJson, normalizeExperimental } from "./core.mjs";
import { MATRIX } from "./matrix.mjs";
import { evaluate, loadExpected, REQUIRED } from "./verdict.mjs";
import * as ot from "./vendor/opentype.js-2.0.0/opentype.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../..");
const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const failures = [];
const check = (label, ok) => { console.log(`${ok ? "OK " : "KO "} ${label}`); if (!ok) failures.push(label); };

// 1. Artefacts
const artefacts = JSON.parse(readFileSync(path.join(dir, "ARTEFACTS.json"), "utf8"));
for (const group of [artefacts.opentype, artefacts.dejavu]) {
  for (const [name, f] of Object.entries(group.files)) check(`artefact ${f.chemin} SHA-256`, sha(readFileSync(path.join(dir, f.chemin))) === f.sha256);
}

// 2. Matrice gelée
const lock = JSON.parse(readFileSync(path.join(dir, "matrix.lock.json"), "utf8"));
const u = (cp) => `U+${cp.toString(16).toUpperCase().padStart(4, "0")}`;
check("60 configurations", MATRIX.length === 60 && lock.count === 60);
check("6 familles × 10", ["F1", "F2", "F3", "F4", "F5", "F6"].every((f) => MATRIX.filter((c) => c.family === f).length === 10));
check("identifiants uniques", new Set(MATRIX.map((c) => c.id)).size === 60);
check("empreinte de la matrice = gel", sha(Buffer.from(canonicalJson(MATRIX), "utf8")) === lock.matrixSha256);
check("points de code déclarés = textes", MATRIX.every((c) => canonicalJson(c.codePoints) === canonicalJson(c.lines.map((l) => Array.from(l, (ch) => ch.codePointAt(0))))));
check("points de code et normalisation = gel", MATRIX.every((c, i) =>
  canonicalJson(c.codePoints.map((l) => l.map(u))) === canonicalJson(lock.configurations[i].codePoints) &&
  canonicalJson(c.lines.map((l) => Array.from(normalizeExperimental(l), (ch) => u(ch.codePointAt(0))))) === canonicalJson(lock.configurations[i].normalizedCodePoints)));

// 3. Couverture (cmap uniquement, aucun calcul de géométrie)
const fontBuf = readFileSync(path.join(dir, "vendor/dejavu-fonts-ttf-2.37/DejaVuSans.ttf"));
const font = ot.parse(fontBuf.buffer.slice(fontBuf.byteOffset, fontBuf.byteOffset + fontBuf.byteLength));
const names = { ...font.names.macintosh, ...font.names.windows, ...font.names.unicode, ...font.names };
check("police : famille DejaVu Sans, Version 2.37", names.fontFamily?.en === "DejaVu Sans" && names.version?.en === "Version 2.37");
const absent = (c) => c.lines.flatMap((l) => Array.from(normalizeExperimental(l))).filter((ch) => font.charToGlyph(ch).index === 0);
check("F1–F5 : tous les caractères présents dans la police", MATRIX.filter((c) => c.family !== "F6").every((c) => absent(c).length === 0));
check("F6 : au moins un caractère absent par configuration", MATRIX.filter((c) => c.family === "F6").every((c) => absent(c).length > 0));
check("crénage GPOS latn disponible", (font.position.getKerningTables("latn") ?? []).length > 0);

// 4. Auto-test des critères (données SYNTHÉTIQUES, en mémoire uniquement)
const expected = loadExpected(dir);
const fake = (json) => ({ matrixSha256: expected.matrixSha256, count: 60, artefacts: { fontSha256: expected.fontSha256, opentypeSha256: expected.opentypeSha256 }, environment: { secureContext: true },
  results: expected.ids.map((id) => ({ id, json: json(id), sha256: sha(Buffer.from(json(id), "utf8")) })) });
const same = (id) => `{"synthetique":"${id}"}`;
const full = (d, override = {}) => REQUIRED.map((env) => ({ dir: d, env, data: override[env] ?? fake(same) }));
check("critère PASS (synthétique)", evaluate(full("x"), expected).proposition === "PASS");
check("critère INCOMPLETE : environnement manquant", evaluate(full("x").filter((r) => r.env !== "firefox"), expected).proposition === "INCOMPLETE");
check("critère INCOMPLETE : résultat manquant", evaluate(full("x", { chrome: { ...fake(same), results: fake(same).results.slice(1) } }), expected).proposition === "INCOMPLETE");
check("critère NO-GO : entrées non identiques", evaluate(full("x", { firefox: { ...fake(same), artefacts: { fontSha256: "0", opentypeSha256: expected.opentypeSha256 } } }), expected).proposition === "NO-GO");
const corrupt = fake(same); corrupt.results[0] = { ...corrupt.results[0], sha256: "0" };
check("critère NO-GO : corruption de preuve", evaluate(full("x", { chrome: corrupt }), expected).proposition === "NO-GO");
const diverge = fake((id) => (id === expected.ids[0] ? `{"autre":1}` : same(id)));
check("divergence unique → INCOMPLETE (réexécution requise)", evaluate(full("a", { "safari-ios": diverge }), expected).proposition === "INCOMPLETE");
check("divergence reproduite → NO-GO", evaluate([...full("a", { "safari-ios": diverge }), ...full("b", { "safari-ios": diverge })], expected).proposition === "NO-GO");

// 5. Séparation produit
const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
check("opentype.js absent des dépendances produit", !JSON.stringify({ ...pkg.dependencies, ...pkg.devDependencies }).includes("opentype"));

console.log(failures.length ? `\nPRÉPARATION INCOHÉRENTE : ${failures.length} contrôle(s) en échec` : "\nPRÉPARATION COHÉRENTE (matrice non exécutée)");
process.exitCode = failures.length ? 1 : 0;
