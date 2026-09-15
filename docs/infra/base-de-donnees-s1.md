# Infrastructure base de données — S1

**Tranche S1 : socle Drizzle → mysql2 → MariaDB 11.8 → migrations versionnées → CI.**

S1 ne crée **aucune table métier** : pas de `customers`, `customer_sessions`, `customer_login_tokens`, `configurations` ni `bat_snapshots`. Ces tables relèvent de S2 et S3.

## Décisions Supervisor

- Drizzle ORM avec le pilote `mysql2` sur MariaDB 11.8.
- Identifiants **ULID générés côté serveur par l'application** : aucun `AUTO_INCREMENT` métier, aucune génération par MariaDB.
- Temps en **UTC**, sans dépendance au fuseau local ni conversion métier dans la couche DB.
- Migrations générées par `drizzle-kit generate`, versionnées dans Git et relues.
- `push` interdit comme mécanisme de production.
- Base locale MariaDB 11.8 sous Docker ; service MariaDB 11.8 éphémère en CI.
- Tests DB séparés des tests du domaine.

## Implémentation

| Élément | Emplacement |
|---|---|
| Connexion (pool applicatif + connexion unique), lecture de `DATABASE_URL` | `src/server/db/client.ts` |
| ULID | `src/server/db/ids.ts` |
| Schéma applicatif (vide en S1) | `src/server/db/schema.ts` |
| Preuve technique `migrate()` (non branchée) | `src/server/db/migrate.ts` |
| Configuration drizzle-kit | `drizzle.config.ts` |
| Migrations versionnées | `drizzle/` |
| MariaDB locale | `docker-compose.yml`, `.env.example` → `.env.local` (ignoré) |
| Tests d'intégration réels | `tests/db/`, `vitest.db.config.mts` |
| CI | job `database` de `.github/workflows/ci.yml` |

**Commandes**

| Commande | Rôle |
|---|---|
| `npm run db:generate` | `drizzle-kit generate` |
| `npm run db:check` | `drizzle-kit check` |
| `npm run db:migrate` | `drizzle-kit migrate` (local et CI) |
| `npm run test:db` | Tests d'intégration ; nécessite `DATABASE_URL` |

**Démarrage local**

```bash
docker compose --env-file .env.local up -d --wait
```

### Migration initiale `0000_init`

- **Contenu** : migration personnalisée **sans instruction SQL** (`drizzle-kit generate --custom`). Elle ne crée aucune table.
- **Rôle** : établir la chaîne de migrations.
- **Effet de son application** : Drizzle crée uniquement sa table de suivi `__drizzle_migrations`.

### Choix techniques S1

- **ULID** : stocké en `CHAR(26)`, forme canonique ; bibliothèque `ulid`, générateur monotone.
- **Dates** :
  - le pilote est configuré en `timezone: "Z"` ;
  - chaque session exécute `SET time_zone = '+00:00'` ;
  - la base locale Docker démarre avec `--default-time-zone=+00:00` ;
  - la colonne de test utilise `DATETIME(3)`.

Le type SQL des horodatages métier (`DATETIME(3)` ou `TIMESTAMP`) n'est **pas** fixé par S1 (voir « Points ouverts »).

## Faits observés (tests réels, MariaDB 11.8)

**Couverture de `tests/db/compat-mariadb.test.ts`** : une table de test `s1_compat_essai` et une table de suivi de test `__s1_compat_migrations`, supprimées après exécution, vérifient :
- connexion mysql2 et `VERSION()` 11.8 ;
- requête Drizzle ;
- migration générée par drizzle-kit puis appliquée deux fois sans effet ;
- JSON ;
- index unique et index secondaire ;
- transactions avec commit et rollback ;
- UTC avec un processus en `TZ=Pacific/Kiritimati` ;
- ULID ;
- requêtes paramétrées ;
- chaîne `drizzle/` de l'application, sans table métier.

**Particularités constatées**
- **JSON** : sous MariaDB, `JSON` est un alias de `LONGTEXT` avec contrôle `JSON_VALID`. Drizzle relit l'objet structuré à l'identique. Une valeur non JSON est rejetée. `JSON_VALUE` rend `'1'` pour un booléen JSON.
- **Drizzle 0.45.2** : `drizzle({ client, mode })` n'est pas reconnu comme configuration (heuristique `isConfig`). Le client est donc créé avec `drizzle({ client })`.

## Environnements Node

| Environnement | Version | Statut |
|---|---|---|
| CI | Node 24 | Fait observé |
| Poste local | Node 24.18.0 | Fait observé |
| Hostinger | Node 22.18.0 | Fait observé, ADR-0003 |

Écart non traité en S1 (AN-10). Aucune exécution des tests DB sous Node 22 n'a été réalisée.

## Points ouverts (non décidés par S1)

| Point | Sujet |
|---|---|
| D-S1-1 | Mode d'application des migrations sur Hostinger. `src/server/db/migrate.ts` est une **preuve technique**, non la solution de production ; aucune migration n'est exécutée au démarrage |
| D-S1-4 | Type SQL des horodatages métier |
| D-S1-6 | Base de la pre-beta |
| D-S1-7 | Un ou deux utilisateurs de base |
| D-S1-8 | Sauvegardes |

**Hostinger — NON ÉTABLI** : SSH exploitable, CLI, accès distant à la base, TLS, privilèges, plusieurs bases ou utilisateurs, déploiement GitHub, sauvegardes. **Aucune migration de production n'a été effectuée.**
