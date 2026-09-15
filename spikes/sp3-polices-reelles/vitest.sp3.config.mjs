// SP-3 — configuration Vitest isolée du spike (hors CI : la configuration du projet n'inclut que tests/**/*.test.ts).
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  root: fileURLToPath(new URL("../..", import.meta.url)),
  test: { environment: "node", include: ["spikes/sp3-polices-reelles/**/*.test.mjs"] },
});
