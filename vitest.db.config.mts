// Tests d'intégration DB (MariaDB 11.8 réelle), séparés des tests du domaine.
// Fuseau du processus volontairement exotique : les vérifications UTC ne doivent pas en dépendre.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/db/**/*.test.ts"],
    env: { TZ: "Pacific/Kiritimati" },
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
  },
});
