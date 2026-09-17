# gueathub

Livre de recettes et liste de courses, servi à `/outils/gueathub/`.
Ce fichier n'est pas publié sur le site.

## Ajouter une recette

1. **Écrire la recette en JSON**, en suivant le contrat
   [`schema/recette.schema.json`](schema/recette.schema.json). Exemple complet :
   [`_data/gueathub/recettes/gratin-dauphinois.json`](../../_data/gueathub/recettes/gratin-dauphinois.json).
   Pour les ingrédients, reprendre les noms déjà utilisés (liste générée sur le site :
   `/outils/gueathub/ingredients.txt`).
2. **Déposer le fichier** `_data/gueathub/recettes/<id>.json`, où `<id>` est l'`id` de la recette
   (minuscules, chiffres et tirets). Photo facultative : la mettre dans `_photos/<id>.jpg` (ou `.png`)
   puis lancer `npm run photos`.
3. **Vérifier** avec `npm run check` : il faut **0 erreur**. Les avertissements sont à lire
   (photo manquante, noms d'ingrédients presque identiques…).
4. **Commiter et pousser.** La recette apparaît dans l'app après la publication du site ; la CI
   relance la vérification.

### Règles à retenir

| Champ | Règle |
|---|---|
| `id` | Identique au nom du fichier (et de la photo). |
| `ingredients[].nom` | Nom canonique : singulier, minuscules, sans quantité ni préparation. Sert à additionner les recettes. |
| `quantite` / `unite` | Tous deux `null` pour « au goût », sinon tous deux renseignés. |
| `unite` | `g` `kg` `ml` `cl` `l` `cac` `cas` `pincee` `piece` `gousse` `tranche` `botte` `brin` `feuille` `sachet` `boite` `pot` `rouleau` |
| `categorie` | Un `id` de [`_data/gueathub/categories.json`](../../_data/gueathub/categories.json). Un même nom garde toujours le même rayon. |
| `precision` | Préparation ou variété (« émincé ») : affichée sur la fiche, jamais dans la liste de courses. |
| `placard` | `true` pour les basiques qu'on a normalement chez soi (sel, huile, épices…). |
| `etapes[].texte` | Sans quantités (elles ne suivraient pas le changement de portions). `minuteur` en minutes. |

Photos : WebP de 300 Ko au plus. `npm run photos` redimensionne (1200 px de large), convertit et
retire les métadonnées (EXIF, position GPS).

## Développement

Prérequis : Node ≥ 22 et l'environnement Jekyll du site (voir le README à la racine).

```bash
npm ci
bundle exec jekyll serve      # http://localhost:4000/outils/gueathub/
```

| Commande | Rôle |
|---|---|
| `npm run check` | Valide les recettes, les rayons et les photos. |
| `npm test` | Tests `node --test` ; la logique de `js/domain/` doit rester couverte à 100 %. |
| `npm run css:build` / `css:watch` | Compile Tailwind (`src/app.css` → `app.css`, commité). À relancer après tout changement de classes. |
| `npm run icons` | Régénère `js/ui/icons.js` (après ajout d'une icône ou d'un rayon). |
| `npm run pwa-icons` | Régénère les icônes de l'app installable (`icons/`). |
| `npm run photos` | Convertit `_photos/` vers `assets/gueathub/recettes/`. |

Organisation :

```
index.html            page de l'app (sans le layout du blog)
recettes.json         généré par Jekyll : rayons, photos disponibles, recettes
ingredients.txt       généré par Jekyll : « nom | rayon » des ingrédients existants
sw.js                 service worker (version = date du build)
js/domain/            logique pure : unités, portions, liste de courses, recherche
js/views/             écrans : recettes, fiche, liste, réglages
js/ui/                gabarits, panneaux, toasts, minuteurs, thème, icônes
js/store.js           état local (clé localStorage « gueathub:v1 »)
src/, tests/          sources Tailwind et tests (non publiés)
```

Bon à savoir :

- Les couleurs viennent de `/assets/css/tokens.css`, partagé avec le blog : ne pas les redéfinir ici.
- Avec `jekyll serve`, chaque régénération crée une nouvelle version du service worker : le message
  « Nouvelle version disponible » apparaît après chaque modification.
- Les choix de conception sont notés dans [`DECISIONS.md`](DECISIONS.md).
