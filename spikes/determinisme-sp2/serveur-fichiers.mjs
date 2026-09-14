// SP-2 — liste blanche des fichiers servis aux navigateurs (commune aux runners HTTP et HTTPS).
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SPIKE_DIR = path.dirname(fileURLToPath(import.meta.url));

export const SERVED = {
  "index.html": "text/html; charset=utf-8",
  "core.mjs": "text/javascript; charset=utf-8",
  "matrix.mjs": "text/javascript; charset=utf-8",
  "vendor/opentype.js-2.0.0/opentype.mjs": "text/javascript; charset=utf-8",
  "vendor/dejavu-fonts-ttf-2.37/DejaVuSans.ttf": "font/ttf",
};

// Retourne { type, body } ou null si le chemin n'est pas autorisé.
export function servedFile(urlPath) {
  const name = urlPath === "/" ? "index.html" : decodeURIComponent(urlPath).replace(/^\/+/, "");
  const type = SERVED[name];
  return type ? { type, body: readFileSync(path.join(SPIKE_DIR, name)) } : null;
}
