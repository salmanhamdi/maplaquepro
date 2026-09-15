// SP-3 — inventaire des artefacts vendorisés (ESSAI — NON NORMATIF) : provenance, intégrité publiée, SHA-256, taille, licence.
// Écrit ARTEFACTS.json (réécriture refusée). Les polices sont des FIXTURES DE SPIKE, jamais des polices produit.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const sortie = path.join(dir, "ARTEFACTS.json");
if (existsSync(sortie)) throw new Error("ARTEFACTS.json existe déjà : aucune réécriture");

const PROVENANCE = [
  {
    nom: "opentype.js",
    version: "2.0.0",
    licence: "MIT",
    role: "moteur A (instrument expérimental, non retenu)",
    source: "repris tel quel de la branche spike/sp2-text-geometry (vendor SP-2, registre npm via npm pack)",
    integritePubliee: "SHA-256 opentype.mjs attendu (SP-2) e139522ac432bb38fb4878d772012f0ad351993c36d7815d65a9890fb3fe68fb",
    dossier: "vendor/opentype.js-2.0.0",
  },
  {
    nom: "harfbuzzjs",
    version: "1.6.1",
    licence: "MIT",
    role: "moteur B (instrument expérimental, non retenu)",
    source: "registre npm — https://registry.npmjs.org/harfbuzzjs/-/harfbuzzjs-1.6.1.tgz (npm pack), archive de 469 800 octets",
    integritePubliee: "dist.integrity npm sha512-+JeJmO+HzXjDwpfCOdGSyM2bNP8WzJNFKl/8TKivbInMYDtfRIuPIDLtnBNmQzcJw6GptbhHY6o5gaH6deCMEw== (recalculée identique)",
    dossier: "vendor/harfbuzzjs-1.6.1",
  },
  {
    nom: "DejaVu Sans",
    version: "2.37",
    licence: "licence DejaVu (Bitstream Vera / domaine public pour les modifications) — vendor/dejavu-fonts-ttf-2.37/LICENSE",
    role: "police de FIXTURE uniquement",
    source: "repris tel quel de la branche spike/sp2-text-geometry (release GitHub version_2_37)",
    integritePubliee: "SHA-256 attendu (SP-2) 7da195a74c55bef988d0d48f9508bd5d849425c1770dba5d7bfc6ce9ed848954",
    dossier: "vendor/dejavu-fonts-ttf-2.37",
  },
  {
    nom: "Gentium Plus Regular",
    version: "fichier google/fonts main @ 1ac2012c34919f5fa2675aacf723fa98edb30b5f",
    licence: "SIL Open Font License 1.1 — vendor/gentiumplus/OFL.txt",
    role: "police de FIXTURE uniquement",
    source: "https://raw.githubusercontent.com/google/fonts/main/ofl/gentiumplus/GentiumPlus-Regular.ttf et OFL.txt",
    integritePubliee: "SHA-1 de blob Git publié (API GitHub) : TTF 42cbe62ce01b975c209574c646796aea3ace9806, OFL.txt 5a7a2dd8330a6d5bd70468ca98c69fe8c0d73b3c (vérifiés, git hash-object --no-filters)",
    dossier: "vendor/gentiumplus",
  },
  {
    nom: "Libre Baskerville (fonte variable, axe wght)",
    version: "fichier google/fonts main @ 1ac2012c34919f5fa2675aacf723fa98edb30b5f",
    licence: "SIL Open Font License 1.1 — vendor/librebaskerville/OFL.txt",
    role: "police de FIXTURE uniquement ; instance par défaut (H-VAR)",
    source: "https://raw.githubusercontent.com/google/fonts/main/ofl/librebaskerville/LibreBaskerville%5Bwght%5D.ttf et OFL.txt ; renommé LibreBaskerville-wght.ttf (crochets incompatibles avec les motifs de classement du lint)",
    integritePubliee: "SHA-1 de blob Git publié (API GitHub) : TTF eae4eba83203138da3a3a7603b598b7ebc5a5238, OFL.txt 92b1e6ca1cfa6f9dfe4ec67468596606fc334c4f (vérifiés, git hash-object --no-filters)",
    dossier: "vendor/librebaskerville",
  },
];

const fichiers = (d) => readdirSync(d).flatMap((f) => (statSync(path.join(d, f)).isDirectory() ? fichiers(path.join(d, f)) : [path.join(d, f)]));

const artefacts = PROVENANCE.map((p) => ({
  ...p,
  fichiers: fichiers(path.join(dir, p.dossier))
    .sort()
    .map((f) => ({ chemin: path.relative(dir, f).split(path.sep).join("/"), octets: statSync(f).size, sha256: createHash("sha256").update(readFileSync(f)).digest("hex") })),
}));

writeFileSync(sortie, `${JSON.stringify({ avertissement: "ESSAI SP-3 — NON NORMATIF. Aucune dépendance de production : package.json et package-lock.json inchangés.", artefacts }, null, 2)}\n`);
for (const a of artefacts) for (const f of a.fichiers) console.log(`${f.sha256}  ${String(f.octets).padStart(9)}  ${f.chemin}`);
