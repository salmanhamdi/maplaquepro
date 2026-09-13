# ADR-0001 — Fondation technique et dépendances de la Phase 1

- **Statut** : proposé (à valider par le Supervisor avec la tranche Phase 1.1–1.3)
- **Date** : 14/09/2026
- **Référence normative** : Master Plan v1.5 §5.1, §5.4, §31 (Phase 1) ; autorisation d'implémentation Phase 1

## Contexte

La stack est décidée par le Master Plan (§5.4). L'autorisation Phase 1 impose Next.js 16.x, React 19.x, TypeScript strict, et seulement les dépendances nécessaires aux étapes 1.1 à 1.3, avec des versions exactes et un lockfile.

## Décision technique

### Dépendances installées (versions exactes)

| Paquet | Version | Type | Justification |
|---|---|---|---|
| `next` | 16.3.5 | dépendance | Framework App Router imposé (§5.1, §5.4) ; dernière 16.x publiée |
| `react` | 19.3.0 | dépendance | Requis par Next.js (§5.4) |
| `react-dom` | 19.3.0 | dépendance | Requis par Next.js (§5.4) |
| `typescript` | 5.9.3 | dev | TypeScript strict (§5.4). La 7.x n'est pas retenue : elle ne fournit pas l'API compilateur JavaScript (documentation Next.js 16), utilisée par le contrôle des frontières (ADR-0004) |
| `@types/node` | 24.13.4 | dev | Types de l'environnement Node 24 (scripts, tests) |
| `@types/react` | 19.3.0 | dev | Types React 19 |
| `@types/react-dom` | 19.3.0 | dev | Types React DOM 19 |
| `vitest` | 5.0.0 | dev | Outil de tests listé au §5.4 ; tests de fondation |

Les versions sont épinglées sans plage. `package-lock.json` est versionné (`npm ci` en CI).

### Non installés en Phase 1 (non nécessaires aux étapes 1.1 à 1.3)

Tailwind, Framer Motion, Lucide, Zod, Drizzle, opentype.js, Stripe, Resend, Sentry, Playwright, axe, Lighthouse CI. Ils seront ajoutés dans les phases qui en ont besoin, par ADR.
ESLint n'est pas installé : les deux contrôles exigés en Phase 1 (termes interdits, frontières de la couche métier) sont réalisés par des scripts sans dépendance supplémentaire (ADR-0002, ADR-0004).

### Structure

`src/domain` (métier pur), `src/server` (infrastructure, vide), `src/app` (UI Next.js minimale), `src/components` (vide) — §5.1. Alias `@/*` → `src/*`.

### Configuration

- `tsconfig.json` : `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch` ; fixtures de test exclues de la compilation.
- `next.config.ts` : `agentRules: false`. Next.js 16.3 génère automatiquement `AGENTS.md` et `CLAUDE.md` lors de `next dev` lorsqu'un agent est détecté. Or la décision ARCH-4 a supprimé ces fichiers, et aucune instruction implicite ne doit apparaître.
- Node ≥ 24 (`engines`).

### CI

GitHub Actions (`.github/workflows/ci.yml`) : Node 24, `npm ci`, typecheck, lint des termes interdits, lint des frontières, tests, build. Actions tierces : `actions/checkout@v4`, `actions/setup-node@v4`.

## Conséquences

- Base reproductible et minimale, sans verrouiller les décisions ouvertes (hébergement OD-12, base de données OD-13, stockage OD-14, notation du modèle A-1).
- Toute nouvelle dépendance exige un ADR.
- Proposition technique uniquement : aucune règle métier n'est tirée de ces choix.
