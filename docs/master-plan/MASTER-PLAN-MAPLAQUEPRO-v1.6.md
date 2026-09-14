# MaPlaquePro — MASTER PLAN v1.6 — VALIDÉ

**Date** : 14 septembre 2026
**Statut** : **VALIDÉ** par le Supervisor (14/09/2026) — réconciliation T5. **Référence normative active.** Le Master Plan v1.5 est l'historique normatif immuable.
**Base** : Master Plan v1.5 (historique normatif, non modifié), amendé uniquement par la réconciliation T5 (§T).
**Statut v1.5 (historique)** : **VALIDÉ** par le Supervisor (14/09/2026). Contrôles documentaires : CR-019 à CR-028. L'implémentation n'est engagée que selon les autorisations distinctes du Supervisor (§G.1).
**Base** : Master Plan v1.4 (archive immuable, `MASTER PROMP MA PLAQUEPRO v1.4.txt`).
**Décisions intégrées** : arbitrages P1 à P14 (`REGISTRE_ARBITRAGES_v1.5.md`), rapport de consolidation CR-018 validé, règle de cohérence P11 / P13 confirmée par le Supervisor.
**Rédacteur** : Opus 5 (Claude Code), consolidation documentaire uniquement.
**Superviseur indépendant** : ChatGPT.

## Légende des étiquettes

| Étiquette | Sens |
|---|---|
| **FACT** | Vérifié dans une source inspectée (v1.4 : dépôt `beaunegravure-astro`, énoncés du superviseur, documentation Hostinger ; v1.5 : vérifications datées). |
| **DECISION** | Choix d'architecture ou de produit arrêté en v1.4 et **non modifié** par P1–P14. |
| **RÈGLE NORMATIVE [Pn]** | Règle issue d'un arbitrage Supervisor (texte du registre). |
| **RÈGLE COMPLÉMENTAIRE [Pn]** | Règle complémentaire issue d'un arbitrage Supervisor. |
| **VALIDATION_REQUIRED / À VALIDER** | Donnée ou confirmation manquante ; jamais remplacée par une hypothèse. |
| **INFERENCE** | Déduction signalée, à confirmer. |
| **À ARBITRER** | Point pour lequel aucune décision Supervisor n'existe ; aucune règle n'est posée. |
| **HISTORIQUE** | Contenu conservé de v1.4 ou antérieur, non normatif en v1.5, jamais réécrit. |

---

## G. Gouvernance du document (nouveau en v1.5)

### G.1 Statut des documents
- **Master Plan v1.4** : archive **immuable**. Il n'est jamais modifié. Toute référence « v1.4 §x » renvoie à ce fichier.
- **REGISTRE_ARBITRAGES_v1.5.md** : source des décisions arbitrées P1 à P14.
- **CR-018** : rapport de consolidation pré-v1.5 validé.
- **Master Plan v1.5** : document normatif **validé** par le Supervisor (14/09/2026) ; **historique normatif**, jamais modifié ; référence normative active jusqu'à la validation de v1.6 (14/09/2026).
- **Master Plan v1.6 (ce document)** : document normatif **validé** par le Supervisor (14/09/2026) ; **référence normative active** ; seules les sections listées au §T diffèrent de v1.5.
- **Code, architecture, installation de paquets, tests d'implémentation, modification du produit** : **INTERDITS** jusqu'à la validation finale de v1.5 puis une autorisation d'implémentation distincte.

### G.2 Historique et identifiants
- **RÈGLE NORMATIVE [P2 D4, P3 D4, P4 D5, P8 D4, P10 D1]** : l'historique n'est jamais réécrit. Les règles historiques (v1.3, v1.4) et les règles normatives v1.5 sont explicitement distinguées.
- **RÈGLE NORMATIVE [P8 D4]** : aucun identifiant (OD, VR, R, CR, GATE, checkpoint) n'est renuméroté, réattribué, réutilisé ni changé silencieusement de sens. Une correction de référence corrige la référence, sans réécrire l'historique de l'identifiant.
- Les contradictions historiques de v1.4 portent des identifiants **CR-1 à CR-12** (§36.3). Les comptes rendus d'exécution portent des identifiants **CR-001 à CR-019** (format à trois chiffres). Les deux séries sont distinctes.

