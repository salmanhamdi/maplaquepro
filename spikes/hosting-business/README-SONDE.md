# Sonde — spike d'hébergement Hostinger Business Web Hosting

**SONDE DE SPIKE — NON PRODUIT.** Référence : PROTOCOLE-SPIKE-HEBERGEMENT-BUSINESS-v1.
- Aucun paquet de la sonde n'est une dépendance produit (`probe/package.json` est distinct du `package.json` racine).
- Aucun travail Stripe : la route `raw` mesure seulement l'intégrité d'un corps `POST`, sans Stripe CLI.

## Contenu

| Chemin | Rôle | Critère |
|---|---|---|
| `probe/` | Application Next.js 16.3.5 minimale à déployer | — |
| `probe/app/api/probe/runtime` | Version Node exécutée, ressources, cgroup | C5, M0 |
| `probe/app/api/probe/env` | Présence de `PROBE_ENV_TEST` | C2 |
| `probe/app/api/probe/db` | `SELECT 1`, `VERSION()` (mysql2) | C3 |
| `probe/app/api/probe/raw` | Taille et SHA-256 du corps `POST` reçu | C4 (partiel), M10 |
| `probe/app/image` + `probe/public/probe.png` | `next/image` optimisé / `unoptimized` | C6 |
| `probe/app/api/probe/c7` | Écriture / relecture de fichiers (cwd, tmp, home) | **C7** |
| `probe/app/ssr` | Page rendue à la requête | C8 |
| `probe/app/api/probe/c9` | Génération puis décodage d'un PNG de N Mpx (sharp) | C9 |
| `probe/app/api/probe/limits` | Durée de requête | M10 |
| `measure/mesurer.mjs` | Mesures depuis le poste (sans paquet) | tous |

Toutes les routes `api/probe/*` exigent l'en-tête `x-probe-token` égal à la variable `PROBE_TOKEN` définie **sur la plateforme**. Sans cette variable, elles refusent tout (503).

## Déploiement (actions du propriétaire)

1. Hostinger → Sites web → **Ajouter** → **Application web Node.js**.
2. Source :
   - **option A** : GitHub, dépôt `salmanhamdi/maplaquepro`, branche `spike/hosting-business`, **répertoire racine `spikes/hosting-business/probe`**, si l'interface le propose ;
   - **option B** : upload de l'archive `sonde-hebergement.zip`, produite par `git archive`.
3. Framework : Next.js. Version Node : **noter la liste proposée**, puis choisir une version et la noter. Build `npm run build`, démarrage `npm run start`.
4. Variables d'environnement, saisies **dans le tableau de bord uniquement** :
   - `PROBE_TOKEN` : jeton de test transmis à part ;
   - `PROBE_ENV_TEST=1` ;
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` : base MySQL / MariaDB de test créée dans hPanel.
5. Communiquer l'URL de l'application, et des captures de l'écran de création (versions Node, options, ressources).

## Protocole C7 (priorité absolue)

1. `c7-write` : label `avant-redeploiement`, dossiers `cwd`, `tmp` et `home` ; puis `c7-read` immédiat.
2. **Redéploiement réel** : sur l'option A, par un commit sur la branche ; sur l'option B, par un nouvel upload. Le `buildId` de la réponse doit changer.
3. `c7-read` après redéploiement, pour chaque dossier.
4. Si possible, **redémarrage** (bouton Restart) puis `c7-read`.
5. Résultat : identique / absent / altéré, par dossier, avec `buildId` avant et après.
