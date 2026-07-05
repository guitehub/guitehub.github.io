---
layout: post

title: "Économie de consommation facile sur CPU AMD AM5 sans perte de performance"
date: 2026-07-04
author: "La Guite"

categories:
  - blog
  - guide

image: 255d9da4-914c-46ca-8e21-ef9ab599785a.png
---

# Économie de consommation facile sur CPU AMD AM5 sans perte de performance

En jouant un peu avec le BIOS de la carte mère il est possible de baisser facilement la consommation brute du processeur sans perdre le moindre FPS en jeu. La manip est rapide et sûre.


## Accéder aux bons réglages

À noter : ces réglages sont ici décrits pour une carte mère **ASUS**, mais l'idée et les menus sont très souvent similaires sur les autres marques.

Redémarrez sur le BIOS (touche en fonction du fabricant), puis appuyez sur **F7** pour passer en mode avancé. Rendez-vous ensuite dans :

**AI Tweaker → Precision Boost Overdrive**

## Étape 1 — Activer l'AMD Eco Mode

>L'Eco Mode impose au processeur une limite de puissance absolue plus basse, ce qui réduit sa consommation et sa chauffe. Comme les CPU modernes atteignent l'essentiel de leurs performances en jeu bien avant leur puissance maximale, on perd très peu, voire rien, en pratique.

Dans **Precision Boost Overdrive (PBO)**, sélectionnez **AMD Eco Mode**.

![ECO mode](/assets/images/signal-2026-07-05-01-04-17-361_002.jpg)

Vous pouvez ensuite choisir le mode : **105 W** est un bon compromis pour un usage polyvalent. Personnellement je suis sur le mode **65 W**, mais c'est parce que ce PC est dédié aux LAN et ne sert qu'au jeu donc vraiment pas besoin de toute la puissance CPU.

![ECO mode](/assets/images/signal-2026-07-05-01-04-39-594_002.jpg)

Petit détail à garder en tête : ces valeurs (65, 105…) ne correspondent pas aux vrais watts consommés, c'est une estimation basée sur [un calcul interne assez obscur](https://www.cowcotland.com/news/81556/amd-clarifie-les-notions-de-tdp-et-ppt-pour-les-processeurs-ryzen-7000.html).

## Étape 2 — Le Curve Optimizer

>Le Curve Optimizer applique un undervolting : il abaisse la tension fournie au processeur pour un même niveau de performance. Résultat, le CPU consomme et chauffe encore moins, et peut même se montrer plus stable en fréquence ; d'où l'intérêt de combiner les deux réglages.

Un peu plus bas dans le menu, cherchez le **Curve Optimizer**.

![ECO mode](/assets/images/signal-2026-07-05-01-08-05-565_002.jpg)

Si rien n'est configuré, mettez les valeurs suivantes :

- **Curve Optimizer** : All cores
- **All Core Curve Optimizer Sign** : Negative
- **All Core Curve Optimizer Magnitude** : 15 à 20 sans problème

Au-delà de 20, il faut y aller progressivement : augmentez par petits crans et vérifiez la stabilité à chaque fois. Le jour où ça finit par crasher, revenez simplement à la dernière valeur stable.

Quelques repères rapides :
- Si vous avez déjà une valeur **supérieure à 20**, ne touchez à rien.
- Si vous êtes **en dessous**, montez à 20.

## Le résultat

Une fois ces réglages appliqués, on obtient un CPU qui consomme nettement moins, chauffe moins… et tout ça sans le moindre impact sur les performances en jeu. Difficile de faire plus rentable comme optimisation.