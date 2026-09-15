import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Les tests d'intégration DB (MariaDB réelle) ont leur propre configuration : vitest.db.config.mts.
    exclude: ["tests/db/**", "node_modules/**"],
  },
});
