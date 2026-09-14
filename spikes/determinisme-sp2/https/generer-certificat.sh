#!/usr/bin/env sh
# SP-2 iOS — certificats de TEST temporaires, NOUVEAUX (aucun certificat SP-1 réutilisé). NE PAS EXÉCUTER avant arbitrage.
# Usage : sh generer-certificat.sh <IPv4 locale du PC> <dossier-certificats HORS DÉPÔT>
# Produit ca.cer (public, à installer sur l'iPhone), serveur.cer, serveur.key (clé privée de test : jamais versée, supprimée après la preuve).
set -eu
export MSYS_NO_PATHCONV=1   # Git Bash : empêche la conversion de -subj en chemin (incident SP-1)
IP="${1:?adresse IPv4 locale requise}"
OUT="${2:?dossier de certificats hors dépôt requis}"
case "$OUT" in *maplaquepro*) echo "refus : dossier dans le dépôt"; exit 1;; esac
[ -e "$OUT/ca.key" ] && { echo "$OUT contient déjà une CA : aucune réécriture"; exit 1; }
mkdir -p "$OUT"

openssl req -x509 -newkey rsa:2048 -sha256 -nodes -days 7 \
  -keyout "$OUT/ca.key" -out "$OUT/ca.cer" \
  -subj "/CN=MaPlaquePro SP2 CA de test temporaire" \
  -addext "basicConstraints=critical,CA:TRUE" \
  -addext "keyUsage=critical,keyCertSign,cRLSign"

openssl req -newkey rsa:2048 -sha256 -nodes -keyout "$OUT/serveur.key" -out "$OUT/serveur.csr" -subj "/CN=$IP"
printf "basicConstraints=CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=IP:%s\n" "$IP" > "$OUT/serveur.ext"
openssl x509 -req -in "$OUT/serveur.csr" -CA "$OUT/ca.cer" -CAkey "$OUT/ca.key" -CAcreateserial -days 7 -sha256 -extfile "$OUT/serveur.ext" -out "$OUT/serveur.cer"
rm "$OUT/serveur.csr" "$OUT/serveur.ext"
openssl verify -CAfile "$OUT/ca.cer" "$OUT/serveur.cer"
openssl x509 -in "$OUT/ca.cer" -noout -fingerprint -sha256
