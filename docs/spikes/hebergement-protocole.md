# Protocole — spike d'hébergement

- **Référence normative** : Master Plan v1.5 §26 (critères), §27 (base de données), §24.4 (secrets), §31 (Phase 1), §32 (checkpoint ARCH-1-bis) ; OD-12, OD-13, OD-14 ; VR-16, VR-30.
- **Statut** : protocole documentaire. **Non exécuté.** Aucun résultat n'est connu ; aucun résultat ne doit être présumé.
- **Résultat attendu** : ADR-0003 (numéro réservé par v1.5).
- **Autorisation** : l'exécution du spike, la création d'une application de sonde et toute action sur Hostinger ou Stripe exigent une autorisation distincte du Supervisor.

## 1. Objet

Déterminer, par des critères binaires, si la cible primaire **Hostinger Managed Node.js Hosting** (plans Business / Cloud) convient, ou si le **fallback VPS Hostinger KVM + Docker Compose** (Next standalone + PostgreSQL + Caddy, déploiement GitHub Actions SSH, backups quotidiens) est nécessaire (§26, DECISION v1.4).

Le spike fournit les éléments de décision pour OD-12 (hébergement exact), OD-13 (base de données / dialecte) et OD-14 (stockage des artworks). **Il ne tranche pas ces OD** : il produit des preuves soumises au Supervisor.

## 2. Critères (repris du §26, sans modification)

| # | Critère binaire (§26) | Critère éliminatoire pour le managed (§26) |
|---|---|---|
| C1 | Déploiement depuis dépôt privé | — |
| C2 | Variables d'environnement au runtime | — |
| C3 | Accès base de données depuis l'app | **Oui** |
| C4 | `POST` raw body reçu (webhook Stripe CLI) | **Oui** |
| C5 | Node ≥ 20 | **Oui** |
| C6 | `next/image` / sharp, ou repli `unoptimized` | — |
| C7 | Stockage persistant de fichiers ou BLOB DB suffisant pour les artworks | **Oui** |
| C8 | SSR p95 < 300 ms | — |
| C9 | Mémoire suffisante pour décoder un PNG de `maxPixels` dans les limites du plan | **Oui** |

**Règle §26** : échec sur C3, C4, C5, C7 ou C9 → VPS.

## 3. Prérequis

| Prérequis | Détenteur | Statut |
|---|---|---|
| Plan Hostinger Business ou Cloud permettant le Node.js managé (VR-16) | Propriétaire | À FOURNIR |
| Accès à un VPS Hostinger KVM, pour l'évaluation du fallback si nécessaire | Propriétaire | À FOURNIR si requis |
| Accès au dépôt GitHub privé depuis la plateforme (clé de déploiement ou intégration GitHub de la plateforme) | Propriétaire | À FOURNIR |
| Base de données de test (MySQL / MariaDB en managé, PostgreSQL en VPS) | Plateforme | À FOURNIR |
| Compte **Stripe en mode test** (compte professionnel prêt, SCOPE-1) et Stripe CLI sur le poste de l'opérateur | Propriétaire | À FOURNIR |
| URL de test de la plateforme (le domaine définitif relève de VR-11, ouvert) | Plateforme | À FOURNIR |
| Application de sonde minimale (déploiement, lecture d'une variable d'environnement, requête DB, route `POST` brute, image, écriture / lecture de fichier, page SSR, décodage PNG) | Opus, **sur autorisation distincte** | NON AUTORISÉE dans cette tranche |

## 4. Secrets et accès

- **Aucun secret dans le dépôt** (§24.4) : clés Stripe de test, identifiants DB et accès Hostinger sont saisis uniquement dans l'interface de la plateforme ou sur le poste de l'opérateur.
- Aucune clé réelle ou de test n'apparaît dans les preuves : les captures et journaux sont **masqués** avant archivage.
- Aucun accès ne peut être simulé puis présenté comme preuve réelle. Un critère non mesuré sur la plateforme réelle est noté **NON MESURÉ**.

## 5. Méthode de vérification par critère

