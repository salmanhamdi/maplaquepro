# Questions ouvertes — Phase 1 (étapes 1.1 à 1.3)

Référence : Master Plan v1.5 validé, contrat d'exécution point 1 (« consigner les ambiguïtés avant de coder »).
Chaque question est **À CONFIRMER** par le Supervisor. Rien ici n'est une décision normative.

## A. Points ouverts du Master Plan (rappel — non traités en Phase 1)

G1-DOC, G2-DOC, VR-42, ART1-DOC, A-1, R-1, RÉF-1, RISK-1, CP-1, HIST-1, TERM-1, TAB-1, VR-15, VR-41, CR-2, CR-7, CR-11 (§37).
Aucun n'a été rencontré ni résolu par l'implémentation des étapes 1.1 à 1.3.

## B. Questions de mise en œuvre soulevées par la Phase 1

| ID | Question | Choix provisoire appliqué (réversible) | Référence |
|---|---|---|---|
| Q-P1-01 | Emplacement définitif des fichiers du lint des termes interdits (point S6 du kickoff, non arbitré) | Chemins indicatifs de v1.4 : `scripts/forbidden-terms.mjs`, `scripts/forbidden-terms.config.json` ; échantillons dans `scripts/forbidden-terms-samples/` | §24.6, P14, ADR-0002 |
| Q-P1-02 | Zone des fichiers non listés au §24.6 : fichiers de configuration racine, CI, `README.md`, `.gitignore`, `scripts/check-boundaries.mjs`, `docs/questions.md`, ADR non liés à l'audit du backoffice | Classés **zone stricte produit** (classement le plus contrôlé), déclarés explicitement dans la configuration | P2 D3, ADR-0002 |
| Q-P1-03 | Exclusion de `package-lock.json` (fichier généré, noms de paquets tiers) | Exclusion explicite justifiée, marquée « À CONFIRMER » dans la configuration | P2 D3, ADR-0002 |
| Q-P1-04 | Numérotation des ADR : v1.5 réserve ADR-0003 (hébergement), ADR-0005 (déterminisme), ADR-0006 (backoffice) | ADR-0001, ADR-0002, ADR-0004 utilisés ; numéros réservés non réutilisés | §26, §12, §21 ; P8 D4 (esprit) |
| Q-P1-05 | Copie du Master Plan v1.5 dans le dépôt | `docs/master-plan/MASTER-PLAN-MAPLAQUEPRO-v1.5.md`, classée zone documentaire d'audit | §24.6 (Master Plans) |
| Q-P1-06 | Le fichier source sur le poste s'appelle encore « MASTER PLAN MAPLAQUEPRO v1.5 - BROUILLON.md » ; seul le statut interne a été mis à jour (VALIDÉ) | Nom de fichier non modifié | Directive d'autorisation Phase 1 §2 ; CP-1 |
| Q-P1-07 | Next.js 16.3 génère automatiquement `AGENTS.md` / `CLAUDE.md` lors de `next dev` si un agent est détecté | Génération désactivée (`agentRules: false`) | Décision ARCH-4, ADR-0001 |
| Q-P1-08 | Liste des pilotes de base de données interdits dans `src/domain` | Seuls React, Next.js, modules Node, `drizzle-orm`, `drizzle-kit` ; pilotes à ajouter après décision du dialecte | §5.1, OD-13, ADR-0004 |
| Q-P1-09 | Paquets autorisés dans `src/domain` (ex. Zod, §5.4 « Zod partout ») | Aucune liste d'autorisation : seules les interdictions §5.1 sont vérifiées | §5.1, §5.4, ADR-0004 |
| Q-P1-10 | Interdiction d'obfuscation des termes (P14 règle complémentaire) : non détectable automatiquement de façon fiable | Règle documentée ; contrôle en revue | P14, ADR-0002 |
| Q-P1-11 | Identité Git locale du dépôt (aucune identité configurée sur le poste) | `user.name = beaunegravure`, `user.email = beaunegravure@gmail.com` (configuration locale au dépôt) | Stratégie Git de l'autorisation Phase 1 |
| Q-P1-12 | Branche de travail créée depuis `origin/main` (commit `c01136b`, README) ; aucune branche `main` locale créée | `feat/phase-1-foundation` suivant `origin/main` | Stratégie Git |
| Q-P1-13 | Actions GitHub tierces utilisées par la CI (`actions/checkout@v4`, `actions/setup-node@v4`) | Épinglées par version majeure | ADR-0001 |
| Q-P1-14 | Page d'accueil minimale et métadonnées : aucun contenu produit, aucune règle d'indexation (environnements et `noindex` relèvent de §28 / Phase 8) | Page technique neutre | §23, §28 |
