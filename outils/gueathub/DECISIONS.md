# gueathub — décisions

Choix pris en cours de route, quand le cahier des charges (`_specs/gueathub-cahier-des-charges.md`)
ne tranchait pas ou a été arbitré. Fichier non publié (exclu dans `_config.yml`).

## Arbitrages validés (phase 0)

| Sujet | Décision |
|---|---|
| Build GitHub Pages | Mode classique (Jekyll 3.10) : pas de workflow de déploiement, pas de gem `github-pages`. Tout est testé en Jekyll 4.3 (local) **et** 3.10 (Gemfile `github-pages` séparé, hors repo). Aucun plugin ajouté. |
| Page Outils (§11) | **Option A** : on garde la convention du README. `pages/outils.md` reçoit seulement `permalink: /outils/` ; pas de `_data/outils.yml` ; l'article gueathub est en catégorie `tool` (calqué sur icomkr) ; Fléchettes et Yam's restent dans Projets. |
| Lien « Le Hub » | Pointe vers `/outils/`. |
| Jetons (§9.1) | Pas d'`@import` : `<link>` vers `/assets/css/tokens.css` dans `_layouts/default.html`, juste avant `style.css`. |
| Exclusions | `Gemfile`, `Gemfile.lock`, `node_modules` et `vendor` listés explicitement. |
| Contrôle « blog inchangé » | Référence = build du commit `3791e2e`, pages dont le changement est attendu ignorées. |
| Photos | Aucune pour l'instant : les avertissements « photo manquante » sont attendus. |
| Vignette de l'article | `assets/images/vignette-gueathub.ico`, fournie avant la phase 5. |
| Navigateurs | Tailwind v4 : Safari 16.4 et plus. |
| Nom du fichier de spec | `_specs/gueathub-cahier-des-charges.md` (le §4 dit `_specs/gueathub.md`) : gardé tel quel. |

## Phase 1 — contrat de données

- **Exclusions dès la phase 1.** La liste `exclude` prévue en phase 5 est ajoutée maintenant : sinon
  `package.json`, `scripts/` et les fixtures de test seraient publiés dès ce commit. Vérifié : en Jekyll 4
  comme en 3.10, le site généré est identique à la référence, à l'exception des 3 nouveaux fichiers
  (`recettes.json`, `ingredients.txt`, `schema/recette.schema.json`).
- **`photos` dans `recettes.json`.** En plus de `genere`, `categories` et `recettes`, le fichier généré
  contient `photos` : la liste des id qui ont un `assets/gueathub/recettes/<id>.webp`, calculée depuis
  `site.static_files`. L'app sait ainsi quelles photos existent, sans requête en 404 (utile hors ligne).
- **Rayon dans le schéma.** `categorie` n'est contrôlé que par un motif kebab-case dans le schéma ;
  l'appartenance à `categories.json` est vérifiée par le script. `categories.json` reste la source unique,
  et le schéma public n'a pas à être régénéré quand on ajoute un rayon.
- **Textes.** Les chaînes (`titre`, `description`, `precision`…) ne peuvent pas être vides ni commencer ou
  finir par un espace. `nom` interdit en plus les majuscules et les doubles espaces (schéma) ; le script
  exige la forme Unicode NFC, pour que la clé d'agrégation soit stable.
- **Limites non précisées.** `portionsUnite` : 30 caractères max. `minuteur` : entier ≥ 1 (minutes).
  `tags` : sans doublon.
- **`categories.json` validé aussi** : structure `{ id, libelle, icone }`, id uniques, rayon `autre`
  obligatoire (rayon par défaut des ajouts manuels).
- **Icônes des rayons** (noms Bootstrap Icons vérifiés dans la v1.13) : `apple`, `basket2`, `shop`, `egg`,
  `thermometer-low`, `box-seam`, `archive`, `droplet`, `globe-europe-africa`, `cake2`, `snow`, `cup-straw`,
  `house`, `three-dots`. Il n'existe pas d'icône pain, poisson ou bocal.
- **Quasi-doublons.** Le `s`/`x` final est retiré à la fin de **chaque mot**, pas seulement de la chaîne,
  pour attraper « pomme de terre » / « pommes de terre ».
- **Codes de problème.** Chaque erreur ou avertissement du script porte un code stable
  (`schema`, `json`, `id-fichier`, `id-doublon`, `categorie-inconnue`, `categorie-conflit`,
  `quantite-unite`, `nom-non-canonique`, `categories` ; `photo-manquante`, `photo-lourde`, `nom-proche`,
  `placard-conflit`, `tag-hors-vocabulaire`, `fichier-ignore`). Les tests s'appuient dessus.
- **`ingredients.txt`** est trié par le `sort` de Liquid, octet par octet : les noms qui commencent par une
  lettre accentuée ou « œ » arrivent en fin de liste. Sans importance pour le convertisseur.
- **Recettes d'exemple.** La quiche suit exactement la fixture du §6.5, y compris « lardons » au pluriel.
  La 3ᵉ recette (crêpes, végétarienne, sans photo) sert aussi à exercer les cas moins courants : `groupe`,
  `optionnel`, cuillères, `portionsUnite` et une quantité `null`.
- **CI.** Le workflow se déclenche aussi sur `package.json`, `package-lock.json` et sur lui-même.
  `actions/checkout@v5`, `actions/setup-node@v5`, `node-version: lts/*`.
- **Node.** `package.json` à la racine en `"type": "module"`, `engines.node >= 22` (motifs de fichiers pour
  `node --test`). En local : Node 24 LTS via nvm.