| # | Méthode | Preuve attendue | Paramètres non définis par v1.5 |
|---|---|---|---|
| C1 | Déployer la sonde depuis le dépôt privé via le mécanisme de la plateforme | Journal de déploiement horodaté, identifiant du commit déployé | — |
| C2 | Définir une variable de test dans la plateforme ; la sonde affiche uniquement sa présence (jamais sa valeur) | Capture de réponse « présente / absente » | — |
| C3 | Depuis l'app déployée, ouvrir une connexion et exécuter une requête triviale sur la DB de test | Réponse de la sonde + nom et version du SGBD | Dialecte : **OD-13 ouvert** (MySQL / MariaDB en managé, PostgreSQL en VPS) |
| C4 | Envoyer un événement de test avec Stripe CLI vers une route `POST` de la sonde ; vérifier que le corps brut reçu est intact (taille + empreinte) | Sortie Stripe CLI + journal de la sonde (empreinte du corps) | Le contrat d'intégration Stripe (événements, signatures, idempotence…) **n'est pas spécifié ni testé** ici (SCOPE-1) : seule la réception du corps brut est vérifiée |
| C5 | Afficher la version de Node exécutée | Capture de `process.version` | **Observation** : v1.5 exige Node ≥ 20 ; le projet déclare `engines.node >= 24` (ADR-0001). Seuil applicable au spike **À CONFIRMER** (le critère v1.5 n'est pas modifié) |
| C6 | Servir une image via `next/image` ; à défaut, vérifier le repli `unoptimized` | Réponse HTTP de l'image optimisée, ou configuration de repli | — |
| C7 | Écrire un fichier, redéployer ou redémarrer, puis relire ; ou écrire / relire un BLOB en DB | Empreinte avant / après redéploiement | **Volume « suffisant » non chiffré par v1.5** (dépend des limites d'upload, OD-25 INFERENCE, et de la rétention §9.6) → **À DÉFINIR** |
| C8 | Mesurer la latence SSR d'une page de la sonde et calculer le p95 | Série de mesures brute + p95 calculé | **Profil de charge, nombre de requêtes et page de référence non définis** → **À DÉFINIR** |
| C9 | Décoder dans l'app un PNG de `maxPixels` pixels et relever la mémoire | Journal de la sonde (succès / échec, mémoire) | **`maxPixels` non fixé par v1.5** (`ArtworkRules.maxPixels`, limites OD-25) → **À DÉFINIR** ; critère non exécutable tant que la valeur n'est pas fixée |

## 6. Résultat attendu (format, sans valeur)

| Critère | Managed : RÉUSSI / ÉCHEC / NON MESURÉ | VPS (si évalué) | Preuve (référence d'archive) | Commentaire |
|---|---|---|---|---|
| C1 … C9 | À MESURER | À MESURER | — | — |

Synthèse attendue pour ADR-0003 :
- plan testé et date ;
- versions (Node, SGBD) ;
- statut de chaque critère ;
- application de la règle §26 ;
- paramètres À DÉFINIR utilisés et leur source d'arbitrage ;
- recommandation soumise au Supervisor (pas une décision).

## 7. Conditions de NO-GO / escalade

| Situation | Conséquence |
|---|---|
| Échec managé sur C3, C4, C5, C7 ou C9 | Évaluation du **VPS** avec les mêmes critères (§26) |
| Échec managé sur C1, C2, C6 ou C8 seulement | Pas de bascule automatique définie par v1.5 → **décision Supervisor** |
| Échec VPS sur un critère éliminatoire | Cas **non prévu par v1.5** → **NO-GO du spike et escalade Supervisor** |
| Critère non mesurable faute de paramètre (C7, C8, C9) ou d'accès | Résultat **NON MESURÉ** ; ADR-0003 incomplet → escalade Supervisor |
| Toute preuve obtenue hors plateforme réelle | Non recevable comme preuve |

## 8. Hors périmètre

Pas de choix définitif d'hébergement, de base ou de stockage. Pas de mise en production, de domaine définitif (VR-11), de contrat d'intégration Stripe (SCOPE-1), ni d'environnements §28.
