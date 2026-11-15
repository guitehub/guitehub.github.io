---
layout: post
title: "guitestyle"
date: 2026-11-15
author: "La Guite"

categories:
#  - blog
#  - build
#  - guide
#  - sysadm
  - project

image: "vignette-guitestyle.svg"
---

# guitestyle — le style du site, réutilisable ailleurs

[Ouvrir guitestyle <i class="bi bi-arrow-right"></i>](/projets/guitestyle/){: .app-button}

À QUOI ÇA SERT
--------------
Plus jeune, pour faire un site, je collais le lien CDN de Bootstrap dans la page et tout
le style était là. guitestyle reprend cette idée pour l'allure de ce site : les couleurs,
les polices, le mode clair/sombre et une base typographique, à charger dans n'importe
quel autre projet avec deux lignes.

Si je retouche une couleur ici, les projets qui suivent guitestyle « en direct » la
reprennent tout seuls. Ceux qui ne doivent pas bouger restent sur une version figée.

COMMENT ON L'UTILISE
--------------------
1. **En direct** : le projet suit chaque modification publiée sur le site.

   ```html
   <link rel="stylesheet" href="https://guitehub.github.io/assets/guitestyle/tokens.css">
   <link rel="stylesheet" href="https://guitehub.github.io/assets/guitestyle/base.css">
   ```

2. **Figé sur une version** : rien ne change tant que le projet ne change pas de
   version dans l'adresse.

   ```html
   <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/guitehub/guitehub.github.io@guitestyle-v1.0.0/assets/guitestyle/tokens.css">
   ```

3. Dans son propre CSS, le projet utilise les variables (`color: var(--accent)`), et peut
   en remplacer certaines pour garder sa personnalité : `:root { --accent: #2a7; }`.

La [page du projet](/projets/guitestyle/) montre toutes les variables, avec leurs
valeurs en clair et en sombre, et les liens à copier.

SUR QUELLE TECHNO C'EST BÂTI
----------------------------
Rien d'autre que du CSS, servi par GitHub Pages avec le reste du site :

  - `tokens.css` ne contient que des **variables CSS** (`--bg`, `--fg`, `--accent`,
    `--sans`…). Ce sont leurs noms qui font le contrat avec les projets : une valeur peut
    changer, un nom ne disparaît qu'en version majeure ;
  - `base.css` pose le reset, le corps du texte, les liens et le code, sans aucune classe
    ni mise en page : chaque projet garde la sienne ;
  - les versions suivent le semver et sont des **tags git** (`guitestyle-v1.0.0`).
    [jsDelivr](https://www.jsdelivr.com/) sait servir n'importe quel fichier d'un dépôt
    GitHub à un tag donné : c'est ce qui fournit les versions figées, sans rien héberger
    de plus.

Le blog et [gueathub]({% post_url 2026-09-17-gueathub %}) sont les premiers à l'utiliser.
guitestyle vit pour l'instant dans le dépôt du site (`assets/guitestyle/`). Il prendra
son propre dépôt le jour où d'autres projets en dépendront vraiment.
