# maplaquepro

Fondation technique de MaPlaquePro — Phase 1, étapes 1.1 à 1.3 du Master Plan v1.5.
Aucune fonctionnalité produit n'est implémentée à ce stade.

## Référence normative

- Master Plan v1.5 (validé) : `docs/master-plan/MASTER-PLAN-MAPLAQUEPRO-v1.5.md`
- Questions ouvertes de la Phase 1 : `docs/questions.md`
- Catalogue conceptuel (toutes valeurs à valider) : `docs/catalog.md`
- Décisions techniques : `docs/ADR/`

## Commandes

| Commande | Rôle |
|---|---|
| `npm ci` | Installation reproductible (lockfile) |
| `npm run typecheck` | TypeScript strict |
| `npm run lint:terms` | Lint des termes interdits et classification des fichiers (§24.6, P2, P14) |
| `npm run lint:boundaries` | Indépendance de `src/domain` (§5.1) |
| `npm run lint` | Les deux lints |
| `npm test` | Tests de fondation (Vitest) |
| `npm run build` | Build Next.js |
| `npm run ci` | Enchaînement complet exécuté par la CI |

Prérequis : Node 24.
