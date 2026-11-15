# guitestyle

Le socle de style du Hub de la Guite : jetons de design (variables CSS) et base typographique.
Utilisé par le blog et gueathub, et utilisable par n'importe quel projet.

Doc publiée (variables, aperçu, URL à copier) : <https://guitehub.github.io/projets/guitestyle/>

## Fichiers

| Fichier | Contenu | Stabilité |
|---|---|---|
| `tokens.css` | Variables uniquement (`--bg`, `--fg`, `--accent`, `--sans`…), clair/sombre | Contrat public : les noms ne bougent qu'en version majeure |
| `base.css` | Reset léger, corps, liens, `hr`, code. Sans classe ni mise en page | Peut s'ajuster en version mineure |
| `CHANGELOG.md` | Historique des versions | |

Ordre de chargement : `tokens.css`, puis `base.css`, puis les styles du projet.

## Utiliser

```html
<!-- En direct : suit chaque modification poussée sur le site -->
<link rel="stylesheet" href="https://guitehub.github.io/assets/guitestyle/tokens.css">
<link rel="stylesheet" href="https://guitehub.github.io/assets/guitestyle/base.css">

<!-- Figé sur une version (tag git, servi par jsDelivr) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/guitehub/guitehub.github.io@guitestyle-v1.0.0/assets/guitestyle/tokens.css">
```

Un projet peut écraser une variable après le chargement : `:root { --accent: #2a7; }`.

Thème : clair par défaut, sombre selon le système, ou forcé avec `data-theme="light"` / `"dark"` sur `<html>`.

## Versions

Semver, version écrite dans l'en-tête de chaque fichier et dans `CHANGELOG.md`.

- **correctif** (`1.0.1`) : valeur ajustée sans changer l'intention ;
- **mineure** (`1.1.0`) : variable ajoutée, couleur retouchée, règle de `base.css` modifiée ;
- **majeure** (`2.0.0`) : variable renommée ou supprimée.

Publier une version : mettre à jour les en-têtes et le changelog, committer, puis
`git tag guitestyle-vX.Y.Z && git push origin guitestyle-vX.Y.Z`.

Les tags sont préfixés parce que le dépôt contient tout le site. Conséquence : jsDelivr ne sert que des
versions exactes, sans canal « toute la v1 » (`@1`). Ce canal viendra si guitestyle sort dans son propre
dépôt (`git subtree split --prefix=assets/guitestyle`), avec des tags `vX.Y.Z` simples.

## Dans ce dépôt

- `_layouts/default.html` (blog) charge `tokens.css` et `base.css`, puis `assets/css/style.css`.
- gueathub charge seulement `tokens.css` (`outils/gueathub/index.html`, pré-caché par `sw.js`) :
  Tailwind fournit son propre reset.
- Fléchettes, Yam's et icomkr ont leurs propres variables et ne l'utilisent pas.
