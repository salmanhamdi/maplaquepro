// SP-2 iOS — serveur HTTPS local temporaire (sans paquet). NE PAS EXÉCUTER avant arbitrage.
// Usage : node spikes/determinisme-sp2/https/serveur-https.mjs <IPv4> <dossier-certificats> <dossier-preuves> <commit-attendu>
// HTTPS :8443 → liste blanche SP-2 + POST /result?env=safari-ios (réception unique) ; HTTP :8080 → /ca.cer uniquement.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer as createHttp } from "node:http";
import { createServer as createHttps } from "node:https";
import path from "node:path";
import { SERVED, servedFile, SPIKE_DIR } from "../serveur-fichiers.mjs";

const [IP, CERTS, PREUVES, COMMIT] = process.argv.slice(2);
if (!/^\d+\.\d+\.\d+\.\d+$/.test(IP ?? "") || !CERTS || !PREUVES || !COMMIT) throw new Error("usage : <IPv4> <certs> <preuves> <commit>");
const git = (...a) => execFileSync("git", ["-C", SPIKE_DIR, ...a], { encoding: "utf8" }).trim();
const head = git("rev-parse", "HEAD");
if (!head.startsWith(COMMIT)) throw new Error(`HEAD ${head} ≠ ${COMMIT} : STOP`);
if (git("status", "--porcelain", "--", ".")) throw new Error("fichiers du spike SP-2 modifiés : STOP");

const sha = (buf) => createHash("sha256").update(buf).digest("hex");
const served = Object.fromEntries(Object.keys(SERVED).map((f) => [f, sha(readFileSync(path.join(SPIKE_DIR, f)))]));
mkdirSync(PREUVES, { recursive: true });
const BRUT = path.join(PREUVES, "safari-ios-brut.json");
const RECEPTION = path.join(PREUVES, "safari-ios-reception.json");
if (existsSync(BRUT)) throw new Error("safari-ios-brut.json existe déjà : aucune réécriture — STOP");
const log = (...m) => console.log(new Date().toISOString(), ...m);

createHttps({ key: readFileSync(path.join(CERTS, "serveur.key")), cert: readFileSync(path.join(CERTS, "serveur.cer")) }, (req, res) => {
  const url = new URL(req.url, `https://${IP}`);
  log(req.socket.remoteAddress, req.method, url.pathname + url.search);
  if (req.method === "POST" && url.pathname === "/result") {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = Buffer.concat(chunks);
      if (url.searchParams.get("env") !== "safari-ios" || existsSync(BRUT)) return res.writeHead(409).end("refusé");
      writeFileSync(BRUT, body);
      writeFileSync(RECEPTION, `${JSON.stringify({
        receivedAt: new Date().toISOString(),
        remoteAddress: req.socket.remoteAddress,
        requestUserAgent: req.headers["user-agent"],
        tls: { protocol: req.socket.getProtocol(), cipher: req.socket.getCipher().name },
        repoCommit: head,
        servedFilesSha256: served,
        bodySha256: sha(body),
        bodyBytes: body.length,
      }, null, 2)}\n`);
      log("RÉSULTAT REÇU →", BRUT);
      res.end("ok");
    });
    return;
  }
  const file = req.method === "GET" ? servedFile(url.pathname) : null;
  if (!file) return res.writeHead(404).end();
  res.writeHead(200, { "content-type": file.type, "cache-control": "no-store" }).end(file.body);
}).listen(8443, IP, () => log(`HTTPS prêt : https://${IP}:8443/index.html?env=safari-ios`));

createHttp((req, res) => {
  log(req.socket.remoteAddress, req.method, req.url, "(http)");
  if (req.method !== "GET" || req.url !== "/ca.cer") return res.writeHead(404).end();
  res.writeHead(200, { "content-type": "application/x-x509-ca-cert" }).end(readFileSync(path.join(CERTS, "ca.cer")));
}).listen(8080, IP, () => log(`Certificat CA : http://${IP}:8080/ca.cer`));

log("fichiers servis (sha256) :", served);
