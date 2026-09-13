#!/usr/bin/env node
// Indépendance de la couche métier — Master Plan v1.5 §5.1 ; ADR-0004.
// `src/domain` est pur : aucun import React, Next.js, base de données, système de fichiers
// ni module Node, et aucun import sortant de `src/domain` (serveur, app, composants).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs", ".jsx"]);

// React / Next.js (§5.1) ; Drizzle (ORM retenu §5.4). Les pilotes de base de données seront
// ajoutés lorsque le dialecte sera décidé (OD-13, ouvert).
const FORBIDDEN_PACKAGES = ["react", "react-dom", "next", "drizzle-orm", "drizzle-kit"];

function listSourceFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...listSourceFiles(full));
    else if (SOURCE_EXTENSIONS.has(path.extname(entry))) files.push(full);
  }
  return files;
}

function packageBase(specifier) {
  const parts = specifier.split("/");
  return specifier.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];
}

function isInside(target, dir) {
  const relative = path.relative(dir, target);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

export function checkSpecifier(specifier, { file, domainDir, srcDir }) {
  if (specifier.startsWith(".")) {
    const target = path.resolve(path.dirname(file), specifier);
    return isInside(target, domainDir) ? null : "import sortant de la couche métier";
  }
  if (specifier.startsWith("@/")) {
    const target = path.resolve(srcDir, specifier.slice(2));
    return isInside(target, domainDir) ? null : "import sortant de la couche métier (alias @/)";
  }
  const base = packageBase(specifier);
  if (specifier.startsWith("node:") || builtinModules.includes(base)) return "module Node interdit";
  if (FORBIDDEN_PACKAGES.includes(base)) return `paquet interdit (${base})`;
  return null;
}

export function checkBoundaries({ domainDir, srcDir }) {
  const violations = [];
  for (const file of listSourceFiles(domainDir)) {
    const info = ts.preProcessFile(readFileSync(file, "utf8"), true, true);
    for (const imported of info.importedFiles) {
      const reason = checkSpecifier(imported.fileName, { file, domainDir, srcDir });
      if (reason) violations.push({ file, specifier: imported.fileName, reason });
    }
  }
  return violations;
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  const root = process.cwd();
  const violations = checkBoundaries({
    domainDir: path.join(root, "src", "domain"),
    srcDir: path.join(root, "src"),
  });
  if (violations.length > 0) {
    console.error(`Frontières de la couche métier : ${violations.length} violation(s)`);
    for (const v of violations) {
      console.error(`  - ${path.relative(root, v.file)} : « ${v.specifier} » — ${v.reason}`);
    }
    process.exit(1);
  }
  console.log("Frontières de la couche métier : OK");
}
