# ADR-0004 — Indépendance de la couche métier vis-à-vis du framework

- **Statut** : proposé (à valider par le Supervisor avec la tranche Phase 1.1–1.3)
- **Date** : 14/09/2026
- **Référence normative** : Master Plan v1.5 §5.1 (« `src/domain/` — pur : aucun import React/Next/DB/fs ; vérifié par lint boundaries »)
- **Numérotation** : ADR-0003, ADR-0005 et ADR-0006 sont réservés par le Master Plan (hébergement, déterminisme, backoffice) et ne sont pas utilisés.

## Décision technique

`scripts/check-boundaries.mjs` (`npm run lint:boundaries`) analyse les imports de chaque fichier source de `src/domain`, via l'API compilateur de TypeScript (`preProcessFile`, sans exécution du code). Il refuse :

1. React, React DOM, Next.js et leurs sous-chemins ;
2. tout module Node (préfixe `node:` ou module intégré, dont le système de fichiers) ;
3. l'ORM retenu par §5.4 (`drizzle-orm`, `drizzle-kit`) ;
4. tout import relatif ou alias `@/` qui sort de `src/domain` (serveur, app, composants).

Les pilotes de base de données seront ajoutés à la liste lorsque le dialecte sera décidé (OD-13, ouvert).
Aucune liste d'autorisation n'est imposée (Q-P1-08, Q-P1-09).

## Conséquences

- La règle §5.1 est bloquante en CI.
- Des fixtures conformes et non conformes (`tests/fixtures/boundaries/`) démontrent le comportement.
- Proposition technique uniquement : aucune règle métier n'en découle.
