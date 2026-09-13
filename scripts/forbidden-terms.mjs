#!/usr/bin/env node
// Lint des termes interdits — Master Plan v1.5 §4.3, §24.6 ; arbitrages P2 et P14 ; ADR-0002.
// Ce fichier appartient au périmètre technique du lint, explicitement exclu du contrôle (P14).
// Règles appliquées :
//  - 2 zones actives par défaut (stricte produit, documentaire d'audit) + Shared Core conditionnelle inactive ;
//  - tout fichier est classé dans une zone connue OU explicitement exclu avec justification (P2 D3) ;
//  - aucune classification silencieuse par défaut ;
//  - la zone stricte produit est contrôlée par mot (frontière de mot, casse ignorée, accents normalisés).
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const DEFAULT_CONFIG_PATH = fileURLToPath(new URL("./forbidden-terms.config.json", import.meta.url));

export function loadConfig(configPath = DEFAULT_CONFIG_PATH) {
  return JSON.parse(readFileSync(configPath, "utf8"));
}

export function normalize(text) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function compilePatterns(config) {
  return config.patterns.map((source) => new RegExp(normalize(source), "g"));
}

export function findTermViolations(text, patterns) {
  const normalized = normalize(text);
  const violations = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    for (const match of normalized.matchAll(pattern)) {
      violations.push({ pattern: pattern.source, index: match.index ?? 0 });
    }
  }
  return violations;
}

export function globToRegExp(glob) {
  let out = "";
  for (let i = 0; i < glob.length; i += 1) {
    const char = glob[i];
    if (char === "*") {
      if (glob[i + 1] === "*") {
        out += ".*";
        i += 1;
        if (glob[i + 1] === "/") i += 1;
      } else {
        out += "[^/]*";
      }
    } else if (char === "?") {
      out += "[^/]";
    } else {
      out += char.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    }
  }
  return new RegExp(`^${out}$`);
}

export function classifyFile(file, config) {
  const matches = [];
  for (const [name, zone] of Object.entries(config.zones)) {
    if (zone.globs.some((glob) => globToRegExp(glob).test(file))) {
      matches.push({ kind: "zone", name, zone });
    }
  }
  for (const exclusion of config.exclusions) {
    if (globToRegExp(exclusion.glob).test(file)) {
      matches.push({ kind: "exclusion", name: exclusion.glob, exclusion });
    }
  }
  return matches;
}

export function validateConfig(config) {
  const errors = [];
  if (!Array.isArray(config.patterns) || config.patterns.length === 0) {
    errors.push("configuration : liste de motifs vide");
  }
  for (const [name, zone] of Object.entries(config.zones)) {
    if (!["active", "inactive"].includes(zone.status)) {
      errors.push(`configuration : statut invalide pour la zone ${name}`);
    }
    if (zone.status === "inactive" && zone.globs.length > 0) {
      errors.push(`configuration : la zone inactive ${name} ne doit contenir aucun fichier`);
    }
  }
  for (const exclusion of config.exclusions) {
    if (!exclusion.reason || !exclusion.source) {
      errors.push(`configuration : exclusion sans justification (${exclusion.glob})`);
    }
  }
  return errors;
}

export function listRepoFiles(root) {
  const output = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], {
    cwd: root,
    encoding: "utf8",
  });
  return output
    .split("\0")
    .filter(Boolean)
    .filter((file) => existsSync(path.join(root, file)));
}

export function runLint({ root, config, files }) {
  const errors = [...validateConfig(config)];
  const patterns = compilePatterns(config);
  for (const file of files) {
    const matches = classifyFile(file, config);
    if (matches.length === 0) {
      errors.push(`${file} : fichier non classé (aucune zone ni exclusion explicite)`);
      continue;
    }
    if (matches.length > 1) {
      errors.push(`${file} : classé plusieurs fois (${matches.map((m) => m.name).join(", ")})`);
      continue;
    }
    const [match] = matches;
    if (match.kind === "exclusion") continue;
    if (match.zone.status !== "active") {
      errors.push(`${file} : classé dans la zone inactive ${match.name}`);
      continue;
    }
    if (!match.zone.lintTerms) continue;
    const content = readFileSync(path.join(root, file));
    const text = content.includes(0) ? "" : content.toString("utf8");
    for (const violation of findTermViolations(`${file}\n${text}`, patterns)) {
      errors.push(`${file} : terme interdit (motif ${violation.pattern})`);
    }
  }
  return errors;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  const root = process.cwd();
  const config = loadConfig();
  const errors = runLint({ root, config, files: listRepoFiles(root) });
  if (errors.length > 0) {
    console.error(`Lint des termes interdits : ${errors.length} erreur(s)`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log("Lint des termes interdits : OK");
}
