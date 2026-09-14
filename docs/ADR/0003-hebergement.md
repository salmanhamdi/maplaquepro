# ADR-0003 — Hébergement MVP : Hostinger Web Hosting Business (Node.js managé)

- **Statut** : **VALIDÉ POUR INTÉGRATION** par le Supervisor (14/09/2026). Branche documentaire `docs/adr-0003-hebergement`, non fusionnée sans validation.
- **Références** : Master Plan v1.5 §26 (critères, règle VPS), §27 ; OD-12, OD-13, OD-14, VR-16, VR-30, AN-10 ; PROTOCOLE-SPIKE-HEBERGEMENT-BUSINESS-v1 ; CR-SPIKE-HEBERGEMENT-BUSINESS-v1 ; CR-HEBERGEMENT-C8-ADR0003-v1 ; arbitrages Supervisor du 14/09/2026.
- **Portée** : MVP. Ce choix repose sur des faits observés à une date donnée. **Ce n'est pas une garantie durable des comportements de Hostinger**, ni une impossibilité de migration future.

---

## 1. Contexte

v1.5 §26 fixe comme cible primaire l'hébergement managé Node.js de Hostinger, avec un fallback VPS. Le choix est tranché par un spike à 9 critères : un échec sur les critères 3, 4, 5, 7 ou 9 impose le VPS.

Le spike a été exécuté le 14/09/2026 sur le **plan réel Web Hosting Business**. La sonde est une application Next.js 16.3.5 non produit (branche `spike/hosting-business`), déployée par upload de zip.

## 2. Faits observés

Tous les faits sont mesurés, sauf mention contraire.

| Sujet | Fait |
|---|---|
| Plan | Web Hosting Business : disque 200 Go, RAM 3072 Mo, 2 cœurs CPU, 600 000 inodes, 100 sites, 120 processus max (capture hPanel) |
| Versions Node proposées | 18.x, 20.x, 22.x, 24.x (tableau de bord) |
| Runtime exécuté | **Node v22.18.0** (22.x sélectionnée) |
| Répertoire d'exécution | `~/domains/<site>/hbuilds/versions/<uuid>/nodejs`, **recréé à chaque déploiement** |
| C1 dépôt privé | **NON TESTÉ / NON BLOQUANT** ; mode effectivement utilisé : upload de zip (réussi) |
| C2 variables d'environnement | Réussi |
| C3 base de données | Réussi : **MariaDB 11.8.9** |
| C4 corps `POST` brut | Intégrité réussie (1 Ko / 1 Mo / 5 Mo). Stripe **non testé** : traité dans l'intégration Stripe dédiée |
| C5 Node ≥ 20 | Réussi (v22.18.0) |
| C6 `next/image` | Réussi (optimisation active) |
| C7 persistance | Dossier de l'application : **perdu** au redéploiement. Dossier du domaine hors `hbuilds` : **intact** après 2 redéploiements et 1 relance automatique du processus |
| C8 SSR (fixture) | Page minimale : p95 40 ms (séquentiel), 230 ms (concurrence 5). **Fixture représentative** : p95 **44 ms** sur 200 requêtes séquentielles, **235 ms** sur 200 requêtes à concurrence 5, 0 erreur |
| C9 décodage PNG | 25 / 50 / 100 Mpx décodés ; pics RSS 252 / 331 / 640 Mo |
| Durée de requête | 45 s : OK ; 60 s : `504 Gateway Time-out` |
| Veille | Processus relancé automatiquement à la requête après inactivité (observé, non documenté par Hostinger) |

**Fixture C8** : la page mesurée est une **fixture de la sonde représentant une étape de configuration**. Elle effectue une lecture MariaDB, calcule une géométrie (plaque et 4 trous), produit un JSON canonique et son SHA-256, puis rend un aperçu SVG et un formulaire. **Ce n'est pas une page produit réelle.**

## 3. Contraintes

1. Le répertoire de l'application déployée est **éphémère**.
2. Les ressources du compte sont partagées : 3072 Mo de RAM et 2 CPU. La sonde voit la machine hôte, pas ces limites.
3. La durée de requête est limitée : la limite observée se situe entre 45 et 60 s.
4. Une mise en veille est probable, donc des démarrages à froid sont possibles.
5. **Latence sous concurrence** : le p95 est d'environ 230 ms à 5 requêtes simultanées, pour un travail serveur d'environ 1 ms. Cette latence est donc imputable à la plateforme.
6. Le SGBD disponible sur le plan est **MariaDB**.

