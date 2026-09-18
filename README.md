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

Une app (page web autonome) se range selon deux axes indépendants.

### 1. Sa nature : le dossier, la catégorie et la page vont ensemble

| Nature | Dossier     | Catégorie de l'article | Page listée |
|--------|-------------|------------------------|-------------|
| Projet | `projets/`  | `project`              | Projets     |
| Outil  | `outils/`   | `tool`                 | Outils      |

### 2. Sa forme : un fichier ou un dossier

- **Fichier unique** : `outils/nom.html`, servi à `/outils/nom.html`.
  Bien pour une petite app sans dépendance : tout tient dans un fichier, facile à copier et à lire.
  En revanche, ça devient vite long et on ne peut rien découper (JS, CSS, données, tests).
- **Dossier** : `outils/nom/index.html` plus le reste du code à côté, servi à `/outils/nom/`.
  Bien dès qu'il y a plusieurs fichiers : modules, données, service worker, tests.
  Les fichiers qui ne doivent pas être publiés (sources, tests, notes) vont dans `exclude` de `_config.yml`.

Idem pour `projets/`. Le nom est celui de l'app, en minuscules et sans accent.

### Référencement

Une app n'apparaît sur sa page **que** via son article `_posts/AAAA-MM-JJ-nom.md`, dans la catégorie
correspondante, avec un lien vers l'app (voir `_posts/_template-article.md`). Il n'y a pas d'autre liste à tenir à jour.

Existant :

| App        | Nature | Forme   | Chemin                    |
|------------|--------|---------|---------------------------|
| icomkr     | outil  | fichier | `outils/icomkr.html`      |
| gueathub   | outil  | dossier | `outils/gueathub/`        |
| Fléchettes | projet | fichier | `projets/flechettes.html` |
| Yam's      | projet | fichier | `projets/yams.html`       |

---

## TODO

- Breadcrumbs
- Analytics
- Redesign homepage

.BMDTU