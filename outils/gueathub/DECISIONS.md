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

## Phase 2 — domaine

- **Fiche recette aux portions d'origine : quantités telles qu'écrites.** Quand les portions affichées
  sont celles de la recette (facteur 1), chaque quantité est montrée exactement comme dans les données
  (« 12 g », « 100 ml », « 4 c. à c. »), sans arrondi métier. L'arrondi au plus proche du §6.3
  s'applique dès que les portions changent. Sinon, 12 g de beurre s'afficheraient « 10 g » alors que la
  recette dit 12 g (« l'app fait confiance aux données »).
- **Jamais d'arrondi à zéro.** Au plus proche, une petite quantité qui s'arrondirait à 0 (2 g, 0,2 c. à c.)
  reste affichée telle quelle. Les dénombrables gardent leur minimum de 0,5 (§6.3).
- **Unité d'affichage choisie après l'arrondi.** 995 g arrondis vers le haut donnent 1000 g, affichés
  « 1 kg » ; 97 ml donnent « 10 cl ». Le pas d'arrondi, lui, dépend de la valeur avant arrondi.
- **Cuillères.** Si la valeur arrondie atteint 3 c. à c., on repart de la quantité exacte, convertie en
  c. à s. et arrondie au 0,5 c. à s. (4 c. à c. → « 1,5 c. à s. », et non « 1,33 c. à s. »).
- **Libellés.** Aucun pluriel pour les symboles (g, kg, ml, cl, l, c. à c., c. à s.). « boîte » prend son
  accent à l'affichage ; « rouleau » fait « rouleaux ».
- **Familles mixtes.** Les quantités sont listées dans l'ordre où leur famille apparaît dans la sélection,
  séparées par « + ».
- **Placard.** Côté données, une ligne est « placard » seulement si toutes ses occurrences le sont
  (comme `optionnel`). En cas de doute, l'article reste dans la liste à acheter.
- **Sources.** Une entrée par occurrence d'ingrédient, avec son `groupe` : une recette qui utilise du beurre
  pour la pâte et pour la garniture donne deux sources. `quantiteAffichee` est celle de la fiche recette
  (au plus proche, ou telle qu'écrite aux portions d'origine).
- **Coches.** La signature est la quantité affichée dans la liste (chaîne vide pour « au goût »). Une coche
  dont la signature ne correspond plus donne l'état `stale` (« quantité modifiée »), affiché non coché ;
  recocher la ligne met la signature à jour. Si la quantité revient à la valeur cochée, la ligne redevient
  cochée. Les ajouts manuels gardent leur propre `coche` et ne passent pas par les signatures.
- **Rayons.** L'ordre perso est nettoyé (rayons inconnus et doublons retirés), puis complété par les rayons
  manquants dans l'ordre par défaut. Une ligne dont le rayon n'existe plus va dans « autre ».
- **Tri dans un rayon.** Non cochés (y compris « quantité modifiée ») d'abord, cochés en fin, puis ordre
  alphabétique français (`Intl.Collator`, casse et accents ignorés : « œuf » se range comme « oeuf »).
- **Progression et badge.** Ils comptent les lignes des rayons et les ajouts, **hors** section
  « À vérifier au placard » (repliée par défaut).
- **Texte copié.** Un bloc par rayon (libellé, puis `- nom : quantité`, suivi de « (facultatif) » si besoin),
  blocs séparés par une ligne vide, « À vérifier au placard » en dernier ; rayons dont tout est coché omis.
- **Recherche.** Tous les mots de la requête doivent apparaître dans le titre ou les noms d'ingrédients.
  Les ligatures sont dépliées (« oeuf » trouve « œuf »). Les tags sélectionnés sont cumulatifs (ET).
  Tri « temps » : temps total croissant, puis titre.
- **Fonctions en plus des 4 prévues au §6.** `text.js` porte aussi le filtre et le tri des recettes,
  `scale.js` le regroupement des ingrédients de la fiche, `aggregate.js` les coches, les rayons, la
  progression et le texte copié : tout ce qui est calculable sans DOM est testé ici.
- **Script de validation.** Il réutilise `normalize` et `nearDuplicateKey` de `text.js` (plus de copie).
- **Couverture.** `npm test` impose 100 % des lignes, branches et fonctions de `js/domain/`
  (`--experimental-test-coverage`, Node ≥ 22.8). L'exemple du §6.5 est testé sur une copie figée des deux
  recettes (`tests/fixtures/reference/`), pour que modifier les vraies recettes ne casse pas le test.
