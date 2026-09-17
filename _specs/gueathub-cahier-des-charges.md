# gueathub — cahier des charges

Nom de l'app : **gueathub**, toujours écrit en minuscules (comme guitehub), dans l'interface, le manifest, les titres et les chemins.

Outil du site « Le Hub de la Guite » (repo `guitehub/guitehub.github.io`), servi à `/outils/gueathub/`.

---

## 0. Mode d'emploi pour Claude Code

- Lis ce document en entier avant d'agir.
- Travaille par phases (§12). La phase 0 est de l'exploration pure : aucun fichier modifié. À la fin de chaque phase :
  1. résume ce qui a été fait ;
  2. donne les commandes pour tester ;
  3. fais un commit clair (sans push) ;
  4. attends mon « ok ».
- Si un point n'est pas couvert, choisis l'option la plus simple, note-la dans `outils/gueathub/DECISIONS.md` et continue. Ne t'arrête pour me demander que si l'action est destructive ou touche au blog existant.
- Règle absolue : le blog existant ne doit pas changer. `bundle exec jekyll build` doit passer et les pages existantes doivent rester identiques.

---

## 1. Objectif

Un livre de recettes intelligent. Je choisis des recettes et un nombre de portions, et l'app compose en direct une liste de courses unique. Cette liste additionne les ingrédients, les range par rayon, et je la coche au fur et à mesure en magasin.

Principes directeurs :

- **Statique.** Aucun backend, aucun compte, aucun service tiers. Tout vit dans le repo GitHub Pages.
- **Données fiables par contrat.** Les recettes sont mises en forme en amont par Claude (Chat) selon le schéma §5, puis validées par un script et par la CI. L'app ne devine rien : elle fait confiance aux données.
- **Ajouter une recette sans toucher au code.** Il suffit de déposer un fichier JSON (et une photo facultative), puis de pousser.
- **Mobile d'abord, utilisable hors-ligne en magasin.**
- **Modulaire.** La logique métier est faite de fonctions pures testées, séparées de l'interface. Les jetons de design sont partagés avec le blog pour les futurs « outils ».

---

## 2. Décisions de cadrage

| Sujet | Décision | Statut |
|---|---|---|
| Hébergement | Repo `guitehub.github.io`, dossier `/outils/gueathub/` | Validé |
| Utilisateurs | Public, sans login. Source de données unique : le repo. L'état perso (sélection, coches) est local au navigateur, sans synchro | Validé |
| Design | Tailwind CSS v4 compilé, aux couleurs du blog (mêmes jetons, même clair/sombre) | Validé |
| Front | JavaScript vanilla en modules ES, sans framework ni bundler | Par défaut |
| Stockage des recettes | Un fichier JSON par recette dans `_data/gueathub/recettes/` | Par défaut |
| Planification | Panier de recettes avec portions, sans calendrier (calendrier en V2) | Par défaut |
| Hors-ligne | PWA installable (service worker) | Par défaut |
| Articles hors recettes | Ajout manuel dans la liste | Par défaut |
| Basiques du placard | Drapeau dans les données, plus préférences perso. Section « À vérifier au placard » repliée | Par défaut |
| Mode cuisine | Étapes cochables, minuteurs, écran maintenu allumé | Par défaut |
| Validation | Script local et GitHub Action | Par défaut |
| Section « Outils » | Nouvelle entrée de nav. Les apps existantes y sont listées, mais leurs fichiers ne bougent pas (aucune URL cassée) | Par défaut |

---

## 3. Contexte technique existant (constaté, à vérifier en phase 0)

- **Jekyll.** Le Gemfile déclare `jekyll ~> 4.3.4`, `minima` et le plugin `jekyll-feed`. Vérifie si Pages construit en mode classique (Jekyll 3.10, liste blanche de plugins) ou via une Action (`.github/workflows/`). Tout ce qui est livré doit fonctionner dans les deux cas, donc **aucun plugin Jekyll supplémentaire**.
- **Navigation.** `_includes/nav.html` liste les pages marquées `is_main: true`, triées par `title`.
- **Thème.** `assets/css/style.css` définit les jetons `--bg --bg-soft --fg --fg-soft --fg-faint --border --accent --accent-fg --code-bg --sel --sans --mono`.
  - Le mode sombre passe par `@media (prefers-color-scheme: dark)` avec `:root:not([data-theme="light"])`, et par `:root[data-theme="dark"]`.
  - Le choix est mémorisé dans `localStorage.theme`, appliqué par un script anti-FOUC dans `_layouts/default.html`.
  - Les icônes viennent de Bootstrap Icons (CDN).
