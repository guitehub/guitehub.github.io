---
layout: post
title: "Fléchettes"
date: 2026-09-07
author: "La Guite"

categories:
#  - blog
#  - build
#  - guide
#  - sysadm
  - project

# image: "flechettes.png"
---

# Fléchettes — scoreur

[Fléchettes](/projets/flechettes.html)

À QUOI ÇA SERT
--------------
Un scoreur de fléchettes qui remplace le tableau : on saisit les volées,
les scores et les fins de manche sont gérés tout seuls — plus besoin de
calculer de tête.

Plusieurs modes de jeu :
  - 501 et 301 (x01, avec options double in / double out) ;
  - Cricket (avec ou sans points, cut-throat possible) ;
  - Horloge (tour de cadran).

COMMENT ON L'UTILISE
--------------------
1. On ajoute les joueurs et on choisit le mode.
2. On saisit chaque volée de fléchettes.
3. Les scores, marques et fins de manche se mettent à jour automatiquement.

SUR QUELLE TECHNO C'EST BÂTI
----------------------------
C'est une page web autonome, en un seul fichier (flechettes.html) :
HTML + CSS + JavaScript, sans aucune dépendance ni bibliothèque externe.

Tout se passe directement dans le navigateur — rien n'est envoyé sur un
serveur, donc ça fonctionne aussi hors-ligne.

L'habillage visuel reprend les couleurs, polices et le mode clair/sombre du
blog « Le Hub de la Guite » pour s'intégrer comme une page du site.
