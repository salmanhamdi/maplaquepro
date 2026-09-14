# ADR-0002 — Lint des termes interdits, zones et exclusion du périmètre technique du lint

- **Statut** : proposé (à valider par le Supervisor avec la tranche Phase 1.1–1.3)
- **Date** : 14/09/2026
- **Référence normative** : Master Plan v1.5 §4.3, §24.6 ; arbitrages P2 et P14

## Contexte

Le §24.6 impose un lint bloquant des termes interdits.

**P2** impose :
- 2 zones actives par défaut (stricte produit, documentaire d'audit) et une Shared Core conditionnelle ;
- une classification obligatoire ou une exclusion explicite justifiée de chaque fichier ;
- aucune classification silencieuse.

**P14** impose :
- une exclusion étroite du périmètre technique du lint, documentée dans le Master Plan **et** par un ADR ;
- l'usage de la source canonique des motifs dans les tests ;
- l'interdiction de toute obfuscation.

Le présent ADR est l'ADR exigé par P14 D2.

## Décision technique

### Implémentation

- `scripts/forbidden-terms.mjs` : lint exécuté par `npm run lint:terms`, sans dépendance supplémentaire.
- `scripts/forbidden-terms.config.json` : **liste canonique unique** des motifs (reprise littérale du §24.6), zones, classification et exclusions.
- `scripts/forbidden-terms-samples/` : échantillons à détecter et à ne pas détecter (dont les faux positifs exigés par §24.6).
- Emplacement : chemins indicatifs de v1.4 ; emplacement définitif **À CONFIRMER** (docs/questions.md Q-P1-01).

### Règles appliquées

1. **Motifs** : correspondance par mot, insensible à la casse, accents normalisés, sur le chemin et le contenu de chaque fichier de la zone stricte produit.
2. **Zones** :
   - `strict-product` (active, contrôlée) : globs du §24.6, plus classement explicite des fichiers non listés par le §24.6 (configuration racine, CI, README, `.gitignore`, `scripts/check-boundaries.mjs`, `docs/questions.md`, ADR non liés à l'audit du backoffice). Le classement retenu est le plus contrôlé ; **À CONFIRMER** (Q-P1-02) ;
   - `audit` (active, non contrôlée pour les termes) : `docs/audit/**`, `docs/master-plan/**`, `docs/CHANGELOG.md` ;
   - `shared-core` : **inactive**, aucun fichier. Toute tentative d'y classer un fichier est une erreur (P2 D2 : jamais implicite).
3. **Classification** : chaque fichier suivi ou non ignoré par Git doit correspondre à **exactement une** zone ou exclusion. Aucun fichier ne peut être non classé ou classé deux fois. Aucune zone par défaut.
4. **Exclusions** (chacune avec justification et source) :
   - le lint, sa liste canonique et ses échantillons (P14 D1, D3) ;
   - `package-lock.json`, fichier généré (P2 D3 — **À CONFIRMER**, Q-P1-03).

   Aucun contenu produit n'est admis dans le périmètre exclu (P14 D4).
5. **Tests** : les tests produit et les tests du lint lisent les motifs dans la source canonique et les échantillons ; aucun terme interdit n'est recopié en clair dans la zone stricte (P14 D5).
6. **Obfuscation** : interdite (P14, règle complémentaire). Elle n'est pas détectable automatiquement de façon fiable ; contrôle en revue (Q-P1-10).
7. Toute modification de la liste de motifs, des zones ou des exclusions exige un ADR.

### Avenant — tranche préparatoire Phase 1 (documentation uniquement)

Les quatre documents préparatoires sont classés **explicitement, fichier par fichier**, dans la zone **existante** stricte produit. Aucune nouvelle zone, aucune exclusion, aucun glob générique de spike :
- `docs/spikes/hebergement-protocole.md`
- `docs/spikes/determinisme-protocole.md`
- `docs/atelier/questionnaire-gate-1.md`
- `docs/da/da-1-preparation.md`

Motif : documents produit / techniques rédigés, ne relevant ni de l'audit du backoffice ni de l'historique. Le classement le plus contrôlé est retenu. **À CONFIRMER** avec AC-2.

### Avenant — préparation SP-2 (spike expérimental de géométrie textuelle)

Les 20 fichiers de `spikes/determinisme-sp2/` sont classés **explicitement, fichier par fichier**, dans la zone **existante** stricte produit. La liste figure dans `spikes/determinisme-sp2/PROTOCOLE-SP2.md` §8. Aucune nouvelle zone, aucune exclusion, aucun glob générique de spike.
- Les fichiers tiers vendorisés (opentype.js 2.0.0, DejaVu Sans 2.37, licences) ont été contrôlés : aucun motif interdit. La police binaire n'est pas analysée par le lint (contenu binaire ignoré).
- Mesure technique provisoire, **À CONFIRMER** (AC-2, AN-6). L'emplacement SP-1 ne vaut pas règle générale.

## Conséquences

- Le lint bloque la CI en cas de terme interdit, de fichier non classé, de double classement, ou d'activation implicite de la Shared Core.
- L'ajout d'un nouveau fichier dans un emplacement non classé fait échouer le lint : la classification doit être déclarée explicitement.