- **Apps existantes.** `projets/flechettes.html` et `projets/yams.html` sont des fichiers uniques, sans dépendance, avec une page autonome hors layout.
  - Leur `localStorage` utilise un préfixe et une sonde pour le mode privé iOS.
  - Chacune a un article `_posts/2026-09-07-*.md` (`layout: post`, catégorie `project`, `image:` vignette).
  - Reprends leurs conventions de robustesse.

---

## 4. Arborescence cible

```
_specs/gueathub.md                 # ce document (dossier _ : non publié)
_data/
  outils.yml                       # liste des outils affichés sur la page Outils
  gueathub/
    categories.json                # rayons : source unique
    recettes/
      gratin-dauphinois.json       # 1 fichier = 1 recette ; nom du fichier = id
assets/
  css/tokens.css                   # jetons extraits de style.css, partagés blog + outils
  gueathub/recettes/
    gratin-dauphinois.webp         # photo facultative ; nom = id
outils/gueathub/
  index.html                       # shell de l'app, page autonome (sans layout du blog)
  recettes.json                    # GÉNÉRÉ par Jekyll : catégories + recettes
  ingredients.txt                  # GÉNÉRÉ : noms d'ingrédients déjà utilisés + rayon
  sw.js                            # service worker (Liquid : version = heure du build)
  manifest.webmanifest
  app.css                          # GÉNÉRÉ par Tailwind CLI, commité
  icons/                           # icônes PWA (192, 512, maskable)
  schema/recette.schema.json       # contrat de données, public
  src/app.css                      # entrée Tailwind (exclu du site)
  js/
    main.js                        # démarrage, chargement, routeur
    router.js                      # routes par hash
    store.js                       # état, persistance, abonnements
    domain/                        # PUR : ni DOM ni storage, importable dans Node
      units.js                     # familles d'unités, conversion, arrondis, formatage
      scale.js                     # mise à l'échelle des portions
      aggregate.js                 # sélection + recettes -> lignes de courses
      text.js                      # normalisation, recherche insensible aux accents
    views/
      recipes.js  recipe.js  list.js  settings.js
    ui/
      dom.js                       # gabarits + échappement systématique
      icons.js                     # SVG inline (copiés de Bootstrap Icons)
      sheet.js  toast.js  timers.js
  tests/                           # node --test (exclu du site)
  README.md                        # « ajouter une recette » (exclu du site)
  DECISIONS.md                     # (exclu du site)
pages/outils.html                  # page « Outils », is_main: true
_posts/AAAA-MM-JJ-gueathub.md      # article de présentation
scripts/gueathub-check.mjs         # validation des données
.github/workflows/gueathub-check.yml
package.json                       # dev uniquement : tailwind, ajv, (sharp)
```

Ajoute à `exclude` dans `_config.yml` : `package.json`, `package-lock.json`, `scripts`, `outils/gueathub/src`, `outils/gueathub/tests`, `outils/gueathub/README.md`, `outils/gueathub/DECISIONS.md`. Vérifie que les exclusions par défaut, dont `node_modules`, restent actives.

---

## 5. Modèle de données (le contrat)

Les clés JSON sont en français. Le code (variables, fonctions) est en anglais. L'interface est en français.

### 5.1 Recette

| Champ | Type | Oblig. | Règle |
|---|---|---|---|
| `schema` | entier | oui | Constante `1` (permet les migrations futures) |
| `id` | chaîne | oui | kebab-case ASCII `^[a-z0-9]+(-[a-z0-9]+)*$`, identique au nom du fichier et de la photo |
| `titre` | chaîne | oui | 80 caractères max |
| `description` | chaîne | non | Une phrase, 160 caractères max |
| `type` | enum | oui | `entree` `plat` `accompagnement` `dessert` `petit-dejeuner` `gouter` `apero` `sauce` `boisson` |
| `portions` | entier | oui | De 1 à 50 |
| `portionsUnite` | chaîne | non | Par défaut `personnes` (ex. `parts`, `pièces`, `pots`) |
| `temps` | objet | oui | `{ preparation, cuisson, repos }` en minutes entières, `0` si sans objet |
| `difficulte` | enum | oui | `facile` `moyen` `difficile` |
| `tags` | chaîne[] | oui | kebab-case, peut être vide. Vocabulaire conseillé : `vegetarien` `vegan` `sans-gluten` `rapide` (≤ 30 min au total) `four` `sans-cuisson` `batch-cooking` `printemps` `ete` `automne` `hiver` `fete` |
| `ingredients` | Ingredient[] | oui | Au moins 1 |
| `etapes` | Etape[] | oui | Au moins 1 |
| `source` | chaîne | non | URL ou texte libre |
| `notes` | chaîne | non | Astuces perso |