## 4. Décisions (Supervisor)

1. **Hébergement MVP** : **Hostinger Web Hosting Business, application Node.js managée**. Aucun critère éliminatoire (3, 4, 5, 7, 9) n'est en échec ; la règle §26 ne déclenche donc pas le VPS. L'environnement Business est **l'environnement de référence du MVP**.
2. **C7 = PASS CONDITIONNEL** — séparation d'architecture obligatoire :
   - **Répertoire applicatif déployé** (`hbuilds/versions/...`) = code et build uniquement, **éphémère**. **Aucune donnée persistante n'y est jamais placée.**
   - **Dossier persistant du domaine** (`~/domains/<site>/`, hors `hbuilds`) = **espace de stockage persistant autorisé pour le MVP** : artworks, fichiers générés. Le sous-dossier exact sera défini à l'implémentation, via la configuration d'environnement.
   - Le stockage des fichiers en base de données **n'est pas obligatoire**.
3. **C8 = PASS sur la fixture représentative de la sonde**. Le repère de 300 ms est un **repère du spike uniquement** : ce n'est **ni un SLA produit, ni une promesse commerciale, ni une garantie pour les futures pages**. Aucune nouvelle campagne C8 n'est requise maintenant.
4. **C9** : **`maxPixels = 50_000_000`** pour le MVP. C'est une **règle applicative de protection du runtime**, et **non une limite déclarée par Hostinger**. 100 Mpx n'est pas retenu comme capacité produit.
5. **OD-13** : **MariaDB est le SGBD relationnel de référence du MVP sur Hostinger Business**. Ce choix n'interdit pas une migration future.
6. **C1** : non testé, non bloquant. **C4 / Stripe** : hors spike.
7. **Node (AN-10, fait intégré)** : Node **v22.18.0** est utilisé sur l'environnement Business du spike. **Aucune version Node universelle du produit n'est décidée** ; AN-10 reste ouvert.

## 5. Conséquences

- Le code produit lit l'emplacement des données persistantes depuis la configuration et n'écrit jamais dans le répertoire applicatif.
- Les limites d'upload s'alignent sur `maxPixels` = 50 Mpx.
- Les traitements longs (décodage, normalisation, génération) restent nettement sous la limite de durée de requête observée.
- Drizzle ORM (v1.5 §27) est utilisé avec le dialecte MariaDB / MySQL.
- La sauvegarde, la rétention (VR-29) et la purge des fichiers du dossier persistant sont **à définir** (hors spike).
- La sonde, la branche spike, la base de test, les preuves et l'application Hostinger sont **conservées** jusqu'à nouvelle instruction.

## 6. Limites de la preuve

- Une seule journée de mesure et un seul site ; persistance observée sur quelques minutes et 2 redéploiements.
- Redémarrage manuel non testé ; suppression ou recréation de l'application non testées.
- C1 (GitHub), Stripe et Node 24.x non testés.
- Latences mesurées depuis un seul poste, en France, sur une fixture et non sur une page produit.
- Aucune garantie contractuelle de Hostinger sur la persistance du dossier du domaine, la veille ou la latence.

## 7. Points réévaluables

| Point | Déclencheur de réévaluation |
|---|---|
| Persistance hors `hbuilds` | Changement de comportement Hostinger, perte de données, changement de plan |
| Latence | Pages produit réelles ; montée en charge (beta, ouverture publique) |
| `maxPixels` | Évolution de VR-25 / VR-27 ; incidents mémoire |
| Version Node | Arbitrage AN-10 ; fin de support de 22.x |
| SGBD | Besoin non couvert par MariaDB ; migration d'hébergement |
| Managé vs VPS | Échec futur d'un critère éliminatoire ; besoins non couverts (processus longs, workers) |

## 8. Points ouverts non tranchés par cet ADR

OD-12, OD-14, VR-16, VR-30 et AN-10 restent **ouverts** ; les faits du spike leur sont rattachés sans les clôturer.
