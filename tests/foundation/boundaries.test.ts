import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error — script JavaScript (sans déclarations de types)
import { checkBoundaries } from "../../scripts/check-boundaries.mjs";

const root = path.resolve(__dirname, "../..");
const fixtures = path.join(root, "tests/fixtures/boundaries");

describe("indépendance de la couche métier (§5.1)", () => {
  it("accepte des imports internes à la couche métier", () => {
    const violations = checkBoundaries({
      domainDir: path.join(fixtures, "domain-ok"),
      srcDir: fixtures,
    });
    expect(violations).toEqual([]);
  });

  it("refuse React, Next.js, les modules Node, l'ORM et les imports sortants", () => {
    const violations = checkBoundaries({
      domainDir: path.join(fixtures, "domain-bad"),
      srcDir: fixtures,
    }) as Array<{ specifier: string }>;
    const specifiers = violations.map((v) => v.specifier).sort();
    expect(specifiers).toEqual(
      ["../outside", "@/server/db", "drizzle-orm", "fs", "next/navigation", "node:path", "react"].sort(),
    );
  });

  it("vérifie la couche métier réelle du dépôt", () => {
    const violations = checkBoundaries({
      domainDir: path.join(root, "src/domain"),
      srcDir: path.join(root, "src"),
    });
    expect(violations).toEqual([]);
  });
});