**Ingredient**

| Champ | Type | Oblig. | Règle |
|---|---|---|---|
| `nom` | chaîne | oui | Nom canonique : singulier, minuscules, accents corrects, sans marque, quantité ni préparation. Clé d'agrégation |
| `quantite` | nombre > 0 ou `null` | oui | `null` pour « au goût » |
| `unite` | enum ou `null` | oui | Voir §5.2. `null` si et seulement si `quantite` vaut `null` |
| `categorie` | enum | oui | Un `id` de `categories.json` |
| `precision` | chaîne | non | Préparation ou variété : « émincé », « à chair ferme ». Affichée dans la recette, jamais dans la liste |
| `groupe` | chaîne | non | Sous-partie de la recette : « Pâte », « Garniture » |
| `optionnel` | booléen | non | Par défaut `false` |
| `placard` | booléen | non | Par défaut `false`. Vaut `true` pour les basiques qu'on a normalement chez soi |

**Etape** : `{ "texte": chaîne, "minuteur"?: minutes > 0 }`.
Le texte ne répète pas les quantités, car elles ne suivraient pas le changement de portions.

### 5.2 Unités

| Famille | Unités (valeur dans l'unité de base) | Affichage |
|---|---|---|
| masse | `g` (1), `kg` (1000) | g, kg |
| volume | `ml` (1), `cl` (10), `l` (1000) | ml, cl, l |
| cuillère | `cac` (1), `cas` (3) | c. à c., c. à s. |
| pincée | `pincee` | pincée(s) |
| dénombrable | `piece` `gousse` `tranche` `botte` `brin` `feuille` `sachet` `boite` `pot` `rouleau` | chacune sa propre famille ; `piece` s'affiche sans libellé (« 3 ») |

Les libellés d'unité passent au pluriel à partir de 2 (« 1,5 gousse », « 2 gousses »). Les noms d'ingrédients ne sont jamais accordés : la ligne affiche le nom à gauche et la quantité à droite, pour éviter toute règle de pluriel.

### 5.3 Catégories (rayons) — `_data/gueathub/categories.json`

Tableau ordonné d'objets `{ "id", "libelle", "icone" }`. L'`icone` est un nom Bootstrap Icons. L'ordre du fichier est l'ordre par défaut, et l'utilisateur peut le réordonner dans l'app.

| id | libellé | exemples (repris dans le convertisseur) |
|---|---|---|
| `fruits-legumes` | Fruits & légumes | légumes, fruits, herbes fraîches, ail, champignons frais |
| `boulangerie` | Boulangerie | pain, pain de mie, brioche |
| `boucherie-poissonnerie` | Boucherie & poissonnerie | viande, volaille, poisson, fruits de mer |
| `cremerie` | Crèmerie & œufs | lait, beurre, crème, yaourt, fromage, œuf |
| `frais` | Frais & traiteur | lardons, jambon, pâte brisée ou feuilletée, tofu |
| `epicerie-salee` | Épicerie salée | pâtes, riz, semoule, légumineuses sèches, chapelure |
| `conserves` | Conserves & bocaux | tomates concassées, pois chiches en boîte, thon, olives |
| `condiments-epices` | Huiles, condiments & épices | huiles, vinaigres, sel, poivre, épices, moutarde, bouillon |
| `saveurs-du-monde` | Saveurs du monde | sauce soja, lait de coco, pâte de curry, tortillas |
| `epicerie-sucree` | Épicerie sucrée & pâtisserie | farine, sucre, chocolat pâtissier, levure, fruits secs, miel |
| `surgeles` | Surgelés | légumes surgelés, pâte surgelée, glaces |
| `boissons` | Boissons | vin, bière, jus |
| `maison` | Maison & hygiène | surtout pour les ajouts manuels |
| `autre` | Autre | en dernier recours |

### 5.4 Exemple complet — `_data/gueathub/recettes/gratin-dauphinois.json`

```json
{
  "schema": 1,
  "id": "gratin-dauphinois",
  "titre": "Gratin dauphinois",
  "description": "Pommes de terre fondantes cuites lentement dans le lait et la crème.",
  "type": "accompagnement",
  "portions": 4,
  "temps": { "preparation": 20, "cuisson": 75, "repos": 10 },
  "difficulte": "facile",
  "tags": ["vegetarien", "four", "automne", "hiver"],
  "ingredients": [
    { "nom": "pomme de terre", "quantite": 1, "unite": "kg", "categorie": "fruits-legumes", "precision": "à chair ferme" },
    { "nom": "lait entier", "quantite": 50, "unite": "cl", "categorie": "cremerie" },
    { "nom": "crème liquide entière", "quantite": 25, "unite": "cl", "categorie": "cremerie" },
    { "nom": "ail", "quantite": 1, "unite": "gousse", "categorie": "fruits-legumes" },
    { "nom": "beurre", "quantite": 10, "unite": "g", "categorie": "cremerie", "precision": "pour le plat" },
    { "nom": "noix de muscade", "quantite": 1, "unite": "pincee", "categorie": "condiments-epices", "precision": "râpée", "placard": true },
    { "nom": "sel", "quantite": null, "unite": null, "categorie": "condiments-epices", "placard": true },
    { "nom": "poivre", "quantite": null, "unite": null, "categorie": "condiments-epices", "placard": true }
  ],
  "etapes": [
    { "texte": "Préchauffer le four à 150 °C. Éplucher les pommes de terre et les couper en rondelles fines, sans les laver." },
    { "texte": "Porter le lait à frémissement avec l'ail écrasé, la muscade, le sel et le poivre. Ajouter les pommes de terre et cuire en remuant délicatement.", "minuteur": 10 },
    { "texte": "Beurrer le plat, y verser les pommes de terre et leur lait, puis napper de crème." },
    { "texte": "Enfourner jusqu'à ce que le dessus soit doré.", "minuteur": 65 },
    { "texte": "Laisser reposer avant de servir.", "minuteur": 10 }
  ],
  "source": "Recette familiale",
  "notes": "Ne pas rincer les rondelles : l'amidon lie la sauce."
}
```

### 5.5 Fichiers générés par Jekyll (aucune liste à maintenir à la main)

`outils/gueathub/recettes.json` :

```liquid
---
layout: null
permalink: /outils/gueathub/recettes.json
---
{
  "genere": {{ site.time | date_to_xmlschema | jsonify }},
  "categories": {{ site.data.gueathub.categories | jsonify }},
  "recettes": [{% for pair in site.data.gueathub.recettes %}{{ pair[1] | jsonify }}{% unless forloop.last %},{% endunless %}{% endfor %}]
}
```

`outils/gueathub/ingredients.txt` contient une ligne `nom | categorie` par ingrédient distinct, triée. Le convertisseur Claude la lit pour réutiliser exactement les noms existants.

Le tri des recettes se fait côté JS.

### 5.6 Validation — `scripts/gueathub-check.mjs` (`npm run check`)

- **Erreurs** (code de sortie 1) :
  - non-conformité au JSON Schema (Ajv, draft 2020-12, `additionalProperties: false`) ;
  - `id` différent du nom de fichier, ou `id` en double ;
  - `categorie` absente de `categories.json` ;
  - un même `nom` rangé dans deux catégories différentes selon les recettes ;
  - `unite`/`quantite` incohérents.
- **Avertissements** :
  - photo manquante, ou photo de plus de 300 Ko ;
  - noms quasi identiques (même chaîne une fois les accents et le `s`/`x` final retirés), par exemple « tomate » et « tomates » ;
  - même `nom` avec un `placard` différent ;
  - tag hors vocabulaire conseillé.

`.github/workflows/gueathub-check.yml` se déclenche sur les push et PR qui touchent `_data/gueathub/**`, `assets/gueathub/**`, `outils/gueathub/**` ou `scripts/**`. Il utilise Node LTS et lance `npm ci`, `npm run check` et `npm test`. Il est indépendant du déploiement Pages : un échec signale le problème mais ne bloque pas la publication.

---

## 6. Logique métier (fonctions pures, 100 % testées)

### 6.1 Mise à l'échelle

`facteur = portionsChoisies / recette.portions`. Chaque `quantite` non nulle est multipliée par ce facteur. Les calculs se font dans l'unité de base de la famille. Arrondis à 1e-6 près avant tout arrondi métier, pour neutraliser les erreurs de virgule flottante.

### 6.2 Agrégation (`aggregate(selection, recettes, prefs) -> lignes`)

1. **Clé de ligne** : `normalize(nom)`, c'est-à-dire trim, minuscules, espaces réduits, NFC (les accents sont conservés).
2. Pour une même clé, les quantités s'additionnent par famille d'unités, dans l'unité de base.
3. Si une clé cumule plusieurs familles, une seule ligne affiche les quantités côte à côte, par exemple « 2 + 100 g ». Il n'y a aucune conversion entre familles.
4. Une quantité `null` n'ajoute rien. Si toutes les occurrences sont `null`, la ligne n'affiche que le nom.
5. La ligne porte la catégorie de l'ingrédient (garantie cohérente par la validation).
6. `optionnel` n'est vrai sur la ligne que si toutes les occurrences sont optionnelles. La ligne affiche alors « facultatif ».
7. `placard` vient de la donnée, écrasé par la préférence perso `placardPerso[clé]` si elle existe.
8. Chaque ligne garde le détail de ses sources `[{ recetteId, titre, portions, quantiteAffichee }]`.
9. Les ajouts manuels sont des lignes séparées, marquées « ajout », jamais fusionnées avec celles des recettes.

### 6.3 Arrondis et affichage

| Famille | Liste de courses (arrondi vers le haut) | Fiche recette (arrondi au plus proche) |
|---|---|---|
| masse | < 100 g : au 5 g ; < 1 kg : au 10 g ; ≥ 1 kg : au 50 g, affiché en kg | mêmes pas |
| volume | < 100 ml : au 5 ml, en ml ; < 1 l : au 10 ml, affiché en cl ; ≥ 1 l : au 50 ml, en l | mêmes pas |
| cuillère | au 0,5 c. à c. ; 3 c. à c. ou plus s'affichent en c. à s. | idem |
| pincée | au 0,5 | idem |
| dénombrables | à l'entier supérieur | au 0,5 le plus proche (minimum 0,5) |

Nombres au format français : virgule décimale, deux décimales au maximum, zéros finaux retirés.

### 6.4 Coches

- L'état coché est stocké par clé de ligne, avec la **signature** de la quantité affichée au moment du cochage.
- Si la quantité change ensuite (ajout d'une recette, changement de portions), la ligne redevient non cochée et affiche discrètement « quantité modifiée ».
- Les coches dont la ligne n'existe plus sont purgées.

### 6.5 Exemple de référence (fixture de test obligatoire)

La quiche lorraine sert de 2ᵉ recette d'exemple (6 personnes) :

- pâte brisée : 1 `rouleau`, `frais`
- lardons : 200 `g`, `frais`
- œuf : 3 `piece`, `cremerie`
- crème liquide entière : 20 `cl`
- lait entier : 100 `ml`
- noix de muscade : 1 `pincee`, `placard`

Sélection : gratin à 6 personnes (facteur 1,5) et quiche à 6 (facteur 1). Liste attendue :

| Rayon | Ligne | Calcul |
|---|---|---|
| Fruits & légumes | pomme de terre — 1,5 kg | 1500 g |
| Fruits & légumes | ail — 2 gousses | 1,5 arrondi à l'entier supérieur |
| Crèmerie & œufs | lait entier — 85 cl | 750 + 100 = 850 ml |
| Crèmerie & œufs | crème liquide entière — 58 cl | 375 + 200 = 575, arrondi à 580 ml |
| Crèmerie & œufs | œuf — 3 | |
| Crèmerie & œufs | beurre — 15 g | |
| Frais & traiteur | lardons — 200 g | |
| Frais & traiteur | pâte brisée — 1 rouleau | |
| À vérifier au placard | noix de muscade — 2,5 pincées ; sel ; poivre | 1,5 + 1 |

---

## 7. Écrans et parcours

Routes par hash : `#/` (recettes), `#/recette/:id`, `#/liste`, `#/reglages`. Tous les liens sont partageables. Sur mobile, une barre d'onglets en bas donne « Recettes » et « Liste » (avec un badge du nombre d'articles restants), plus un accès aux réglages. Sur écran large, cette navigation passe dans l'en-tête. Un lien discret « Le Hub » ramène à `/outils/`.

### 7.1 Recettes (`#/`)

- **Recherche** sur le titre et les noms d'ingrédients, insensible aux accents et à la casse.
- **Filtres** en puces : type (choix unique), tags (choix multiple), « Sélectionnées ».
- **Tri** : alphabétique ou temps total.
- **Grille** : 1 colonne sous 400 px, 2 colonnes en `sm`, 3 en `lg`.
- **Carte** :
  - photo 4:3 (`loading="lazy"`, `aspect-ratio` réservé, icône du type sur fond doux si la photo manque) ;
  - titre et temps total ;
  - bouton « Ajouter », qui devient un compteur de portions `− 6 +`. Descendre sous 1 retire la recette, avec un toast « Annuler ».

### 7.2 Fiche recette (`#/recette/:id`)

- **En-tête** : photo, titre, description, temps (préparation, cuisson, repos), difficulté, tags, source (lien si c'est une URL).
- **Portions** : compteur local, initialisé depuis la sélection si la recette y est, sinon depuis `portions`.
- **Bouton principal** : « Ajouter à la liste », ou « Mettre à jour la liste » si les portions diffèrent, ou « Retirer de la liste ».
- **Ingrédients** : regroupés par `groupe`, quantités recalculées, `precision` en texte secondaire.
- **Étapes numérotées** : un toucher marque l'étape faite (état persisté par recette, bouton « Recommencer »).
- **Minuteurs** : le bouton « 10 min » d'une étape lance un minuteur. Plusieurs minuteurs peuvent tourner dans une barre collante. À la fin : vibration, son court et toast.
- **Écran allumé** : interrupteur « Garder l'écran allumé » via l'API Screen Wake Lock, masqué si le navigateur ne la gère pas.
- **Notes** en bas.
- **Identifiant inconnu** : message « Cette recette n'existe pas ou a été retirée » et bouton « Voir les recettes ».

### 7.3 Liste de courses (`#/liste`)

- **En-tête** :
  - progression « 12 / 30 » avec barre ;
  - puces des recettes sélectionnées (titre et portions), qui ouvrent un panneau pour changer les portions ou retirer.
- **Sections par rayon**, dans l'ordre choisi par l'utilisateur. Les rayons vides sont masqués.
- **Ligne** :
  - toute la ligne est une case à cocher (vraie `<input type="checkbox">` dans un `<label>`, zone tactile ≥ 44 px) ;
  - nom à gauche, quantité à droite en chiffres tabulaires ;
  - un bouton « détails » ouvre un panneau avec les sources et l'action « Toujours au placard » ou « Pas au placard » ;
  - les lignes cochées sont barrées, atténuées et déplacées en fin de rayon.
- **Section « À vérifier au placard »** en dernier, repliée par défaut, cochable aussi.
- **Ajout manuel** : champ nom, rayon (liste déroulante, `autre` par défaut) et quantité en texte libre facultatif. Les ajouts sont cochables et supprimables.
- **Actions** :
  - « Masquer les articles cochés » (interrupteur) ;
  - « Copier la liste » : Web Share API si disponible, sinon presse-papiers. Seulement les articles non cochés, groupés par rayon, en texte brut ;
  - « Tout décocher » ;
  - « Vider la liste » : sélection, ajouts et coches, avec toast « Annuler » pendant 5 s plutôt qu'une boîte de confirmation.
- **État vide** : « Ta liste est vide. Choisis des recettes pour la remplir. » et bouton « Voir les recettes ».

### 7.4 Réglages (`#/reglages`)

- Ordre des rayons, avec des boutons monter/descendre accessibles (pas de bibliothèque de glisser-déposer) et « Rétablir l'ordre par défaut ».
- Thème clair, sombre ou système, écrit dans la même clé `localStorage.theme` que le blog.
- Liste des préférences placard perso, chacune supprimable.
- « Effacer les données de l'app sur cet appareil ».
- Date de génération des recettes (`genere`) et version de l'app.

### 7.5 Robustesse

- **Recette sélectionnée supprimée du site** : elle est retirée de la sélection au chargement, avec le toast « 1 recette retirée : elle n'existe plus ».
- **`recettes.json` servi depuis le cache** : bandeau discret « Hors ligne — recettes du 17/09 ».
- **`localStorage` indisponible** : l'app fonctionne en mémoire, avec le bandeau « Tes choix ne seront pas conservés sur cet appareil ».

---

## 8. État local — `store.js`

Une seule clé `localStorage` : `gueathub:v1`.

```js
{
  version: 1,
  selection: [{ id, portions }],
  coches: { [cleLigne]: signature },
  ajouts: [{ id, nom, quantite, categorie, coche }],
  placardPerso: { [cleLigne]: true | false },
  ordreRayons: [categorieId],
  etapesFaites: { [recetteId]: [index] },
  masquerCoches: false
}
```

- Au chargement : sonde, lecture, migration selon `version`, valeurs par défaut pour les champs absents, purge des références mortes.
- Écriture différée d'environ 200 ms. Écoute de l'événement `storage` pour synchroniser plusieurs onglets.
- Abonnements : chaque changement redessine la vue active en préservant le défilement et le focus. Au cochage, on met à jour la ligne concernée plutôt que toute la liste.

---

## 9. Design et interface

### 9.1 Jetons partagés

- Extraire les blocs de variables de `assets/css/style.css` (le `:root`, le bloc `prefers-color-scheme` et le bloc `[data-theme="dark"]`) vers `assets/css/tokens.css`.
- Placer `@import url("tokens.css");` en tête de `style.css`.
- Vérifier que le blog rend exactement pareil avant et après (captures ou diff du HTML et CSS générés).
- L'app charge `tokens.css` par un `<link>` au moment de l'exécution, avant `app.css`. La source reste unique, sans recompilation quand les couleurs du blog changent.
- Copier dans `index.html` le script anti-FOUC du layout du blog.

### 9.2 Tailwind v4

- `@tailwindcss/cli` en devDependency, avec les scripts `css:build` (minifié) et `css:watch`.
- Le fichier `outils/gueathub/app.css` généré est commité.

```css
/* outils/gueathub/src/app.css */
@import "tailwindcss";
@source "../js";
@source "../index.html";

@theme inline {
  --color-page: var(--bg);
  --color-soft: var(--bg-soft);
  --color-ink: var(--fg);
  --color-ink-soft: var(--fg-soft);
  --color-ink-faint: var(--fg-faint);
  --color-line: var(--border);
  --color-accent: var(--accent);
  --color-on-accent: var(--accent-fg);
  --font-sans: var(--sans);
  --font-mono: var(--mono);
}
```

- Les couleurs basculent seules avec le thème du blog, donc **aucune variante `dark:` pour les couleurs**.
- Les classes Tailwind écrites dans le JS sont toujours des chaînes complètes et littérales (jamais `bg-${x}`), sinon le scan ne les voit pas.
- En v4, la couleur de bordure par défaut est `currentColor` : toujours préciser `border-line`.

### 9.3 Direction visuelle

- Web app moderne « Tailwind classique », sobre, aux couleurs du blog. L'accent `--accent` est réservé aux actions principales, aux cases cochées et à la progression.
- Surfaces : `bg-page` et `bg-soft` pour les cartes et panneaux. Bordures fines `border-line`, `rounded-xl` pour les cartes, `rounded-full` pour les puces. Ombres rares et légères.
- Typographie : `--sans` du blog, une seule famille. Quantités en `tabular-nums`.
- En-tête collant, barre d'onglets en bas avec `env(safe-area-inset-bottom)`. Panneaux en tiroir depuis le bas sur mobile, en dialogue centré sur desktop. Largeur max environ `42rem` pour la liste et la fiche, et plus large pour la grille.
- Icônes : SVG inline copiés de Bootstrap Icons dans `ui/icons.js`, sans police CDN, pour le hors-ligne.
- Mouvement : seulement en retour d'action (coche, ouverture de panneau, toast). Aucune animation d'entrée décorative. `prefers-reduced-motion` est respecté.
- Accessibilité :
  - contraste AA, focus visible, zones tactiles ≥ 44 px ;
  - `aria-live` pour les toasts et la progression ;
  - `lang="fr"` ;
  - tout fonctionne au clavier.
- Textes :
  - phrases courtes, casse de phrase, verbes explicites (« Ajouter à la liste », « Copier la liste ») ;
  - une action garde le même nom de bout en bout (« Copier la liste » → toast « Liste copiée ») ;
  - les états vides disent quoi faire.
- `<meta name="theme-color">` est ajusté au thème actif.

---

## 10. PWA et hors-ligne

- **`manifest.webmanifest`** :
  - `name` « gueathub — Le Hub de la Guite », `short_name` « gueathub » ;
  - `start_url` et `scope` à `/outils/gueathub/`, `display: standalone` ;
  - icônes 192, 512 et maskable, couleurs du thème.
- **`sw.js`** (avec front matter Liquid, `layout: null`) :
  - nom du cache `gueathub-{{ site.time | date: '%s' }}`, donc nouvelle version à chaque build, automatiquement ;
  - pré-cache de la coquille : `index.html`, `app.css`, `/assets/css/tokens.css`, `recettes.json`, et tous les `site.static_files` dont le `path` commence par `/outils/gueathub/` (liste générée par Liquid, jamais maintenue à la main) ;
  - `recettes.json` en network-first avec repli sur le cache ;
  - photos en cache-first au fil des consultations, 80 entrées max ;
  - navigations : repli sur `index.html` ;
  - nettoyage des anciens caches à l'activation.
- **Mise à jour** : quand un nouveau service worker est en attente, toast « Nouvelle version disponible » avec un bouton « Recharger ».

---

## 11. Intégration au Hub : section « Outils »

- **`_data/outils.yml`** : entrées `{ titre, description, url, icone }`. Contenu initial :
  - gueathub → `/outils/gueathub/` ;
  - Fléchettes → `/projets/flechettes.html` ;
  - Yam's → `/projets/yams.html`.

  Pour icomkr, inspecte ce que c'est. Si c'est un outil utilisable en ligne, ajoute-le ; sinon laisse-le dans Projets. Note ta décision dans `DECISIONS.md`.
- **`pages/outils.html`** : `is_main: true`, `title: Outils`, layout du blog. Cartes générées depuis `_data/outils.yml`, stylées avec le CSS existant du blog (pas de Tailwind sur les pages du blog).
- La page Projets et les fichiers des apps existantes ne bougent pas.
- **Article `_posts/AAAA-MM-JJ-gueathub.md`** calqué sur celui de Fléchettes :
  - sections « À quoi ça sert », « Comment on l'utilise », « Sur quelle techno c'est bâti » et « Ajouter une recette » ;
  - catégorie `project`, vignette `assets/images/vignette-gueathub.*`.

---

## 12. Phases de livraison

| Phase | Contenu | Terminé quand |
|---|---|---|
| **0. Exploration** | Lire les fichiers du §3, identifier le mode de build Pages, lancer `bundle exec jekyll build` comme référence, repérer les conflits avec ce document | Plan détaillé et risques présentés, aucun fichier modifié |
| **1. Contrat de données** | `categories.json`, JSON Schema, 3 recettes (gratin, quiche, une recette végétarienne sans photo), `recettes.json` et `ingredients.txt` générés, `gueathub-check.mjs`, workflow CI, `package.json` | Build OK ; `/outils/gueathub/recettes.json` est du JSON valide ; `npm run check` au vert sur les vraies données et au rouge sur une fixture invalide |
| **2. Domaine** | `units.js`, `scale.js`, `aggregate.js`, `text.js` et leurs tests `node --test` | `npm test` au vert, fixture §6.5 incluse, cas limites couverts (quantités nulles, familles mixtes, flottants, coches invalidées) |
| **3. Interface** | `tokens.css`, Tailwind, shell, routeur, store, les 4 vues, minuteurs, Wake Lock | Parcours du §13 validés dans un viewport de 375 px et sur desktop, en clair et en sombre |
| **4. PWA** | Manifest, icônes, service worker, toast de mise à jour | App installable ; parcours complet en mode avion après une première visite |
| **5. Intégration au Hub** | `_data/outils.yml`, page Outils, article, `exclude` | Nav affiche « Outils » ; le reste du blog est identique à la référence de la phase 0 |
| **6. Documentation** | `README.md` (ajouter une recette en 4 étapes), `DECISIONS.md` à jour. En option, `npm run photos` (sharp : `_photos/*.jpg|png` → `assets/gueathub/recettes/<nom>.webp`, 1200 px de large, qualité 80, dossier `_photos/` dans `.gitignore`) | Je peux ajouter une recette en suivant le README, sans aide |

---

## 13. Critères d'acceptation

- [ ] Ajouter `_data/gueathub/recettes/x.json` et `assets/gueathub/recettes/x.webp`, puis pousser : la recette apparaît sans aucune modification de code.
- [ ] Sélectionner 2 recettes, puis changer les portions : la liste se met à jour en direct et respecte la fixture §6.5.
- [ ] Cocher un article, puis augmenter les portions d'une recette qui le contient : l'article est décoché et marqué « quantité modifiée ».
- [ ] Recharger la page : sélection, portions, coches, ajouts et ordre des rayons sont conservés.
- [ ] Mode avion après une première visite : l'app s'ouvre, les recettes s'affichent, la liste se coche.
- [ ] Le thème suit le bouton clair/sombre du blog, et inversement.
- [ ] Une recette sans photo affiche le visuel de remplacement, sans décalage de mise en page.
- [ ] Une recette supprimée du repo disparaît proprement de la sélection.
- [ ] « Copier la liste » produit un texte propre, groupé par rayon.
- [ ] Navigation au clavier complète, focus visible, zones tactiles ≥ 44 px, aucun défilement horizontal à 320 px.
- [ ] `npm run check` et `npm test` au vert ; `bundle exec jekyll build` sans avertissement nouveau.
- [ ] Aucune dépendance chargée en production depuis un CDN (Tailwind compilé, icônes inline).

---

## 14. Hors périmètre V1 (idées pour V2)

- Planning par jour et par repas.
- Synchronisation entre appareils.
- Édition de recettes dans l'app.
- Profils de magasins multiples.
- Conversions cuillère ↔ gramme.
- Nutrition et allergènes.
- Import direct depuis une URL.
