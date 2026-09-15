# Plan — moteur texte de production

**Statut : plan proposé, non autorisé.** Il découle de `contrat-texte.md` et ne crée aucune décision. Aucune dépendance ni aucun code de production n'est ajouté par ce document.

## Prérequis d'arbitrage

1. Distribution de production de HarfBuzz (liaison, version, exécution serveur) et autorisation de dépendance.
2. Structure `TextGlyphPaths` par clusters (§2 du contrat) et impact sur `CaractereTrace` / `canonicalGeometrySchema`.
3. Algorithme de canonicalisation des contours, ordre des contours, compatibilité F11 / S7.
4. Payload `fontHash`.
5. S3, et au minimum la décision sur l'unité de contrôle (cluster) ; S1, S2 ; A7.
6. Polices produit et licences (commercial).
7. Portée de B-D1 pour un shaping exclusivement serveur ; exécution Firefox et Safari iOS réel si requise.

## Lots proposés

| Lot | Contenu | Dépend de | Couche |
|---|---|---|---|
| TXT-1 | Types de domaine : `TexteTrace` par clusters, schéma Zod, compatibilité de `evaluerTexteTrace` et de la couche texte canonique ; aucune dépendance de police | 2 | Domaine (pur) |
| TXT-2 | Canonicalisation des contours : fonction pure, invariants (idempotence, points, aire signée, sens), tests sur fixtures dérivées de la matrice SP-3 | 3 | Domaine (pur) |
| TXT-3 | Calcul de `fontHash` : fonction pure sur tables sfnt fournies, normalisation de `head`, exclusions arbitrées, instance variable | 4 | Domaine (pur) ; lecture du fichier côté serveur |
| TXT-4 | Adaptateur serveur HarfBuzz : texte original → normalisation §10 → shaping (`ccmp`, `liga`, `kern`, `mark`, `mkmk`) → clusters → glyphes → contours ; erreur bloquante en cas d'échec du moteur, aucun repli | 1, TXT-1, TXT-2 | Serveur (hors domaine, ADR-0004) |
| TXT-5 | Stockage et chargement des polices produit, `glyphesDisponibles` issus du `cmap`, `fontHash` calculé à l'enregistrement | 4, 6, TXT-3 | Serveur |
| TXT-6 | Contrôles VR-08 selon l'arbitrage S3 (unité cluster), trait minimal selon S1 / S2 | 5, TXT-1 | Domaine |
| TXT-7 | Taille effective et composition selon A7 : calcul serveur déterministe, aucune réduction automatique non validée | 5 (A7) | Domaine + serveur |
| TXT-8 | Intégration au BAT : levée du refus du texte dans `buildBatDraft`, `fontHash`, `effectiveFontSizeMm`, `designRulesVersion`, empreinte `contentHash` (texte et tracés) | T2, TXT-4 à TXT-7 | Domaine + serveur |
| TXT-9 | Preuves d'environnement complémentaires (Firefox, Safari iOS réel) si l'arbitrage B-D1 l'exige | 7 | Spike / preuve |

## Tests transverses prévus

- Reprise de la matrice SP-3 comme fixtures de non-régression.
- Déterminisme : mêmes entrées ⇒ mêmes clusters, glyphes, contours canoniques et empreintes.
- Aucune dégradation silencieuse : moteur en erreur ⇒ violation explicite.
- Traçabilité : chaque glyphe rattaché à un cluster, chaque cluster à un intervalle du texte normalisé, puis au texte original.
- `fontHash` : stable face aux métadonnées volatiles, sensible aux contours et aux coordonnées d'instance.

## Hors périmètre de ce plan

Choix de polices produit ; licences ; valeurs VR-08 ; composition A7 ; Master Plan ; G2-D12 ; panier, commande, paiement.
