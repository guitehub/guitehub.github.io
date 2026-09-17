# LaGuite's Github Pages

Link : [GuiteHub](https://guitehub.github.io)

## Getting Started

### Prerequisites

1. **Install Ruby with DevKit** :  
   Download and install from [rubyinstaller.org](https://rubyinstaller.org/downloads/).  
   - During installation, select the option to install **MSYS2**.

2. **Verify Ruby and Bundler installation** :  
   ```bash
   ruby -v
   gem install bundler
   ```

### Installation

1. **Install dependencies** :
   ```bash
   bundle install
   ```

2. **Run the development server** :
   ```bash
   bundle exec jekyll serve
   ```

3. **Open the site** :  
   Visit [http://localhost:4000](http://localhost:4000) in your browser.

### Troubleshooting

- If errors occur related to `wdm` on Windows, comment out the following line in the `Gemfile` and rerun `bundle install` :
  ```ruby
  gem "wdm", "~> 0.1.1", platforms: [:mingw, :x64_mingw, :mswin]
  ```

- To update all dependencies, run :
  ```bash
  bundle update
  ```

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
| Fléchettes | projet | fichier | `projets/flechettes.html` |
| Yam's      | projet | fichier | `projets/yams.html`       |

---

## TODO

- Breadcrumbs
- Analytics
- Redesign homepage

.BMDTU