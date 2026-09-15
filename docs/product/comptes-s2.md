# S2 — Compte client et authentification

**Tranche S2** : compte client **facultatif**, authentification email + mot de passe, sessions, vérification d'email, réinitialisation et changement de mot de passe, limitation de débit, espace `/compte` minimal.

**Hors S2** (tranche commandes ultérieure) : commandes, checkout, suivi invité, jetons d'accès commande, liaison commande / compte, emails de commande. Le compte n'est jamais une condition d'achat.

## Décisions Supervisor appliquées

| Sujet | Décision |
|---|---|
| Compte | Dans le MVP, facultatif |
| Authentification | Email + mot de passe (magic link abandonné) |
| Hachage | Argon2id, `argon2@0.45.1`, m=19456 Kio, t=2, p=1, format PHC (re-hachage possible) — preuve réelle Hostinger S2-0 |
| Non retenus | scrypt, `@node-rs/argon2` |
| Mot de passe en clair | Jamais persisté, journalisé, placé dans une URL ni renvoyé |
| Session | Valeur opaque aléatoire, hash en base ; cookie `__Host-`, `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, sans `Domain` |
| Jetons | Aléatoires, hachés en base, finalité typée, expiration, consommation contrôlée |
| Anti-énumération | Aucune révélation inutile de l'existence d'un email |
| Mutations | Jamais par `GET` |
| Horodatages | `DATETIME(3)` en UTC |
| Identifiants | ULID `CHAR(26)` générés par l'application, aucun `AUTO_INCREMENT` |
| Restauration Hostinger | Redéploiement d'un artefact connu ; le rollback de l'historique hPanel n'est pas une restauration fiable |

## Paramètres arbitrés (Supervisor, arbitrage final S2 — MVP)

Tous regroupés dans `src/server/auth/parametres.ts` (`PARAMETRES_AUTH`). Clés de limitation : SHA-256, pas de HMAC pour le MVP. Audit : stdout uniquement, sans conservation en base.

| Paramètre | Valeur proposée |
|---|---|
| Mot de passe | 10 caractères minimum, 256 octets UTF-8 maximum, normalisation NFC, aucune règle de composition |
| Durée de session | 30 jours, absolue (non glissante) |
| Jeton de vérification d'email | 24 h |
| Jeton de réinitialisation | 1 h |
| Connexion avant vérification d'email | Autorisée |
| Changement de mot de passe | Révoque toutes les autres sessions et renouvelle la session courante |
| Réinitialisation | Révoque toutes les sessions, sans connexion automatique |
| Limites | connexion 5 / 15 min par email et 30 / 15 min par IP ; inscription 5 / h par IP ; mot de passe oublié 3 / h par email et 10 / h par IP ; renvoi de vérification 3 / h par compte ; changement de mot de passe 5 / 15 min par compte |
| Journal d'audit | JSON sur la sortie standard (`canal: "auth"`) : événement, horodatage, `customerId` si disponible, sans email |

## Architecture

| Élément | Emplacement |
|---|---|
| Schéma (4 tables) | `src/server/db/schema.ts`, migration `drizzle/0001_s2_comptes.sql` |
| Cas d'usage (indépendants de Next.js) | `src/server/auth/service.ts` |
| Hachage, politique | `src/server/auth/mot-de-passe.ts` |
| Secrets opaques | `src/server/auth/secrets.ts` |
| Limitation de débit (en base) | `src/server/auth/limites.ts` |
| Journal d'audit | `src/server/auth/audit.ts` |
| Cookie de session | `src/server/auth/cookie-session.ts` |
| Liaison Next.js (cookies, IP, dépendances) | `src/server/auth/requete.ts` |
| Configuration (Zod) | `src/server/auth/environnement.ts` |
| Emails | `src/server/email/envoi.ts` (interface), `src/server/email/modeles.ts` |
| Server Actions | `src/app/compte/actions.ts` |
| Pages | `/compte`, `/compte/connexion`, `/compte/inscription`, `/compte/mot-de-passe-oublie`, `/compte/reinitialiser`, `/compte/verifier-email` |

### Tables

- **`customers`** : `id`, `email` (unique, normalisé), `password_hash`, `email_verified_at`, `created_at`, `updated_at`.
- **`customer_sessions`** : `token_hash` unique, `expires_at`, `last_seen_at`, `revoked_at` ; clé étrangère en cascade.
- **`customer_tokens`** : `purpose` ∈ {`email_verification`, `password_reset`}, `token_hash` unique, `expires_at`, `consumed_at` ; clé étrangère en cascade.
- **`auth_attempts`** : `key_hash` (SHA-256 de l'action et de la clé), `action`, `window_start`, `count` ; clé primaire composite.

### Comportements

- **Inscription** : réponse identique, que l'email soit nouveau ou déjà inscrit. Le hachage est calculé dans les deux cas. Si l'email est déjà inscrit, un email informatif est envoyé, sans jeton.
- **Connexion** : erreur unique « identifiants invalides » et vérification factice si l'email est inconnu. Re-hachage transparent si les paramètres ont changé.
- **Liens email** : le jeton est dans l'URL du lien. La page `GET` affiche un formulaire, et seul le `POST` consomme le jeton (résistant aux scanners de liens). Les pages portent `Referrer-Policy: no-referrer` et `noindex`.
- **Consommation d'un jeton** : transaction avec `SELECT … FOR UPDATE`, contrôle de la finalité, de l'usage unique et de l'expiration. Toute nouvelle demande invalide les jetons précédents de même finalité.
- **Redirection après connexion** : chemins internes relatifs uniquement, sinon `/compte`.
- **URL des liens** : origine lue dans `APP_URL`, jamais déduite de l'en-tête `Host`.

## Environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Base MariaDB (S1) |
| `APP_URL` | Origine des liens envoyés par email |
| `EMAIL_TRANSPORT` | `memoire` (tests) ou `fichier` (développement, `.local/outbox/`) |

**Aucun fournisseur d'email n'est arbitré.** En production, la configuration lève `EmailNonConfigure` : aucun envoi n'est simulé silencieusement.

## Tests

- **`tests/auth/auth-unitaire.test.ts`** : hachage et paramètres, politique, secrets, cookie, validation, redirections, configuration, journal, périmètre S2, frontières.
- **`tests/db/auth.test.ts`** (MariaDB réelle) :
  - schéma ;
  - inscription et anti-énumération ;
  - jetons : usage unique, expiration, concurrence, séparation des finalités ;
  - sessions : expiration, révocation ;
  - re-hachage ;
  - limitation persistée entre instances ;
  - réinitialisation et changement de mot de passe avec révocation ;
  - cascade, UTC ;
  - absence de secret dans le journal.
- Un garde-fou refuse d'exécuter ces tests hors d'une base se terminant par `_ci`, `_local` ou `_test`.

## Points ouverts

**Bloquants production (S2 n'est pas production-ready) :**
- **Fournisseur d'email de production** : non choisi. Le refus explicite (`EmailNonConfigure`) reste en place ; aucun fournisseur fictif.
- **D-S1-1** : mode de migration en production, toujours ouvert.

**Ouverts, sans tranche dédiée :**
- **`X-Forwarded-For`** : utilisé comme clé IP, mais pas une source de vérité absolue. Sa fiabilité dépend du proxy de production.
- **Purge et rétention** des tentatives, sessions et jetons expirés : non implémentées.
- **Suppression de compte** (D4).
- **Évolution HMAC** des clés de limitation.
- **Conservation de l'audit en base.**
