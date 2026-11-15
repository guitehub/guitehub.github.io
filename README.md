# LaGuite's Github Pages

Link : [GuiteHub](https://guitehub.github.io)

## Lancer le site en local

Prérequis : Ruby et Bundler (`gem install bundler`).

```bash
bundle install
bundle exec jekyll serve   # http://localhost:4000
```

Le `Gemfile` sert au développement local (Jekyll 4). En production, GitHub Pages construit le site
avec Jekyll 3.10 et ses plugins autorisés : ne rien utiliser qui n'existe qu'en Jekyll 4.

Outillage Node (`npm ci`) : hooks git qui retirent les métadonnées de toutes les images
et vérifications de gueathub, détaillés dans [`outils/gueathub/README.md`](outils/gueathub/README.md).

---

## Projets et outils

Une seule question décide : **y a-t-il un bouton « Ouvrir » ?**

| | Outil | Projet |
|---|---|---|
| Critère | s'ouvre et s'utilise dans le navigateur, sur le site | se construit et se raconte : dépôt, bibliothèque, extension, script, matériel |
| Le visiteur vient pour | s'en servir | lire comment c'est fait, récupérer le code |
| Dossier | `outils/` (l'app elle-même) | `projets/` (seulement si une page est hébergée ici, ex. une doc) |
| Catégorie de l'article | `tool` | `project` |
| Page listée | Outils | Projets |

Avoir son propre dépôt git n'est **pas** le critère : c'est une question d'organisation du code, qui peut
changer (guitestyle vit dans ce dépôt, json-helper dans le sien, et tous deux sont des projets).

### 1. Où vit une app

L'app (page web autonome) va dans `outils/`.

### 2. Sa forme : un fichier ou un dossier

- **Fichier unique** : `outils/nom.html`, servi à `/outils/nom.html`.
  Bien pour une petite app sans dépendance : tout tient dans un fichier, facile à copier et à lire.
  En revanche, ça devient vite long et on ne peut rien découper (JS, CSS, données, tests).
- **Dossier** : `outils/nom/index.html` plus le reste du code à côté, servi à `/outils/nom/`.
  Bien dès qu'il y a plusieurs fichiers : modules, données, service worker, tests.
  Les fichiers qui ne doivent pas être publiés (sources, tests, notes) vont dans `exclude` de `_config.yml`.

Idem pour une page hébergée dans `projets/`. Le nom est celui de l'app, en minuscules et sans accent.

### Référencement

Une app n'apparaît sur sa page **que** via son article `_posts/AAAA-MM-JJ-nom.md`, dans la catégorie
correspondante, avec un lien vers l'app (voir `_posts/_template-article.md`). Il n'y a pas d'autre liste à tenir à jour.

Existant :

| Nom            | Nature | Forme   | Chemin                    |
|----------------|--------|---------|---------------------------|
| icomkr         | outil  | fichier | `outils/icomkr.html`      |
| gueathub       | outil  | dossier | `outils/gueathub/`        |
| Fléchettes     | outil  | fichier | `outils/flechettes.html`  |
| Drôle de Yam's | outil  | fichier | `outils/yams.html`        |
| guitestyle     | projet | dossier | `assets/guitestyle/` + doc `projets/guitestyle/` |
| json-helper    | projet | dépôt   | [guitehub/json-helper](https://github.com/guitehub/json-helper) |

`projets/yams.html` est une redirection vers `outils/yams.html`, gardée pour les raccourcis déjà partagés.

---

## TODO

- Breadcrumbs
- Analytics
- Redesign homepage

.BMDTU