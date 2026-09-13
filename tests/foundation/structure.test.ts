import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const readJson = (file: string) => JSON.parse(readFileSync(path.join(root, file), "utf8"));

describe("fondation du projet (§5)", () => {
  it("met en place la séparation métier / serveur / UI de §5.1", () => {
    for (const dir of ["src/domain", "src/server", "src/app", "src/components"]) {
      expect(existsSync(path.join(root, dir)), dir).toBe(true);
    }
  });

  it("active TypeScript strict", () => {
    expect(readJson("tsconfig.json").compilerOptions.strict).toBe(true);
  });

  it("épingle chaque dépendance sur une version exacte (ADR-0001)", () => {
    const pkg = readJson("package.json");
    const all = { ...pkg.dependencies, ...pkg.devDependencies } as Record<string, string>;
    for (const [name, version] of Object.entries(all)) {
      expect(version, name).toMatch(/^\d+\.\d+\.\d+$/);
    }
    expect(pkg.dependencies.next).toMatch(/^16\./);
    expect(pkg.dependencies.react).toMatch(/^19\./);
    expect(existsSync(path.join(root, "package-lock.json"))).toBe(true);
  });

  it("n'a aucun fichier d'instructions agents implicite (ARCH-4) et désactive leur génération", () => {
    expect(existsSync(path.join(root, "AGENTS.md"))).toBe(false);
    expect(existsSync(path.join(root, "CLAUDE.md"))).toBe(false);
    expect(readFileSync(path.join(root, "next.config.ts"), "utf8")).toMatch(/agentRules:\s*false/);
  });
});