### T. Transition v1.5 → v1.6 (réconciliation T5, validée le 14/09/2026)
- **Sources** : décisions Supervisor « T5 / clôture documentaire des arbitrages » et « Master Plan v1.6 / réconciliation T5 » (V-1 à V-7) du 14/09/2026 ; faits atelier Q1–Q9, Q3, E-1 complémentaire (REGISTRE_ARBITRAGES_v1.5.md).
- **Décisions intégrées** : C5 clos (TroLase : découpe systématique, CUT toujours présent) ; VR-34 close ; CR-2 **non activée** ; P3 (découpe systématique ; workflows TroGlass Metallic et Plexiglass / TroGlass Clear distincts) ; E-1 clos (Plexiglass / TroGlass Clear : impression UV à l'envers → découpe) ; **V-2 fermé** (découpe Plexiglass côté envers, face imprimée vers le laser ; information de fabrication, aucun miroir de l'artefact laser) ; **V-3 fermé** (impression UV Plexiglass à l'envers en miroir ; D1 étendue à `PLEXIGLASS_UV`) ; libellés du procédé Plexiglass explicitant l'ordre (V-6) ; champ `condition` conservé (V-5).
- **Non modifié** : §30.1 (ligne TroLase 600 × 400 DIFFÉRÉE) ; format fournisseur 600 × 300 hors modèle ; VR-02 ; GATE 1 ; machine / côté de la découpe TroLase Metallic (V-1, non établis) ; identifiant technique `decoupe_impression_uv` (§33, inchangé, G.2).
- Le tableau détaillé v1.5 → v1.6 figure dans TABLEAU-TRANSITION-MP-v1.5-v1.6.

### G.3 Ancien code
**RÈGLE NORMATIVE [P10 D4]** : l'ancien code supprimé lors d'ARCH-3 à ARCH-5 n'est **pas** une source de conception, d'architecture, de convention, de comportement ou de référence normative. Il peut uniquement être cité comme historique de nettoyage (CR-001 à CR-004). Aucune règle normative ne peut en être déduite.

### G.4 Recommandations et décisions
Une recommandation d'Opus n'est jamais une décision. Lorsqu'une décision manque, le point est marqué **À ARBITRER** et listé au §37.

### G.5 Cohérence configurateur / serveur (confirmée par le Supervisor après CR-018)
**RÈGLE NORMATIVE [P11 × P13]** : « Toute adaptation d'une valeur de configuration doit intervenir avant la constitution de la requête soumise au serveur. Le serveur ne substitue jamais silencieusement une autre valeur à celle reçue. »
- Le configurateur peut déterminer ou proposer une valeur valide (P11).
- Le client soumet la valeur résultante.
- Le serveur accepte ou rejette (P13) ; il ne corrige jamais silencieusement.
- Chaîne confirmée : configuration → détermination / proposition → validation côté client → requête client → validation serveur → acceptation OU rejet.
- **Portée** : entrées **client**. Cette règle ne s'applique pas mécaniquement aux événements d'intégration externe (Stripe, SCOPE-1, §18).

### G.6 Stabilité et non-rétroactivité (G-2, arbitré)
- **G2-D1 (S-5)** : stabilité objet par objet (voir §15, §16, §19, §20).
- **G2-D2 (T-1)** : aucune évolution ne réécrit un BAT, une commande, une décision ou une preuve existants.
- **G2-D5 / D6 (R-2)** : réévaluation ciblée ; historique jamais réécrit ; état historique ≠ condition actuelle d'exécution.
- **G2-D8** : une référence déjà utilisée dans une décision validée n'est pas modifiée rétroactivement d'une manière qui change sa signification pour cette décision. Une nouvelle réalité commerciale ou de fabrication est traitée comme une nouvelle référence / nouvelle version commerciale, selon un **mécanisme futur à définir** (non défini ici).
- Aucun mécanisme technique de versioning n'est défini par ce document.

---

## GL. Glossaire normatif (nouveau en v1.5)

Le glossaire est stabilisé **avant** toute règle qui en dépend. Les noms techniques exacts (identifiants de code) seront fixés lors de la future modélisation ; **le vocabulaire métier ci-dessous est canonique** (P5 D5) et s'applique au catalogue, au BAT et au dossier atelier.

**Principe [P3, P4]** : FAMILLE ≠ FINITION ≠ PROCÉDÉ ≠ WORKFLOW.

| Terme | Définition normative | Source |
|---|---|---|
| **Famille de matière / produit** | Groupe commercial de références. **Quatre familles MVP** : TroLase, TroLase Metallic, Plexiglass, TroGlass (Metallic Gold / Silver). | P3 D1 |
| **Référence** | Unité de vente commercialisable (v1.4 : `MaterialVariant`), porteuse de ses propriétés : fabricant, code, famille, épaisseurs, apparence, capacité de gravure, politique d'impression, workflow, règles. Chaque aspect de surface commercialisable distinct est une référence distincte. | v1.4 §7.1, P4 D2 |
| **Procédé de fabrication** | Manière physique de fabriquer. **Trois procédés** : (1) gravure laser ; (2) impression UV à l'envers → découpe ; (3) gravure envers + UV noir. TroLase et TroLase Metallic partagent le procédé « gravure laser ». | P3 D1, D3 |
| **Workflow de production** | Séquence explicite d'opérations d'une référence (identifiants techniques v1.4 : `TROLASE_ENGRAVE`, `TROLASE_METALLIC_ENGRAVE`, `PLEXIGLASS_UV`, `TROGLASS_METALLIC_HYBRID`). Un workflow n'est ni une famille ni un procédé. | v1.4 §7.2, P3 |
| **Opération** | Étape exécutée d'un workflow (gravure laser, découpe laser, impression UV), sur une machine, un côté, dans un ordre fixé. Matérialise l'exécution. | v1.4 §7.2, P7 D5 |
| **Finition** | **Uniquement** l'aspect de surface d'une référence. Ni choix client indépendant, ni étape, ni entité indépendante, ni propriété d'une couleur isolée, ni procédé, ni workflow. | P4 D1, P5 D3 |
| **Apparence de la référence** | Regroupe : couleur de surface ; finition ; couleur révélée par gravure lorsqu'elle existe. Propriété de la référence. | P5 D1 |
| **Couleur de surface** | Couleur visible de la face de la référence. | P5 |
| **Couleur révélée** | Couleur de la couche mise à nu par la gravure (matières bicouches). **Propriété de la référence, jamais du procédé.** Le noir UV de TroGlass **n'est pas** une couleur révélée. | P5 D2 |
| **États normatifs** | **SANS OBJET** (la propriété ne s'applique pas) ; **DÉFINIE** (valeur existante et validée) ; **À VALIDER** (information attendue, non validée). Un champ absent ne représente jamais implicitement un état. « À VALIDER » ≠ absence. Une propriété obligatoire « À VALIDER » rend la référence inactive. | P5 D4, P7 D3 |
| **VALIDATION_REQUIRED (v1.4)** | Marqueur v1.4 d'une donnée manquante. En v1.5, il correspond à l'état **À VALIDER** lorsqu'il qualifie une propriété. *(Correspondance de consolidation, cf. CR-019 §6.)* | v1.4, P5 |
| **Capacité machine** | Ce qu'une machine sait techniquement faire (opérations, zone). | P7 D1 |
| **Capacité de gravure (d'une référence)** | Indique seulement si la référence est gravable et le côté autorisé. **Ne contient aucune couleur.** Aucun couple de propriétés redondantes (type « activé + mode »). | P5 D2, P7 D2 |
| **Politique d'impression de la référence** | Ce que la référence autorise / commercialise en impression : **aucune**, **noir uniquement** ou **couleur**, ou état **À VALIDER**. Jamais appelée « capacité d'impression ». Pas d'indicateur « activé » séparé. | P7 D1–D3 |
| **Encre de l'opération** | Encre utilisée par l'opération d'impression, **dérivée** de la politique d'impression de la référence ; jamais saisie par le client. | P7 D5 |
| **Mode couleur de l'artwork** | Traitement couleur appliqué à l'artwork, **dérivé** de la politique d'impression / du workflow ; jamais saisi par le client. | P7 D5 |
| **Artwork** | Contenu graphique fourni par le client. Trois représentations toujours distinctes : **artwork original client ≠ version normalisée ≠ fichier machine** [ART1-D3]. | P7 D1, ART-1 |
| **Artwork original client** | Fichier tel que fourni par le client ; **conservé** ; jamais modifié ni présenté comme corrigé. | ART1-D1, D3 |
| **Version normalisée** | Représentation distincte, produite depuis l'original selon la référence active et validée et le workflow / procédé applicable ; c'est elle que le client voit au rendu et valide au BAT. | ART1-D1, D3, D4 |
| **Fichier machine** | Artefact de production dérivé du BAT (version normalisée figée) ; jamais validé par le client. | ART1-D3, D4 ; v1.4 §9.1, §13 |
| **Catégories de transformation d'artwork** | **A** préparation purement technique sans changement perceptible du rendu commercial (autorisée si déterministe et non sémantique) ; **B** transformation visible imposée par la référence / le procédé (avertissement + rendu normalisé + acceptation avant BAT) ; **C** transformation susceptible de modifier l'intention graphique (aucune correction silencieuse ; pas de traitement automatique sans règle explicite). | ART1-D6, D8 |
| **Chaîne de dérivation** | RÉFÉRENCE → BAT → OPÉRATION DE FABRICATION → ARTWORK. La référence est la source normative des propriétés commercialisées ; le BAT matérialise la commande validée ; l'opération l'exécution ; l'artwork le fichier graphique. Aucune couche aval ne réinterprète ni ne contredit silencieusement l'amont. | P7 D5 |
| **Orientation de pose** | Sens de placement de la plaque sur une machine, par opération : **tel quel** ou **tournée**. « Tel quel » = l'orientation de référence ne nécessite aucune rotation de pose (≠ « orientation inconnue »). Donnée technique interne, non affichée au client. | P6 D1, D3, D5 |
| **Zone machine** | Zone de travail machine retenue pour une opération. Donnée de production enregistrée dans le BAT. | P6 D1, D2 |
| **Disposition des trous** | Géométrie et position des trous. | P6 D1 |
| **Côté** | Face de la plaque concernée par une opération (face / envers). | P6 D1 |
| **Miroir** | Transformation graphique éventuelle liée au côté concerné. | P6 D1 |
| **Orientation (terme seul)** | **Non normatif** lorsqu'il crée une ambiguïté ; utiliser l'un des cinq termes ci-dessus. | P6 D6 |
| **Contrat de fichier de production** | Spécification d'un fichier machine : laser `PRODUCTION_SVG_CONTRACT_v1`, UV `PRODUCTION_UV_CONTRACT_v1`, hybride `HYBRID_TROGLASS_METALLIC`. | v1.4 §14 |
| **Conformité d'un contrat** | Les artefacts produits respectent la spécification du contrat. Condition de sortie de la Phase 5. | P12 D1, D4 |
| **Validation atelier d'un contrat** | Confirmation par l'atelier qu'un contrat est exploitable ; c'est l'une des preuves prises en compte par **GATE 4**, contrat par contrat. Moment, modalités, fichiers et preuves : **VR-42 (À VALIDER)**. Distincte de la conformité du contrat et de GATE 4 lui-même. | P12 D1–D3, D5 |
| **GATE 4** | Règle de blocage qui contrôle, **contrat par contrat**, que les conditions nécessaires à l'activation et à la production des familles / workflows dépendants sont satisfaites, sur la base des validations et preuves applicables. Ce n'est ni un simple contrôle de conformité documentaire, ni une validation globale, ni une validation physique des plaques, ni un nouveau gate. **Conformité du contrat ≠ validation atelier ≠ GATE 4.** | P12, G-1 |
| **Validation physique** | Validation du produit fabriqué. Relève de **GATE 12**. Distincte de la validation documentaire / atelier du contrat. | P12 |
| **Phase** | Unité de planification ; **8 phases** (§31), chacune avec identifiant unique, périmètre unique, étapes internes éventuelles, checkpoints rattachés. | P1 |
| **Étape interne** | Subdivision numérotée d'une phase (ex. 4.1, 4.2). N'est jamais une phase. | P1 D4 |
| **Checkpoint** | Revue supervisée rattachée à une phase (§31, §32), qui **produit ou revoit une preuve**. Un checkpoint peut satisfaire un GATE mais **n'est pas le GATE lui-même** ; un checkpoint n'est jamais implicitement un GATE. | P1, G-1 |
| **GATE** | **Règle normative de blocage**, distincte d'un checkpoint, qui détermine si **son objet** peut franchir une condition. Chaque GATE déclare : identifiant ; objet bloqué ; portée ; condition de satisfaction ; preuves attendues ; dépendances ; déclencheurs de réévaluation ; statut (§36.1). **Un GATE ne bloque que son objet explicitement déclaré** ; aucun GATE ne bloque automatiquement toute une phase. Identifiants historiques **GATE 0 à GATE 13**, conservés, sans nouveau GATE. | G-1 |
| **Phase n / GATE n** | Toujours écrits avec leur préfixe. La ressemblance entre d'anciens numéros de GATE et d'anciens numéros de phase n'a **aucune signification sémantique**. | G-1 |
| **Critère de sortie de phase** | Condition de fin d'une phase ; **n'est pas automatiquement un GATE**. | G-1 |
| **Réévaluation d'un GATE** | Toute modification susceptible d'affecter l'objet, les prérequis, la preuve ou la condition d'un GATE entraîne sa réévaluation [G-1]. La réévaluation est **ciblée** sur les objets réellement affectés, sans réévaluation globale automatique [G2-D6] ; elle **ne réécrit jamais l'historique** : on distingue l'**état historique** du gate (satisfait à un moment donné, preuve attachée à cet état) et la **condition actuelle d'exécution** [G2-D5]. Un gate peut être historiquement satisfait et devoir être réévalué avant une nouvelle étape d'exécution. Mécanisme technique non défini. | G-1, G-2 |
| **Base normative stable** | État à partir duquel un objet ne peut plus être remplacé silencieusement par un état plus récent. Stabilité **objet par objet** : BAT validé (spécification, rendu, artwork original + normalisé, référence, prix de la plaque) ; création de la commande (montant) ; production (BAT + contrôles applicables). | G2-D1, D3 |
| **Non-rétroactivité** | Aucune nouvelle règle, référence, politique, prix ou évolution de catalogue ne réécrit un BAT, une commande, une décision ou une preuve existants. Toute modification demandée après BAT = nouvelle décision et nouveau BAT. | G2-D1, D2 |
| **Réévaluation ≠ correction** | Réévaluer vérifie une condition actuelle d'exécution ; cela peut bloquer, mais ne modifie jamais une donnée reçue ou une décision validée (P11, P13). | G-2, P13 |
| **OD** | Décision normative à arbitrer ou confirmer. Liée à zéro, une ou plusieurs VR. | P8 D2 |
| **VR** | Donnée, contrainte ou confirmation à établir ou valider. Pointe vers l'OD concernée lorsqu'une décision normative est nécessaire. | P8 D2 |
| **Contrat de requête** | Ensemble des champs et valeurs qu'une frontière serveur accepte. | P13 |
| **Violation du contrat de requête** | Requête contenant un champ inconnu, un champ interdit au client, ou une saisie invalide / non fabricable. Qualification neutre, sans présumer d'une intention (« request contract violation »). | P13 D1, D5 |
| **Zone stricte produit / zone documentaire d'audit / Shared Core** | Zones du lint des termes interdits : 2 zones actives par défaut + 1 Shared Core conditionnelle. | P2 D1 |
| **Périmètre technique du lint** | Implémentation du lint, liste normative des motifs interdits, échantillons de test du lint. Explicitement exclu du périmètre contrôlé par ce lint ; ce n'est pas une zone. | P14 |
| **Termes retirés du normatif** | « technologie » (tolérée seulement en marketing au sens clair, jamais identifiant normatif) ; « finition gravée ». | P3 D2, P4 D4 |

---

## 0. État des sources inspectées

### 0.1 Constats v1.4 — HISTORIQUE (inchangés, P10 D1)

| Source | Statut v1.4 | Ce qu'on en tire |
|---|---|---|
| `salmanhamdi/maplaquepro` | FACT v1.4 : HTTP 404 sans authentification (privé ou inexistant) | Traité comme vierge → VR-01 |
| `salmanhamdi/beaunegravure-astro` (public) | FACT v1.4 : inspecté | Cartographie atelier (§4), hébergement mutualisé PHP/FTP sans Node (§26), identités visuelles à éviter |
| app.glassora | FACT v1.4 : backoffice interne existant ; dépôt non localisé | Audit obligatoire (§21) → VR-18 |
| Configurateur Glassora (glassora.fr) | FACT v1.4 : « configurateur en ligne pour composer sa gravure et visualiser le bon à tirer », « projet en construction » (page Projets BG, relevée 8 sept. 2026) | Référence fonctionnelle pour l'upload (§9), sans réutilisation de code avant le gate |
| Décisions produit v1.4 (superviseur) | FACT v1.4 | §3, §4, §7 |
| Hostinger | FACT v1.4 : Node.js/Next.js sur plans Business/Cloud et VPS | §26 |

### 0.2 Clarification datée v1.5 — état réel du dépôt (P10)

| Élément | Constat | Preuve |
|---|---|---|
| Dépôt distant `https://github.com/salmanhamdi/maplaquepro.git` | Existe. Une seule branche `main`, aucun tag. Sommet `c01136bdfabd4603ab78e1b2cc1a3cd743e562c1` (« Initial commit »), contenu : `README.md` seul. | **PROVEN** — `git ls-remote --heads --tags origin` le 2026-09-13T19:43:49Z ; contenu par identité de hachage avec la référence locale. Limites : preuve à cet instant ; références spéciales hors branches/tags et paramètres du dépôt non inspectés. |
| Dépôt local | Aucun commit ; seul `.gitignore` (template générique conservé sur décision ARCH-4). | Vérifications CR-002 à CR-004, CR-014. |
| Implémentation historique | Une implémentation non commitée, construite sur un brief antérieur, a existé puis a été **supprimée** (ARCH-3 à ARCH-5). **Elle n'est pas une source de conception (G.3).** | CR-001 à CR-004 (historique de nettoyage). |
| **VR-01** | **CLÔTURÉE** — résultat : « aucune convention à reprendre ». | P10 D2, preuve directe ci-dessus. |

---

## 1. Executive Summary (v1.5)

MaPlaquePro est une marque e-commerce indépendante de plaques personnalisées fabriquées par l'atelier Beaune Gravure (Ladoix-Serrigny). Le cœur du produit est la chaîne **configurateur → preview → BAT immuable → paiement vérifié → dossier de production exact** : un client ne peut jamais commander ce que l'atelier ne peut pas fabriquer, et l'atelier n'a jamais rien à reconstruire à partir d'une capture d'écran.

La v1.5 ne change **ni le périmètre produit ni les valeurs de fabrication** de v1.4. Elle rend le plan cohérent en intégrant quatorze arbitrages :
- une **structure unique en 8 phases**, DA-1 comme GATE avant la Phase 4 (P1) ;
- un **vocabulaire canonique** : 4 familles, 3 procédés, 4 workflows, finition, apparence, trois états, orientation de pose, zone machine, politique d'impression (P3–P7) ;
- une **source de vérité unique** par information métier et une chaîne RÉFÉRENCE → BAT → OPÉRATION → ARTWORK (P7) ;
- Plexiglass = **impression UV à l'envers → découpe**, couleur selon la référence et jamais promise sans référence couleur validée (P7, P9) ;
- un défaut de trous à 3,0 mm **soumis à toutes les contraintes** (P11) ;
- la séparation **conformité de contrat / validation atelier / GATE 4 (règle de blocage, contrat par contrat) / validation physique (GATE 12)** (P12) ;
- le **rejet typé** de toute requête non conforme, sans correction serveur (P13) ;
- les **zones du lint** et l'exclusion étroite de son périmètre technique (P2, P14) ;
- des **registres OD / VR** clarifiés (P8, P10).

Deux sujets restent **À ARBITRER** (numérotation des GATE ; versions futures de configuration) et une validation reste **À VALIDER** (VR-42). Voir §37.

Principe directeur inchangé : **simple dans l'expérience, structuré dans le domaine, extensible dans l'architecture — et PRODUCT OVER INFRASTRUCTURE.**

*Résumés v1.2, v1.3 et v1.4 : HISTORIQUE, voir Master Plan v1.4 §1.*

## 2. Vision produit

DECISION (v1.4, formulation alignée P4) — Un client doit pouvoir, en quelques minutes sur mobile : choisir un produit, **une référence** (dont l'apparence, finition comprise, est déjà définie) et son épaisseur, un format ; saisir son texte et/ou importer son visuel ; définir ses trous de fixation ; voir une preview crédible ; vérifier ; valider un BAT ; payer — avec la certitude que ce qu'il a validé est exactement ce que l'atelier fabriquera.

Positionnement : **ATELIER × DESIGN × PRÉCISION**. Ce que MaPlaquePro n'est pas : une marketplace, du dropshipping, un outil SaaS, un logiciel de CAO, un configurateur « tout est possible ».

**PRODUCT OVER INFRASTRUCTURE** (DECISION) :
```
Produit > Configurateur > Production > BAT > Commande > Paiement > Backoffice > Infrastructure
```
Une configuration commerciale correspond toujours à un workflow de fabrication explicite, issu de la référence. Une machine seule ne définit jamais la fabricabilité : c'est le workflow complet (intersection des zones machine de toutes ses opérations, §7.4).

Aucune infrastructure complexe (multi-tenant, admin catalogue, abstraction multi-marques, architecture distribuée) avant d'avoir sécurisé, dans l'ordre : 1. configuration ; 2. géométrie ; 3. compatibilité ; 4. prix ; 5. BAT ; 6. production ; 7. commande.

## 2bis. Direction artistique — DA PROVISOIRE vs DA MASTER PLAN VALIDÉ

- **DA PROVISOIRE** (statut PROVISIONAL) : registre premium / contemporain / atelier français / précision / chaleur / simplicité ; distinction obligatoire des identités visuelles existantes de l'atelier et de ses marques (FACT v1.4) ; piste indicative ivoire / encre / accent laiton. **Elle n'est pas une contrainte technique** : le code n'en porte que des tokens sémantiques à valeurs remplaçables.
- **DA MASTER PLAN VALIDÉ** (checkpoint DA-1, VR-14) : document séparé `docs/da-master-plan.md`, 2–3 pistes.
  - **RÈGLE NORMATIVE [P1 D2, modèle G-1]** : **L'entrée en Phase 4 est bloquée par GATE 10 tant que DA-1 n'est pas validé.** La DA peut être préparée avant.
  - *HISTORIQUE — formulation littérale de l'arbitrage P1 D2 (non normative dans v1.5, texte de l'arbitrage inchangé au registre) : « DA-1 est un GATE. DA-1 doit être validée avant le démarrage effectif de la Phase 4. Si DA-1 n'est pas validée, la Phase 4 est bloquée. »*
  - **Lecture selon le modèle G-1** : l'objet bloqué est **l'entrée effective en Phase 4** ; la règle de blocage est **GATE 10 (DA)** ; le checkpoint **DA-1** fournit la preuve (v1.4 §2bis : « GATE 10, checkpoint DA-1 »). Voir §36.1.
  - Périmètre obligatoire : identité ; palette (contrastes mesurés) ; typographie UI (licences) ; iconographie ; photographie ; composants ; configurateur (mobile/desktop ; **étape matière : 4 familles présentées, chacune avec son procédé, 3 procédés au total** [P3] ; dimensions standard / sur mesure ; trous ; upload) ; micro-interactions ; motion (reduced motion) ; responsive ; accessibilité ; ton rédactionnel ; checkout ; BAT (écran de vérification) ; backoffice (si le scénario A/B/C l'exige).
  - Le périmètre DA-1 dépend du glossaire (§GL) ; il est révisé après stabilisation du glossaire.
- Les polices **de gravure** ne relèvent pas de la DA mais du catalogue (§7, VR-08).

## 3. Périmètre MVP

### 3.1 Inclus
- **Produit hero** : plaque de boîte aux lettres personnalisée (DECISION). Architecture prête pour d'autres plaques — non construites.
- **Familles MVP** (FACT superviseur ; références exactes À VALIDER) :
  - **TroLase** — procédé : gravure laser (couleur révélée fixée par la référence) — OD-26 / VR-03 ;
  - **TroLase Metallic** — procédé : gravure laser (même règle) — OD-27 / VR-37 ;
  - **Plexiglass** — procédé : impression UV à l'envers → découpe — OD-28 / VR-38 ;
  - **TroGlass Metallic Gold / Silver** — procédé : gravure envers + UV noir — OD-29 / VR-39.

  Chaque référence reste inactive tant qu'une propriété obligatoire est À VALIDER (GATE 1).
- **Dimensions** : format standard **ou** sur mesure (largeur × hauteur en mm), validées côté serveur contre les règles de dimension et la zone machine de chaque opération du workflow (§7.4, §8, §16bis). **La découpe sur mesure est une fonctionnalité MVP** (OD-34).
- **Impression UV sur Plexiglass** — **RÈGLE NORMATIVE [P9]** : « La famille Plexiglass garantit : DÉCOUPE + IMPRESSION UV. La couleur d'impression dépend de la politique d'impression de la référence. Aucune promesse commerciale de couleur ne peut être faite sans référence couleur active et validée. »
  - Une référence Plexiglass est **noir uniquement** ou **couleur**, selon sa politique validée (OD-32 / VR-40).
  - **RÈGLE NORMATIVE [P7 D4]** : Plexiglass sans impression **interdit en MVP** (pas de workflow « découpe seule », pas de variante supplémentaire).
- **TroGlass** : impression UV **noir uniquement** (OD-33), portée par la référence.
- Configurateur progressif, texte 1–2 lignes, 4–6 polices, layouts, upload artwork (règles par workflow, §9), trous 0/2/4 paramétriques, preview, BAT, panier, Stripe Checkout, emails, dossier de production, analytics, SEO, sécurité, monitoring minimal.
- Vue atelier minimale : contrat §21.1, implémentation après le gate Backoffice.

### 3.2 Exclus (P1 produit / P2 produit / FUTURE)
*Note : ici « P1 / P2 » désignent des **priorités produit** (v1.4), pas les arbitrages P1/P2.*
Comptes clients (P1), inox/laiton marqués fibre (P1), paliers dégressifs (P1), PDF BAT client (P1), PDF en upload (VR-26), motifs bibliothèque (P1), formes non rectangulaires (P1), admin CRUD catalogue (P2), promos (P2), multi-marques (conditionné §21), export machine direct (FUTURE), i18n (FUTURE), **Plexiglass sans impression (hors MVP, P7 D4, sans préjuger d'une évolution)**.

### 3.3 Matrice de priorité (détecteur de sur-ingénierie)

| Élément | MVP | Important | Nice to have | Future |
|---|---|---|---|---|
| Catalogue par référence (fabricant, code, épaisseur, apparence, capacité de gravure, politique d'impression, workflow) + états | ✔ | | | |
| `ProductionWorkflow` + `MachineCapability` + intersection des zones machine | ✔ | | | |
| Format standard / sur mesure + `DimensionRules` | ✔ | | | |
| Moteur de compatibilité raisonnant sur le workflow complet | ✔ | | | |
| Pricing serveur (référence, épaisseur, dimensions/surface, UV, trous, artwork) | ✔ | | | |
| Configurateur : étape matière (famille → référence) → épaisseur → dimensions avec retour par opération | ✔ | | | |
| Trous standard / avancé (défaut P11) | ✔ / ✔ | | | |
| Upload SVG (+ raster selon politique du workflow), couleur selon la politique d'impression | ✔ | | | |
| Preview + BAT serveur immuable (workflow figé) | ✔ | | | |
| Artefacts de production : laser, UV, hybride (conformité en Phase 5 ; validation atelier : VR-42 ; blocage : GATE 4, contrat par contrat) | ✔ | | | |
| Stripe + webhook 8 gardes, dossier de production, vue atelier (après gate) | ✔ | | | |
| Analytics double mode, Sentry, taille réelle | | ✔ | | |
| Formes non rectangulaires, PDF upload, comptes, promos, multi-marques | | | | ✔ / conditionné |

*(v1.4 citait « étape matière → référence/couleur → épaisseur → finition » : supprimé, P4.)*

## 4. Contraintes atelier

Source : `beaunegravure-astro` (rédigé par l'atelier) et décisions du superviseur. Rien n'est extrapolé au-delà de l'étiquette indiquée.

### 4.1 Machines — `MachineCapability` (capacité machine)

DECISION — Les **capacités physiques appartiennent aux machines** ; le workflow ne les duplique jamais (R30). On distingue l'enveloppe mécanique (`workingArea`) de la zone réellement exploitable (`printableArea`). La zone retenue pour une opération est la **zone machine** (§GL).

| `machineId` | Opérations | Zone machine | Orientation de pose tournée autorisée | Statut | Source |
|---|---|---|---|---|---|
| `SPEEDY_400` (Trotec CO₂) | gravure laser, découpe laser (matières non métalliques) | `workingArea` **1010 × 610 mm** — capacité atelier retenue, non universelle ; limites plus précises via `DimensionRules` (VR-25) | oui | `validated` (enveloppe) | FACT atelier |
| `ARTISJET_3000U` | impression UV | **`printableArea` = 347 × 490 mm** — valeur atelier normative, DECIDED — BLOCKING pour tout workflow avec impression UV ; jamais remplacée par une valeur trouvée sur Internet | oui (490 × 347), si la géométrie et le workflow le permettent | `validated` | FACT atelier + superviseur (OD-30) |
| `FIBER_50W` | marquage laser | 300 × 300 mm | — | hors MVP | FACT atelier |
| `UV_5W` | marquage délicat | 100 × 100 mm | — | hors MVP | FACT atelier |

**Contrainte inchangée [P6]** : 347 × 490 mm et 1010 × 610 mm. Aucune capacité machine n'est inventée ; toute limite non listée est À VALIDER.
**Rappel [P7 D1]** : la capacité machine (ce que l'ArtisJet sait faire) n'est jamais la politique d'impression d'une référence (ce qui est commercialisé).

### 4.2 Familles et références MVP (références exactes À VALIDER)

| Famille | Description (FACT superviseur) | Procédé [P3] | Apparence de la référence [P5] | Capacité de gravure [P5, P7] | Politique d'impression [P7, P9] | Workflow (§7.2) | Épaisseurs | Références |
|---|---|---|---|---|---|---|---|---|
| **TroLase** | Bicouche ; la gravure révèle la couche sous-jacente | Gravure laser | Couleur de surface, finition, **couleur révélée DÉFINIE** par la référence ; aucun choix client | gravable, côté face | **aucune** | `TROLASE_ENGRAVE` | th_0_8 / th_1_6 / th_3_0 | OD-26 / VR-03 |
| **TroLase Metallic** | Bicouche aspect métallique ; même règle | Gravure laser (même procédé que TroLase, famille distincte [P3 D3]) | idem TroLase | gravable, côté face | **aucune** | `TROLASE_METALLIC_ENGRAVE` | th_0_8 / th_1_6 / th_3_0 (sous réserve des références retenues) | OD-27 / VR-37 |
| **Plexiglass** | Impression UV à l'envers → découpe laser ; support et apparence définis par la référence | Impression UV à l'envers → découpe | Couleur de surface (support), finition ; couleur révélée **SANS OBJET** dans le workflow MVP | selon la référence (À VALIDER) ; aucune gravure dans le workflow MVP `PLEXIGLASS_UV` (CR-12) | **noir uniquement** ou **couleur**, selon la référence ; **aucune interdite en MVP** [P7 D4] ; jamais présumée couleur | `PLEXIGLASS_UV` | th_3_0 / th_5_0 | OD-28 / VR-38 ; politique OD-32 / VR-40 |
| **TroGlass Metallic Gold / Silver** | Hybride : gravure laser envers → découpe → impression UV noire envers | Gravure envers + UV noir | Couleur de surface Gold / Silver selon référence, finition ; couleur révélée selon référence (un des trois états). **Le noir UV n'est jamais une couleur révélée** [P5 D2] | gravable, côté envers | **noir uniquement** (OD-33), portée par la référence ; aucune encre proposée | `TROGLASS_METALLIC_HYBRID` | selon références validées | OD-29 / VR-39 |
| Inox brossé, laiton, alu anodisé | Marquage fibre, jamais découpés (FACT) | — | — | — | — | P1 produit | — | VR-06 |

- **RÈGLE NORMATIVE [P4]** : la finition désigne exclusivement un aspect de surface attaché à une référence. Chaque aspect commercialisable distinct est une référence distincte ; seules les références réellement définies et validées sont proposées.
- **RÈGLE NORMATIVE [P5]** : aucune propriété d'apparence ne doit être déduite d'une capacité de fabrication.
- **RÈGLE NORMATIVE [P7]** : une information métier n'a qu'une seule source de vérité normative ; les représentations aval la dérivent ou la matérialisent, sans la redéfinir silencieusement.
- Aucune couleur, finition, combinaison ou épaisseur n'est inventée. Ce qui n'est pas confirmé reste À VALIDER, et la référence reste inactive et invisible.

### 4.3 Interdictions absolues — DECISION
**PVC**, **verre**, **découpe métal** : interdits dans le produit (catalogue, configurateur, fixtures, seeds, tests produit, contenu, UI, démo). Tolérés en zone documentaire d'audit pour expliquer une contrainte ou un rejet. Politique de lint : **§24.6** (P2, P14). Les tests produit qui vérifient ces motifs utilisent la source canonique des motifs, sans recopier les termes en clair [P14 D5]. (« TroGlass » et « Plexiglass » désignent du PMMA acrylique, pas du verre ; le lint à frontière de mot ne les matche pas.)

### 4.4 Règles de fabrication transposées
- **Dimensions** : format standard ou sur mesure, bornées par `DimensionRules` (référence × épaisseur × forme × workflow × machine) **et** par l'intersection des zones machine de toutes les opérations (§7.4, Annexe B). **Forme MVP = rectangle** à coins arrondis paramétriques.
- Une configuration commerciale correspond toujours à un workflow explicite issu de la référence ; le procédé n'est jamais déduit de la couleur ou de l'apparence.
- Artefacts de production : laser (`PRODUCTION_SVG_CONTRACT_v1`, §14.1), UV (`PRODUCTION_UV_CONTRACT_v1`, VR-33, §14.2), hybride (§14.3).
- Tenue extérieure par référence : VR-04. Fixation : trous (§11, VR-22 à VR-24) et/ou adhésif (VR-05). L'atelier vérifie chaque fichier : `ON_HOLD` prévu.
- **RÈGLE COMPLÉMENTAIRE [P11]** : « Aucune valeur de fabrication ne peut être considérée comme validée avant validation des données atelier correspondantes. »

### 4.5 HERO PRODUCT VALIDATION GATE
- **Volet a (papier) = GATE 1** : références exactes de chaque famille (OD-26 à OD-29 / VR-03, VR-37 à VR-39), épaisseurs en stock, apparence (surface, finition, couleur révélée), capacité de gravure et politique d'impression par référence (OD-32 / VR-40), workflow confirmé, tenue extérieure, `DimensionRules` par référence et épaisseur, format de fichier UV ArtisJet (VR-33 ; volet documentaire / papier — sa validation par l'atelier relève du contrat applicable et donc de GATE 4), diamètre / marges / sémantique / disposition des trous, `rasterPolicy` par workflow, adhésif.
- **Volet b (physique) = GATE 12** : ≥ 3 plaques par famille activée (dont une sur mesure, une avec trous, une avec artwork ; pour TroGlass un hybride), fabriquées depuis des BAT réels, comparées, validées par l'atelier. Livrable `docs/hero-validation.md`.
  - **RÈGLE NORMATIVE [P9 D2]** : pour Plexiglass, l'exigence d'une plaque imprimée **en couleur** est **conditionnelle** : elle s'applique lorsqu'une référence Plexiglass à politique couleur est effectivement active. Sans référence couleur active, aucun échec artificiel du MVP n'est créé. Dès qu'une référence couleur est déclarée active, la capacité est réellement validée et le parcours testé.
  - **RÈGLE COMPLÉMENTAIRE [P12]** : la validation physique (GATE 12) ne se confond pas avec la validation documentaire / atelier des contrats de fichier (preuve prise en compte par GATE 4).

## 5. Architecture

### 5.1 DECISION — Application unique à deux couches
Next.js App Router (TypeScript strict) avec :
- `src/domain/` — **pur** (aucun import React/Next/DB/fs ; vérifié par lint boundaries) : catalogue (références, workflows, capacités machine, `DimensionRules`), configuration, compatibilité (workflow complet), dimensions, design, trous, artwork (règles par workflow), pricing, géométrie, rendu (preview), production (artefacts laser / UV / hybride, §13–§14).
- `src/server/` — persistance (Drizzle), server actions, services (Stripe, mailer, storage, pdf), auth.
- `src/app/`, `src/components/` — UI.

Pas de monorepo, pas de microservices, pas de multi-tenant.
*Note v1.5 : ces décisions v1.4 sont reprises telles quelles ; elles ne sont pas des instructions d'implémentation tant que v1.5 n'est pas validée (G.1). L'ancien code supprimé n'y a contribué en rien (G.3).*

### 5.2 Chaîne de vérité
```
Configuration structurée (client) ← seule chose que le client envoie (champs autorisés uniquement, §16bis)
↓ createBat (serveur) — requête non conforme ⇒ rejet typé (P13)
Compatibilité (workflow complet) · Dimensions (intersection des zones machine) · Design · Trous · Artwork (mode couleur dérivé) · Pricing ← calcul serveur (création du BAT)
↓
Géométrie canonique (mm) ← vérité métier n°1
↓ ↓
Preview SVG (client) Production Engine (workflow → artefacts)
↓ ↓
BAT immuable (snapshot) ←────── ProductionArtifact[] (laser / UV / hybride)
↓
Order → Production Job (dérivé du BAT, jamais du DOM)
```
**RÈGLE NORMATIVE [P7 D5]** : RÉFÉRENCE → BAT → OPÉRATION DE FABRICATION → ARTWORK ; aucune couche aval ne réinterprète ni ne contredit silencieusement une propriété normative amont.

### 5.3 Frontières — ARCH-0.2 (DECISION, condition Shared Core corrigée)
```
MaPlaquePro domain (src/, content/, seeds/, tests/, fonts/, public/)
├── aucun produit/process interdit (PVC, verre, découpe métal)
├── aucun couplage Glassora (ni import, ni vocabulaire, ni schéma partagé)
└── aucune dépendance à l'ancien backoffice (app.glassora)
Audit architectural (docs/audit/**, docs/ADR/0006-backoffice.md)
└── peut nommer et décrire l'application Glassora
Shared Core (n'existe que si le verdict ARCH-BACKOFFICE conclut B, ou C avec mutualisation effectivement décidée)
└── aucune dépendance ni vocabulaire spécifique à Glassora ou à MaPlaquePro
```
**RÈGLE NORMATIVE [P2 D2]** : le Shared Core n'est jamais implicite ; son activation résulte d'une décision explicite de mutualisation, avec un périmètre déclaré. *(v1.4 écrivait « A ou C » : formulation incorrecte, corrigée.)*

### 5.4 Stack — DECISION (v1.4, inchangée)
Next.js 15/16, React 19, TS strict, Tailwind v4 + tokens CSS sémantiques, Framer Motion (reduced motion), Lucide, Zod partout, Drizzle ORM, opentype.js, **Stripe Checkout (Stripe = fournisseur de paiement retenu, compte professionnel disponible — SCOPE-1)**, Resend (fallback SMTP), Sentry (gratuit), Vitest, Playwright, axe, Lighthouse CI. Hébergement §26. *Aucune installation autorisée avant validation v1.5 et autorisation d'implémentation.*

## 6. Domain Model (conceptuel)

Types du domaine : `configurationVersion = 4` (v1.4). Toute configuration de version antérieure est rejetée (aucune n'existe en production). **Stabilité et non-rétroactivité : G-2 arbitré (§G.6, §15). Mécanisme technique de versioning et compatibilité de futures versions de configuration : non définis (G2-DOC, §37).**

DECISION (v1.4) — **Aucune valeur de fabrication n'est codée en dur dans un type.** La configuration ne porte que des références catalogue et des saisies client ; toutes les valeurs (mm, couleurs, machines, côtés, encre, zones, orientation de pose) sont **résolues serveur** et figées dans le BAT. **Le procédé n'est jamais déduit d'une couleur ou d'une apparence : le workflow vient de la référence.**

*Notation indicative : les noms techniques ci-dessous reprennent v1.4 et restent non définitifs (P5 D5) ; le statut normatif de cette notation est À ARBITRER (A-1, §37).*

```ts
// Envoyé par le client — seuls ces champs sont autorisés (P13)
type Configuration = {
  configurationVersion: 4
  productId: ProductId
  materialVariantId: MaterialVariantId   // la RÉFÉRENCE
  thicknessId: ThicknessId               // ∈ épaisseurs de la référence
  format: FormatSpec                     // standard OU sur mesure
  design: {
    text: { lines: string[]; fontId: FontId; layoutId: LayoutId; alignment: 'left'|'center' } | null
    artwork: ArtworkPlacement | null     // traitement couleur dérivé de la politique d'impression (§9)
  }
  mounting: MountingPattern              // §11 ; valeurs éventuellement proposées par le configurateur AVANT envoi (G.5)
  quantity: number
}
// Interdits au client (rejet typé, P13) : prix, géométrie, workflow, opérations, orientation de pose,
// zone machine, encre, mode couleur, artefacts, toute propriété résolue.

type FormatSpec =
  | { mode: 'standard'; formatId: FormatId }
  | { mode: 'custom'; widthMm: number; heightMm: number; cornerRadiusMm?: number }

type MountingPattern =
  | { count: 0 }
  | { count: 2 | 4; mode: 'standard'; edgeDistanceMm: number }
  | { count: 2 | 4; mode: 'advanced'; edgeDistanceXMm: number; edgeDistanceYMm: number; symmetry: true }

type ArtworkPlacement = { artworkRef: string; xMm; yMm; widthMm; heightMm; rotationDeg: 0|90|180|270 }

// Trois états normatifs (P5 D4) — notation conceptuelle
type Etat<T> = { etat: 'SANS_OBJET' } | { etat: 'DEFINIE'; valeur: T } | { etat: 'A_VALIDER' }

type ResolvedSpec = { // calculé serveur, figé dans le BAT ; aucun état À_VALIDER possible ici (P7)
  product: { id; slug; name }
  reference: { id; manufacturer; code; family; label }
  thickness: { id; mm }
  plate: { widthMm; heightMm; cornerRadiusMm; safeZoneMm; formatMode:'standard'|'custom'; formatId? }
  apparence: { couleurSurface: ColorSpec; finition: Etat<Finition>; couleurRevelee: Etat<ColorSpec> }   // P5
  capaciteGravure: { cote: Etat<'face'|'envers'> }                                                    // gravable ⇔ côté DÉFINI (P7 D2)
  politiqueImpression: { valeur: 'aucune'|'noir_uniquement'|'couleur'; cote: Etat<'face'|'envers'> }  // P7
  workflow: { id; version; operations: ResolvedOperation[] }   // machine, côté, encre dérivée, séquence
  posesParOperation: Array<{ operationSequence; machineId; zoneMachine: { widthMm; heightMm }; orientationDePose: 'tel_quel'|'tournee' }> // P6
  mountingRules: { holeDiameterMm; minEdgeDistanceMm; holeKeepOutMarginMm; edgeDistanceSemantics }
  artworkRules: ArtworkRules
  catalogVersion; designRulesVersion; productionContractIds: string[]
}

type CanonicalGeometry = { // mm, arrondi roundMm (3 décimales)
  plate: { widthMm; heightMm; cornerRadiusMm; thicknessMm }
  safeZoneMm: number
  holes: Array<{ cxMm; cyMm; diameterMm }>          // disposition des trous (P6)
  keepOutZones: Array<{ kind:'hole'|'edge'; shape: Circle|Rect }>
  layers: {
    engrave: Array<TextGlyphPaths | ArtworkVectorPaths | ArtworkRasterRef>   // toujours monochrome
    print: Array<ArtworkVectorPaths | ArtworkRasterRef | TextGlyphPaths> | null // couleur selon la politique d'impression ; null si 'aucune'
  }
  engineVersions: { design; mounting; geometry; render; production }
}
```
Entités catalogue : `Product`, référence (`MaterialVariant`), `Thickness`, `Format`, `DimensionRules`, apparence, politique d'impression, `ProductionWorkflow`, `ProductionOperation`, `MachineCapability`, `MountingRules`, `DesignOptions`, `ArtworkRules`, `PriceRules`, `CompatibilityRules`, `ProductionContracts`. Persistées : `artworks`, `bat_snapshots`, `orders`, `order_lines`, `order_events`, `production_jobs`, `stripe_events`, `events`, `email_log`, `admin_*`. **Aucun `brand_id/store_id/channel_id/tenant_id`** (§21). Modèle complet : **Annexe A**.

## 7. Catalogue

DECISION — Déclaratif, TypeScript, Zod, versionné (`catalogVersion`), sans tables catalogue en MVP, statut par entité, seules les références actives exposées ; valeurs résolues figées dans le BAT. **La référence est l'unité de vente.**

### 7.1 Structure cible
```
Product (plaque boîte aux lettres)
├── allowedVariantIds[], allowedFormats[], allowedLayouts[], allowedFonts[], mountingRulesId
└── Référence (MaterialVariant — unité de vente)
    ├── manufacturer (valeur | À VALIDER)
    ├── reference / code fabricant (valeur | À VALIDER)
    ├── family ('trolase' | 'trolase_metallic' | 'plexiglass' | 'troglass_metallic')
    ├── thicknessIds[] (→ Thickness : th_0_8 0.8, th_1_6 1.6, th_3_0 3.0, th_5_0 5.0)
    ├── apparence (P5) : couleur de surface ; finition (état) ; couleur révélée (état)
    ├── capacité de gravure (P5, P7) : côté (état) — aucune couleur
    ├── politique d'impression (P7) : aucune | noir uniquement | couleur | À VALIDER ; côté (état)
    ├── productionWorkflowId (→ ProductionWorkflow)
    ├── dimensionRulesIds[]
    ├── mountingRulesId
    ├── artworkRulesId
    ├── outdoorStatus ('outdoor' | 'indoor' | À VALIDER)
    ├── swatch
    └── statut ('active' | 'validation_required' | 'draft') — active impossible si une propriété obligatoire est À VALIDER
```
Références attendues (toutes À VALIDER — OD-26 à OD-29 / VR-03, VR-37 à VR-39) : TroLase × couleurs retenues ; TroLase Metallic × références ; Plexiglass × apparences de support (politique d'impression par référence, OD-32 / VR-40) ; TroGlass Metallic Gold ; TroGlass Metallic Silver. **Ne pas inventer de références, de couleurs, de finitions ni de capacités.**
**RÈGLE [G2-D8]** : une référence déjà utilisée dans une décision validée n'est pas modifiée rétroactivement d'une manière qui change sa signification pour cette décision. Si l'évolution crée une nouvelle réalité commerciale ou de fabrication, elle est traitée comme une **nouvelle référence / nouvelle version commerciale**, selon un mécanisme futur à définir (non défini ici). Une évolution du catalogue n'invalide pas automatiquement un BAT (G2-D4).

### 7.2 `ProductionWorkflow` (source de vérité du procédé — sans contraintes machine)

| `id` | Procédé [P3] | Séquence (`sequence`, type, machine, côté, encre) | Politique d'artwork |
|---|---|---|---|
| `TROLASE_ENGRAVE` | Gravure laser | 1 gravure laser @ `SPEEDY_400` face · 2 découpe laser @ `SPEEDY_400` face — **systématique** (`condition: always`), même session que la gravure (VR-34 close : mise au format à l'atelier) | monochrome, gravure |
| `TROLASE_METALLIC_ENGRAVE` | Gravure laser | 1 gravure laser @ `SPEEDY_400` face · 2 découpe laser **systématique** (`condition: always`), même session que la gravure (VR-34 close ; machine et côté non précisés par les faits atelier — V-1) | monochrome, gravure |
| `PLEXIGLASS_UV` | Impression UV à l'envers → découpe | 1 impression UV @ `ARTISJET_3000U` **envers, en miroir X** (V-3), **encre dérivée de la politique d'impression de la référence** (noir uniquement ou couleur ; jamais présumée couleur) · 2 découpe laser @ `SPEEDY_400` **envers** (face imprimée tournée vers le laser, V-2), **systématique** (`condition: always`) ; **aucun miroir** du contour ni des trous | impression, traitement couleur selon la politique de la référence (OD-32 / VR-40) |
| `TROGLASS_METALLIC_HYBRID` | Gravure envers + UV noir | 1 gravure laser @ `SPEEDY_400` envers · 2 découpe laser @ `SPEEDY_400` envers, **systématique** (`condition: always`, P3 ; workflow distinct de `PLEXIGLASS_UV`) · 3 impression UV @ `ARTISJET_3000U` envers, encre **noir uniquement** | gravure envers + UV noir envers ; **aucun choix d'encre** |

L'ordre est explicite et figé dans le BAT (`workflowVersion`). **Le moteur de compatibilité raisonne sur le workflow complet.** La découpe des workflows TroLase est confirmée et systématique (VR-34, close). Cela n'active aucun format ni aucun mode commercialement : le mode sur mesure TroLase / TroLase Metallic reste **inactif** (CR-2, ouverte) tant que notamment VR-25, VR-02, GATE 1 et les conditions commerciales du sur mesure ne sont pas validés.
*Note [P3 × P9] : pour TroGlass, « noir » figure dans le nom du procédé parce que le noir est un invariant de la famille (OD-33). Pour Plexiglass, la couleur varie selon la référence : elle ne fait pas partie du libellé du procédé.*

### 7.3 `MachineCapability`
Voir §4.1 (source de vérité). `SPEEDY_400` { gravure laser, découpe laser ; `workingArea` 1010 × 610 ; orientation de pose tournée autorisée ; `validated` } · `ARTISJET_3000U` { impression UV ; **`printableArea` 347 × 490** ; orientation de pose tournée autorisée ; `validated` } · `FIBER_50W`, `UV_5W` hors MVP.

### 7.4 `DimensionRules`, forme, dimensionnement et orientation de pose
- **Forme — DECISION** : **MVP = rectangle**. Rond, ovale, contour libre : hors périmètre (P1 produit). Coins arrondis : `cornerRadiusMm` paramétrique, soumis aux règles atelier (VR-36).
- `DimensionRules { id, variantId, thicknessId, minWidthMm, maxWidthMm, minHeightMm, maxHeightMm, minAreaMm2?, maxAreaMm2?, minCornerRadiusMm?, maxCornerRadiusMm?, statut }`. **Aucun minimum ou maximum non validé n'est introduit** : valeurs À VALIDER (VR-25) jusqu'à GATE 1.
- **Règle fondamentale (normative, v1.4)** : la fabricabilité est déterminée par l'intersection des contraintes de toutes les opérations du workflow. Exemple normatif : Plexiglass 500 × 300, impression UV à l'envers → découpe → Speedy OK, ArtisJet NON → `NOT_FABRICABLE`.
- **Orientation de pose — logique générique** : pour chaque opération, (W, H) est admissible si `(W ≤ zoneW ∧ H ≤ zoneH)` [tel quel] ou `(orientation tournée autorisée ∧ W ≤ zoneH ∧ H ≤ zoneW)` [tournée].
  - **RÈGLE NORMATIVE [P6]** : « Une commande doit produire une orientation de pose déterministe. Lorsque plusieurs orientations sont techniquement admissibles : « TEL QUEL » est retenu par défaut. Aucun choix arbitraire ou dépendant de l'ordre de traitement n'est autorisé. »
  - Pour chaque opération, le BAT enregistre la **zone machine** retenue et l'**orientation de pose** retenue [P6 D2].
  - **Repère** : le sens exact de « largeur » et « hauteur » de chaque zone machine (quel axe physique) n'est pas défini dans les sources. **À ARBITRER (R-1, §37)** : aucune VR n'est créée ni étendue sans décision.
  - L'orientation de pose **n'est pas affichée au client** [P6 D5].
  - **RÈGLE [P6 D4]** : orientation de pose de la plaque ≠ transformation du fichier de production. Aucune transformation automatique du fichier n'est supposée tant que l'atelier n'a pas validé le comportement (**VR-41**).
  - Tests normatifs (v1.4, inchangés) : 347 × 490 admissible ; 490 × 347 admissible (tournée) ; 347,1 × 490 rejet ; 347 × 490,1 rejet.

### 7.5 Autres entités
`Thickness { id, mm, label, statut }` (exactement quatre valeurs référentielles ; TroLase / TroLase Metallic → 0,8 / 1,6 / 3,0 ; Plexiglass → 3,0 / 5,0 ; TroGlass → selon références validées) · `Format { id, label, widthMm, heightMm, cornerRadiusMm, statut }` (VR-02) · `MountingRules` (§11) · `ArtworkRules { formats, maxBytes, maxPixels, minDpiAtPlacedSize, minLineWidthMm, colorMode: 'monochrome' | 'noir_uniquement' | 'selon_politique_impression_reference', rasterPolicy, statut }` (une par workflow ; le mode couleur est **dérivé**, jamais saisi) · `PriceRules { base, byVariant, byThickness, byFormat, customDimensionPricing (VR-07), byWorkflow, byMounting, artworkProcessingFee, quantityTiers, vatRate, pricingStatus }` · `CompatibilityRules` · `ProductionContracts` (§14).
Tests (spécification) : schéma ; toute propriété obligatoire À VALIDER ⇒ référence inactive ; cohérence / atteignabilité ; le moteur détermine la fabricabilité d'une configuration complète sur toutes les opérations du workflow ; `docs/catalog.md` relu par l'atelier.

## 8. Configurateur

DECISION — Machine à états, état = configuration v4 ; options filtrées par `availableOptions` ; preview, prix et résumé = projections ; **le parcours varie selon le workflow de la référence**.

| # | Étape | Contenu | Sortie |
|---|---|---|---|
| 1 | Produit | Page produit → entrée configurateur | `productId` |
| 2 | **Matière : famille → référence** | **Quatre cartes de famille** [P3], chacune avec un schéma de coupe et **son procédé** : **TroLase** — « Plaque bicouche », procédé *gravure laser* ; **TroLase Metallic** — « Plaque aspect métallique », procédé *gravure laser* (même procédé que TroLase, famille distincte) ; **Plexiglass** — procédé *impression UV à l'envers → découpe* ; **TroGlass Metallic Gold / Silver** — procédé *gravure envers + UV noir*. Puis swatches des **références** (apparence complète : surface, finition, couleur révélée le cas échéant). Le client ne doit jamais croire que toutes les familles utilisent le même procédé, ni que deux familles au même procédé sont deux procédés différents. **Aucune étape « finition »** [P4]. | `materialVariantId` |
| 3 | Épaisseur | Cartes `Thickness` de la référence | `thicknessId` |
| 4 | **Dimensions** | **STANDARD** (formats) ou **SUR MESURE** : largeur, hauteur (+ rayon de coin borné si VR-36 validée). Retour dynamique **par opération du workflow** : « ✓ Découpe compatible », « ✓ Impression UV compatible » / « ✕ Ce format dépasse la zone maximale d'impression UV » ; alternative **uniquement si réellement applicable** (Annexe B). **L'orientation de pose n'est pas affichée** [P6 D5]. | `format` |
| 5 | Personnalisation (texte) | 1–2 lignes, polices, layouts | `design.text` |
| 6 | Artwork | Upload selon `ArtworkRules` du workflow ; bandeau de procédé (§9.4) ; **aucun sélecteur d'encre** ; traitement couleur dérivé de la politique d'impression de la référence | `design.artwork` |
| 7 | Trous | §11.1 (0/2/4, standard / avancé) ; défaut P11 ; entrent dans la fabricabilité | `mounting` |
| 8 | Vérification | Rendu **serveur**, taille réelle, relecture, cotations, **procédé rappelé en clair** ; cases orthographe / visuel | confirmations |
| 9 | BAT | « Valider et ajouter au panier » → `createBat` | `batId` |
| 10 | Panier | §17 | — |

Règles : une action primaire par écran ; erreurs inline ; BAT désactivé tant que le domaine (exécuté localement, **informatif**) retourne une erreur ; draft `mpp.draft.v4.<productId>` ; prefill URL (référence, format standard) ; aucun appel réseau sauf upload et `createBat`.
- **RÈGLE NORMATIVE [G.5 — P11 × P13]** : toute adaptation d'une valeur (ex. distance au bord des trous) a lieu dans le configurateur **avant** la constitution de la requête ; le serveur ne substitue jamais une autre valeur à celle reçue.
- Frontière de confiance : §16bis.

## 9. Upload Artwork

FACT (v1.4) — Fonctionnalité MVP, sur le principe fonctionnel du configurateur d'une marque sœur (référence de produit uniquement, §5.3). DECISION — **Les règles d'upload dépendent du workflow** : `ArtworkRules` (par workflow) + `ProductionWorkflow` + politique d'impression de la référence.

### 9.1 Pipeline
```
upload → validation (serveur) → normalisation selon le mode couleur dérivé → placement (zone utile, keep-out, ratio)
→ représentation canonique (layers.engrave / layers.print) → validation fabrication (ArtworkRules + workflow + machines)
→ BAT → artefact de production
```
Un fichier client ne devient jamais un fichier machine ; le BAT est bloqué si non fabricable.
**RÈGLE [ART1-D3]** : ARTWORK ORIGINAL CLIENT ≠ VERSION NORMALISÉE ≠ FICHIER MACHINE. L'original client est conservé ; la « normalisation » de ce pipeline produit une **version normalisée distincte**, jamais une modification de l'original. Règles de transformation : §9.7.

### 9.2 Politique par workflow

| Workflow (procédé) | Destination de l'artwork | Mode couleur (dérivé, P7 D5) | Normalisation | Raster |
|---|---|---|---|---|
| `TROLASE_ENGRAVE` / `TROLASE_METALLIC_ENGRAVE` (gravure laser) | Gravure | `monochrome` : tout remplissage → couleur révélée de la référence ; la couleur originale du fichier client est **conservée dans l'original** ; la **version normalisée** est monochrome (couleur révélée de la référence) ; transformation visible ⇒ avertissement + rendu normalisé + acceptation avant BAT (§9.7) | SVG → paths monochromes | `rasterPolicy` VR-28 (défaut `reject`) |
| `PLEXIGLASS_UV` (impression UV à l'envers → découpe) | Impression | **selon la politique d'impression de la référence** : noir uniquement ou couleur (OD-32 / VR-40) ; jamais présumé couleur | référence à politique **couleur** validée : couleurs de l'original conservées dans la version normalisée (profil VR-33) ; référence à politique **noir uniquement** validée : règle **ART1-D5** (§9.7) ; PNG / JPG selon la politique de la référence | politique UV VR-33 (non promise avant validation) |
| `TROGLASS_METALLIC_HYBRID` (gravure envers + UV noir) | Gravure envers + UV noir envers | `noir_uniquement` : **version normalisée noire** produite depuis l'original conservé (ART1-D1) ; **aucune encre proposée** ; preview = noir sur Gold / Silver | SVG → version normalisée noire ; raster → bilevel (VR-28 ; catégorie ART-1 de cette transformation **À CONFIRMER**) | VR-28 |

Aucune promesse « photo / dégradé gravé ou imprimé » ; les libellés dépendent de la politique de la référence. Le configurateur ne propose jamais de couleur d'encre.

### 9.3 Contrôles serveur
MIME réel, taille, pixels, DPI à la taille posée (VR-27), géométrie vectorielle, texte non converti → rejet, débordement, keep-out, traits fins (VR-08), sécurité (allowlist, XXE, `href` distants, décodage borné), conformité au mode couleur dérivé.
- Un artwork couleur fourni pour une référence dont la politique active et validée n'est pas « couleur » est traité selon **§9.7** : version normalisée distincte, original conservé, rendu normalisé présenté, avertissement si la transformation est visible, **acceptation client avant BAT** lorsqu'elle est requise ; jamais imprimé en couleur ; **aucune conversion silencieuse**. Le traitement dépend de la référence et de son procédé (TroLase, TroLase Metallic, Plexiglass, TroGlass restent distingués) ; aucune règle générale ne s'applique à toutes les familles.
- *Note [P13] : cette normalisation porte sur le contenu du fichier fourni, dans le pipeline d'artwork, et elle est explicitement signalée. Elle ne corrige aucun champ de requête. Toute demande d'encre ou de mode couleur envoyée comme champ reste un champ interdit (rejet typé). Qualification arbitrée : **ART1-D2** (§9.7).*

### 9.4 UX
Dépôt, miniature, centré à 60 %, déplacer / redimensionner / centrer / pivoter 90°, limites visibles, alertes, remplacer / supprimer ; bandeau de procédé :
- gravure laser : « Ce visuel sera gravé dans la couleur révélée de la référence » ;
- impression UV à l'envers → découpe : « Ce visuel sera imprimé par UV — en noir ou en couleur selon la référence choisie » (message adapté à la politique réelle de la référence) ;
- gravure envers + UV noir : « Ce visuel sera gravé à l'envers puis imprimé en noir sous la plaque ».

Pas de CAO.

### 9.5 Non fabricable → BAT bloqué, explication actionnable ; transformation visible imposée par la référence / le procédé (catégorie B, §9.7) → avertissement + rendu normalisé + **acceptation avant BAT** ; refus ou impossibilité → rejet typé `ARTWORK_COLOR_NOT_ALLOWED` selon ART1-D7 (pour la couleur) ou code de fabricabilité correspondant.

### 9.6 Stockage et rétention — inchangé : table `artworks` (original + normalisé, hash, purge 24 h orphelin / 30 j BAT / 2 ans commande, original supprimé 30 j après expédition — VR-29) ; emplacement OD-14. *Ces durées relèvent de la **conservation RGPD** ; elles ne définissent pas l'expiration commerciale d'un BAT, dont la durée est À DÉFINIR (G2-D12).*

### 9.7 Transformations d'artwork — règles ART-1 (arbitrées)

**ART1-D1 — Conversion couleur → noir** : une conversion d'artwork est **autorisée** lorsqu'elle est **imposée par la référence active et validée** et qu'elle correspond au **workflow / procédé applicable**. Conditions :
- original client conservé ;
- version normalisée distincte ;
- rendu normalisé présenté au client ;
- avertissement lorsque la transformation est visible ;
- acceptation client avant BAT lorsque cette transformation visible est requise.

**Aucune conversion silencieuse du contenu client.**

**ART1-D2 — Relation avec P13** : P13 s'applique aux requêtes client et à leurs données contractuelles. P13 **n'interdit pas par principe** une préparation / normalisation technique d'un artwork. Une transformation du contenu ne doit **jamais** être présentée comme une correction silencieuse d'une donnée client.

**ART1-D3 — Trois représentations** : ARTWORK ORIGINAL CLIENT ≠ VERSION NORMALISÉE ≠ FICHIER MACHINE. L'original client est conservé.

**ART1-D4 — BAT** : toute transformation ayant une incidence sur le rendu validé ne peut pas être appliquée silencieusement après validation du BAT. Si une modification post-BAT change le rendu validé : **nouveau BAT + nouvelle validation client avant production**. Le client valide le rendu normalisé / BAT, jamais le fichier machine.

**ART1-D5 — Plexiglass noir uniquement** : pour une référence Plexiglass active dont la politique d'impression UV noire est validée :
- artwork couleur techniquement convertible → normalisation noire autorisée selon ART1-D1 ;
- transformation visible → avertissement + rendu + acceptation avant BAT ;
- transformation impossible → rejet typé ;
- **aucune bascule automatique vers une autre référence**.

Si une autre référence Plexiglass couleur existe, elle peut éventuellement être proposée comme alternative commerciale ; **son choix appartient au client**.
*Rappel P9 : aucune règle générale ne fait de tout Plexiglass une référence noire ou couleur ; la couleur dépend de la politique d'impression de la référence active et validée.*

**ART1-D6 — Catégories de transformation** :

| Catégorie | Définition | Traitement |
|---|---|---|
| **A** | Préparation purement technique, sans changement perceptible du rendu commercial | Autorisée si **déterministe et non sémantique** ; sans acceptation spécifique (ART1-D8) |
| **B** | Transformation **visible** imposée par la référence / le procédé | Avertissement + rendu normalisé + **acceptation avant BAT** |
| **C** | Transformation susceptible de modifier l'**intention graphique** | Aucune correction silencieuse ; si elle ne peut pas être encadrée par une règle explicite, **aucun traitement automatique n'est inventé** |

Aucun service d'infographie automatique n'est créé.
*Classement des transformations existantes : conversion couleur → monochrome / noir imposée par la référence = catégorie B lorsqu'elle est visible (ART1-D1, D5). Conversion en paths vectoriels sans changement perceptible = catégorie A si déterministe et non sémantique. **À CONFIRMER** : sanitisation SVG ayant un effet visible, conversion raster → bilevel (TroGlass, VR-28), traitement des traits fins sous le seuil (VR-08). Aucune de ces transformations n'est traitée automatiquement en catégorie B ou C sans confirmation.*

**ART1-D7 — `ARTWORK_COLOR_NOT_ALLOWED`** (code conservé) : il ne signifie **pas** simplement « l'artwork contient de la couleur ». Il s'applique lorsque, après application des règles de référence / workflow :
- la transformation nécessaire est impossible ;
- aucune normalisation autorisée ne permet d'obtenir un résultat fabricable ;
- le client refuse une transformation nécessitant son acceptation ;
- ou la politique applicable interdit effectivement le traitement.

**ART1-D8 — Critère opérationnel** : une transformation purement technique et non perceptible peut être effectuée sans acceptation spécifique. Une transformation visible ou susceptible d'affecter le résultat commercial ne doit pas être silencieuse.

**Articulation P11 / P13** : l'acceptation d'une transformation visible a lieu **avant la validation du BAT**. La requête client transmet la référence, le placement et l'artwork original ; le serveur ne corrige aucune donnée de requête (P13). La version normalisée est une représentation serveur distincte, montrée et acceptée, jamais substituée silencieusement à la donnée reçue.

**Changement de règle de normalisation après BAT [G2-D11]** :
- le BAT existant reste inchangé ;
- la nouvelle règle ne remplace pas silencieusement la version normalisée validée ;
- si la nouvelle règle est indispensable à la fabrication : blocage ;
- si le rendu commercial doit changer : nouveau BAT + nouvelle validation client.

## 10. Design Engine

Module pur `src/domain/design/`. Entrées : configuration + catalogue + artwork normalisé (métadonnées). Sorties : `DesignResult { ok, geometry: CanonicalGeometry, warnings[], errors[], effectiveFontSizeMm }`.
- **Mesure texte** : opentype.js sur les fichiers de police embarqués (jamais le DOM). Plus grande taille dans `[min,max]` telle que la ligne tienne dans la **zone utile** = plaque − `safeZoneMm` − keep-out des trous ; sinon `TEXT_TOO_LONG`.
- **Composition** : layouts (1 ligne centrée, 2 lignes, nom + numéro, texte + artwork gauche/droite) ; interligne 1,15–1,3 ; centrage optique dans la zone utile.
- **Artwork** : placement contraint dans la zone utile ; ratio verrouillé ; erreur si chevauchement keep-out ; DPI recalculé ; affecté à `layers.engrave` (monochrome) ou `layers.print` (selon la **politique d'impression de la référence**) **d'après le workflow**, jamais d'après ses couleurs.
- **Zone utile** : plaque − safe zone − keep-out ; recalculée à chaque changement de dimensions.
- **Lisibilité** : taille < `minFontSizeMm` → `BELOW_LEGIBILITY` ; trait < `minStrokeMm` → avertissement / erreur.
- **Normalisation texte** : trim, espaces multiples, NFC, suppression des contrôles ; accents conservés ; glyphes absents → `UNSUPPORTED_GLYPHS`.
- **Arrondi** : fonction unique `roundMm` (3 décimales).

Valeurs initiales : safe zone 2 mm, min capitale 4 mm, trait 0,3 mm — **À VALIDER (VR-08)**, hypothèses de travail tracées par `designRulesVersion`, jamais présentées comme validées (règle complémentaire P11).

## 11. Mounting / Holes Engine — disposition des trous

Module pur `src/domain/mounting/` — géométrie paramétrique ; **pas de positionnement libre type CAO en MVP**.

### 11.1 Comportement UX — FACT (superviseur) / DECISION / RÈGLE P11

| Choix | Mode standard | Mode avancé |
|---|---|---|
| **Aucun** | Aucun trou | — |
| **2 trous** | Deux trous horizontaux, centrés verticalement, symétriques ; saisie d'une **distance au bord** ; second trou calculé | Distances X et Y distinctes ; symétrie obligatoire |
| **4 trous** | Quatre trous symétriques ; une distance au bord ; positions calculées | Distances X et Y ; symétrie obligatoire |

Le diamètre du trou **n'est jamais au choix du client**. Tant qu'un paramètre obligatoire (VR-22 à VR-24) est À VALIDER, les trous sont inactifs.

**RÈGLE NORMATIVE [P11]** : « 3,0 mm est la valeur cible par défaut des trous. Elle n'est retenue que si elle satisfait toutes les contraintes de validité applicables. Dans le cas contraire, le système recherche une valeur supérieure minimale satisfaisant ces contraintes et informe explicitement le client. Si aucune valeur valide n'est disponible, les trous sont indisponibles pour la configuration concernée. Cette règle est déterministe et identique à l'ouverture et lors de tout changement de contexte. »
- **Contraintes de validité** : distance minimale ; marge autour du trou ; taille de la plaque ; géométrie des coins ; autres contraintes atelier validées. **OD-07 ne se lit pas comme « max(3,0 mm ; minimum atelier) ».**
- **Changements de contexte** : ouverture de l'étape ; changement de format, d'épaisseur, de référence ; tout changement susceptible d'affecter la validité. Même configuration ⇒ même résultat, quel que soit le chemin.
- **Toute adaptation est explicitement signalée au client ; aucune correction silencieuse.** Sans valeur valide : trous indisponibles, avec explication compréhensible ; interdiction de forcer ou d'inventer une valeur.
- **Mode avancé [P11 D4]** : même logique de validation pour X et Y ; X = Y n'est pas imposé ; aucune valeur par défaut non définie n'est inventée pour ce mode.
- **Modèle évolutif [P11 D6]** : aujourd'hui, 3,0 mm est le défaut global ; une valeur contextuelle (référence, épaisseur, format ou combinaison) ne deviendra normative qu'après validation atelier / normative.
- **[G.5]** : la détermination du défaut a lieu dans le configurateur avant envoi ; une distance invalide reçue par le serveur est rejetée (§16bis).

### 11.2 Paramètres — À VALIDER (source : catalogue `MountingRules`, §7)
Non confirmés, jamais remplacés par une hypothèse : diamètre exact (VR-22) ; distance minimale au bord (VR-23) ; sémantique de la cote — centre du trou ↔ bord (`edge_to_center`) ou bord du trou ↔ bord (`edge_to_rim`) (VR-24) ; dégagement lié au rayon de coin (VR-24) ; **disposition exacte des 2 trous** (VR-24 — INFERENCE `horizontal_centered`, comportement souhaité par le superviseur, à confirmer par l'atelier) ; contraintes par référence / épaisseur (VR-23). Le moteur est écrit pour **les deux sémantiques**.

### 11.3 Génération (mm, arrondi `roundMm`)
Soit `d` le diamètre résolu, `e` la cote soumise (ou `eX`, `eY`), `c = e` si `edge_to_center`, `c = e + d/2` si `edge_to_rim`.
- `count = 2`, disposition `horizontal_centered` : centres `(cX, H/2)` et `(W − cX, H/2)`.
- `count = 4` : centres `(cX, cY)`, `(W − cX, cY)`, `(cX, H − cY)`, `(W − cX, H − cY)`.
- Mode standard : `eX = eY = e`. Mode avancé : `eX`, `eY`, `symmetry: true` (déverrouillage par trou : FUTURE).
- Validation : `e ≥ minEdgeDistanceMm` ; `c ≥ d/2 + holeKeepOutMarginMm` ; `2·c + d < W` (resp. `H`) ; centre hors de la zone d'arrondi ; pas de 0,1 mm.
- **Recalcul au changement de contexte : règle P11 (§11.1)** — remplace la formulation v1.4 « ramenées au minimum valide avec message ».
- Sortie : `holes[] { cxMm, cyMm, diameterMm }` + `keepOutZones[]` ; **cotations dans la preview uniquement**, jamais dans le fichier machine (§14).

## 12. Preview Engine — déterminisme

Chaîne : **configuration → géométrie canonique → preview**. Trois niveaux : **1. Géométrie canonique OBLIGATOIRE** (identique Node / Chrome / Safari iOS / Firefox, JSON canonique + SHA-256) ; **2. SVG canonique**, objectif fort ; **3. sérialisation brute** = détail. Vérité métier = géométrie déterministe + BAT serveur immuable + artefacts contractuels. Le preview client est indicatif ; à la Vérification, le client valide le **rendu serveur de la version normalisée**.

Le rendu dérive l'apparence de la **référence résolue**, jamais l'inverse :
- gravure laser → texte / artwork dans la **couleur révélée** sur la couleur de surface ;
- impression UV à l'envers → découpe : artwork en noir ou en couleur selon la politique d'impression, sur le support ;
- gravure envers + UV noir → noir sur Gold / Silver, avec la mention « vue face — gravure et impression réalisées à l'envers ». Ce noir est produit par l'impression UV ; il n'est pas une couleur révélée [P5 D2]. La géométrie du preview est en vue face ; le miroir est appliqué par le production engine (§13).

**Spike de déterminisme (Phase 1)** : matrice ≥ 60 configurations, étendue aux 4 workflows, aux dimensions sur mesure et aux orientations de pose (347 × 490 tel quel / 490 × 347 tournée) ; ADR-0005 ; ARCH-PREVIEW ; niveau 1 non atteint = NO-GO. Contenu réservé à la preview : décor matière, ombre, cotations, zone utile, keep-out, poignées, taille réelle.

## 13. Production Engine et `ProductionArtifact`

Module pur `src/domain/production/`. Chaîne : **BAT → workflow figé → artefacts de production**. Le frontend ne génère jamais un fichier machine ; les artefacts dérivent exclusivement de `geometryJson` + spécification résolue du BAT.

```ts
type ProductionArtifact =
  | LaserProductionArtifact  // { kind:'laser', contractId:'PRODUCTION_SVG_CONTRACT_v1', cote, miroir, svg, hash }
  | UVProductionArtifact     // { kind:'uv', contractId:'PRODUCTION_UV_CONTRACT_v1', status, cote, encre, canonicalPrintLayer, payload?, hash }
  | HybridProductionArtifact // { kind:'hybrid', laserArtifact, uvArtifact, metadata } — même BAT, même job
```
`buildArtifacts(bat)` sélectionne les artefacts **à partir du workflow** (jamais de la couleur) :
- `TROLASE_ENGRAVE` / `TROLASE_METALLIC_ENGRAVE` → 1 artefact laser (ENGRAVE + CUT + HOLES ; **CUT toujours présent**, §14.1), côté face.
- `PLEXIGLASS_UV` → 1 artefact UV (encre dérivée de la politique de la référence, côté envers, **miroir X** — D1 étendue, V-3) + 1 artefact laser (CUT + HOLES, côté envers, **miroir none** — V-2 : contour et trous tels que la géométrie canonique) ; ordre de production : impression UV à l'envers en miroir → découpe (§7.2).
- `TROGLASS_METALLIC_HYBRID` → 1 artefact hybride : laser côté envers (ENGRAVE + CUT + HOLES) + UV côté envers, noir uniquement.

**Côté envers et miroir (DECISION v1.4, vocabulaire P6)** : pour le **côté** envers, la géométrie de l'artefact reçoit un **miroir** en X (`x' = W − x`) calculé depuis la géométrie canonique vue face ; transformation pré-appliquée (aucun `transform` résiduel), tracée (`data-side="reverse"`, `data-mirrored="x"`), testée (bbox miroir exact). **VR-35** : confirmer avec l'atelier que le fichier envers attendu est bien avec miroir (et non retourné machine).

**Précision v1.6 (V-2, V-3 — arbitrage Supervisor 14/09/2026)** : le côté et le miroir sont deux informations distinctes ; aucun miroir n'est déduit du seul côté. Pour `PLEXIGLASS_UV`, l'impression UV à l'envers est réalisée en miroir X (D1 étendue) ; la découpe côté envers (face imprimée tournée vers le laser) est une information de fabrication : l'artefact laser porte `data-side="reverse"` et `data-mirrored="none"`, contour et trous inchangés. La règle ci-dessus s'applique inchangée au workflow `TROGLASS_METALLIC_HYBRID`.
**Orientation de pose [P6 D4]** : une orientation de pose tournée n'implique **aucune** transformation du fichier tant que VR-41 n'est pas validée.
**Artwork [ART1-D3, D4]** : les artefacts utilisent la **version normalisée figée au BAT**, jamais l'original client. Aucune transformation modifiant le rendu validé n'est appliquée après BAT ; si elle devient nécessaire : nouveau BAT et nouvelle validation client avant production. Seules les transformations contractuelles sans effet sur le rendu validé (miroir X côté envers, sérialisation) interviennent dans l'artefact.

## 14. Contrats de fichiers de production

**RÈGLE NORMATIVE [P12]** : « La conformité d'un contrat de fichier de production est une condition de sortie de Phase 5. La validation atelier du contrat relève de GATE 4. GATE 4 ne constitue pas une porte d'entrée de phase ; il conditionne l'activation et la mise en production des familles/workflows dépendant du contrat concerné. Son évaluation est contrat par contrat. »
**RÈGLE COMPLÉMENTAIRE [P12]** : « La validation physique du produit relève ultérieurement de GATE 12 et ne doit pas être confondue avec la validation documentaire/atelier du contrat de fichier. »
**Chaîne [P12]** : Spécification → Contrat conforme → Validation atelier (GATE 4) → Activation / production → Validation physique (GATE 12).
**Clarification de lecture (v1.5, P12 inchangé)** :
- **GATE 4** contrôle, contrat par contrat, que les conditions nécessaires à l'activation et à la production des familles / workflows dépendants sont satisfaites, sur la base des validations et preuves applicables.
- La **conformité du contrat à sa spécification** est une condition de sortie de Phase 5 ; elle ne constitue pas à elle seule la définition de GATE 4.
- La **validation atelier** est l'une des preuves applicables ; son moment, ses modalités, ses fichiers et ses preuves relèvent de **VR-42 (ouvert)**. Rien n'est déduit ici sur son calendrier (avant ou pendant la Phase 5, avant ou pendant la pre-beta) ni sur un type de fichier.
- Conformité du contrat ≠ validation atelier ≠ GATE 4.
**VR-42 (À VALIDER)** : moment et modalités de la validation atelier de chaque contrat (fichiers d'essai ? avant ou pendant la pre-beta ? preuves suffisantes ?). **Aucun contrat n'est présenté comme validé par l'atelier tant que VR-42 et la VR de contenu du contrat ne sont pas clôturées.**

| Contrat | Familles / workflows dépendants | Contenu | Validation atelier (preuve applicable pour GATE 4) |
|---|---|---|---|
| `PRODUCTION_SVG_CONTRACT_v1` (laser) | TroLase, TroLase Metallic, Plexiglass (découpe), TroGlass (partie laser) | §14.1 | À VALIDER — VR-20 (contenu), VR-42 (modalités) |
| `PRODUCTION_UV_CONTRACT_v1` (UV) | Plexiglass, TroGlass | À VALIDER — VR-33 | À VALIDER — VR-33, VR-42 |
| `HYBRID_TROGLASS_METALLIC` | TroGlass | §14.3 (structure DECISION) | À VALIDER — VR-33, VR-35, VR-42 |

GATE 4 est évalué **contrat par contrat** ; un contrat UV non validé ne bloque ni TroLase ni TroLase Metallic.

### 14.1 `PRODUCTION_SVG_CONTRACT_v1` — laser (conformité : spécification ci-dessous ; validation atelier : À VALIDER)
Convention **inchangée** pour les workflows laser ; elle n'est pas modifiée pour faire entrer l'UV couleur dans une convention monochrome.
- **Unité** : mm. Racine `<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">`, W/H réelles (standard ou sur mesure), aucune transformation résiduelle.
- **Groupes** (ordre, ids exacts) : `<g id="ENGRAVE">` — `path` `fill="#000000" stroke="none"` (texte en glyphes, artwork vectoriel monochrome ; `image` uniquement si `rasterPolicy` l'autorise), présent si gravure ; `<g id="CUT">` — un `path` contour `fill="none" stroke="#FF0000" stroke-width="0.001pt"`, toujours présent ; `<g id="HOLES">` — `circle` par trou, même style, présent si `count > 0`.
- **Interdictions** : cotations, dimensions visuelles, UI, décor, guides, poignées, textes d'interface, overlays, géométrie non validée, éléments non résolus, `transform`, dépendances externes, `<script>`, `<style>`, `<text>`, couleurs autres que `#000000` / `#FF0000`, `opacity`, `filter`, `mask`, `clipPath`.
- **Traçabilité** (racine) : `data-bat`, `data-bat-hash`, `data-convention="PRODUCTION_SVG_CONTRACT_v1"`, `data-geometry-hash`, `data-catalog-version`, `data-side` (`front`|`reverse`), `data-mirrored` (`none`|`x`), `data-job` (copie du job uniquement). Commentaires `<!-- ENGRAVE -->`, `<!-- CUT -->`, `<!-- HOLES -->`.
- **Déterminisme** : sérialiseur maison, ordre d'attributs fixe, `roundMm`, `\n`, UTF-8 sans BOM, pas de timestamp ; `productionSvg(bat) === productionSvg(bat)` ; hash stocké dans le BAT.
- **Tests de conformité** (`tests/production-svg-contract/`) : dimensions / unités (standard et sur mesure), ENGRAVE, CUT, HOLES, structure, interdictions, traçabilité, déterminisme, régénération depuis `geometryJson`, bbox preview / production, miroir X pour le côté envers.

### 14.2 `PRODUCTION_UV_CONTRACT_v1` — À VALIDER (VR-33, OD-31)
Contrat distinct ; l'UV n'est jamais forcée dans le SVG laser. Défini selon le **véritable format exploitable par l'ArtisJet 3000U** (format, résolution, profil, repères de registration avec la découpe, gestion du blanc, gabarit). **Aucune hypothèse de fichier UV n'est inventée** : tant que le contrat n'est pas défini, `buildArtifacts` produit pour l'impression UV un artefact **`status: 'contract_pending'`** (géométrie canonique de la couche d'impression en mm, couleurs sRGB, encre dérivée) ; le BAT reste valide. **L'activation de Plexiglass et de TroGlass en production est bloquée** jusqu'à la validation atelier du contrat UV (GATE 4, contrat par contrat).

### 14.3 `HYBRID_TROGLASS_METALLIC` — structure DECISION, contenu UV À VALIDER
```
LASER : PRODUCTION_SVG_CONTRACT_v1, côté = envers, miroir = x (ENGRAVE + CUT si nécessaire + HOLES)
UV : PRODUCTION_UV_CONTRACT_v1, côté = envers, encre = noir uniquement, même miroir, même repère
SEQUENCE : gravure laser → découpe laser (si nécessaire) → impression UV
```
Le BAT conserve famille, référence, apparence (surface Gold / Silver, finition, couleur révélée), épaisseur, capacité de gravure (côté), politique d'impression (côté), encre, dimensions, zones machine et orientations de pose, géométrie, artwork, hashes, versions : le workflow est reconstructible sans interprétation humaine. Contrainte serveur : encre = noir uniquement pour TroGlass ; toute demande de couleur → **`INVALID_INK_POLICY`, rejet explicite** (jamais une correction silencieuse, P13).

## 15. BAT

DECISION — Entité serveur **immuable après validation**, mono-marque. Créée par `createBat(configuration)` **uniquement si la requête est conforme au contrat de requête (P13)**, puis après calcul serveur complet (compatibilité sur le workflow complet, résolution de la référence, de l'épaisseur et des dimensions, zones machine, design, trous, artwork selon le mode couleur dérivé, pricing, géométrie, rendu, artefacts). Créée seulement si `Compatibility.ok && Dimensions.ok && Design.ok && Artwork.ok`. Aucune propriété à l'état À VALIDER ne peut figurer dans un BAT (P7).

| Bloc | Champs |
|---|---|
| Identité | `batId`, `contentHash`, `createdAt`, `expiresAt`, `status` |
| Versions | `configurationVersion = 4`, `catalogVersion`, `pricingVersion`, `designRulesVersion`, `engineVersions`, `workflowId` + `workflowVersion`, `productionContractVersion` (par contrat, avec son statut au moment du BAT : conformité ; validation atelier) |
| Spécification résolue | produit ; **famille** ; **référence** (fabricant + code) ; épaisseur (id + mm) ; plaque (W, H, rayon, safe zone, mode de format, formatId?) ; **apparence de la référence** (couleur de surface, finition, couleur révélée — état) ; **capacité de gravure** (côté — état) ; **politique d'impression** (valeur, côté — état) ; **workflow** (opérations, machines, côtés, encre dérivée, séquence) ; **par opération : zone machine retenue + orientation de pose** [P6] ; règles de trous résolues (diamètre, marges, sémantique) ; `artworkRules` |
| Design | texte, police + hash, layout, alignement ; `artwork` (`artworkRef`, `artworkHash`, hash normalisé, mime, placement, mode couleur appliqué) |
| Trous | valeurs soumises, trous résolus (disposition), règles résolues |
| Géométrie | `geometryJson` (plate, safe zone, keep-out, holes, `layers.engrave` / `layers.print`) + `geometryHash` |
| Rendus | `previewSvg` (serveur, validé par le client) ; `artifacts[]` (laser SVG + hash ; UV payload ou `contract_pending` ; hybride) |
| Prix | `priceJson` |
| Confirmations | orthographe, visuel, avertissements acceptés, dont **acceptation des transformations visibles d'artwork (catégorie B, ART1-D1)** ; **procédé affiché et confirmé** (`workflowAcknowledgedAt`) |

**Artwork au BAT [ART1-D3, D4]** : le BAT référence l'**original client** (hash) et la **version normalisée** (hash, rendu) ; le client valide le rendu normalisé, jamais le fichier machine. Toute transformation modifiant le rendu validé après BAT exige un **nouveau BAT et une nouvelle validation client avant production**.
**Stabilité du BAT [G-2]** :
- **G2-D1** — Stabilité objet par objet ; aucun moment unique de stabilisation. Au BAT validé : spécification de plaque, rendu commercial, artwork original + normalisé, référence choisie, prix de la plaque. À la création de la commande : montant de commande. En production : BAT de référence + contrôles de production applicables. **Toute modification demandée après BAT crée une nouvelle décision / configuration et un nouveau BAT.**
- **G2-D3** — Après validation, le BAT est la **base normative stable** de la plaque ; le catalogue actuel ne remplace jamais silencieusement les propriétés validées.
- **G2-D2** — Aucune nouvelle règle, référence, politique, prix ou modification de catalogue ne réécrit un BAT, une commande, une décision ou une preuve existants.
- **G2-D4** — Une évolution du catalogue n'invalide pas automatiquement un BAT. Si elle rend la fabrication effectivement impossible : **BAT inchangé**, blocage, nouvelle décision selon le parcours applicable.
- **G2-D12** — `expiresAt` : **durée d'expiration commerciale À DÉFINIR** (aucune durée n'est fixée). L'expiration commerciale du BAT est distincte de la conservation RGPD ; la purge des BAT orphelins à 30 j (§9.6, §25) **n'est pas** la durée d'expiration commerciale.

Immutabilité par contrainte DB. **La production est dérivée du BAT** ; le BAT permet de reconstruire le workflow sans interprétation humaine, même après changement de catalogue (R29). L'orientation de pose figée est vérifiable grâce à la zone machine enregistrée. Test (spécification) : `buildArtifacts(bat)` régénéré ≡ `artifacts[]` stockés, y compris avec un catalogue muté. Type conceptuel : Annexe A.

## 16. Pricing

`computePrice(config, resolvedSpec, rules): PriceBreakdown` — centimes, serveur = autorité : base produit + référence + épaisseur + dimensions (standard `byFormat` ou sur mesure `customDimensionPricing` : cm² ou paliers — VR-07 / OD-37) + workflow (frais UV, frais hybride) + personnalisation (texte ; `artworkProcessingFee`) + trous + options, × quantité ; paliers vides en MVP ; TVA VR-10 ; livraison au checkout (VR-09). Aucun prix en UI, dans un type ou un email ; `pricingStatus = placeholder` bloque la production.
**RÈGLES [G2-D7] — prix** :
- `computePrice` est exécuté par le serveur à la **création du BAT** ; le **prix commercial de la plaque est figé dans le BAT validé**.
- Le **montant de commande** est fixé **lors de la création de la commande**, à partir des éléments commerciaux validés (BAT) et de la livraison (VR-09).
- Le checkout **ne remplace jamais** silencieusement le prix validé par un prix catalogue plus récent.
- Toute divergence entre montant attendu et montant applicable conduit à un **blocage explicite**, jamais à une correction silencieuse.
- Une évolution du tarif catalogue **ne modifie jamais rétroactivement** le prix d'un BAT existant ; elle s'applique aux nouveaux BAT. **Un prix envoyé par le client est un champ interdit : rejet typé (P13).**

## 16bis. Frontière client / serveur (Trust Boundary)

DECISION (v1.4) — **Toute validation affichée dans le frontend est informative. La seule décision de fabricabilité qui fait autorité est celle du moteur serveur exécuté sur la configuration canonique.** Même principe pour : dimensions, trous, artwork, workflow, compatibilité machine, pricing.

**RÈGLE NORMATIVE [P13]** : « Toute requête reçue par le serveur est validée contre le contrat applicable. Le serveur ne corrige jamais silencieusement les champs reçus. Un champ inconnu, un champ interdit au client ou une saisie invalide/non fabricable entraîne le rejet de la requête avec une erreur typée. »
**RÈGLE COMPLÉMENTAIRE [P13]** : « Cette validation est identique aux frontières de création du BAT et de lancement du paiement, ainsi qu'à toute autre frontière serveur équivalente. »
**Portée [SCOPE-1]** : ces règles s'appliquent aux **contrats d'entrée client**. Les intégrations système-à-système (webhook Stripe) relèvent de leur propre contrat d'intégration (§18) ; une donnée externe n'est jamais interprétée comme une requête client.
**RÈGLE NORMATIVE [G.5 — P11 × P13]** : « Toute adaptation d'une valeur de configuration doit intervenir avant la constitution de la requête soumise au serveur. Le serveur ne substitue jamais silencieusement une autre valeur à celle reçue. »

| Catégorie [P13 D3] | Exemples | Traitement |
|---|---|---|
| 1. Champ inconnu | tout champ absent du contrat de requête | rejet, erreur typée |
| 2. Champ interdit au client | prix, géométrie, workflow, opérations, orientation de pose, zone machine, encre, mode couleur, artefacts, propriétés résolues | rejet, erreur typée ; **jamais** ignoré, remplacé, écrasé ni recalculé silencieusement [P13 D2] |
| 3. Saisie invalide ou non fabricable | dimensions hors zone machine (ex. Plexiglass 500 × 300), distance au bord invalide, référence inactive ou à valider, épaisseur non autorisée, artwork non conforme, encre couleur demandée sur TroGlass (`INVALID_INK_POLICY`) | rejet, erreur typée, avec code de fabricabilité et alternatives éventuelles (Annexe B) |

- Le client n'envoie qu'une configuration (ids + saisies autorisées) et des fichiers.
- **[ART1-D2]** P13 s'applique aux requêtes client et à leurs données contractuelles ; il n'interdit pas par principe la normalisation technique d'un artwork, qui produit une **version normalisée distincte** de l'original conservé (§9.7). Une transformation de contenu n'est jamais présentée comme une correction silencieuse d'une donnée client.
- `createBat`, `startCheckout` et toute frontière serveur équivalente appliquent la même validation ; une requête invalide ne devient pas valide selon le point d'entrée [P13 D4].
- Les dimensions sur mesure sont saisies côté client et validées côté serveur, jamais l'inverse.
- Le même code de domaine tourne des deux côtés pour le retour instantané, mais seule l'exécution serveur produit la spécification résolue, la géométrie canonique, le prix et les artefacts.
- **RÈGLE DE JOURNALISATION [P13 D5]** : « Les violations du contrat de requête peuvent être journalisées comme événements techniques de validation/sécurité, sans présumer d'une intention frauduleuse. » Qualification : « violation du contrat de requête » ; pas de payload complet ni de donnée sensible inutile (§24.9).

## 17. Cart

Client-side (`localStorage` `mpp.cart.v4`), lignes = `{ batId, quantity, summarySnapshot }` : nom ; dimensions (standard ou sur mesure) ; **famille, référence (dont apparence) et épaisseur** ; **procédé en clair** [P3, P9] : « gravure laser » / « impression UV à l'envers → découpe » (suivi de la politique de la référence : « impression noire » ou « impression couleur ») / « gravure envers + UV noir » ; texte ; miniature artwork ; trous au format **« 2 trous à X mm »** [P11 D5] ; prix unitaire ; preview miniature. Vérité = BAT serveur. Modifier une plaque → configurateur pré-rempli → nouveau BAT. Panier vide utile (CTA).
*(v1.4 : « imprimée UV couleur » et « 2 trous à 3,0 mm » — HISTORIQUE, remplacés.)*

## 18. Checkout — pipeline webhook durci (ARCH-0.6)

DECISION — Stripe Checkout hébergé. `startCheckout(cartLines)` : **valide la requête contre son contrat (P13 ; même règle que `createBat`)** ; recharge chaque BAT (rejet inconnu / expiré) ; **vérifie** pour chaque BAT les conditions actuelles d'exécution qui le concernent réellement (référence utilisable, fabricabilité, GATE applicables — G2-D4, D6, D9) **sans modifier le BAT** ; **ne recalcule ni ne remplace le prix de la plaque**, qui est celui du BAT validé (G2-D7) ; toute divergence ou condition non satisfaite ⇒ **blocage explicite**, jamais de correction silencieuse ; calcule la livraison (VR-09) ; crée `orders` en `PENDING_PAYMENT` (numéro `MPP-YYYY-NNNNN`, `expectedAmount` **fixé à la création de la commande à partir des éléments commerciaux validés**, `currency='eur'`) ; crée la session Stripe avec `line_items` **serveur** et `metadata.orderId` ; redirige.

Webhook `POST /api/stripe/webhook` — chaque étape est un garde ; tout échec → log + `ON_HOLD` ou rejet, jamais `PAID` :
```
1. Signature Stripe valide (body brut, secret d'env) → sinon 400, rien n'est écrit
2. Idempotence : event_id absent de stripe_events (INSERT unique) → sinon 200 sans effet
3. Commande existante : metadata.orderId → orders trouvée → sinon alerte, ON_HOLD_UNMATCHED
4. Corrélation : session.id === orders.stripe_session_id ET client_reference_id === orderId → sinon ON_HOLD
5. Devise : session.currency === orders.currency → sinon ON_HOLD
6. Montant : session.amount_total === orders.expectedAmount → sinon ON_HOLD
7. Statut paiement : session.payment_status === 'paid' (et payment_intent.status === 'succeeded' si récupéré) → sinon rien
8. Transaction DB : PENDING_PAYMENT → PAID, paid_at, payment_intent_id ; création production_jobs ; order_events ;
   marquage stripe_events.processed_at ; email confirmation
```
Un événement Stripe « succès » n'est **jamais** suffisant seul. `checkout.session.expired` → `CANCELLED`. Page succès : lecture serveur par `session_id`. Réconciliation quotidienne (runbook).
**Règle [P12 D2]** : aucune commande externe ne peut porter sur une famille dont un contrat requis n'a pas passé GATE 4.
**Fournisseur de paiement — DECISION [SCOPE-1]** : **Stripe est le fournisseur de paiement retenu** ; le compte Stripe professionnel est disponible.
**RÈGLE NORMATIVE [SCOPE-1]** : « La règle de rejet strict de P13 s'applique aux contrats d'entrée client de MaPlaquePro. Les intégrations système-à-système disposent de leur propre contrat d'intégration et de leurs propres règles de validation. Une donnée externe n'est jamais interprétée comme une requête client. Toute transformation d'une donnée externe vers une représentation interne doit être explicitement définie par le contrat d'intégration. »
- `startCheckout` reçoit une **requête client** (P13 s'applique).
- Le webhook Stripe reçoit une **donnée externe** : elle est validée selon le **contrat d'intégration Stripe**, jamais comme une requête client.
- Le pipeline à 8 gardes ci-dessus est le contenu v1.4 conservé. Le détail du contrat d'intégration (événements exacts, champs, signatures, retries, idempotence, statuts, mappings internes) **n'est pas spécifié ici** et relève de la conception ultérieure, sauf ce que v1.4 décide déjà.

## 19. Orders

Statuts et transitions (machine à états en domaine + contrainte DB) :
```
PENDING_PAYMENT → PAID → READY_FOR_PRODUCTION → IN_PRODUCTION → QUALITY_CONTROL → SHIPPED → COMPLETED
PENDING_PAYMENT → CANCELLED
PAID | READY_FOR_PRODUCTION | IN_PRODUCTION → ON_HOLD → READY_FOR_PRODUCTION | REFUNDED
any(after PAID) → REFUNDED (manuel)
```
`PAID → READY_FOR_PRODUCTION` automatique dans le webhook. **[G2-D10]** Une commande payée dont le BAT n'est plus fabricable fait l'objet d'un blocage explicite (BAT conservé, motif tracé, nouvelle décision) ; l'usage de l'état `ON_HOLD` existant pour ce motif est **À CONFIRMER** ; aucune transition vers un remboursement n'est définie ici. `order_events` trace chaque transition. ORDER DATA est distinct de PRODUCTION DATA (§20). Aucun `brand_id` ; schéma conçu pour une migration additive si le gate §21 conclut A, B ou C avec mutualisation.

## 20. Production Jobs

`production_jobs` — **indépendant des données commande** (ne lit que le BAT + jobRef) : `jobRef` (`MPP-2026-00042-1`), `orderId`, `orderLineId`, `batId`, `batHash`, `artifacts[]` (copies figées du BAT : laser SVG avec `data-job`, UV payload ou `contract_pending`, hybride), hashes, `productionContractIds`, `workflowId` + opérations résolues (machine, côté, encre, séquence, **zone machine, orientation de pose**), `specJson` (spécification résolue : produit ; **famille, référence (fabricant, code)** ; épaisseur ; dimensions ; **apparence de la référence (surface, finition, couleur révélée)** ; capacité de gravure (côté) ; politique d'impression (côté) ; encre ; **procédé** ; texte ; artwork ref / hash ; **trous : nombre, mode, valeurs soumises, sémantique, disposition calculée, diamètre résolu** ; quantité ; fixation), `notes`, `status`, horodatages, `operator`, `trackingNumber`.

Dossier atelier (fiche PDF générée depuis `specJson` + SVG) : jobRef + QR ; tableau « quoi / workflow et séquence (machine, côté, encre, zone machine, orientation de pose) / famille et référence / épaisseur / dimensions / personnalisation / trous / fichiers par opération (`jobRef__batId8__hash8__laser.svg`, `…__uv.<ext VR>`) / version BAT » ; preview ; texte en grand ; cotations trous ; cases QC. **Le dossier atelier emploie le même vocabulaire que le catalogue et le BAT [P5 D5].** **Aucune information critique n'est reconstruite manuellement par l'atelier**, y compris le côté, la séquence et l'orientation de pose.

**Fabricabilité avant production [G2-D9, G2-D10]** :
- La stabilité du BAT ne garantit pas les conditions physiques pour toujours : les contrôles nécessaires peuvent être **réévalués avant production**, de manière ciblée (G2-D6).
- Si une condition actuelle empêche la fabrication : **blocage sans modifier le BAT**.
- Jamais de changement silencieux de la référence, des dimensions, du procédé, du workflow, de l'artwork ou du prix.
- **Commande payée** : si le BAT reste fabricable → production ; s'il ne l'est plus → **blocage explicite, BAT conservé, motif tracé, nouvelle décision**. Une commande payée n'est jamais transformée silencieusement pour la rendre fabricable.
- Remboursement, avoir ou annulation : **non définis** dans ce document.
*(v1.4 citait « finition » comme champ autonome : remplacé par l'apparence de la référence, P4 / P5.)*

## 21. Backoffice Gate

FACT (v1.4) — app.glassora existe et gère commandes, BAT, suivi opérationnel et production (superviseur). DECISION — **Ne pas implémenter immédiatement un nouveau backoffice MaPlaquePro.** Aucune décision définitive ni implémentation avant l'audit et le verdict ARCH-BACKOFFICE. Le nom de la marque existante n'apparaît que dans la zone documentaire d'audit (§24.6).

### 21.1 Contrat fonctionnel MaPlaquePro
Voir les commandes payées et leurs lignes ; télécharger le dossier de production (SVG + fiche) ; faire avancer les statuts avec traçabilité ; saisir un suivi et déclencher l'email d'expédition ; notes ; renvoi d'email ; accès authentifié, rôle atelier, audit log.

### 21.2 Workflow obligatoire
1. **Audit réel de app.glassora** (jamais seulement le README) : architecture, frontend, backend / API, DB / migrations, commandes, BAT, fichiers, production, auth / rôles, emails, stockage, tests, intégrations, logique métier, couplages spécifiques, exploitation.
2. **Classification** : `CORE_REUSABLE` · `GLASSORA_SPECIFIC` · `MAPLAQUEPRO_SPECIFIC` · `TECHNICAL_DEBT` · `RISK`.
3. **Trois scénarios** documentés (avantages, inconvénients, coût, dette, risque, migration, impact opérationnel, multi-marques, production, recommandation) : **A** — réutilisation / adaptation de l'existant ; **B** — extraction d'un Atelier Backoffice partagé (core commun + deux marques) ; **C** — backoffice MaPlaquePro séparé (contrat 21.1), avec identification des éléments mutualisables.
4. **Décision ChatGPT** (ARCH-BACKOFFICE).
5. **Seulement ensuite** : architecture puis implémentation (**Phase 7**).

Règles : ne pas choisir B « parce que multi-marque est élégant », ni C « parce que refaire est plus simple » ; pas de multi-marques par anticipation ; **Shared Core activé seulement en B, ou en C avec mutualisation explicitement décidée, avec périmètre déclaré [P2 D2]** ; si migration : état actuel / cible, étapes, DB additive, API versionnée, BAT existants jamais réécrits, numérotation conservée, tests de parité, rollback ; interdiction du couplage par marque (`if (brand === …)`) ; lint `no-brand-branching`. Livrable : `docs/audit/glassora-audit.md` + ADR-0006.

### 21.3 En attendant le verdict
La **Phase 6** crée `orders`, `order_lines`, `order_events`, `production_jobs` (§19–20) — minimum pour vendre et produire, pas un backoffice ; l'atelier reçoit le dossier de production par lien signé temporaire ; aucune UI admin.

## 22. Analytics

DECISION — Événements first-party (`events` : `sessionId` aléatoire en `sessionStorage`, `name`, `props`, `ts`, `path`, `device`) envoyés par `sendBeacon` à `/api/events` (Zod, rate limit, **validation stricte P13**). Funnel figé : `page_view, product_view, configurator_open, configuration_started, option_selected{step,optionId}, thickness_selected, mounting_selected{count}, artwork_uploaded{format,ok}, artwork_rejected{code}, design_warning, design_error, preview_fullscreen, bat_started, bat_validated, add_to_cart, cart_view, checkout_started, purchase (serveur)`.
**CONSENT_REQUIRED_STATUS = À VALIDER** (VR-13). Double mode sans réécriture : `ANALYTICS_CONSENT_MODE = 'exempt' | 'consent'` ; en mode `consent`, aucun événement avant `consent.analytics === true` ; mode `consent` par défaut tant que VR-13 n'est pas résolue. Les événements serveur (`purchase`) ne contiennent aucun identifiant de session.

## 23. SEO / contenu

URL FR : `/`, `/plaque-boite-aux-lettres-personnalisee/`, `/plaque-sur-mesure/` (découpe sur mesure, MVP), `/configurateur/…` (noindex), `/panier/`, `/commande/…` (noindex), `/l-atelier/`, légal. Une page par produit actif. Metadata, JSON-LD (`Product` / `Offer` « à partir de » calculé, `Organization`, `BreadcrumbList`, `FAQPage`), sitemap / robots, staging / beta noindex testés, CWV. **Checkpoint SEO-1 rattaché à la Phase 8 [P1 D3]** ; travaux préparatoires possibles plus tôt, contraintes SEO prises en compte dès la conception.

**Contenu — DECISION (v1.4) + règles P3 / P9** : la découpe sur mesure est communiquée au minimum sur la homepage, la page produit, le configurateur, la FAQ et la page SEO dédiée. Message : **« Votre plaque peut être réalisée aux dimensions dont vous avez besoin, sous réserve des contraintes de fabrication du modèle choisi. »**
- Le contenu présente **quatre familles** et **trois procédés** [P3] ; il ne présente jamais toutes les familles comme un seul procédé, ni deux familles au même procédé comme deux procédés différents :
  - « **TroLase** — plaque bicouche, gravure laser » ;
  - « **TroLase Metallic** — plaque aspect métallique, gravure laser » ;
  - « **Plexiglass** — impression UV à l'envers → découpe » ;
  - « **TroGlass Metallic Gold / Silver** — gravure envers + UV noir ».
- **« Technologie »** : jamais identifiant normatif ; toléré en marketing seulement si le sens est clair [P3 D2].
- **RÈGLE [P9 D4] — promesse couleur** : référence couleur validée et active → promesse couleur autorisée ; référence noir → promesse couleur interdite ; couleur à valider → référence inactive, aucune promesse. « Plexiglass UV couleur » n'est jamais un libellé générique [P9 D3].
- Les libellés viennent de `content/`, pilotés par la famille et la référence, jamais d'un texte générique « plaque personnalisée ».

## 24. Security

1. **Autorité serveur** : prix, compatibilité, design, trous, artwork, géométrie calculés par le serveur dans `createBat` et figés au BAT validé ; `startCheckout` vérifie les conditions actuelles d'exécution sans recalculer ni remplacer les propriétés validées (G-2) ; le client n'envoie qu'une configuration (champs autorisés) et des fichiers ; **toute requête non conforme est rejetée avec erreur typée (P13, §16bis)**.
2. **Webhook** : pipeline §18 ; body brut ; secret d'env ; idempotence.
3. **Upload** : sniffing MIME, limites taille / pixels, décodage en processus borné, SVG par allowlist (seul le SVG normalisé serveur est rendu, re-sanitisé ; XXE et `href` distants rejetés), rate limit 10 uploads / 10 min / IP, antivirus non requis en MVP (fichiers jamais exécutés ni servis tels quels).
4. **Secrets** : env uniquement, validés par Zod ; `.env.example` sans valeur.
5. **Headers** : CSP (`script-src 'self'` + Stripe.js, `frame-src` Stripe, `img-src 'self' data: blob:`), HSTS après HTTPS confirmé, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
6. **Termes interdits — politique de lint (ARCH-0.1 / ARCH-1, arbitrages P2 et P14).**
   Règle métier absolue : dans le **produit**, le verre, le PVC et la découpe métal sont interdits. Le lint (chemins indicatifs v1.4 : `scripts/forbidden-terms.mjs`, config `scripts/forbidden-terms.config.json` ; emplacement définitif relevant de la future architecture) est bloquant en CI ; sa liste de motifs n'est modifiable que par ADR.

   **RÈGLE NORMATIVE [P2 D1] — modèle : 2 zones actives par défaut + 1 Shared Core conditionnelle.** Ne jamais présenter l'ensemble comme simplement « deux zones ».
   - **ZONE STRICTE PRODUIT (active)** — `src/**`, `content/**`, `seeds/**`, `fixtures/**`, `tests/**`, `e2e/**`, `fonts/**`, `public/**`, `emails/**`, `docs/product/**`, `docs/catalog.md`, données de démonstration. Interdits par regex à frontière de mot, insensible à la casse, accents normalisés : `\bpvc\b`, `\bverres?\b`, `\bglass(ware)?\b`, `\bglassora\b`, `\bd[ée]coupe[_ -]?m[ée]tal\b`, `\bmetal[_ -]?cut(ting)?\b`. Scan par mot, jamais par sous-chaîne (`hourglass`, `glassmorphism`, **`TroGlass`** ne matchent pas ; test explicite dans les échantillons du lint).
   - **ZONE DOCUMENTAIRE D'AUDIT (active)** — `docs/audit/**`, `docs/architecture/**` liée à l'audit, `docs/ADR/**` concernant l'audit du backoffice existant, `docs/CHANGELOG.md`, les Master Plans, toute documentation expliquant une contrainte, un rejet ou une décision historique : exclue du lint des termes de marque et de matière ; `pvc` y reste toléré uniquement dans une phrase d'interdiction (vérification en revue).
   - **SHARED CORE (conditionnelle)** — n'existe que si activée par décision explicite de mutualisation (B, ou C avec mutualisation décidée ; P2 D2), avec périmètre déclaré. Interdits dans les identifiants et dépendances : `glassora`, `maplaquepro`, `verre`, `glass`, `plaque` ; aucune dépendance vers un dépôt de marque.

   **RÈGLE NORMATIVE [P2 D3] — classification obligatoire ou exclusion explicite** : tout fichier soumis au lint est **classé dans une zone connue** ou **explicitement exclu du lint avec une justification normative**. **Aucune classification silencieuse par défaut** ; un fichier inconnu ou non classé n'est jamais considéré automatiquement comme zone produit. Un fichier n'appartient qu'à une zone (globs disjoints ; test du lint). Toute nouvelle exception = ADR.

   **RÈGLE NORMATIVE [P14]** : « Le périmètre technique nécessaire à l'implémentation et au test du lint — comprenant le lint lui-même, sa liste normative de motifs interdits et ses échantillons de test — est explicitement exclu du périmètre produit contrôlé par ce lint. Cette exclusion est limitée, justifiée et documentée par ADR. Aucun contenu produit ne peut être introduit dans ce périmètre au titre de l'exclusion. Les tests produit utilisent la source canonique des motifs plutôt que de recopier les termes interdits. »
   - Double documentation : ce Master Plan (règle) **et** un ADR (justification, conséquences) [P14 D2].
   - Périmètre strictement limité à : implémentation du lint ; liste normative des motifs ; échantillons / fixtures de test du lint [P14 D3]. Aucun élargissement implicite.
   - L'exclusion n'est pas une zone et ne crée pas de quatrième zone ; c'est une exception fonctionnelle de P2 D3.
   - Aucune seconde liste normative divergente [P14 D5].

   **RÈGLE COMPLÉMENTAIRE [P14]** : « Aucun terme interdit ne peut être masqué, encodé, fragmenté ou transformé artificiellement dans le but de contourner le lint. »

   **Règles historiques** : la v1.3 décrivait un « lint 2 zones » — HISTORIQUE, non réécrit (P2 D4).

   **Anti-contamination étendue** : une matière ou un processus non validé ne peut pas contaminer la zone produit ; toute référence avec une propriété obligatoire À VALIDER est inactive par construction et absente de l'UI, des fixtures et des seeds (test de schéma).
7. **Rate limits** : `createBat` 30 / 10 min / IP, `startCheckout` 10 / 10 min / IP, upload 10 / 10 min / IP, `/api/events` 120 / min / IP, admin login 5 / h / IP.
8. **Admin** (après gate) : magic link, cookie `Secure HttpOnly SameSite=Lax`, session révocable, audit log.
9. **Logs** structurés, sans données de carte ni fichiers, emails masqués, rétention 30 j. **Violations du contrat de requête** journalisées comme événements techniques de validation / sécurité, sans présumer d'une intention frauduleuse, sans payload complet ni donnée sensible inutile [P13 D5].

## 25. RGPD

Données : commande (identité, adresse, email — 10 ans, obligation comptable), texte gravé et artwork (données personnelles potentielles — rétention §9.6, VR-29), événements analytics (mode consentement §22), BAT orphelins purgés à 30 j (conservation RGPD, distincte de l'expiration commerciale du BAT, À DÉFINIR — G2-D12), uploads orphelins à 24 h, **journaux de violations du contrat de requête (§24.9, minimisés)**. Registre des traitements minimal ; politique de confidentialité ; DPA Stripe / Resend / Hostinger / Sentry ; droits d'accès / suppression par runbook ; artwork original supprimé 30 j après expédition, artwork normalisé et SVG de production conservés avec le dossier (2 ans, VR-29). Aucun cookie non essentiel sans consentement.

## 26. Hosting

FACT (v1.4) : l'hébergement Hostinger actuel (site de l'atelier) est mutualisé Apache / LiteSpeed + PHP + FTP, sans Node. FACT (v1.4) : Hostinger propose Managed Node.js Hosting (plans Business / Cloud, GitHub privé, SSL, env vars, SSR / API routes) et VPS.

DECISION (v1.4) — Cible primaire **Hostinger Managed Node.js Hosting** ; **fallback VPS Hostinger KVM + Docker Compose** (Next standalone + PostgreSQL + Caddy, déploiement GitHub Actions SSH, backups quotidiens). Tranché par le **spike hébergement (Phase 1)** à critères binaires : (1) déploiement depuis dépôt privé ; (2) env vars runtime ; (3) accès base de données ; (4) `POST` raw body reçu (webhook Stripe CLI) ; (5) Node ≥ 20 ; (6) `next/image`/sharp ou repli `unoptimized` ; (7) stockage persistant de fichiers ou BLOB DB suffisant pour les artworks ; (8) SSR p95 < 300 ms ; (9) mémoire suffisante pour décoder un PNG de `maxPixels`. Échec sur 3, 4, 5, 7 ou 9 → VPS. Résultat : ADR-0003. Externes justifiés : Stripe, Resend, Sentry. Pas de Vercel. Hosting exact : OD-11 *(référence v1.4 conservée ; au §33, OD-11 désigne « artwork non fabricable → BAT bloqué » et OD-12 « hosting exact » — écart signalé, **correction À ARBITRER (RÉF-1, §37)**)*. *(v1.4 écrivait « spike Phase 0 » : phase renumérotée, P1.)*

## 27. Database

DECISION (v1.4) — Drizzle ORM ; dialecte tranché par le spike (MySQL / MariaDB au plan managed, ou PostgreSQL sur VPS) — OD-12 ; schéma unique en TS, migrations versionnées (`db:migrate` au déploiement, jamais `push` en prod). Ids ULID, timestamps UTC, montants `int` centimes, JSON pour `geometryJson` / `specJson` / `priceJson`, `TEXT` / `MEDIUMTEXT` pour SVG, BLOB ou `storage_key` pour artworks (OD-13).

Tables : `artworks`, `bat_snapshots`, `orders` (avec `expected_amount`, `currency`, `stripe_session_id` unique, `stripe_payment_intent_id`, `channel_env`, `tester_code`), `order_lines`, `order_events`, `production_jobs` (`bat_hash`, `production_svg_hash`, `production_convention_id`), `stripe_events` (PK `event_id`), `events`, `email_log`, `admin_users/sessions/login_tokens` (après gate). Pas de tables catalogue, pas de `brand_id` / `tenant_id`. `bat_snapshots` : contrainte interdisant tout `UPDATE` hors `order_line_id`, `expires_at`. *(Références v1.4 conservées : « OD-12 » pour le dialecte, « OD-13 » pour le stockage. Au §33, OD-12 = hosting, OD-13 = base de données, OD-14 = stockage — écart signalé, **correction À ARBITRER (RÉF-1, §37)**.)*

## 28. Environments

| Env | SITE_ENV | Index | Stripe | DB | Déploiement | Accès |
|---|---|---|---|---|---|---|
| development | development | — | test | locale Docker | manuel | — |
| staging | staging | noindex + Disallow (testé) | test | staging | auto sur `main` | ouvert (URL non publiée) |
| pre-beta (`channel_env=prebeta`) | prebeta | noindex + Disallow | **test** | production | manuel (tag) | codes d'invitation internes |
| beta | beta | noindex + Disallow | **live** | production | manuel (tag) | codes d'invitation |
| production | production | index + sitemap (testé) | live | production | manuel (tag `vX.Y.Z`) | public |

**Build de production bloqué** si :
- `pricingStatus = placeholder` ;
- `donneesManquantes` non vide ;
- terme interdit en zone stricte ;
- **une famille active dépend d'un contrat de fichier pour lequel GATE 4 n'est pas satisfait (validations et preuves applicables, dont la validation atelier — VR-42)** — évaluation contrat par contrat [P12] (laser pour toute famille qui l'utilise ; UV pour Plexiglass et TroGlass ; hybride pour TroGlass) ;
- une propriété obligatoire À VALIDER sur une référence active ;
- produit hero ≠ active.

Domaine : VR-11.

## 29. Private Beta — séquence (ARCH-0.8 / ARCH-1)

```
QA technique (Phase 8) → QA-1 (GATE 11)
↓
Stripe TEST de bout en bout sur pre-beta (commandes internes, webhook, emails, dossiers)
↓
VALIDATION PHYSIQUE du produit hero (§4.5 volet b) : plaques fabriquées depuis les BAT de pre-beta
(avec trous et artwork), comparées, validées par l'atelier → PRODUCT-1 (b) (GATE 12)
↓
PRE-BETA FREEZE : gel fonctionnel, tag `beta-rc`, re-validation
↓
Stripe LIVE activé (env beta)
↓
15–20 commandes réelles (testeurs invités, chaque plaque contrôlée)
↓
Analyse (funnel, divergences, retours, délais)
↓
Corrections (tag `beta-rcN`, re-test ciblé)
↓
Production publique → BETA-1 (GATE 13) puis RELEASE-1
```
- **Aucune commande externe réelle avant PRODUCT-1 (b)**, ni sur une famille dont un contrat requis n'a pas passé GATE 4 [P12 D2].
- Le **moment** de la validation atelier des contrats par rapport à la pre-beta n'est **pas** fixé : **VR-42 (À VALIDER)**. Aucune hypothèse de séquencement n'est normative [P12 D5].
- Critères de sortie : 0 divergence BAT / plaque non expliquée ; 0 erreur serveur non résolue ; ≥ 15 commandes livrées ; complétion configurateur → BAT > 40 % ; délais tenus ; juridique lu ; Lighthouse ≥ 90 mobile ; **GATE 4 satisfait pour chaque contrat de fichier dont dépend une famille active** ; retours consignés `docs/beta-log.md`.

**Séparation des données** — DECISION : `orders.channel_env: 'test' | 'prebeta' | 'beta' | 'public'` renseigné par l'environnement d'origine (jamais par le client — champ interdit au client, P13) ; `orders.tester_code` nullable ; commandes `test` / `prebeta` exclues des exports comptables et des analytics de conversion ; commandes `beta` réelles et distinguables ; l'environnement `public` ne peut pas créer de commandes `test`. Ce champ est un attribut d'environnement, **pas** un `brand_id` / `tenant_id`.

## 30. QA (spécification des contrôles — aucun test d'implémentation autorisé avant validation v1.5)

| Couche | Contenu | Bloquant |
|---|---|---|
| Domaine | Catalogue (schéma ; propriété obligatoire À VALIDER ⇒ référence inactive ; trois états explicites, jamais d'absence implicite ; exactement quatre `Thickness` ; chaque référence a un workflow, une apparence, une capacité de gravure, une politique d'impression, des `DimensionRules` par épaisseur ; aucune couleur dans une capacité ; aucune apparence déduite d'une capacité) ; configuration v4 (rejet < 4) ; compatibilité sur workflow complet ; pricing (≥ 50 cas) ; design ; canonicalisation / hash | Oui |
| **Fabricabilité / dimensions** | matrice 30.1 ; orientation de pose déterministe (« tel quel » si les deux poses sont valides) ; zone machine et orientation de pose figées dans le BAT | Oui |
| **Trous** | 0/2/4 ; symétrie 0,001 mm ; deux sémantiques ; **règle P11** : 3,0 mm retenu seulement si valide, sinon plus petite valeur supérieure valide signalée, sinon trous indisponibles ; résultat identique à l'ouverture et après tout changement (format, épaisseur, référence) ; X / Y en mode avancé ; aucune valeur inventée ; trous inactifs si VR-22 à VR-24 À VALIDER | Oui |
| **Upload** | SVG valide / invalide ; PNG / JPG selon `rasterPolicy` par workflow ; règles ART-1 (§9.7) : original conservé ≠ version normalisée ≠ fichier machine ; transformation visible (catégorie B) → avertissement + rendu normalisé + acceptation avant BAT ; catégorie A sans acceptation si déterministe et non sémantique ; aucune conversion silencieuse ; Plexiglass noir uniquement selon ART1-D5 (aucune bascule de référence) ; `ARTWORK_COLOR_NOT_ALLOWED` selon ART1-D7 (impossibilité, refus d'acceptation, politique interdisant le traitement) ; transformation modifiant le rendu après BAT → nouveau BAT ; débordement ; keep-out ; remplacement ; persistance BAT ; purge | Oui |
| **Artefacts de production** | Conformité : suite §14.1 (standard et sur mesure, miroir X côté envers) ; sélection des artefacts depuis le workflow ; UV `contract_pending` tant que VR-33 ; hybride : laser envers + UV envers noir, séquence ; régénération ≡ stocké ; aucune transformation de fichier déduite d'une orientation de pose tournée (VR-41) | Oui |
| **Serveur / frontière** | `createBat` et `startCheckout` : **même validation** ; **rejet typé** pour champ inconnu, champ interdit (prix, géométrie, orientation de pose, zone machine, encre…), saisie invalide / non fabricable ; **aucun champ ignoré ni recalculé** ; `INVALID_INK_POLICY` pour TroGlass ; dimensions hors zone machine → rejet ; BAT expiré / dédup ; webhook 8 gardes ; machine à états ; auth ; journalisation neutre des violations | Oui |
| **E2E** | Parcours par famille : TroLase gravé (sur mesure si CR-2 levée) avec trous ; TroLase Metallic idem ; Plexiglass impression UV à l'envers → découpe 347 × 490 avec artwork **pour chaque politique d'impression effectivement active** (parcours couleur **seulement si** une référence couleur est active, P9 D2) ; TroGlass Gold hybride avec artwork noir ; refus visible Plexiglass 500 × 300 avec alternative ; refresh / retour ; Stripe test ; noindex ; clavier ; **le client ne voit jamais de choix d'encre** ; **l'orientation de pose n'est jamais affichée** ; modification du payload client ⇒ rejet serveur | Oui |
| A11y / Perf / Garde-fous | axe, Lighthouse, lint (2 zones actives + Shared Core conditionnelle ; classification ou exclusion explicite ; périmètre technique du lint exclu par ADR ; aucune obfuscation), boundaries, env, placeholders, statuts de contrats (conformité / validation atelier) | Oui / Préprod / Oui |

### 30.1 Matrice normative de fabricabilité (`tests/fabricability/`)

| Cas | Speedy 400 | ArtisJet 3000U | Résultat attendu |
|---|---|---|---|
| TroLase 600 × 400 gravé | ✓ | — | ✓ |
| Plexiglass 347 × 490 | ✓ | ✓ (tel quel) | ✓ |
| Plexiglass 490 × 347 | ✓ | ✓ (tournée) | ✓ |
| Plexiglass 347,1 × 490 | ✓ | ✕ | ❌ `NOT_FABRICABLE` (impression UV) + alternative |
| Plexiglass 347 × 490,1 | ✓ | ✕ | ❌ |
| Plexiglass > 347 × 490 (ex. 500 × 300) | ✓ | ✕ | ❌ + alternative « ≤ 347 × 490 » ou « famille dont le procédé de fabrication est la gravure laser » [P4 D4] (seulement si elle est elle-même fabricable) |
| TroGlass Gold hybride ≤ 347 × 490 | ✓ | ✓ | ✓ |
| TroGlass Gold > 347 × 490 | ✓ | ✕ | ❌ |
| TroGlass Gold, encre couleur demandée | — | — | ❌ `INVALID_INK_POLICY` (rejet explicite, P13) |
| TroGlass Gold UV noir | ✓ | ✓ | ✓ |
| TroLase > 1010 × 610 | ✕ | — | ❌ (Speedy) |
| Toute référence : dimensions < `DimensionRules.min` | — | — | ❌ |
| Carré admissible dans les deux poses (ex. 300 × 300) | ✓ | ✓ | ✓, orientation de pose = **tel quel** (déterminisme P6) |

Chaque ligne existe aussi en 490 × 347 / 347 × 490 ; les valeurs limites (`,1`) sont testées dans les deux orientations de pose.

## 31. Phases d'implémentation (8 phases — structure normative unique)

**RÈGLE NORMATIVE [P1]** : les 8 phases ci-dessous constituent l'unique structure normative. Toute phase dispose d'un identifiant unique, d'un périmètre unique, d'étapes internes éventuellement numérotées (ex. 4.1, 4.2) qui ne sont jamais des phases, et de checkpoints explicitement rattachés. Toute ancienne numérotation de phases (0, 0b, 4b, 9 à 13) est obsolète.

**Modèle G-1 appliqué aux phases** :
- Une **fin de phase** est un critère de sortie ; elle **n'est pas automatiquement un GATE**.
- Un **checkpoint** rattaché à une phase produit une preuve ; il **n'est pas un GATE**.
- Seuls les **GATE 0 à 13** (§36.1) sont des règles de blocage. Chacun ne bloque que **son objet déclaré** ; aucun GATE ne bloque automatiquement une phase entière.
- Les GATE dont l'objet bloqué est l'**entrée dans une phase** ou une **étape de la séquence §29** sont indiqués ci-dessous. Les autres GATE (ex. **GATE 1**, **GATE 4**) portent sur l'activation, la production ou les commandes, **indépendamment des phases**.
- **P1 × P12** : GATE 10 (preuve DA-1) bloque l'**entrée effective en Phase 4** ; GATE 4 bloque, **contrat par contrat**, l'activation, la production réelle et les commandes externes des familles / workflows dépendants. Leurs objets bloqués sont différents : les deux règles coexistent sans contradiction.

Aucune phase ne suppose qu'un contrat UV non défini est disponible : les références UV / hybrides restent inactives tant que GATE 4 n'est pas satisfait pour le contrat UV.

```
ARCH-3 (HISTORIQUE : revue v1.4, conduite par les arbitrages P1–P14)
Validation finale du Master Plan v1.5 par le Supervisor, puis autorisation d'implémentation distincte   ← rien ne démarre avant (G.1)

PHASE 1 Architecture + DA + catalogue conceptuel
  foundation (outillage, CI, lint : 2 zones actives + Shared Core conditionnelle, exclusion ADR du périmètre technique du lint, boundaries),
  spike hébergement (9 critères), DA Master Plan → DA-1,
  catalogue conceptuel (docs/catalog.md : 4 familles, références, workflows, machines, règles, tout À VALIDER),
  questionnaire atelier GATE 1, demande d'accès app.glassora, spike de déterminisme (noyau géométrie)
  → checkpoints : ARCH-1-bis, DA-1, ARCH-PREVIEW, PRODUCT-1 (a)

PHASE 2 Domain model
  références (apparence, capacité de gravure, politique d'impression, trois états) · Thickness · FormatSpec · DimensionRules ·
  ProductionWorkflow · ProductionOperation · MachineCapability · ArtworkRules · MountingRules · ProductionContracts · Configuration v4 · pricing
  → checkpoint : ARCH-2 (partie modèle)

PHASE 3 Géométrie canonique + moteur de compatibilité
  géométrie, dimensions (intersection des zones machine, orientation de pose déterministe), trous (règle P11), design, artwork (règles),
  evaluateFabricability (Annexe B), matrice 30.1 verte
  → checkpoint : ARCH-2 (partie moteur)

PHASE 4 Configurateur + preview
  ▲ ENTRÉE : GATE 10 (DA) doit être satisfait — preuve : checkpoint DA-1 [P1 D2, v1.4 §2bis]
  étapes 1–10 (§8), dimensions standard / sur mesure avec retour par opération, upload (pipeline serveur), preview (§12),
  rendu serveur à la Vérification, design system (tokens validés par DA-1)
  → checkpoints : UX-1, CONFIG-1, ARTWORK-1, UX-2

PHASE 5 BAT + artefacts de production
  bat_snapshots immuable (spécification résolue, workflow figé, zones machine, orientations de pose, hashes), createBat (validation P13),
  artefacts laser / UV (contract_pending) / hybride, miroir X, fiche de production
  → checkpoint : BAT-1 + PROD-SVG-1
  ▼ CRITÈRE DE SORTIE (pas un GATE) : contrats CONFORMES à leur spécification ; validation atelier NON exigée [P12 D4]

PHASE 6 Checkout + orders
  panier, startCheckout (requête client, P13), Stripe Checkout (fournisseur retenu, SCOPE-1), webhook (contrat d'intégration Stripe),
  orders / production_jobs, emails, lien atelier signé
  → checkpoints : CHECKOUT-1 + SEC-1, PROD-1

PHASE 7 Backoffice
  audit app.glassora → classification → scénarios A/B/C → ARCH-BACKOFFICE → implémentation selon verdict
  ▲ L'IMPLÉMENTATION du backoffice est l'objet de GATE 9 (preuve : verdict ARCH-BACKOFFICE) — pas l'entrée en Phase 7 [v1.4 §21.2, §36.1]
  → checkpoints : ARCH-BACKOFFICE, PROD-2

PHASE 8 QA / private beta / production readiness
  analytics double mode, sécurité durcie, observabilité, QA complète (§30), SEO (checkpoint SEO-1 [P1 D3]),
  séquence §29 : QA technique → GATE 11 (preuve QA-1) → pre-beta Stripe test → GATE 12 (preuve PRODUCT-1 (b)) → freeze
  → beta Stripe live 15–20 commandes → analyse → corrections → GATE 13 (preuve BETA-1) → RELEASE-1
  → checkpoints : SEO-1, SEC-2 + PERF-1, QA-1, PRODUCT-1 (b), BETA-1, RELEASE-1

HORS PHASES (activation / production / commandes) :
  GATE 1 — activation de chaque référence (par référence) ;
  GATE 4 — activation, production réelle et commandes externes des familles / workflows dépendant de chaque contrat (contrat par contrat) ;
  GATE 6 — mise en production (grille tarifaire).
```
Ordre justifié (v1.4) : géométrie et moteur (Phase 3) avant le configurateur (Phase 4) ; BAT (Phase 5) avant le commerce (Phase 6) ; backoffice (Phase 7) après l'audit, sans bloquer la vente.

## 32. Checkpoints Opus (supervision ChatGPT)

**Modèle G-1** : un checkpoint **produit ou revoit une preuve**. Il n'est pas un GATE. Le rattachement à une phase est celui du §31 (v1.4, déjà normatif par P1). La dernière colonne renvoie à la table GATE ↔ checkpoint / preuve (§36.1bis) ; « — » signifie qu'**aucun GATE n'est établi**, le checkpoint ne bloque donc rien par lui-même.

| Checkpoint | Phase (§31) | Contrôle (preuve produite) | GATE utilisant cette preuve (§36.1bis) |
|---|---|---|---|
| **ARCH-3** | HISTORIQUE — revue v1.4 (conduite via P1–P14) | Revue du Master Plan v1.4 ; arbitrage des Open Decisions. *Identifiant conservé (P8 D4). La validation finale de v1.5 est une autorisation Supervisor distincte, sans identifiant (CP-1 ouvert).* | GATE 0 — À CONFIRMER |
| **DA-1** | Phase 1 (validée avant l'entrée en Phase 4) | DA Master Plan : identité, différenciation, typo, palette, photo, écrans configurateur (4 familles / 3 procédés), non-généricité | **GATE 10** — directe |
| **ARCH-1-bis** | Phase 1 | Spike hébergement (9 critères), ADR-0003, CI, lint (2 zones actives + Shared Core conditionnelle ; exclusion ADR du lint), accès Glassora | — |
| **ARCH-PREVIEW** | Phase 1 | Niveau 1 géométrie 100 % ; niveau 2 documenté ; causes ; polices ; performance | GATE 3 — documentaire |
| **PRODUCT-1 (a)** | Phase 1 | Références, épaisseurs, apparences, politiques d'impression, tenue extérieure, formats, diamètre trous, marges, fixation | GATE 1 — documentaire |
| **UX-1** | Phase 4 | Primitives, tokens, a11y | — |
| **ARCH-2** | Phase 2 (modèle) / Phase 3 (moteur) | Catalogue par référence, workflows, capacités machine (347 × 490), `DimensionRules`, intersection des zones machine (matrice 30.1), orientation de pose déterministe, pricing, trous (P11), aucune capacité ni référence inventée | — |
| **CONFIG-1** | Phase 4 | Machine à états, filtrage, étape matière (4 familles, procédé affiché, aucune étape finition), dimensions avec retour par opération (orientation de pose non affichée), trous (P11), persistance, aucun choix d'encre | GATE 2 — À CONFIRMER |
| **UX-2** | Phase 4 | Preview, rendu serveur à la Vérification, taille réelle | — |
| **ARTWORK-1** | Phase 4 | Pipeline upload : sécurité, normalisation selon ART-1 (original / normalisé / machine distincts ; catégories A/B/C ; avertissement + acceptation avant BAT), DPI, keep-out, UX, rétention | — |
| **BAT-1 + PROD-SVG-1** | Phase 5 | Snapshot complet (§15) ; contrats séparés laser / UV (`contract_pending`) / hybride ; sélection depuis le workflow ; miroir X ; suite §14.1 verte ⇒ **preuve de conformité des contrats** (critère de sortie de Phase 5) | BAT-1 : GATE 5 — À CONFIRMER ; PROD-SVG-1 : **prérequis** de GATE 4 — directe (P12) |
| **SEO-1** | Phase 8 [P1 D3] | Pages, metadata, contenu 4 familles / 3 procédés, promesse couleur conforme P9 | — |
| **CHECKOUT-1 + SEC-1** | Phase 6 | 8 gardes du webhook testés individuellement (contrat d'intégration Stripe, SCOPE-1) ; validation P13 de `startCheckout` identique à `createBat` ; schéma sans brand_id | CHECKOUT-1 : GATE 7 — documentaire ; SEC-1 : — |
| **PROD-1** | Phase 6 | Dossier dérivé du BAT, vocabulaire canonique, fiche exploitable, aucune UI admin | GATE 8 — documentaire |
| **ARCH-BACKOFFICE** | Phase 7 | Audit réel, classification, A/B/C, Shared Core seulement si mutualisation décidée, migration, absence de couplage | GATE 9 — documentaire |
| **PROD-2** | Phase 7 | Admin conforme au verdict | — |
| **SEC-2 + PERF-1** | Phase 8 | Headers, rate limits, bundle sans secret, consent modes, journalisation neutre, budgets | — |
| **QA-1** | Phase 8 | Matrice §30 verte | **GATE 11** — directe |
| **PRODUCT-1 (b)** | Phase 8 | Plaques physiques vs BAT (couleur Plexiglass conditionnelle, P9) | **GATE 12** — directe |
| **BETA-1** | Phase 8 | Critères §29 | **GATE 13** — directe |
| **RELEASE-1** | Phase 8 | Checklist, légal, prix réels, GATE 4 satisfait pour les contrats des familles actives, monitoring, rollback | — (relation avec GATE 6 : À CONFIRMER) |

### Contrat d'exécution Opus 5 (mis à jour v1.5)
1. Lire ce document ; consigner les ambiguïtés dans `docs/questions.md` avant de coder.
2. Dépôt inspecté : VR-01 clôturée (§0.2). Signaler tout nouvel écart.
3. **Ne rien implémenter avant la validation finale de v1.5 et une autorisation d'implémentation distincte.** Ensuite, implémenter phase par phase ; ne jamais ouvrir une phase avant son critère d'entrée (dont GATE 10 pour la Phase 4) ; respecter les checkpoints ; ne jamais activer, produire ou commander un objet dont le GATE n'est pas satisfait.
4. Ne jamais inventer une capacité atelier, une épaisseur, un diamètre, une marge, une sémantique de cote, une disposition de trous, une politique raster, une politique d'impression, une finition, une convention : toute propriété À VALIDER reste telle quelle et rend la référence inactive. Aucune valeur de fabrication n'est validée avant validation atelier (P11).
5. Ni PVC, ni verre, ni découpe métal dans le produit ; lint §24.6 (P2, P14) jamais assoupli ni élargi sans ADR ; aucune obfuscation.
6. Ne jamais contourner le moteur de compatibilité ni le moteur de trous.
7. Aucun prix, règle de compatibilité, valeur d'épaisseur, diamètre ou marge dans l'UI ni dans un type : ids catalogue en configuration, valeurs résolues dans le BAT.
8. Le frontend n'est jamais source de vérité ni générateur de fichier machine.
9. Un fichier client n'est jamais un fichier machine.
10. Conserver `PRODUCTION_SVG_CONTRACT_v1` tel quel ; ne jamais l'appliquer à l'UV ; ne jamais inventer le contrat UV ; **ne jamais présenter un contrat comme validé par l'atelier tant que la VR de contenu et VR-42 ne sont pas clôturées**.
10bis. Le procédé vient du workflow de la référence, jamais de la couleur ; encre noir uniquement pour TroGlass (contrainte serveur, rejet `INVALID_INK_POLICY`) ; fabricabilité = intersection des zones machine ; orientation de pose déterministe (« tel quel » par défaut) ; sur mesure validé serveur.
11. Pas de `brand_id/store_id/channel_id/tenant_id` avant ARCH-BACKOFFICE ; pas d'UI admin avant ce verdict (GATE 9) ; pas de DA figée avant DA-1 (GATE 10) ; pas de preview réputée acquise avant ARCH-PREVIEW ; produit avant infrastructure.
12. Tester chaque phase ; ne jamais désactiver un test pour avancer.
13. Signaler toute contradiction (contradiction, impact, options, recommandation) et attendre l'arbitrage.
14. Toute dépendance hors §5.4 = ADR.
15. Identifiants de code en anglais, libellés UI en français, aucun secret dans le dépôt.
16. **[P13, SCOPE-1]** Toute frontière d'entrée client rejette avec erreur typée les champs inconnus, les champs interdits et les saisies invalides ; aucune correction silencieuse ; toute adaptation de valeur a lieu avant l'envoi (G.5). Les intégrations externes (Stripe) sont validées selon leur propre contrat d'intégration.
17. **[P10 D4]** Ne jamais utiliser l'ancien code supprimé comme source.
18. **[P7]** Une seule source de vérité par information métier ; chaîne RÉFÉRENCE → BAT → OPÉRATION → ARTWORK.
19. **[G-1]** Un checkpoint n'est jamais traité comme un GATE ; un GATE ne bloque que son objet déclaré ; toute modification affectant l'objet, les prérequis, la preuve ou la condition d'un GATE entraîne sa réévaluation.
20. **[G-2]** Le BAT validé est la base normative stable de la plaque ; aucune évolution (règle, référence, politique, prix, catalogue) ne réécrit un BAT, une commande, une décision ou une preuve existants ; le checkout ne remplace jamais le prix validé ; toute modification après BAT = nouveau BAT ; réévaluation ciblée, jamais une correction ; fabrication impossible ⇒ blocage explicite, BAT conservé ; ne jamais inventer de durée d'expiration ni de mécanisme de versioning.

## 33. Open Decisions (registre, statuts explicites)

Statuts : `DECIDED` · `VALIDATION_REQUIRED` · `INFERENCE` · `BLOCKING` / `NON_BLOCKING`. **RÈGLE [P8 D2]** : OD = décision à prendre ; une OD est liée à zéro, une ou plusieurs VR (table §36.4bis). Identifiants inchangés.

| # | Décision | Statut | Bloquant | Note v1.5 |
|---|---|---|---|---|
| OD-01 | `PRODUCTION_SVG_CONTRACT_v1` (laser) | VALIDATION_REQUIRED (VR-20) | BLOCKING | Conformité en Phase 5 ; validation atelier du contrat : modalités VR-42 (ouvert) ; GATE 4 contrôle, contrat par contrat, les conditions d'activation et de production sur la base des validations et preuves applicables. **GATE 12 porte sur la validation physique des plaques et ne constitue pas une validation du contrat de fabrication** (P12) |
| OD-02 | Activation des références × épaisseurs | VALIDATION_REQUIRED | BLOCKING | Référence par référence (GATE 1) |
| OD-03 | Diamètre du trou | VALIDATION_REQUIRED (VR-22) | BLOCKING | Jamais choix client |
| OD-04 | Sémantique « distance au bord » | VALIDATION_REQUIRED (VR-24) | BLOCKING | Moteur bi-sémantique |
| OD-05 | Marges minimales / safe zone / dégagement d'arrondi | VALIDATION_REQUIRED (VR-23/08) | BLOCKING | Par référence / épaisseur |
| OD-06 | Disposition des 2 trous | INFERENCE + VR-24 | BLOCKING | Terme « orientation » remplacé (P6) |
| OD-07 | Défaut UX 3,0 mm | DECIDED | NON_BLOCKING | **Précisée [P11]** : valeur cible retenue seulement si toutes les contraintes sont satisfaites ; ne se lit pas comme max(3,0 ; minimum) |
| OD-08 | Formats d'upload SVG/PNG/JPG ; PDF hors MVP | DECIDED | NON_BLOCKING | — |
| OD-09 | Traitement SVG client | DECIDED, seuils VR-08 | BLOCKING (seuils) | — |
| OD-10 | `rasterPolicy` gravure (TroLase, TroLase Metallic, TroGlass) | VALIDATION_REQUIRED (VR-28) | NON_BLOCKING | Défaut `reject` |
| OD-11 | Artwork non fabricable → BAT bloqué | DECIDED | — | — |
| OD-12 | Hosting exact | VALIDATION_REQUIRED (spike, VR-30) | BLOCKING | — |
| OD-13 | Base de données | VALIDATION_REQUIRED (VR-30) | BLOCKING | — |
| OD-14 | Stockage artworks | VALIDATION_REQUIRED (VR-30) | BLOCKING | Critère 7 renforcé |
| OD-15 | Analytics consentement | VALIDATION_REQUIRED (VR-13) | NON_BLOCKING | — |
| OD-16 | Backoffice A/B/C | VALIDATION_REQUIRED (audit, VR-18) | BLOCKING **Phase 7** | Phase corrigée (P1) ; objet bloqué : implémentation du backoffice (GATE 9) |
| OD-17 | Déterminisme niveau 2 | VALIDATION_REQUIRED (spike, VR-32) | NON_BLOCKING | Niveau 1 BLOCKING (VR-31) |
| OD-18 | Adhésif | VALIDATION_REQUIRED (VR-05) | NON_BLOCKING | — |
| OD-19 | DA en parallèle de la **Phase 1** | DECIDED | NON_BLOCKING | Phase corrigée (P1) ; GATE 10 (preuve DA-1) bloque l'entrée en Phase 4 |
| OD-20 | Matière de secours | DECIDED (préparer toutes les familles) | NON_BLOCKING | — |
| OD-21 | Épaisseurs 0,8 / 1,6 / 3,0 affectées à TroLase (ex-« Étiquettes ») | INFERENCE → VR (OD-26) | BLOCKING | HISTORIQUE conservé |
| OD-22 | `thicknessId` référentiel | DECIDED | — | — |
| OD-23 | Séparation preview / production | DECIDED | — | — |
| OD-24 | `orders.channel_env` | DECIDED | — | Champ interdit au client (P13) |
| OD-25 | Limites d'upload | INFERENCE | NON_BLOCKING | — |
| OD-26 | Références exactes TroLase | VALIDATION_REQUIRED (VR-03) | BLOCKING | Apparence complète, dont finition (P4, P5) |
| OD-27 | Références exactes TroLase Metallic | VALIDATION_REQUIRED (**VR-37**) | BLOCKING | — |
| OD-28 | Références exactes Plexiglass (apparences de support) | VALIDATION_REQUIRED (**VR-38**) | BLOCKING | — |
| OD-29 | TroGlass Metallic Gold / Silver exacts et épaisseurs | VALIDATION_REQUIRED (**VR-39**) | BLOCKING | — |
| OD-30 | ArtisJet 3000U `printableArea` = 347 × 490 mm | DECIDED | BLOCKING | Orientation de pose tournée 490 × 347 si géométrie / workflow le permettent |
| OD-31 | Format de fichier UV ArtisJet (`PRODUCTION_UV_CONTRACT_v1`) | VALIDATION_REQUIRED (VR-33) | BLOCKING (Plexiglass, TroGlass) | Validation atelier : VR-42 ; blocage : GATE 4 / UV, contrat par contrat |
| OD-32 | **Politique d'impression de chaque référence Plexiglass : noir uniquement ou couleur** | VALIDATION_REQUIRED (**VR-40**) | BLOCKING | **Reformulée [P7 D4, P9]** : « aucune » interdite en MVP ; couleur jamais présumée, promise seulement si validée et active |
| OD-33 | UV noir uniquement TroGlass Metallic | DECIDED | — | Portée par la référence (P7) ; rejet `INVALID_INK_POLICY` |
| OD-34 | Découpe sur mesure MVP | DECIDED | — | Validée serveur, bornes VR-25 |
| OD-35 | Découpe laser des workflows TroLase (mise au format) | DÉCIDÉ — VR-34 close (v1.6) : découpe systématique | Sur mesure TroLase / TroLase Metallic toujours bloqué par CR-2 | CR-2 |
| OD-36 | Miroir X pour le côté envers | DECIDED (structure) / VR-35 | BLOCKING (TroGlass) | Vocabulaire côté / miroir (P6) |
| OD-37 | Méthode de pricing sur mesure | VALIDATION_REQUIRED (VR-07) | BLOCKING | — |
| OD-38 | Forme MVP = rectangle ; `cornerRadius` paramétrique borné | DECIDED / VR-36 | NON_BLOCKING | — |
| OD-39 | Workflow sans contraintes machine (R30) | DECIDED | — | — |
| OD-40 | Frontière de confiance frontend informatif / serveur autorité | DECIDED | — | **Renforcée [P13]** : rejet typé, trois catégories, aucune correction (entrées client ; intégrations externes : SCOPE-1) |

## 34. Risk Register

*(La colonne « GATE n » renvoie aux identifiants historiques GATE 0 à 13 du §36.1. Elle n'a aucun rapport avec des numéros de phase.)*

| # | Risque | Cause | Impact | Mitigation | Test | Owner | GATE n |
|---|---|---|---|---|---|---|---|
| R01 | Déterminisme géométrie non atteint | flottants, métriques, locale | BAT non fiable | `roundMm`, sérialiseur maison, niveau 1 bloquant, rendu serveur validé | spike ≥ 60 cas × 4 runtimes | Opus | GATE 3 |
| R02 | Contrat laser mal compris | statut À VALIDER | fichiers inexploitables | contrat §14.1 conservé ; conformité (Phase 5) ≠ validation atelier (VR-42) ≠ GATE 4 (blocage par contrat) ≠ validation physique (GATE 12) | §14.1 + GATE 12 | Atelier | GATE 4, GATE 12 |
| R03 | Diamètre de trou erroné | VR-22 | vis inadaptées | paramètre catalogue, jamais client, inactif sans valeur | schéma : À VALIDER ⇒ inactif | Atelier | GATE 1 |
| R04 | Distance minimale trous | VR-23 | casse | règle P11 ; validation `c ≥ d/2 + marge` | table de précision | Atelier | GATE 1, GATE 12 |
| R05 | Sémantique de cote | VR-24 | perçage décalé | moteur bi-sémantique, cotation | deux sémantiques | Atelier | GATE 1, GATE 3 |
| R06 | Référence / épaisseur non fabricable | références À VALIDER | vente impossible | états, GATE 1, build bloqué | schéma | Direction | GATE 1 |
| R07 | Raster promis à tort | politique À VALIDER | déception | `rasterPolicy` par workflow, aucune promesse UI | upload par politique | Produit | GATE 1 |
| R08 | Stockage artwork insuffisant | fichiers couleur | perte | spike critère 7 | spike | Opus | — |
| R09 | Sécurité SVG upload | XSS / XXE / DoS | sécurité | allowlist, décodage borné | suite upload | Opus | GATE 11 |
| R10 | BAT mutable / incomplet | schéma | reproduction impossible | contrainte DB, spécification résolue + workflow + zones machine figés | régénération | Opus | GATE 5 |
| R11 | Divergence preview / production | deux rendus | confiance | même géométrie, bbox 0,001, miroir testé | bbox | Opus | GATE 3, GATE 4 |
| R12 | Audit backoffice absent | accès | mauvaise décision | gate §21 | livrable | Direction | GATE 9 |
| R13 | Multi-marques prématuré | anticipation | dette | pas de brand_id, Shared Core seulement sur mutualisation décidée, lint | lint | Opus | GATE 9 |
| R14 | Hébergement inadapté | plan actuel | retard | spike, fallback VPS | spike | Direction | — |
| R15 | Stockage persistant absent | managed | artworks | critère 7 | spike | Opus | — |
| R16 | RGPD | rétention, journaux | juridique | §9.6 / §25, journalisation minimisée | purge | Direction | GATE 13 |
| R17 | Webhook accepté à tort | événement seul | non payé produit | 8 gardes (contrat d'intégration Stripe, SCOPE-1) | par garde | Opus | GATE 7 |
| R18 | Termes interdits / faux positifs / contournement | lint | cohérence | 2 zones actives + Shared Core conditionnelle ; classification ou exclusion explicite ; exclusion ADR du périmètre technique du lint ; aucune obfuscation | self-test du lint | Opus | GATE 11 |
| R19 | Sur-ingénierie | anticipation | retard | matrice §3.3 | revue | ChatGPT | — |
| R20 | Commande externe avant validation | séquence | réputation | §29 ; GATE 4 par contrat ; GATE 12 ; `channel_env` | `channel_env` | Direction | GATE 12, GATE 13 |
| R21 | Prix placeholders | grille VR | financier | build bloqué | build | Direction | GATE 6 |
| R22 | DA provisoire devenue contrainte | tokens en dur | refonte | tokens sémantiques ; GATE 10 (preuve DA-1) avant Phase 4 | revue | DA | GATE 10 |
| R23 | Confusion entre procédés | présentation unique | commande erronée | 4 familles / 3 procédés distincts (P3), BAT explicite | E2E par famille ; BAT contient le workflow | Produit | GATE 2, GATE 5 |
| R24 | Produit découpable mais non imprimable | Speedy > ArtisJet | commande non fabricable | intersection des zones machine | matrice 30.1 | Opus | GATE 2, GATE 4 |
| R25 | Encre couleur proposée ou acceptée sur TroGlass | UI / catalogue / requête | non fabricable | noir uniquement porté par la référence ; aucun sélecteur ; rejet `INVALID_INK_POLICY` | E2E TroGlass | Opus | GATE 2, GATE 5 |
| R26 | Contrat laser utilisé pour l'UV | convention unique | fichier UV inexploitable | contrats séparés, `contract_pending` | sélection par workflow | Opus | GATE 4 |
| R27 | Divergence frontend / serveur | code dupliqué, cache, requête modifiée | BAT non fabricable | même domaine ; serveur autorité ; **rejet typé (P13)** | requêtes non conformes ⇒ rejet | Opus | GATE 5, GATE 7 |
| R28 | Dimensions sur mesure hors contraintes | validation client seule | commande impossible | validation serveur exclusive, intersection | Plexiglass 500 × 300 → rejet typé (422) | Opus | GATE 2, GATE 5 |
| R29 | BAT non reproductible après changement catalogue | ids seuls | production fausse | spécification résolue + versions + zones machine figées | régénération avec catalogue muté | Opus | GATE 5 |
| R30 | Double source de vérité workflow / capacité machine | contraintes dupliquées | incohérence | workflow sans contraintes machine | lint de schéma | Opus | GATE 2 |
| R31 | Miroir côté envers inversé (TroGlass) | VR-35 | plaque illisible | `data-mirrored`, test physique ; côté / miroir ≠ orientation de pose (P6) | bbox miroir | Atelier | GATE 12 |
| R32 | Transformation de fichier déduite d'une orientation de pose tournée | confusion pose / fichier | fichier faux | règle P6 D4 ; VR-41 | aucune transformation sans VR-41 | Atelier | GATE 4 |
| R33 | Contrat présenté comme validé atelier sans preuve | séquencement supposé | production sur fichier non validé | VR-42 ; aucun statut « validé » sans clôture | revue des statuts de contrat | Direction | GATE 4 |

*R32 et R33 : **PROPOSÉS par Opus lors de la consolidation, non arbitrés — À CONFIRMER (RISK-1, §37).** Ils découlent de P6 D4 et P12 D5 mais n'ont pas été décidés comme risques.*
*Colonne « GATE n » : valeurs v1.4 conservées, avec le préfixe « GATE » ajouté (G-1 : toujours distinguer Phase n et GATE n).*

## 35. Changelog

**HISTORIQUE (inchangé)** : **v1.0** → architecture initiale. **v1.1** → Backoffice Gate, DA provisoire, Determinism Spike, Hero Validation Gate, priorité produit. **v1.2** → corrections ARCH-0, épaisseurs, trous, SVG machine, upload, séparation preview / production. **v1.3** → corrections ARCH-1 : lint 2 zones, `thicknessId`, trous VR, raster policy, `PRODUCTION_SVG_CONTRACT v1`, tests déterministes, gate backoffice A/B/C, DA provisoire / validée, registre de décisions, 14 gates. **v1.4** → réconciliation fabrication / catalogue / configurateur (détail : Master Plan v1.4 §35, archive).

**v1.5 — Consolidation normative (BROUILLON)** :
- ajout d'une section gouvernance (§G) et d'un glossaire normatif (§GL) ;
- §0 : clarification datée de l'état du dépôt ; VR-01 clôturée (P10) ;
- structure unique en 8 phases ; DA-1 avant Phase 4 ; SEO-1 Phase 8 (P1) ;
- lint : 2 zones actives + Shared Core conditionnelle ; condition Shared Core corrigée ; classification ou exclusion explicite (P2) ;
- 4 familles / 3 procédés ; « technologie » retiré (P3) ;
- finition = aspect de surface d'une référence ; VR-21 fusionnée ; « finition gravée » supprimée (P4) ;
- apparence de la référence ; couleur révélée propriété de la référence ; trois états ; vocabulaire canonique (P5) ;
- orientation de pose / disposition des trous / côté / miroir / zone machine ; « tel quel » par défaut ; zone machine dans le BAT ; VR-41 (P6, P9) ;
- politique d'impression de la référence ; suppression d'`enabled` ; Plexiglass sans impression interdit en MVP ; chaîne de dérivation (P7) ;
- définitions OD / VR ; VR-37 à VR-40 ; table OD ↔ VR ; §36.5 VR-29 → OD-29 (P8) ;
- Plexiglass = impression UV à l'envers → découpe, couleur conditionnelle ; tests et GATE 12 couleur conditionnels (P9) ;
- défaut des trous 3,0 mm soumis à toutes les contraintes (P11) ;
- conformité de contrat ≠ validation atelier (VR-42) ≠ GATE 4 (règle de blocage par contrat) ≠ validation physique GATE 12 (P12) ;
- rejet typé des requêtes client non conformes ; journalisation neutre (P13) ;
- exclusion ADR du périmètre technique du lint ; obfuscation interdite (P14) ;
- règle de cohérence configurateur / serveur (G.5) ;
- **Stripe fournisseur de paiement retenu ; P13 limité aux entrées client ; intégrations externes régies par leur contrat (SCOPE-1)** ;
- **modèle normatif des GATE : règle de blocage distincte du checkpoint, 8 attributs, blocage limité à l'objet déclaré, réévaluation sur modification, dépendances explicites ; GATE 0 à 13 conservés sans renumérotation ni nouveau GATE ; table GATE ↔ checkpoint / preuve ; GATE 4 contractuel ; GATE 12 réécrit ; réécriture de §31, §32, §36.1 (G-1)** ;
- **transformations d'artwork : trois représentations (original / normalisé / machine), conversion couleur → noir autorisée sous conditions, catégories A/B/C, règle BAT, Plexiglass noir uniquement, définition de `ARTWORK_COLOR_NOT_ALLOWED` ; suppression de « couleur d'origine ignorée » et de « sinon masque noir » (ART-1)** ;
- **stabilité objet par objet (BAT validé, création de commande, production) ; non-rétroactivité ; BAT base normative stable ; prix figé au BAT et montant fixé à la création de la commande, suppression du « recalcul du prix » au checkout ; réévaluation ciblée sans réécriture de l'historique ; commande payée non fabricable bloquée ; changement de normalisation après BAT ; expiration commerciale À DÉFINIR distincte de la conservation RGPD (G-2)** ;
- risques R32, R33 (proposés) ; sujets ouverts §37 ; contrôle croisé §38.

## 36. Livrables d'architecture v1.5

### 36.1 Matrice normative des GATE (modèle G-1)

**RÈGLES [G-1]** :
- Un GATE est une règle normative de blocage, distincte d'un checkpoint. Le checkpoint produit ou revoit une preuve ; le GATE détermine si son objet peut franchir la condition.
- Chaque GATE déclare : identifiant, objet bloqué, portée, condition de satisfaction, preuves attendues, dépendances, déclencheurs de réévaluation, statut.
- **Un GATE ne bloque que son objet explicitement déclaré.** Aucun principe ne fait bloquer automatiquement toute une phase.
- **Toute modification susceptible d'affecter l'objet, les prérequis, la preuve ou la condition d'un GATE entraîne sa réévaluation.** Réévaluation **ciblée** sur les objets réellement affectés, sans réévaluation globale automatique (G2-D6). Elle **ne réécrit jamais l'historique** : l'état historique d'un gate (satisfait à un moment donné, avec sa preuve) est distinct de la **condition actuelle d'exécution** ; un gate historiquement satisfait peut devoir être réévalué avant une nouvelle étape d'exécution (G2-D5). Mécanisme technique non défini.
- Dépendances explicites uniquement.
- Identifiants historiques **GATE 0 à GATE 13** conservés ; aucun renumérotage ; aucun nouveau GATE.
- Une fin de phase n'est pas automatiquement un GATE ; les conditions du §28 ne deviennent pas des GATE.

*Sources des cellules : v1.4 (§2bis, §4.5, §12, §16, §21, §28, §29, §36.1) et arbitrages. Toute cellule non établie par ces sources est marquée **À CONFIRMER** : rien n'est inventé.*

| GATE | Nom (v1.4) | Objet bloqué | Portée | Condition de satisfaction | Preuves attendues | Dépendances (explicites) | Déclencheurs de réévaluation | Statut |
|---|---|---|---|---|---|---|---|---|
| **GATE 0** | Product Scope | **À CONFIRMER** (v1.4 : « Bloquant — », aucun objet établi) | Produit hero — À CONFIRMER | Hero défini : 4 familles, épaisseurs référentielles, rectangle + coins arrondis, sur mesure, impression UV selon la référence, noir uniquement sur TroGlass (v1.4, vocabulaire P3 / P7 / P9) | Décisions de périmètre du Master Plan ; lien avec ARCH-3 : À CONFIRMER | Aucune écrite | Modification du périmètre hero (familles, procédés, sur mesure, politiques d'impression) | DECIDED (v1.4) ; objet et rôle **À CONFIRMER** |
| **GATE 1** | Workshop Validation | **Activation** d'une référence (passage à l'état actif) [v1.4 : « → entités active »] | **Par référence** | Toutes les propriétés obligatoires de la référence validées : référence exacte, épaisseurs, apparence (surface, finition, couleur révélée), capacité de gravure, politique d'impression, workflow (dont découpe TroLase), `DimensionRules`, rayons, trous, `rasterPolicy`, adhésif (v1.4 §4.5 volet a, §36.1) | Clôture des VR concernées (VR-02 à VR-05, VR-22 à VR-25, VR-28, VR-33 pour le format de fichier UV *(volet documentaire / papier, v1.4 §4.5 ; sa validation par l'atelier relève du contrat applicable et donc du périmètre de validation de GATE 4 — aucune fonction contractuelle pour GATE 1)*, VR-34, VR-36, VR-37 à VR-40) ; checkpoint PRODUCT-1 (a) : relation documentaire | Aucune dépendance amont écrite | Modification d'une propriété d'une référence ; nouvelle référence ; nouvelle valeur atelier | VALIDATION_REQUIRED |
| **GATE 2** | Configurator | **À CONFIRMER** (v1.4 : « BLOCKING (exécution) », objet non défini) | À CONFIRMER | Configuration v4 déterministe ; dimensions standard / sur mesure avec retour par opération ; aucun sélecteur d'encre sur TroGlass ; upload par workflow (v1.4) ; aucune étape finition (P4) ; orientation de pose non affichée (P6) ; règle P11 | Checkpoint CONFIG-1 : relation À CONFIRMER | Aucune écrite | Modification du parcours §8, des règles d'upload ou de trous | DECIDED (spec) ; objet **À CONFIRMER** |
| **GATE 3** | Geometry | **À CONFIRMER** (v1.4 §12 : « niveau 1 non atteint = NO-GO », objet du NO-GO non précisé) | À CONFIRMER | Niveau 1 = 100 % ; 4 workflows, sur mesure, orientations de pose (v1.4, vocabulaire P6) | Checkpoint ARCH-PREVIEW : relation documentaire ; VR-31 | Aucune écrite | Modification du moteur de géométrie, des runtimes ciblés, des polices, des workflows | VALIDATION_REQUIRED (spike) ; objet **À CONFIRMER** |
| **GATE 4** | Production artifacts | **Activation, production réelle et commandes externes** des familles / workflows **dépendant du contrat concerné** [P12 D2] ; **jamais** l'entrée dans une phase ; **jamais** un blocage global du produit | **Contractuelle, contrat par contrat** [P12 D3]. Sous-identifiants **documentaires** (pas de nouveaux GATE) : **GATE 4 / laser** (`PRODUCTION_SVG_CONTRACT_v1` → TroLase, TroLase Metallic, découpe Plexiglass, partie laser TroGlass) ; **GATE 4 / UV** (`PRODUCTION_UV_CONTRACT_v1` → Plexiglass, TroGlass) ; **GATE 4 / hybride** (`HYBRID_TROGLASS_METALLIC` → TroGlass) | GATE 4 contrôle, contrat par contrat, que les conditions nécessaires à l'activation et à la production des familles / workflows dépendants sont satisfaites, sur la base des validations et preuves applicables (dont la validation atelier du contrat, P12) ; sélection des artefacts par workflow (v1.4). La conformité du contrat à sa spécification est une condition de sortie de Phase 5 ; elle ne constitue pas à elle seule la définition de GATE 4. Un contrat dont les conditions ne sont pas satisfaites ne bloque que les familles / workflows qui en dépendent | Validation atelier du contrat (modalités : **VR-42, À VALIDER**) ; contenu : VR-20 (laser), VR-33 (UV), VR-35 (miroir côté envers, hybride) | **Prérequis** : conformité du contrat (critère de sortie Phase 5, preuve PROD-SVG-1) [P12 D4] ; GATE 1 pour les références concernées. Lien avec VR-41 : **À CONFIRMER** | Nouvelle version ou modification d'un contrat ; modification d'un workflow ou d'une machine dépendants ; modification de la convention côté envers | VALIDATION_REQUIRED (VR-20, VR-33, VR-35, VR-42) — aucun contrat présenté comme validé |
| **GATE 5** | BAT | **À CONFIRMER** (v1.4 : « BLOCKING (exécution) ») | À CONFIRMER | BAT immuable, spécification résolue + versions, régénérable (v1.4) ; zone machine et orientation de pose par opération (P6) ; aucun À VALIDER dans un BAT (P7) ; création seulement sur requête client conforme (P13) | Checkpoint BAT-1 : relation À CONFIRMER | Aucune écrite | Modification du contenu du BAT, des versions figées ou des moteurs | DECIDED (spec) ; objet **À CONFIRMER** |
| **GATE 6** | Pricing | **Mise en production** [v1.4 §16 : « `pricingStatus = placeholder` bloque la prod » ; §28] | Grille tarifaire — globale | Pricing serveur ; sur mesure, UV, hybride ; `pricingStatus = validated` (v1.4) | Clôture de VR-07 (↔ OD-37) ; `pricingStatus = validated` ; lien avec RELEASE-1 : À CONFIRMER | Aucune écrite | Modification de la grille tarifaire, de la méthode sur mesure ou de la TVA | VALIDATION_REQUIRED (VR-07) |
| **GATE 7** | Checkout | **À CONFIRMER** (v1.4 : « BLOCKING (exécution) ») | À CONFIRMER | 8 gardes (v1.4) ; webhook validé selon le contrat d'intégration Stripe (SCOPE-1) ; `startCheckout` validé comme requête client (P13) | Checkpoint CHECKOUT-1 : relation documentaire | Aucune écrite | Modification du pipeline webhook, du contrat d'intégration Stripe ou de `startCheckout` | DECIDED ; objet **À CONFIRMER** |
| **GATE 8** | Production | **À CONFIRMER** (v1.4 : « BLOCKING (exécution) ») | À CONFIRMER | Job dérivé du BAT, artefacts multiples (v1.4) ; vocabulaire canonique du dossier atelier (P5 D5) | Checkpoint PROD-1 : relation documentaire | Aucune écrite | Modification du dossier de production, des artefacts ou du lien BAT → job | DECIDED ; objet **À CONFIRMER** |
| **GATE 9** | Backoffice | **Implémentation du backoffice** ; ne bloque **pas** la vente [v1.4 §21.2 étape 5, §36.1 « BLOCKING (Phase 7) / NON_BLOCKING (vente) »] | Backoffice | Audit réel + scénarios A/B/C + verdict (v1.4 §21.2) ; Shared Core seulement sur mutualisation décidée (P2 D2) | Verdict ARCH-BACKOFFICE, `docs/audit/glassora-audit.md`, ADR-0006 (v1.4 §21.2) ; clôture VR-18 | Audit (v1.4 §21.2 étapes 1 à 4) | Modification du périmètre backoffice, du scénario retenu ou de la mutualisation | VALIDATION_REQUIRED (VR-18) |
| **GATE 10** | DA | **Entrée effective en Phase 4** [P1 D2] (v1.4 : « BLOCKING (frontend final) ») | Phase 4 | DA Master Plan validé (v1.4) | **Checkpoint DA-1** — relation directe (v1.4 §2bis « GATE 10, checkpoint DA-1 ») ; VR-14 | Aucune écrite | Modification du DA Master Plan ou de son périmètre (dont vocabulaire du glossaire) | VALIDATION_REQUIRED (VR-14) |
| **GATE 11** | QA | **Passage à la pre-beta Stripe test** dans la séquence §29 [v1.4 §29 : « QA-1 (GATE 11) ↓ Stripe TEST… pre-beta »] | Release candidate — globale | Matrice §30 verte (v1.4), avec les contrôles P9 D2, P11, P13, P14 | **Checkpoint QA-1** — relation directe (v1.4 §29) | Aucune écrite en amont | Modification du contenu couvert par la matrice §30 | — (v1.4) |
| **GATE 12** | Physical Validation | **Commande externe réelle** pour la famille concernée [v1.4 §29 : « Aucune commande externe réelle avant PRODUCT-1 (b) »] et **passage au pre-beta freeze** dans la séquence §29 | **Par famille activée** [v1.4 §4.5 volet b] | Validation **physique** par l'atelier : ≥ 3 plaques par famille activée (dont une sur mesure, une avec trous, une avec artwork ; pour TroGlass un hybride), fabriquées depuis des BAT réels de pre-beta, comparées, validées (v1.4 §4.5, §29). **Plexiglass couleur** : exigence applicable **seulement si** une référence Plexiglass à politique d'impression couleur validée est active [P9 D2]. **GATE 12 ne valide pas les contrats de fichier (GATE 4) et n'active aucune famille (GATE 1 / GATE 4)** [P12] | **Checkpoint PRODUCT-1 (b)** — relation directe (v1.4 §29) ; livrable `docs/hero-validation.md` (v1.4 §4.5) | **GATE 4** pour chaque contrat dont dépend la famille (chaîne P12 : validation atelier → activation / production → validation physique) ; **GATE 1** (références actives) ; **GATE 11** (séquence §29) | Nouvelle famille activée ; nouvelle référence Plexiglass couleur active ; modification d'un contrat, d'un workflow ou d'une référence de la famille | VALIDATION_REQUIRED |
| **GATE 13** | Private Beta | **Production publique / release** [v1.4 §36.1 « BLOCKING (release) », §29] | Release — globale | Freeze ; 15–20 commandes réelles ; critères de sortie §29 (v1.4) | **Checkpoint BETA-1** — relation directe (v1.4 §29) ; `docs/beta-log.md` | **GATE 12** (séquence §29) | Corrections post-beta (tags `beta-rcN`, re-test ciblé, v1.4 §29) ; modification des critères §29 | — (v1.4) |

*Changement de rédaction de GATE 12 par rapport à v1.4 : la mention « contrats confirmés » est retirée de la condition. Les conditions contractuelles (validations et preuves applicables) relèvent de GATE 4, dont GATE 12 dépend explicitement (P12). Aucune règle produit nouvelle.*

### 36.1bis Table normative GATE ↔ checkpoint(s) / preuve(s)

**Types de relation** :
- **Directe** : lien écrit explicitement dans v1.4 ou dans un arbitrage.
- **Documentaire** : objets ou contrôles qui se correspondent dans les textes, sans lien écrit.
- **À CONFIRMER** : correspondance insuffisamment établie ; rien n'est présumé.

| Checkpoint / preuve | Preuve fournie | GATE qui utilise la preuve | Relation | Source | Portée de blocage concernée |
|---|---|---|---|---|---|
| DA-1 | DA Master Plan validé | GATE 10 | **Directe** | v1.4 §2bis ; P1 D2 | Entrée effective en Phase 4 |
| QA-1 | Matrice §30 verte | GATE 11 | **Directe** | v1.4 §29 | Passage à la pre-beta (séquence §29) |
| PRODUCT-1 (b) | Plaques physiques validées vs BAT | GATE 12 | **Directe** | v1.4 §29, §4.5 | Commande externe réelle, par famille activée |
| BETA-1 | Critères de sortie §29 | GATE 13 | **Directe** | v1.4 §29 | Release / production publique |
| PROD-SVG-1 | Conformité des contrats (critère de sortie Phase 5) | GATE 4 (**prérequis**, pas satisfaction) | **Directe** | P12 D4, chaîne P12 | Activation / production / commandes des familles dépendantes, par contrat |
| Validation atelier d'un contrat (sans checkpoint) | Contrat exploitable confirmé par l'atelier | GATE 4 | **Directe** | P12 D1–D3 ; modalités VR-42 (À VALIDER) | Idem, contrat par contrat |
| Clôture VR-20 / VR-33 / VR-35 | Contenu des contrats laser / UV / miroir | GATE 4 | **Directe** | v1.4 §36.1 (statut GATE 4) | Idem |
| Clôture des VR de références (VR-02 à VR-05, VR-22 à VR-25, VR-28, VR-33, VR-34, VR-36, VR-37 à VR-40) | Propriétés de référence validées | GATE 1 | **Directe** | v1.4 §4.5 volet a, §36.1 ; P8 | Activation de chaque référence |
| PRODUCT-1 (a) | Revue des références, apparences, politiques, trous, fixation | GATE 1 | **Documentaire** | v1.4 §4.5 « volet a » et §32 « PRODUCT-1 (a) » (sans lien écrit) | Activation de chaque référence |
| Verdict ARCH-BACKOFFICE (+ audit, ADR-0006) | Scénario A/B/C décidé | GATE 9 | **Directe** (verdict → implémentation) / checkpoint **documentaire** | v1.4 §21.2 | Implémentation du backoffice |
| VR-07 clôturée + `pricingStatus = validated` | Grille tarifaire validée | GATE 6 | **Directe** | v1.4 §16, §36.1 | Mise en production |
| ARCH-PREVIEW | Niveau 1 géométrie 100 % | GATE 3 | **Documentaire** | v1.4 §12, §32, §36.1 | Objet de GATE 3 À CONFIRMER |
| CHECKOUT-1 | 8 gardes testés | GATE 7 | **Documentaire** | v1.4 §32, §36.1 | Objet de GATE 7 À CONFIRMER |
| PROD-1 | Dossier dérivé du BAT | GATE 8 | **Documentaire** | v1.4 §32, §36.1 | Objet de GATE 8 À CONFIRMER |
| CONFIG-1 | Configurateur conforme | GATE 2 | **À CONFIRMER** | — | Objet de GATE 2 À CONFIRMER |
| BAT-1 | Snapshot BAT complet | GATE 5 | **À CONFIRMER** | — | Objet de GATE 5 À CONFIRMER |
| ARCH-3 | Revue de périmètre v1.4 | GATE 0 | **À CONFIRMER** | — | Objet de GATE 0 À CONFIRMER |
| RELEASE-1 | Checklist release (prix réels…) | GATE 6 / GATE 13 | **À CONFIRMER** | — | — |
| ARCH-1-bis, UX-1, ARCH-2, UX-2, ARTWORK-1, SEO-1, SEC-1, PROD-2, SEC-2 + PERF-1 | Preuves de phase | **Aucun GATE établi** | — | — | Aucune : ces checkpoints ne bloquent rien par eux-mêmes |

### 36.2 Diff v1.4 → v1.5
Voir le changelog v1.5 (§35) et les rapports de contrôle **CR-019** (consolidation) et **CR-021** (application G-1). Diff v1.3 → v1.4 : HISTORIQUE, Master Plan v1.4 §36.2.

### 36.3 Contradiction Register

**HISTORIQUE v1.4 (CR-1 à CR-12, identifiants inchangés), avec statut v1.5** :

| # | Contradiction (résumé v1.4) | Statut v1.4 | Statut v1.5 |
|---|---|---|---|
| CR-1 | Épaisseurs « Étiquettes » vs TroLase | Résolue | Inchangé |
| CR-2 | Sur mesure TroLase / TroLase Metallic non activé (découpe confirmée, VR-34 close) | Non résolue | **Ouverte** (VR-25, VR-02, GATE 1, conditions commerciales) |
| CR-3 | `full_color` présumé pour tout Plexiglass | Résolue | Renforcée par P7 et P9 |
| CR-4 | Contraintes machine dans le workflow | Résolue | Inchangé |
| CR-5 | Confusion enveloppe mécanique / zone exploitable | Résolue | Vocabulaire « zone machine » (P6) |
| CR-6 | `shape:'rect'` générique | Résolue | Inchangé |
| CR-7 | Alignement gravure / UV envers non spécifiable sans contrat UV | Non résolue | **Ouverte** (VR-33, VR-35, VR-42) |
| CR-8 | Nom du contrat UV | Résolue | Inchangé |
| CR-9 | 13 phases vs 8 phases | Résolue | Renforcée par P1 ; structure réécrite selon G-1 |
| CR-10 | Workflow TroLase Metallic distinct | Résolue | Même procédé, famille distincte (P3 D3) |
| CR-11 | Pricing sur mesure : méthode inconnue | Non résolue | **Ouverte** (OD-37, VR-07) |
| CR-12 | Plexiglass sans gravure / références gravables | Résolue | Inchangé ; capacité de gravure par référence (P5) |

**Contradictions v1.4 traitées en v1.5** : P1 à P14, SCOPE-1, G-1 (voir registre des arbitrages, CR-019, CR-021).

### 36.4 Validation Required Register

**RÈGLE [P8 D2]** : VR = donnée, contrainte ou confirmation à établir ou valider ; pointe vers l'OD concernée lorsqu'une décision normative est nécessaire. Identifiants v1.4 inchangés ; VR-37 à VR-42 nouveaux.

| ID | Question | Pourquoi nécessaire | Impact | Bloquant ? | Statut v1.5 |
|---|---|---|---|---|---|
| VR-01 | Contenu réel du dépôt | Conventions existantes | Phase 1 | Non | **CLÔTURÉE** — « aucune convention à reprendre » (P10, preuve 2026-09-13T19:43:49Z) |
| VR-02 | Formats standard vendus, rayons | Entités `Format` | Étape dimensions | Oui | À VALIDER |
| VR-03 | Références exactes TroLase (codes, apparence, épaisseurs) | Référence TroLase | Activation (GATE 1) | Oui | À VALIDER (↔ OD-26) |
| VR-04 | Tenue extérieure par référence | Promesse boîte aux lettres | Page produit | Oui | À VALIDER |
| VR-05 | Adhésif | Fixation | Étape trous | Non | À VALIDER (↔ OD-18) |
| VR-06 | Ébauches inox / laiton | P1 produit | — | Non | À VALIDER |
| VR-07 | Grille tarifaire (dont sur mesure), TVA | Pricing | Mise en production (GATE 6) | Oui | À VALIDER (↔ OD-37) |
| VR-08 | Polices de gravure, tailles / traits minimaux, safe zone | Design engine | Lisibilité | Oui | À VALIDER |
| VR-09 | Livraison | Checkout | Prix | Oui | À VALIDER |
| VR-10 | Entité vendeuse, légal, Stripe | Vente | Phase 6 | Oui | À VALIDER — *Stripe retenu et compte professionnel disponible (SCOPE-1) ; les autres éléments restent à valider* |
| VR-11 | Domaine | Environnements | Phase 1 | Oui | À VALIDER |
| VR-12 | Rétractation produit personnalisé | CGV | BAT | Oui | À VALIDER |
| VR-13 | Consentement analytics | Mode | Défaut consent | Non | À VALIDER (↔ OD-15) |
| VR-14 | DA Master Plan | Frontend final | GATE 10 (entrée Phase 4) | Oui (frontend) | À VALIDER |
| VR-15 | Photos réelles par famille | Pages | Phase — **rattachement À CONFIRMER** (numérotation de phase de la ligne v1.4 indéterminée) | Non | À VALIDER |
| VR-16 | Plan Hostinger / upgrade | Hosting | Phase 1 | Oui | À VALIDER |
| VR-17 | Motifs | P1 produit | — | Non | À VALIDER |
| VR-18 | Accès app.glassora | Audit | Phase 7 (GATE 9) | Oui (Phase 7) | À VALIDER (↔ OD-16) |
| VR-19 | Existant en production réelle ? | Poids migration | A/B/C | Non | À VALIDER |
| VR-20 | Contenu du contrat laser confirmé | Fichiers laser | GATE 4 / laser | Oui | À VALIDER (↔ OD-01) ; modalités : VR-42 |
| VR-21 | ~~Finitions par variante / épaisseur~~ | — | — | — | **FUSIONNÉE** dans la validation des références (VR-03, VR-37 à VR-39) [P4 D3] ; identifiant conservé, jamais réutilisé |
| VR-22 | Diamètre de trou | Trous | Étape 7 | Oui | À VALIDER (↔ OD-03) |
| VR-23 | Distance minimale, marge trou ↔ gravure, safe zone | Trous / design | Étape 7 | Oui | À VALIDER (↔ OD-05) |
| VR-24 | Sémantique de cote, disposition des 2 trous, dégagement d'arrondi | Trous | Étape 7 | Oui | À VALIDER (↔ OD-04, OD-06) |
| VR-25 | `DimensionRules` par référence × épaisseur ; limites Speedy par matière | Sur mesure | Étape 4 | Oui | **FERMÉE / NORMATIVE** (Supervisor 15/09/2026 ; faits atelier du 15/09/2026) : TroLase et TroLase Metallic 10 × 10 → 594 × 294 mm ; Plexiglass / TroGlass Clear et TroGlass Metallic 10 × 10 → 347 × 490 mm, deux orientations ; toutes épaisseurs ; distinctes des capacités machine ; règles catalogue = couche distincte |
| VR-26 | PDF en upload | Hors MVP | — | Non | À VALIDER |
| VR-27 | DPI minimal raster à la taille posée | Upload | — | Non | À VALIDER |
| VR-28 | `rasterPolicy` gravure | Upload | Défaut reject | Non | À VALIDER (↔ OD-10) |
| VR-29 | Rétention artworks | RGPD | — | Non | À VALIDER — **identité inchangée** (P8 D1) |
| VR-30 | Spike hébergement (OD-12/13/14) | Hosting / DB / stockage | Phase 1 | Oui | À VALIDER |
| VR-31 | Niveau 1 spike géométrie | GATE 3 | — | Oui | À VALIDER |
| VR-32 | Niveau 2 spike | Preview | — | Non | À VALIDER (↔ OD-17) |
| VR-33 | Format / fichier réel de production UV ArtisJet | Artefact UV | GATE 4 / UV ; activation Plexiglass, TroGlass | Oui | À VALIDER (↔ OD-31) ; modalités : VR-42 |
| VR-34 | Mise au format TroLase / TroLase Metallic (découpe) | Sur mesure | Mode sur mesure | Oui (sur mesure) | **VALIDÉE / CLOSE** (v1.6 ; faits atelier Q1–Q4, Q3) (↔ OD-35) |
| VR-35 | Convention du fichier côté envers (miroir X) | Hybride | GATE 4 / hybride ; activation TroGlass | Oui (TroGlass) | À VALIDER (↔ OD-36) |
| VR-36 | Rayons de coin min / max | Forme | Étape 4 | Oui (si rayon exposé) | À VALIDER (↔ OD-38) |
| **VR-37** | Références exactes TroLase Metallic | Référence TroLase Metallic | Activation (GATE 1) | Oui | À VALIDER (↔ OD-27) [P8] |
| **VR-38** | Références exactes Plexiglass (apparences de support) | Référence Plexiglass | Activation (GATE 1) | Oui | À VALIDER (↔ OD-28) [P8] |
| **VR-39** | Références exactes TroGlass Gold / Silver et épaisseurs | Référence TroGlass | Activation (GATE 1) | Oui | À VALIDER (↔ OD-29) [P8] |
| **VR-40** | Politique d'impression de chaque référence Plexiglass (noir uniquement / couleur ; « aucune » exclue en MVP) | Upload, promesse couleur | Activation Plexiglass (GATE 1) ; exigence couleur de GATE 12 | Oui | À VALIDER (↔ OD-32) [P8, P7, P9] |
| **VR-41** | Effet d'une orientation de pose tournée sur les fichiers de production | Fichiers de production | Lien avec GATE 4 : À CONFIRMER | Oui (là où la pose tournée s'applique) | À VALIDER — sans OD [P6 D4, P9] |
| **VR-42** | Moment et modalités de la validation atelier de chaque contrat : fichiers d'essai ? avant la pre-beta ? pendant ? preuves suffisantes ? | GATE 4 | Activation / production | Oui | **À VALIDER** — sans OD ; voisines VR-20, VR-33, VR-35 non fusionnées [P12 D5] |

*v1.4 listait OD-27, OD-28, OD-29 et OD-32 dans ce registre sans identifiant VR : remplacés par VR-37 à VR-40 (P8 D3). La colonne « Impact » reçoit des renvois « GATE n » documentaires ; aucune VR n'est modifiée sur le fond.*

### 36.4bis Table de correspondance OD ↔ VR [P8 D3]

| OD | VR liées |
|---|---|
| OD-01 | VR-20 (+ VR-42 pour les modalités) |
| OD-03 | VR-22 |
| OD-04 | VR-24 |
| OD-05 | VR-23, VR-08 |
| OD-06 | VR-24 |
| OD-09 | VR-08 (seuils) |
| OD-10 | VR-28 |
| OD-12, OD-13, OD-14 | VR-30 |
| OD-15 | VR-13 |
| OD-16 | VR-18 |
| OD-17 | VR-32 |
| OD-18 | VR-05 |
| OD-26 | VR-03 |
| OD-27 | VR-37 |
| OD-28 | VR-38 |
| OD-29 | VR-39 |
| OD-31 | VR-33 (+ VR-42 pour les modalités) |
| OD-32 | VR-40 |
| OD-35 | VR-34 |
| OD-36 | VR-35 |
| OD-37 | VR-07 |
| OD-38 | VR-36 |
| — (sans OD) | VR-41, VR-42 ; et toutes les VR non listées ci-dessus |

*Ajouts de consolidation par rapport à la table du registre : OD-17 ↔ VR-32, OD-01 / OD-31 ↔ VR-42 (modalités). À confirmer (TAB-1).*

### 36.5 Contrôle croisé v1.4 — HISTORIQUE
Remplacé par §38. Correction documentaire [P8 D1] : la ligne TroGlass du contrôle croisé v1.4 citait « VR-29/33/35 » ; la référence correcte est « **OD-29** / VR-33 / VR-35 ».

### 36.6 Statut
**MASTER PLAN v1.5 — VALIDÉ** par le Supervisor (14/09/2026). Implémentation : uniquement selon les autorisations distinctes du Supervisor (première autorisation : Phase 1, étapes 1.1 à 1.3, 14/09/2026).

## 37. Sujets ouverts et points À ARBITRER

| ID | Sujet | Nature | Bloque | État |
|---|---|---|---|---|
| **G-1** | Nature, rôle, nomenclature et numérotation des GATE | **ARBITRÉ et appliqué** (§GL, §2bis, §31, §32, §34, §36.1, §36.1bis) | — | Points documentaires résiduels : **G1-DOC** ci-dessous |
| **G1-DOC** | Objets bloqués non établis par les sources : **GATE 0**, **GATE 2**, **GATE 3**, **GATE 5**, **GATE 7**, **GATE 8** ; correspondances checkpoint ↔ GATE marquées À CONFIRMER (ARCH-3 ↔ GATE 0, CONFIG-1 ↔ GATE 2, BAT-1 ↔ GATE 5, RELEASE-1 ↔ GATE 6 / GATE 13) ; lien VR-41 ↔ GATE 4 | À CONFIRMER (documentaire) | Complétude de la matrice §36.1 | Aucun objet inventé |
| **G-2** | Stabilité des configurations, non-rétroactivité, réévaluation | **ARBITRÉ et appliqué** (§G.6, §GL, §6, §7.1, §9.6, §9.7, §15, §16, §18, §19, §20, §24.1, §25, §32, §36.1, Annexes A et C) | — | Points résiduels : **G2-DOC** ci-dessous |
| **G2-DOC** | (1) Mécanisme technique de versioning / nouvelle version commerciale d'une référence (G2-D8 : « mécanisme futur à définir ») ; (2) durée d'expiration commerciale du BAT (G2-D12 : À DÉFINIR) ; (3) parcours remboursement / avoir / annulation (G2-D10 : hors document) ; (4) usage de l'état `ON_HOLD` pour une commande payée non fabricable ; (5) compatibilité des brouillons et paniers locaux construits sur un état antérieur ; (6) relation entre quantité d'une ligne de panier et prix figé au BAT ; (7) règle « configuration < 4 rejetée » vis-à-vis de futures versions de configuration ; (8) sort d'un **BAT créé mais pas encore validé** ; (9) **livraison** (VR-09) au regard des éléments commerciaux validés et du montant de commande ; (10) **rôle des champs de version hérités de la v1.4** (`catalogVersion`, `pricingVersion`, `designRulesVersion`, `workflowVersion`, `productionContractVersion`…) | À DÉFINIR / À CONFIRMER | Conception ultérieure | Aucun mécanisme, aucune durée, aucun parcours inventés |
| **VR-42** | Moment et modalités de la validation atelier de chaque contrat | À VALIDER (atelier) | GATE 4 | Aucun contrat présenté comme validé |
| **ART-1** | Transformation d'artwork (couleur → noir) au regard de P13 | **ARBITRÉ et appliqué** (§GL, §9.1–§9.7, §13, §15, §16bis, §30, Annexes B et C) | — | Points résiduels : **ART1-DOC** ci-dessous |
| **ART1-DOC** | Catégorie ART-1 (A, B ou C) non établie pour : sanitisation SVG à effet visible ; conversion raster → bilevel (TroGlass, VR-28) ; traits fins sous le seuil (VR-08) | À CONFIRMER | §9.7 | Aucun traitement automatique supposé |
| **SCOPE-1** | Portée de P13 vis-à-vis des intégrations externes | **ARBITRÉ** : Stripe fournisseur retenu ; P13 = entrées client ; webhook Stripe = contrat d'intégration propre ; détail technique non spécifié | — | Intégré (§5.4, §16bis, §18, §G.5) |
| **A-1** | Statut normatif de la notation TypeScript (§6, §13, Annexe A) | À ARBITRER | Réécriture définitive de l'Annexe A | Notation conservée comme **indicative** |
| **R-1** | Repère des zones machine (axe « largeur ») | À ARBITRER | Orientation de pose déterministe (§7.4) | Aucune VR créée ni étendue |
| **RÉF-1** | Références OD vraisemblablement décalées en §26 et §27 | À ARBITRER | Traçabilité | Références v1.4 conservées, écart signalé |
| **RISK-1** | Risques R32, R33 | PROPOSITION — À CONFIRMER | Registre des risques | Marqués « proposés » |
| **CP-1** | Identifiant de la validation finale v1.5 (ARCH-3 conservé comme historique) | À ARBITRER si un identifiant est souhaité | §31, §32 | — |
| **HIST-1** | Notes historiques citant d'anciens numéros de phase | À ARBITRER | Notes | Conservées comme notes HISTORIQUE |
| **TERM-1** | Correspondance « VALIDATION_REQUIRED (v1.4) = état À VALIDER (v1.5) » | À CONFIRMER | §GL | Posée comme correspondance de consolidation |
| **TAB-1** | Liens OD ↔ VR ajoutés en consolidation | À CONFIRMER | §36.4bis | Marqués « à confirmer » |
| VR-15 | Rattachement de phase de la ligne v1.4 | À CONFIRMER | §36.4 | — |
| CR-2 | Sur mesure TroLase | Ouverte / non activée (VR-25, VR-02, GATE 1, conditions commerciales) | Sur mesure TroLase | — |
| CR-7 | Alignement gravure / UV côté envers | Ouverte (VR-33, VR-35, VR-42) | Activation TroGlass | — |
| CR-11 | Pricing sur mesure | Ouverte (OD-37, VR-07) | Mise en production (GATE 6) | — |

## 38. Contrôle croisé v1.5 (brouillon)

| Sujet | Vérification | Résultat |
|---|---|---|
| Phases | 8 phases seules normatives (§31) ; entrée Phase 4 = GATE 10 (preuve DA-1) ; SEO-1 Phase 8 ; sortie Phase 5 = critère de conformité, pas un GATE | Cohérent |
| Gates — modèle | GATE ≠ checkpoint ; 8 attributs déclarés pour GATE 0 à 13 ; blocage limité à l'objet ; réévaluation sur modification ; dépendances explicites | Cohérent ; objets À CONFIRMER pour GATE 0, 2, 3, 5, 7, 8 (**G1-DOC**) |
| Gates — identifiants | GATE 0 à 13 inchangés ; aucun nouveau GATE ; sous-identifiants GATE 4 documentaires ; « Phase n » / « GATE n » toujours préfixés | Cohérent |
| P1 × P12 | GATE 10 → entrée Phase 4 ; GATE 4 → activation / production par contrat ; objets différents | Cohérent |
| GATE 12 | Validation physique seule ; dépend de GATE 4 et GATE 1 ; couleur Plexiglass conditionnelle (P9) | Cohérent |
| Checkpoints | Aucun checkpoint traité comme GATE ; relations directe / documentaire / À CONFIRMER | Cohérent |
| Glossaire | Famille / procédé / workflow / finition / apparence / orientation de pose / zone machine / politique d'impression / GATE / checkpoint définis une fois | Cohérent |
| Familles / procédés | 4 familles, 3 procédés dans §3.1, §4.2, §7.2, §8, §9.4, §17, §23 | Cohérent |
| Finition | Aucune étape finition ; attribut de l'apparence ; « finition gravée » absente | Cohérent |
| Apparence | Couleur révélée dans l'apparence de la référence ; aucune couleur dans une capacité ; noir UV ≠ couleur révélée | Cohérent (Annexe A indicative, A-1) |
| Trois états | Définis §GL ; appliqués à l'apparence, au côté, à la politique d'impression | Cohérent |
| Politique d'impression | Terme unique ; « aucune » interdite pour Plexiglass MVP ; TroGlass noir uniquement ; chaîne de dérivation | Cohérent |
| Couleur Plexiglass | Jamais promise sans référence couleur active validée ; tests / GATE 12 conditionnels | Cohérent |
| Orientation de pose | Déterministe, « tel quel » par défaut, zone machine au BAT, non affichée, sans transformation de fichier (VR-41) | Cohérent ; repère des zones machine **ouvert R-1** |
| Trous | Règle P11 dans §11, §30 ; exemple panier neutre ; OD-07 précisée | Cohérent |
| Frontière client / serveur | Rejet typé, 3 catégories, toutes frontières client ; Annexes B et C sans « ignorés et recalculés » ; G.5 | Cohérent ; intégrations externes régies par leur contrat (SCOPE-1 arbitré) ; normalisation d'artwork encadrée (ART-1 arbitré, ART1-D2) |
| Artwork | Original / normalisé / machine distincts ; conversion couleur → noir seulement si imposée par la référence active et validée ; aucune conversion silencieuse ; acceptation avant BAT pour les transformations visibles ; nouveau BAT si le rendu change après validation ; Plexiglass noir uniquement sans bascule de référence ; `ARTWORK_COLOR_NOT_ALLOWED` défini ; plus de « couleur d'origine ignorée » ni de « sinon masque noir » | Cohérent ; catégories non établies pour certaines transformations : **ART1-DOC** |
| Contrats | Conformité ≠ validation atelier (VR-42) ≠ GATE 4 (blocage par contrat) ≠ validation physique (GATE 12) ; aucun contrat présenté comme validé | Cohérent ; VR-42 ouverte |
| Lint | 2 zones actives + Shared Core conditionnelle ; classification ou exclusion ; exclusion ADR ; aucune obfuscation | Cohérent |
| OD / VR | Définitions ; VR-37 à VR-42 ; VR-01 clôturée ; VR-21 fusionnée ; §36.5 corrigé ; aucun identifiant renuméroté | Cohérent |
| Ancien code | Jamais cité comme source normative | Cohérent |
| Historique | §0.1, §35, §36.3, mentions v1.3 conservés ; v1.4 non modifié | Cohérent |
| Stabilité / non-rétroactivité (G-2) | BAT validé = base stable ; prix figé au BAT, montant fixé à la création de la commande, checkout sans recalcul ni remplacement du prix ; aucune évolution rétroactive ; réévaluation ciblée, historique préservé ; commande payée non fabricable bloquée sans transformation ; changement de normalisation après BAT sans réécriture ; expiration commerciale (À DÉFINIR) ≠ conservation RGPD | Cohérent ; points **G2-DOC** ouverts (mécanisme de versioning, durée d'expiration, remboursement, `ON_HOLD`, brouillons locaux, quantité, versions de configuration) |

**Document validé par le Supervisor (14/09/2026). Les points ouverts listés au §37 (dont A-1, G1-DOC, ART1-DOC, G2-DOC) restent ouverts.**

---

## Annexe A — Modèle conceptuel (notation TypeScript indicative)

> **Statut : INDICATIF.** Les noms techniques ne sont pas normatifs (P5 D5) ; le statut de cette notation est **À ARBITRER (A-1)**. Le vocabulaire métier normatif est celui du §GL. Cette annexe n'est pas une instruction d'implémentation (G.1).

```ts
// ---------- Référentiels ----------
type MachineId = 'SPEEDY_400' | 'ARTISJET_3000U' | 'FIBER_50W' | 'UV_5W'
type ProductionOperationType = 'laser_engrave' | 'laser_cut' | 'uv_print'
type ThicknessId = 'th_0_8' | 'th_1_6' | 'th_3_0' | 'th_5_0'
type MaterialFamily = 'trolase' | 'trolase_metallic' | 'plexiglass' | 'troglass_metallic'   // 4 familles (P3)
type Procede = 'gravure_laser' | 'decoupe_impression_uv' | 'gravure_envers_uv_noir'         // 3 procédés (P3)
type ProductionWorkflowId = 'TROLASE_ENGRAVE' | 'TROLASE_METALLIC_ENGRAVE' | 'PLEXIGLASS_UV' | 'TROGLASS_METALLIC_HYBRID'
type Statut = 'active' | 'validation_required' | 'draft'
type ColorSpec = { name: string; hex: `#${string}` }                                          // la finition n'est plus attachée à une couleur (P5 D3)

// ---------- Trois états normatifs (P5 D4, P7 D3) ----------
type Etat<T> = { etat: 'SANS_OBJET' } | { etat: 'DEFINIE'; valeur: T } | { etat: 'A_VALIDER' }
// Jamais d'absence implicite. Une propriété obligatoire A_VALIDER ⇒ référence non active.

// ---------- Thickness ----------
type Thickness = { id: ThicknessId; mm: number; label: string; statut: Statut }   // exactement quatre entrées

// ---------- Capacité machine (P7 D1) ----------
type ZoneMm = { widthMm: number; heightMm: number }   // repère exact des axes : À ARBITRER (R-1)
type MachineCapability = {
  machineId: MachineId
  operationTypes: ProductionOperationType[]
  printableArea?: ZoneMm          // ArtisJet : 347 × 490 (DECIDED)
  workingArea?: ZoneMm            // Speedy : 1010 × 610 (non universelle)
  orientationDePoseTourneeAutorisee: boolean
  statut: 'validated' | 'validation_required'
}

// ---------- Workflow (aucune contrainte machine — R30) ----------
type ProductionOperation = {
  sequence: number
  type: ProductionOperationType
  machineId: MachineId
  cote: 'face' | 'envers'
  encre?: 'derivee_de_la_politique_d_impression'   // uv_print uniquement ; jamais saisie (P7 D5)
  condition?: 'always' | 'if_geometry_requires' | 'A_VALIDER'   // v1.6 : 'always' pour les découpes TROLASE_ENGRAVE, TROLASE_METALLIC_ENGRAVE, PLEXIGLASS_UV, TROGLASS_METALLIC_HYBRID (VR-34, P3, E-1) ; champ conservé (V-5)
}
type ProductionWorkflow = {
  id: ProductionWorkflowId
  procede: Procede
  version: string
  operations: ProductionOperation[]
  artworkPolicy: ArtworkRules
  contractIds: Array<'PRODUCTION_SVG_CONTRACT_v1' | 'PRODUCTION_UV_CONTRACT_v1' | 'HYBRID_TROGLASS_METALLIC'>
}

// ---------- Apparence, capacité de gravure, politique d'impression (P4, P5, P7) ----------
type Finition = string                                   // valeurs atelier À VALIDER ; aucune valeur présumée
type ApparenceReference = {
  couleurSurface: Etat<ColorSpec>
  finition: Etat<Finition>                               // aspect de surface de la référence (P4)
  couleurRevelee: Etat<ColorSpec>                        // propriété de la référence (P5 D2)
}
type CapaciteGravure = { cote: Etat<'face' | 'envers'> } // SANS_OBJET ⇔ non gravable ; aucune couleur ; pas d'« enabled » (P7 D2)
type PolitiqueImpression = {
  valeur: Etat<'aucune' | 'noir_uniquement' | 'couleur'>
  cote: Etat<'face' | 'envers'>                          // SANS_OBJET si valeur = aucune
}

// ---------- Format & dimensions ----------
type FormatId = string
type FormatSpec =
  | { mode: 'standard'; formatId: FormatId }
  | { mode: 'custom'; widthMm: number; heightMm: number; cornerRadiusMm?: number }
type DimensionRules = {
  id: string; variantId: MaterialVariantId; thicknessId: ThicknessId
  minWidthMm: Etat<number>; maxWidthMm: Etat<number>
  minHeightMm: Etat<number>; maxHeightMm: Etat<number>
  minAreaMm2?: Etat<number>; maxAreaMm2?: Etat<number>
  minCornerRadiusMm?: Etat<number>; maxCornerRadiusMm?: Etat<number>
  statut: Statut
}

// ---------- Trous (disposition des trous — P6, P11) ----------
type MountingRules = {
  id: string
  allowedCounts: Array<0 | 2 | 4>
  defaultEdgeDistanceTargetMm: 3.0       // valeur CIBLE UX globale (P11) ; retenue seulement si toutes les contraintes sont satisfaites
  decimals: 1
  holeDiameterMm: Etat<number>           // jamais choix client
  minEdgeDistanceMm: Etat<number>
  holeKeepOutMarginMm: Etat<number>
  edgeDistanceSemantics: Etat<'edge_to_center' | 'edge_to_rim'>
  twoHolesDisposition: Etat<'horizontal_centered'>   // INFERENCE à confirmer (VR-24)
  cornerRadiusClearanceMm: Etat<number>
  overrides?: Array<{ variantId?: MaterialVariantId; thicknessId?: ThicknessId } & Partial<Omit<MountingRules, 'id' | 'overrides'>>>
  // overrides contextuels du défaut : seulement sur donnée atelier validée (P11 D6)
  statut: Statut
}
type MountingPattern =
  | { count: 0 }
  | { count: 2 | 4; mode: 'standard'; edgeDistanceMm: number }
  | { count: 2 | 4; mode: 'advanced'; edgeDistanceXMm: number; edgeDistanceYMm: number; symmetry: true }

// ---------- Artwork ----------
type ArtworkRules = {
  id: string
  formats: Array<'svg' | 'png' | 'jpeg'>
  maxBytes: number; maxPixels: number
  minDpiAtPlacedSize: Etat<number>
  minLineWidthMm: Etat<number>
  modeCouleur: 'monochrome' | 'noir_uniquement' | 'selon_politique_impression_reference'   // dérivé (P7 D5)
  rasterPolicy: Etat<'reject' | 'accept_bilevel' | 'accept_grayscale' | 'accept_color'>
  statut: Statut
}
type ArtworkPlacement = { artworkRef: string; xMm: number; yMm: number; widthMm: number; heightMm: number; rotationDeg: 0 | 90 | 180 | 270 }

// ---------- Référence (unité de vente) ----------
type MaterialVariantId = string
type MaterialVariant = {
  id: MaterialVariantId
  manufacturer: Etat<string>
  reference: Etat<string>
  family: MaterialFamily
  label: string
  thicknessIds: ThicknessId[]
  apparence: ApparenceReference
  capaciteGravure: CapaciteGravure
  politiqueImpression: PolitiqueImpression
  productionWorkflowId: ProductionWorkflowId
  dimensionRulesIds: string[]
  mountingRulesId: string
  artworkRulesId: string
  outdoorStatus: Etat<'outdoor' | 'indoor'>
  swatch: { surface: string; reveal?: string }
  statut: Statut
}
// Invariants (spécification) :
// trolase | trolase_metallic ⇒ procédé gravure_laser ; politiqueImpression.valeur = DEFINIE('aucune') ;
//   capaciteGravure.cote = DEFINIE('face') ; apparence.couleurRevelee = DEFINIE(...) pour être active
// plexiglass ⇒ workflow PLEXIGLASS_UV ; politiqueImpression.valeur ∈ { DEFINIE('noir_uniquement'), DEFINIE('couleur'), A_VALIDER } ;
//   jamais 'aucune' en MVP (P7 D4) ; apparence.couleurRevelee = SANS_OBJET dans le workflow MVP
// troglass_metallic ⇒ workflow TROGLASS_METALLIC_HYBRID ; politiqueImpression.valeur = DEFINIE('noir_uniquement') ;
//   capaciteGravure.cote = politiqueImpression.cote = DEFINIE('envers') ; le noir UV n'est jamais une couleurRevelee
// statut = 'active' impossible si une propriété obligatoire est A_VALIDER ; thicknessIds ⊆ épaisseurs de la famille
// aucune propriété d'apparence n'est déduite d'une capacité (P5)

// ---------- Configuration client (champs autorisés uniquement — P13) ----------
type Configuration = {
  configurationVersion: 4                // compatibilité de futures versions : non définie (G2-DOC)
  productId: string
  materialVariantId: MaterialVariantId
  thicknessId: ThicknessId
  format: FormatSpec
  design: { text: TextSpec | null; artwork: ArtworkPlacement | null }
  mounting: MountingPattern
  quantity: number
}

// ---------- Artefacts de production ----------
type LaserProductionArtifact = { kind: 'laser'; contractId: 'PRODUCTION_SVG_CONTRACT_v1'; cote: 'face' | 'envers'; miroir: 'none' | 'x'; svg: string; hash: string }
type UVProductionArtifact = { kind: 'uv'; contractId: 'PRODUCTION_UV_CONTRACT_v1'; status: 'contract_defined' | 'contract_pending'; cote: 'face' | 'envers'; encre: 'noir_uniquement' | 'couleur'; canonicalPrintLayer: PrintLayerGeometry; payload?: unknown /* format VR-33 */; hash: string }
type HybridProductionMetadata = { sequence: ProductionOperation[]; registration: Etat<'shared_origin_mirrored_x'>; batId: string; jobRef?: string }
type HybridProductionArtifact = { kind: 'hybrid'; contractId: 'HYBRID_TROGLASS_METALLIC'; laserArtifact: LaserProductionArtifact; uvArtifact: UVProductionArtifact; metadata: HybridProductionMetadata }
type ProductionArtifact = LaserProductionArtifact | UVProductionArtifact | HybridProductionArtifact

// ---------- Statut d'un contrat (P12) ----------
type StatutContrat = {
  contractId: string
  conformite: 'conforme' | 'non_conforme'          // condition de sortie de la Phase 5
  validationAtelier: Etat<'validee'>                // GATE 4, contrat par contrat ; modalités VR-42 ; jamais DEFINIE sans preuve
}

// ---------- BAT ----------
type BAT = {
  batId: string; contentHash: string; createdAt: string; expiresAt: string; status: 'validated'
  // expiresAt = expiration commerciale : durée À DÉFINIR (G2-D12), distincte de la conservation RGPD
  // BAT validé = base normative stable (G2-D3) ; jamais réécrit par une évolution ultérieure (G2-D2)
  configurationVersion: 4; catalogVersion: string; pricingVersion: string; designRulesVersion: string
  workflowId: ProductionWorkflowId; workflowVersion: string; procede: Procede
  productionContracts: StatutContrat[]              // statuts au moment du BAT
  engineVersions: { design: string; mounting: string; geometry: string; render: string; production: string }
  material: { family: MaterialFamily; variantId: MaterialVariantId; manufacturer: string; materialReference: string }
  thicknessId: ThicknessId; thicknessMm: number
  apparence: ApparenceReference                     // aucun A_VALIDER possible dans un BAT (P7)
  capaciteGravure: CapaciteGravure
  politiqueImpression: PolitiqueImpression
  dimensions: { widthMm: number; heightMm: number; cornerRadiusMm: number; formatMode: 'standard' | 'custom'; formatId?: FormatId }
  posesParOperation: Array<{ operationSequence: number; machineId: MachineId; zoneMachine: ZoneMm; orientationDePose: 'tel_quel' | 'tournee' }>  // P6
  geometry: CanonicalGeometry; geometryHash: string
  holes: { pattern: MountingPattern; resolved: Array<{ cxMm: number; cyMm: number; diameterMm: number }>; rules: Pick<MountingRules, 'holeDiameterMm' | 'minEdgeDistanceMm' | 'holeKeepOutMarginMm' | 'edgeDistanceSemantics'> }
  artwork: { artworkRef: string; artworkHash: string; normalizedHash: string; mime: string; placement: ArtworkPlacement; modeCouleurApplique: ArtworkRules['modeCouleur'] } | null
  text: TextSpec & { fontHash: string; effectiveFontSizeMm: number } | null
  previewSvg: string
  artifacts: ProductionArtifact[]
  price: PriceBreakdown
  confirmations: { spellCheckConfirmedAt?: string; artworkConfirmedAt?: string; workflowAcknowledgedAt: string; warningsAcknowledged: string[] }
}
// Immuable après validation ; la production dérive du BAT ; reconstruction du workflow sans interprétation humaine.
```

## Annexe B — Compatibility / Fabricability Engine

Fonction pure serveur `evaluateFabricability(config, catalog): FabricabilityResult`, exécutée aussi côté client à titre **informatif** (§16bis). **Étape 0 obligatoire côté serveur : validation du contrat de requête (P13).**

```
0. VALIDER LA REQUÊTE (serveur, toutes frontières — P13)
   champ inconnu ⇒ REJET typé ; champ interdit au client (prix, géométrie, workflow, orientation de pose, zone machine,
   encre, mode couleur, artefacts…) ⇒ REJET typé ; aucun champ ignoré, remplacé, écrasé ni recalculé
1. RÉSOUDRE LE CATALOGUE
   référence = catalog.variants[config.materialVariantId] → absente / inactive ⇒ NOT_FABRICABLE(INVALID_VARIANT)
   épaisseur ∉ référence.thicknessIds ⇒ NOT_FABRICABLE(INVALID_THICKNESS)
   règles = { dimension : référence × épaisseur, trous : référence.mountingRulesId (+ overrides validés), artwork : référence.artworkRulesId }
   propriété obligatoire A_VALIDER rencontrée ⇒ NOT_FABRICABLE(VALIDATION_REQUIRED, champ)   // jamais d'hypothèse
2. RÉSOUDRE LE WORKFLOW
   workflow = catalog.workflows[référence.productionWorkflowId] ; ops triées par sequence
   encre de chaque impression UV ← dérivée de référence.politiqueImpression (P7 D5)
   opérations conditionnelles : 'if_geometry_requires' évaluée à l'étape 3 ; A_VALIDER ⇒ si l'opération est requise ⇒ NOT_FABRICABLE(VALIDATION_REQUIRED)
   invariants : troglass_metallic ⇒ politique = noir_uniquement ; politique = aucune ⇒ aucune op uv_print (familles gravure laser) ;
               plexiglass ⇒ politique ≠ aucune (P7 D4)
   demande d'encre couleur sur TroGlass ⇒ REJET typé INVALID_INK_POLICY (explicite, jamais corrigé)
3. RÉSOUDRE LA GÉOMÉTRIE
   (W, H, r) = format standard | sur mesure (valeurs reçues, jamais modifiées) ; plaque, safe zone, zone utile → géométrie partielle (roundMm)
4. ÉVALUER LES OPÉRATIONS
   pour chaque op : machine validée et op.type ∈ machine.operationTypes, sinon NOT_FABRICABLE(MACHINE_UNAVAILABLE)
5. ÉVALUER LES CAPACITÉS MACHINE — orientation de pose (P6)
   zoneMachine = machine.printableArea ?? machine.workingArea
   telQuel(W,H)  = W ≤ zone.w ∧ H ≤ zone.h
   tournee(W,H)  = machine.orientationDePoseTourneeAutorisee ∧ W ≤ zone.h ∧ H ≤ zone.w
   ¬telQuel ∧ ¬tournee ⇒ NOT_FABRICABLE(EXCEEDS_MACHINE, op, alternatives)
   orientationDePose[op] = telQuel ? 'tel_quel' : 'tournee'        // « tel quel » par défaut, déterministe, indépendant de l'ordre
   enregistrer zoneMachine[op] (figée dans le BAT) ; aucune transformation de fichier déduite (VR-41)
6. ÉVALUER LES DIMENSIONS
   règles.dimension : min / max W, H, aire, rayon ⇒ BELOW_MIN / ABOVE_RULES
   résultat = ∩ des étapes 5 et 6 sur toutes les opérations
7. ÉVALUER LES TROUS (disposition des trous)
   valeurs reçues validées (jamais adaptées côté serveur — G.5) ; erreurs : EDGE_TOO_CLOSE, CORNER_CLEARANCE, PLATE_TOO_SMALL
   (côté configurateur, AVANT envoi : détermination du défaut selon la règle P11 ; trous indisponibles si aucune valeur valide)
8. ÉVALUER L'ARTWORK (+ texte)
   mode couleur = dérivé (monochrome | noir_uniquement | selon la politique d'impression de la référence)
   format autorisé ; rasterPolicy ; DPI à la taille posée ; zone utile − keep-out
   transformations d'artwork (§9.7, ART-1) : original conservé ; version normalisée distincte selon la référence active et validée
   et le workflow ; catégorie A (technique, non perceptible) sans acceptation ; catégorie B (visible, imposée) ⇒ avertissement + rendu
   normalisé + acceptation client AVANT BAT ; catégorie C sans règle explicite ⇒ aucun traitement automatique ; aucune conversion silencieuse
   texte : ajustement, lisibilité, glyphes
   erreurs : ARTWORK_OUT_OF_BOUNDS, ARTWORK_KEEPOUT, ARTWORK_RASTER_REJECTED, ARTWORK_COLOR_NOT_ALLOWED, TEXT_TOO_LONG, BELOW_LEGIBILITY
   ARTWORK_COLOR_NOT_ALLOWED (ART1-D7) : pas « contient de la couleur », mais : transformation nécessaire impossible ; aucune normalisation
   autorisée ne donne un résultat fabricable ; client refusant une transformation nécessitant son acceptation ; politique interdisant le traitement
   Plexiglass noir uniquement (ART1-D5) : conversion autorisée selon ART1-D1, sinon rejet typé ; aucune bascule automatique vers une autre référence
9. RÉSULTAT
   FABRICABLE { resolvedSpec, geometry, posesParOperation[], warnings[] }
   | NOT_FABRICABLE { code, failingOperation?, champ?, alternatives[] }   ⇒ côté serveur : rejet typé (P13, catégorie 3)
   alternatives (proposées seulement si elles passent elles-mêmes les étapes 1 à 8) :
   { kind:'max_dimensions', widthMm, heightMm } — plus grand rectangle admissible pour l'opération fautive, dans les deux orientations de pose
   { kind:'switch_family', toFamily } — famille active dont le procédé n'inclut pas l'opération fautive
                                        (ex. « famille dont le procédé de fabrication est la gravure laser », P4 D4)
```
Propriétés (spécification) : déterminisme (même entrée ⇒ même sortie, y compris orientation de pose) ; monotonie (réduire W ou H ne rend pas une configuration moins fabricable pour les étapes 5–6) ; exhaustivité (chaque opération évaluée) ; aucune alternative non fabricable proposée ; **requête non conforme (champ inconnu, champ interdit, saisie invalide) ⇒ rejet typé, jamais ignorée ni recalculée (P13)**.
*(v1.4 : « payload injecté ⇒ ignorés, recalculés » — HISTORIQUE, incompatible avec P13, remplacé.)*

## Annexe C — QA Matrix (spécification des contrôles)

| Niveau | Suite | Cas |
|---|---|---|
| Unitaire | Catalogue | schéma ; propriété obligatoire A_VALIDER ⇒ inactive ; trois états explicites (aucune absence implicite) ; 4 `Thickness` ; invariants par famille ; aucune couleur dans une capacité ; aucune apparence déduite d'une capacité ; workflows sans champ de dimension (R30) ; chaque référence → workflow, procédé, apparence, capacité de gravure, politique d'impression, `DimensionRules`, `MountingRules` |
| Unitaire | Fabricabilité (Annexe B) | **Gravure laser** : TroLase / TroLase Metallic 600 × 400 ✓ ; > 1010 × 610 ❌ ; sur mesure tant que CR-2 ouverte ⇒ VALIDATION_REQUIRED. **Impression UV à l'envers → découpe** : Plexiglass 347 × 490 ✓ (tel quel) ; 490 × 347 ✓ (tournée) ; 347,1 × 490 ❌ ; 347 × 490,1 ❌ ; 500 × 300 ❌ + alternatives. **Gravure envers + UV noir** : TroGlass Gold et Silver ≤ 347 × 490 ✓ ; > ❌ ; encre couleur ⇒ `INVALID_INK_POLICY` ; noir ✓. **Workflow impossible** : Speedy OK ∧ ArtisJet KO ⇒ NOT_FABRICABLE. **Couleur révélée** : fixée par la référence, aucune entrée client. **Orientation de pose** : « tel quel » quand les deux poses sont valides ; zone machine enregistrée ; valeurs limites dans les deux poses. **Monotonie**, **exhaustivité**, **alternatives fabricables** |
| Unitaire | Trous | 0/2/4, symétrie, deux sémantiques ; **P11** : 3,0 mm si valide ; sinon plus petite valeur supérieure valide, signalée ; sinon trous indisponibles ; résultat identique à l'ouverture et après changement de format / épaisseur / référence ; X et Y ; aucune valeur inventée ; inactif si À VALIDER |
| Unitaire | Artwork | SVG valide / invalide ; PNG / JPG selon `rasterPolicy` ; mode couleur dérivé (ART-1 : original conservé ≠ version normalisée ≠ fichier machine ; conversion couleur → monochrome / noir seulement si imposée par la référence active et validée ; catégorie B ⇒ avertissement + rendu + acceptation avant BAT ; refus ⇒ `ARTWORK_COLOR_NOT_ALLOWED` ; couleur conservée dans la version normalisée seulement si la politique de la référence est « couleur » ; Plexiglass noir uniquement sans bascule de référence ; aucune conversion silencieuse ; transformation post-BAT modifiant le rendu ⇒ nouveau BAT) ; débordement ; keep-out |
| Unitaire | Artefacts | Conformité §14.1 (mm, viewBox, ENGRAVE / CUT / HOLES, couleurs, 0.001pt, interdictions, traçabilité, déterminisme, régénération, miroir X côté envers) ; sélection par workflow ; UV `contract_pending` ; hybride laser / UV / metadata ; aucune transformation liée à une orientation de pose tournée (VR-41) |
| Unitaire | Pricing | ≥ 50 cas (référence, épaisseur, standard / sur mesure, UV, hybride, trous, artwork), centimes |
| Intégration | `createBat` | FABRICABLE ⇒ BAT complet (Annexe A) avec zones machine et orientations de pose ; NOT_FABRICABLE ⇒ rejet typé (422) ; **champ inconnu ⇒ rejet typé ; champ interdit (dimensions forgées hors saisie, prix, orientation de pose, zone machine, encre) ⇒ rejet typé, jamais ignoré ni recalculé** ; BAT régénérable après mutation du catalogue (R29) ; immutabilité DB |
| Intégration | Checkout | `startCheckout` : **même validation de requête que `createBat`** ; **prix de la plaque = prix du BAT validé, jamais recalculé ni remplacé** ; montant fixé à la création de la commande ; divergence ⇒ blocage explicite ; évolution du tarif catalogue sans effet sur un BAT existant ; BAT jamais modifié ; webhook 8 gardes individuellement ; réconciliation ; `channel_env` ; aucune commande sur famille dont un contrat requis n'a pas passé GATE 4 |
| Intégration | Production | job ≡ BAT (artefacts, hashes, workflow, côté, séquence, zone machine, orientation de pose) ; réévaluation ciblée avant production ; BAT non fabricable ⇒ blocage explicite, BAT conservé, motif tracé, aucune transformation silencieuse (G2-D9, D10) ; changement de règle de normalisation après BAT sans réécriture du BAT (G2-D11) ; fiche PDF avec vocabulaire canonique |
| Intégration | Journalisation | violation du contrat de requête journalisée comme événement technique neutre ; aucun payload complet ; aucune donnée sensible inutile |
| E2E | Par famille | TroLase : gravé, format standard (sur mesure si CR-2 levée) avec 4 trous ; TroLase Metallic : idem ; Plexiglass : impression UV à l'envers → découpe 347 × 490 avec artwork, **un parcours par politique d'impression effectivement active** (couleur **seulement si** une référence couleur est active — P9 D2) ; TroGlass : hybride Gold avec artwork noir, **aucun sélecteur d'encre** ; refus 500 × 300 Plexiglass avec alternative ; **orientation de pose jamais affichée** ; **aucune étape finition** ; libellés « gravure laser » / « impression UV à l'envers → découpe » / « gravure envers + UV noir » ; panier « 2 trous à X mm » ; mobile + desktop ; refresh / retour ; clavier |
| E2E | Frontière client / serveur | modification du payload client (DevTools) ⇒ **rejet typé serveur** ; adaptation de la distance au bord visible avant envoi (G.5) |
| Sécurité | Upload, headers, rate limits, secrets, webhook, lint (2 zones actives + Shared Core conditionnelle ; classification ou exclusion ; périmètre technique du lint exclu par ADR ; aucune obfuscation) |
| A11y / Perf | axe (toutes étapes), Lighthouse, budgets |

Tous bloquants en CI sauf Perf (préprod). **Aucun de ces tests n'est à écrire avant la validation finale de v1.5 et l'autorisation d'implémentation.**

---

**MASTER PLAN v1.6 — VALIDÉ (14/09/2026). v1.5 = historique normatif immuable. IMPLÉMENTATION UNIQUEMENT SELON LES AUTORISATIONS DU SUPERVISOR.**
*Fin du Master Plan v1.6 — MaPlaquePro.*
