# Plan T2 — BAT réel côté serveur (non persisté)

**Statut : plan d'implémentation proposé, non autorisé.** Il applique les arbitrages T1 (`t1-contrats-bat.md`) et G2-D12 (CLOSED) sans en créer de nouveaux. Aucune persistance, aucun panier, aucune commande, aucun paiement.

## 1. Objectif

Produire un BAT serveur réel, de bout en bout et en mémoire :
`configuration vérifiée → spécification → géométrie → contenu canonique → contentHash → artefacts → brouillon → confirmations → validation (G2-D12) → enregistrement (integrite)`.

## 2. Constats de départ (`main` @ `5923df5`)

- `preparerBat` (domaine) reçoit `identite.contentHash` **avant** de construire les artefacts, qui l'embarquent (`data-bat-hash`) ; aucun calcul n'existe.
- `buildBatDraft` calcule le prix et assemble le brouillon **après** les artefacts ; le contenu à hacher (prix, contrats, avertissements) n'est donc pas disponible au moment où l'empreinte est attendue.
- `BAT-PREP` serveur (`src/server/preparation-bat.ts`) n'emprunte pas `createBat` : aucun identifiant ni empreinte.
- `validateBat(bat, at, { clientInscrit })` calcule `expiresAt` (G2-D12) ; aucun appelant serveur ne passe ce contexte.
- SHA-256 hexadécimal disponible côté serveur (`src/server/auth/secrets.ts` · `empreinte`), rattaché au domaine du compte.
- Catalogue servi : démonstration ⇒ un BAT réel reste non validable (valeurs À VALIDER) ; la preuve se fait par fixtures de test.

## 3. Étapes proposées

### Domaine (pur)
1. **Contenu canonique** : fonction pure qui assemble `{ schemaVersion: 1, content: { … } }` à partir des champs inclus par T1 (versions, contrats, spécification, trous, texte, artwork, géométrie canonique, `geometryHash`, prix, avertissements). Aucun champ exclu (identité, cycle de vie, confirmations, artefacts, preview).
2. **Empreinte** : `hacher(canonicalJson(enveloppe))`, la fonction de hachage restant injectée (P7). Contrôle de forme : 64 caractères hexadécimaux minuscules.
3. **Réordonnancement de la préparation** : calculer le prix et les autres éléments du contenu **avant** les artefacts, puis l'empreinte, puis les artefacts (avec `batHash`), puis le brouillon. Aucune modification de `regenererArtefacts` / `verifierArtefacts`.
4. **Schéma BAT** : resserrer `contentHash` au format arrêté (hexadécimal minuscule, 64) — changement de schéma à valider avec les fixtures existantes.

### Serveur
5. **Adaptateur de hachage** SHA-256 hexadécimal partagé (sans dépendre du module d'authentification).
6. **Création** : action serveur de création d'un BAT à partir de l'état de saisie revalidé (même garde que la vérification) : `batId` ULID (`src/server/db/ids.ts`), `createdAt` horloge serveur, catalogue serveur, empreinte, artefacts, brouillon. Réponse : BAT brouillon + éléments en attente ; texte toujours refusé (SP-3).
7. **Validation** : `validateBat` avec `{ clientInscrit }` déterminé côté serveur à la validation (P4), puis `enregistrerBat` (`integrite`). Aucun stockage : le résultat vit le temps de la requête.

### Interface
8. Aucune exposition d'un BAT « validable » tant que le catalogue est de démonstration ; au plus, affichage des éléments en attente, sans identifiant présenté comme contractuel.

## 4. Tests prévus

- Même contenu, `batId` / `createdAt` différents ⇒ même `contentHash`.
- Variation d'un champ inclus (prix, géométrie, contrat, trou, version) ⇒ empreinte différente.
- Variation d'un champ exclu (confirmations, `expiresAt`, `validatedAt`, artefacts, preview) ⇒ empreinte identique.
- `schemaVersion` présent et hashé ; format hexadécimal minuscule 64.
- Absence de circularité : artefacts construits avec `batHash = contentHash`, `verifierArtefacts` sans écart.
- `integrite` ≠ `contentHash` ; `verifierBatEnregistre` détecte une altération.
- Validation G2-D12 : `expiresAt` 15 j / 7 j selon le profil figé.
- Texte présent ⇒ refus explicite (SP-3) ; valeurs À VALIDER ⇒ BAT non validable, jamais présumé.
- Déterminisme : aucune lecture d'horloge dans le domaine.

## 5. Hors périmètre

`bat_snapshots` et état du cycle de vie persistés (T3) ; panier ; commande ; checkout ; Stripe ; worker de purge ; pipeline d'artwork ; moteur de polices (SP-3) ; modification du Master Plan ; G2-D12.

## 6. Questions à arbitrer avant exécution

1. **« Client inscrit »** : correspondance avec une session client connectée au moment de la validation (P4) — à confirmer.
2. **Avertissements métier** : aucune source ne produit aujourd'hui `warnings` (toujours vide) ; périmètre attendu dans le contenu ?
3. **Valeurs À VALIDER dans le contenu** : un brouillon non validable porte des états `A_VALIDER` ; son empreinte est-elle calculée telle quelle, ou l'empreinte n'est-elle due qu'à partir d'un contenu sans valeur en attente ?
4. **Nom et clés du `content`** : reprise des noms de champs du BAT existant (proposition) — à confirmer.
5. **Adaptateur de hachage** : emplacement serveur partagé à valider (frontière ADR-0004 inchangée).
