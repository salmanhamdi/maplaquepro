# G2-D12 — Cycle de vie du BAT, expiration, rétention et avoirs

**Statut : décision normative du Supervisor (arbitrage Q1 → Q75, 15/09/2026). Implémentation en cours de validation — G2-D12 n'est pas clôturé.**
Le Master Plan v1.6 n'est pas modifié ; les écarts sont listés au §6 pour arbitrage.

## 1. Décisions

### BAT
| Cas | Règle | Origine |
|---|---|---|
| BAT validé standard | Validité commerciale 15 jours ; suppression à l'expiration | `validatedAt` |
| BAT validé d'un client inscrit non payé | 7 jours au lieu de 15 ; profil déterminé et figé à la validation (P4) | `validatedAt` |
| BAT brouillon jamais validé | Suppression après 7 jours ; toute modification supprime le brouillon et en crée un nouveau, sans historique | création |
| Checkout (`startCheckout`) | Crée la commande `PENDING_PAYMENT` (P2) ; expiration commerciale suspendue 7 jours au plus ; sans paiement dans la fenêtre : BAT orphelin | début du checkout |
| BAT orphelin | Cycle commercial abandonné (P3) ; rétention 30 jours ; l'ancien `expiresAt` ne provoque aucune suppression anticipée ; non modifiable, toute reprise impose un nouveau BAT | `orphanedAt` (moment du constat) |
| Commande annulée avant fabrication | BAT orphelin, 30 jours | annulation |
| Entrée en fabrication | BAT figé, conservé avec le dossier 2 ans calendaires, même si la commande est annulée ensuite (P1) | `enteredProductionAt` |
| Modification avant fabrication | Nouveau BAT ; il remplace l'ancien dans la commande, qui garde son paiement | — |
| Modification après fabrication | Interdite sur la commande ; nouvelle commande avec un nouveau BAT ; l'ancienne commande continue | — |
| Correction (client, atelier, système) | Nouveau BAT soumis à la validation du client ; refus : BAT initial utilisable. Aucune distinction mineure / majeure | — |

### Avoirs
- TTC ; valable 1 an calendaire depuis `createdAt` ; aucun renouvellement ; reliquat perdu à l'expiration.
- Un seul avoir par commande ; choix libre parmi les avoirs valides ; seule la partie nécessaire est consommée, le reliquat garde l'échéance originale.
- Baisse de prix d'une commande payée avant fabrication : recrédit de la part d'avoir consommée d'abord (échéance originale), puis nouvel avoir pour la différence TTC restante (1 an depuis sa création).
- Hausse de prix : complément dû avant fabrication (calculé par le futur domaine commande à partir des montants figés ; VR-07 inchangé).
- Annulation avant fabrication : avoir utilisé recrédité. Après fabrication : aucun recrédit automatique.
- Échec technique interne, avant comme après fabrication (Q65) : avoir recrédité et paiement complémentaire remboursé.
- Défaut atelier, erreur du client, contestation d'un résultat conforme au BAT validé : SAV manuel, rien d'automatique.

## 2. Implémentation (domaine pur)

| Élément | Fichier · symbole |
|---|---|
| Durées exactes (jours) et calendaires (années) | `src/domain/temps.ts` · `ajouterJours`, `ajouterAnsCalendaires`, `echeanceAtteinte` |
| Politique versionnée | `src/domain/cycle-vie-bat.ts` · `POLITIQUE_CYCLE_VIE_BAT` (`G2-D12-2026-09-15`) |
| États et événements typés | `CycleVieBat`, `EvenementCycleVie` |
| Transitions | `creerCycleBrouillon`, `appliquerEvenement` |
| Action due à un instant | `actionDue` : `AUCUNE`, `SUPPRIMER`, `RENDRE_ORPHELIN`, `FIN_CONSERVATION` |
| Remplacement, après-fabrication, corrections | `remplacerBat`, `resoudreCorrection` |
| Expiration à la validation | `src/domain/bat.ts` · `validateBat(bat, at, { clientInscrit })` |
| Avoirs | `src/domain/avoirs.ts` · `creerAvoir`, `utiliserAvoir`, `recrediterAvoir`, `ecartPrixCommandePayee`, `annulerCommande`, `traiterIncident` |

Le moteur **décide** ; il n'exécute ni suppression, ni persistance, ni paiement. Les états sont immuables (aucune mutation implicite).

## 3. Conventions techniques appliquées (à confirmer)
- Une échéance est atteinte à l'instant exact qui l'égale (événement à l'échéance ⇒ échu).
- Horodatages UTC ISO 8601 (`Z`) ; jours = 24 h exactes ; années calendaires calculées en UTC.
- 29 février sans équivalent l'année cible ⇒ 28 février (dernier jour du mois).

## 4. Dépendances absentes (non implémentées, non simulées)
- **Persistance des BAT** (`bat_snapshots`) : aucun stockage de `CycleVieBat`.
- **Domaine commande** (statuts, entrée en fabrication, montants figés, complément dû) et **lien BAT → commande**.
- **Checkout** et **paiement** : aucun encaissement, remboursement ou recrédit exécuté.
- **Worker de purge** : aucune suppression physique ; le futur worker appliquera `CONSTAT_ECHEANCE`.
- **Avoirs persistés** et **lien BAT / avoir → client**.
- `BatBrouillon` produit par `buildBatDraft` garde `expiresAt` À VALIDER : l'échéance est calculée par `validateBat` avec contexte ; les appelants serveur ne passent pas encore ce contexte.

## 5. Points ouverts
1. Remplacement du BAT d'une commande `PENDING_PAYMENT` : la fenêtre de checkout d'origine est conservée (aucune prolongation) — à confirmer.
2. `FIN_CONSERVATION` (2 ans) : action d'exécution (suppression, archivage, anonymisation) non arbitrée ici.
3. Recrédit sur un avoir déjà expiré : le solde revient mais reste perdu (échéance originale) — à confirmer.
4. Commande payée non entrée en fabrication : aucune échéance ; BAT protégé tant que la commande existe.
5. La version de politique est portée par `CycleVieBat`, pas par le BAT validé (schéma BAT inchangé).
6. Formulation « peut être utilisé sur une seule commande » : implémentée comme « un seul avoir par commande », le reliquat restant utilisable ensuite.

## 6. Écarts avec le Master Plan v1.6 (non réécrits)
- §9.6 : « 30 j BAT / 2 ans commande » sans point de départ ; G2-D12 : 30 j depuis `orphanedAt`, 2 ans depuis l'entrée en fabrication.
- §25 : commande « 10 ans, obligation comptable » ; G2-D12 : BAT de fabrication 2 ans. Périmètre des données comptables non traité ici.
- §27 : `bat_snapshots` autorise un `UPDATE` de `expires_at` ; G2-D12 : `expiresAt` figé à la validation, suspension portée par le cycle de vie.
- §15 G2-D12 : « durée À DÉFINIR » ; désormais arbitrée.
- §19 : aucun état « entrée en fabrication » distinct de `IN_PRODUCTION` ; correspondance à confirmer lors du domaine commande.
- Avoirs : absents du Master Plan.
