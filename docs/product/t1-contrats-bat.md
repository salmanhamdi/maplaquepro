# T1 — Contrats du BAT réel

**Statut : arbitrages normatifs du Supervisor (lot T1).** Ce document consigne les décisions telles que rendues. Il ne crée aucune règle supplémentaire, ne modifie pas le Master Plan v1.6 et ne rouvre pas G2-D12 (CLOSED).
Aucun code n'est modifié par ce lot. Plans associés : `plan-t2-bat-reel.md`, `plan-sp3.md`.

## 1. `contentHash`

| Aspect | Décision |
|---|---|
| Nature | SHA-256 du **contenu métier canonique** du BAT |
| Calcul | Côté serveur |
| Représentation | Hexadécimal minuscule, 64 caractères |
| Indépendance | Du cycle de vie **et** de l'identité du BAT |
| Conséquence | Deux BAT au contenu métier identique peuvent avoir le même `contentHash` |

**Inclus :** configuration résolue ; versions pertinentes ; catalogue ; pricing ; design rules (lorsqu'elles seront définies) ; versions des moteurs ; contrats de production ; spécification résolue ; trous ; texte et tracés ; artwork et ses hash (lorsqu'ils existent) ; géométrie canonique ; `geometryHash` ; prix ; avertissements métier.

**Exclus :** `batId` ; `createdAt` ; `validatedAt` ; `expiresAt` ; états et transitions du cycle de vie ; confirmations ; artefacts finaux ; hash des artefacts ; `previewSvg` complet.

## 2. Enveloppe versionnée

Le payload hashé est versionné ; `schemaVersion` fait partie du payload :

```
{
  schemaVersion: 1,
  content: { ... }
}
```

Aucun autre mécanisme de canonicalisation n'est introduit.

## 3. JSON canonique

- Sérialisation : le `canonicalJson` existant (`src/domain/geometrie-canonique.ts`).
- Géométrie canonique : arrondie à 0,001 mm selon la convention existante (`roundMm`).
- Aucune nouvelle bibliothèque de canonicalisation.

## 4. Preview

Le `previewSvg` complet n'entre pas dans `contentHash`. La **géométrie canonique** est la représentation normative.

## 5. `contentHash` et `integrite`

Les deux empreintes restent distinctes :
- `contentHash` identifie le **contenu métier** ;
- `integrite` (`src/domain/bat-enregistre.ts`) protège l'**enregistrement du BAT validé complet**.

## 6. `bat_snapshots` (principe)

| Partie | Rôle |
|---|---|
| A. `bat_snapshots` | Contenu du BAT **immuable** |
| B. État du cycle de vie | Séparé, **mutable** selon G2-D12 |

- Le brouillon local ou éphémère actuel ne devient **pas** automatiquement une donnée persistée.
- Le snapshot serveur correspond au **BAT enregistré**.
- Schéma et migration : non réalisés dans ce lot.

## 7. Rattachement à la commande

- Aucun lien mutable `order_line_id` dans le BAT comme mécanisme de rattachement.
- Le rattachement appartient à la commande / ligne de commande.
- Le BAT reste immuable.

## 8. Expiration

- `expiresAt` commercial n'est pas modifié dans le snapshot.
- Le cycle de vie G2-D12 porte les échéances et transitions.
- Le principe documentaire antérieur autorisant un `UPDATE` de `bat_snapshots.expires_at` (Master Plan §27) sera **réconcilié ultérieurement** dans la documentation normative ; le Master Plan n'est pas modifié dans ce lot.

## 9. SP-3

**Autorisé comme spike technique.** Objectif : démontrer la génération déterministe de `TextGlyphPaths` avec de vraies polices et les exigences VR-08.

À démontrer : glyphes ; shaping ; `ccmp` ; ligatures ; crénage ; déterminisme ; `fontHash` ; taille effective ; composition ; tracés ; fabricabilité.

Non décidé par le spike :
- opentype.js comme bibliothèque définitive ;
- DejaVu Sans comme police produit ;
- liste de polices commerciales ;
- licences ;
- règles VR-08 encore OPEN.

## 10. Points toujours OPEN (non transformés en décisions)

| Point | Référence |
|---|---|
| S1 — code et sévérité du trait minimal 1 mm | VR-08, `docs/atelier/questionnaire-gate-1.md` §11.6 |
| S2 — méthode de mesure du trait | idem |
| S3 — portée de « caractère » | idem |
| A7 — composition, interligne, taille effective | idem |
| `designRulesVersion` | VR-08 |
| Définition finale de `fontHash` | dépend de SP-3 |
| Références réelles | GATE 1 |
| Tarifs réels | VR-07 (données) |
| Perçages | VR-22 à VR-24 |
| Validation atelier des contrats | VR-42 |

## 11. Écarts documentaires connus (non corrigés ici)

| Document | Écart |
|---|---|
| Master Plan §27 | `UPDATE` autorisé de `bat_snapshots.expires_at` et `order_line_id` (contraire aux décisions 7 et 8) |
| Master Plan §15 | `contentHash` rangé dans le bloc « Identité » ; la décision 1 le rend indépendant de l'identité |
| ADR-0005 B-O1 | Mode exact de `roundMm` (demi-valeurs, négatifs) : la précision 0,001 mm est confirmée, le mode d'arrondi n'est pas ré-arbitré |
| `docs/atelier/questionnaire-gate-1.md` §11.6 S6 | « P7 (hash) » : l'empreinte du BAT est désormais arbitrée ; `fontHash` et A7 restent OPEN |
| `docs/phase-2/preparation-domain-model.md` | « SP-3 bloqué » (état historique) |
| Commentaires de code (`geometrie-canonique.ts`, `bat.ts`) | « hash (arbitrage P7) » / « hash reçus en entrée » : non modifiés (aucun code dans ce lot) |
