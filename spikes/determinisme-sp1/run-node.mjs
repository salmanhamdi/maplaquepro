// SP-1 — exécution Node : node spikes/determinisme-sp1/run-node.mjs
import { createHash, webcrypto } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runMatrix, toHex } from "./core.mjs";
import { MATRIX } from "./matrix.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));

const nodeHash = async (bytes) => createHash("sha256").update(bytes).digest("hex");
const webHash = async (bytes) => toHex(new Uint8Array(await webcrypto.subtle.digest("SHA-256", bytes)));

const a = await runMatrix(MATRIX, nodeHash);
const b = await runMatrix(MATRIX, webHash);
if (a.globalSha256 !== b.globalSha256) throw new Error("node:crypto et WebCrypto divergent");

const output = {
  environment: {
    runtime: "node",
    version: process.version,
    platform: `${os.type()} ${os.release()} ${process.arch}`,
    hash: "node:crypto createHash (contrôle croisé WebCrypto identique)",
    proof: "principale (runtime Node)",
  },
  ...a,
};
mkdirSync(path.join(dir, "results"), { recursive: true });
writeFileSync(path.join(dir, "results", "node.json"), `${JSON.stringify(output, null, 2)}\n`);
console.log(`node ${process.version} — ${a.count} configurations — global ${a.globalSha256}`);
