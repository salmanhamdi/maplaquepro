import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error — module JavaScript du périmètre technique du lint (sans déclarations de types)
import * as lint from "../../scripts/forbidden-terms.mjs";

// Les motifs proviennent exclusivement de la source canonique (P14 D5) :
// aucun terme interdit n'est recopié dans ce fichier.
const root = path.resolve(__dirname, "../..");
const config = lint.loadConfig();
const patterns = lint.compilePatterns(config);

function readSamples(name: string): string[] {
  return readFileSync(path.join(root, "scripts/forbidden-terms-samples", name), "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

describe("lint des termes interdits — motifs (§24.6)", () => {
  it("détecte chaque échantillon qui doit être refusé", () => {
    for (const sample of readSamples("must-match.txt")) {
      expect(lint.findTermViolations(sample, patterns), sample).not.toHaveLength(0);
    }
  });

  it("n'émet aucun faux positif sur les échantillons autorisés (dont TroGlass et Plexiglass)", () => {
    for (const sample of readSamples("must-not-match.txt")) {
      expect(lint.findTermViolations(sample, patterns), sample).toHaveLength(0);
    }
  });
});

describe("lint des termes interdits — zones et classification (P2, P14)", () => {
  it("déclare 2 zones actives et une Shared Core inactive sans fichier", () => {
    expect(config.zones["strict-product"].status).toBe("active");
    expect(config.zones["audit"].status).toBe("active");
    expect(config.zones["audit"].lintTerms).toBe(false);
    expect(config.zones["shared-core"].status).toBe("inactive");
    expect(config.zones["shared-core"].globs).toHaveLength(0);
  });

  it("exige une justification pour chaque exclusion", () => {
    expect(lint.validateConfig(config)).toEqual([]);
    for (const exclusion of config.exclusions) {
      expect(exclusion.reason).toBeTruthy();
      expect(exclusion.source).toBeTruthy();
    }
  });

  it("refuse un fichier non classé (aucune classification silencieuse)", () => {
    expect(lint.classifyFile("inconnu/nouveau-fichier.txt", config)).toHaveLength(0);
    const errors = lint.runLint({ root, config, files: ["package.json"] });
    expect(errors).toEqual([]);
    const unclassified = lint.runLint({ root, config, files: ["inconnu/nouveau-fichier.txt"] });
    expect(unclassified[0]).toContain("non classé");
  });

  it("refuse une configuration activant implicitement la Shared Core", () => {
    const tampered = structuredClone(config);
    tampered.zones["shared-core"].globs = ["packages/**"];
    expect(lint.validateConfig(tampered).join("\n")).toContain("zone inactive");
  });

  it("limite l'exclusion au périmètre technique du lint et au lockfile généré", () => {
    const globs = config.exclusions.map((e: { glob: string }) => e.glob).sort();
    expect(globs).toEqual(
      [
        "package-lock.json",
        "scripts/forbidden-terms-samples/**",
        "scripts/forbidden-terms.config.json",
        "scripts/forbidden-terms.mjs",
      ].sort(),
    );
  });

  it("classe chaque fichier du dépôt dans exactement une zone ou exclusion, sans violation", () => {
    const files = lint.listRepoFiles(root);
    expect(files.length).toBeGreaterThan(0);
    expect(lint.runLint({ root, config, files })).toEqual([]);
  });
});
