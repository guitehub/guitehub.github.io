---
layout: post
title: "Making of the mon site"
date: 2023-04-24
categories:
- blog
image: "Capture d’écran 2023-04-24 213723.png"
---

## Mon parcours de création de mon site web avec Jekyll et GitHub Pages

En à peine plus d'une journée, j'ai réaliser la création de mon propre site web avec ChatGPT comme partenaire. Mon objectif était de créer un site simple et élégant pour partager mon travail, mes connaissances et mes expériences avec le monde. Dans cet article, je vais vous guider à travers les étapes que j'ai suivies pour mettre en place mon site web en utilisant Jekyll et GitHub Pages.

### 1. Choisir Jekyll et GitHub Pages

J'ai longtemps chercher cet outil simple pour simplement "bloguer" sans me prendre la tête avec une base de donnée, de l'hérgement des accès, etc. Ayant passer un peu de temps à messayer au développement web j'ai notamment travailler dans la formation à Wordpress. Et après avoir étudié les différentes solutions pour créer un site web, j'ai choisi GitHub Pages, un service d'hébergement gratuit offert par GitHub pour héberger des sites web statiques.
En me familirisant avec Jekyll et GitHub Pages, j'ai pu créer et déployer mon site web rapidement et facilement.
D'autre part, Jekyll à l'avanatge de sa simplicité et sa flexibilité. Jekyll est un générateur de site statique qui convertit les fichiers Markdown en HTML. Il est idéal pour les blogs et les sites de documentation, et il est facile à personnaliser.

#### Configurer Github Pages

[Doc officielle](https://docs.github.com/fr/pages/quickstart){:target="_blank"}

Créez un compte GitHub (si vous n'en avez pas encore) :
Rendez-vous sur [https://github.com/](https://github.com/){:target="_blank"} et suivez les instructions pour créer un compte.

Créez un nouveau dépôt pour votre site :
Connectez-vous à votre compte GitHub.
Cliquez sur le bouton "New" (Nouveau) en haut à gauche de la page d'accueil.
Nommez le dépôt avec le format suivant : "username.github.io" (où "username" est votre nom d'utilisateur GitHub).
Cochez la case "Initialize this repository with a README".
Cliquez sur "Create repository" (Créer un dépôt).
Ajoutez du contenu à votre site :

Dans votre dépôt, cliquez sur le bouton "Add file" (Ajouter un fichier) puis sélectionnez "Create new file" (Créer un nouveau fichier).
Nommez le fichier "index.html" et ajoutez le contenu HTML de base pour votre site.
Cliquez sur "Commit new file" (Valider le nouveau fichier) en bas de la page.
Activez GitHub Pages :

Allez dans l'onglet "Settings" (Paramètres) de votre dépôt.
Faites défiler la page jusqu'à la section "GitHub Pages".
Sélectionnez la branche "main" comme source pour GitHub Pages.
Cliquez sur "Save" (Enregistrer).
Personnalisez votre site :
Vous pouvez maintenant personnaliser votre site en ajoutant et modifiant des fichiers HTML, CSS et JavaScript dans votre dépôt. Vous pouvez également utiliser un générateur de site statique comme Jekyll pour simplifier la gestion de votre contenu.

Consultez votre site :
Votre site est maintenant en ligne et accessible à l'adresse suivante : "https://username.github.io" (remplacez "username" par votre nom d'utilisateur GitHub).

### 2. Configurer Jekyll

J'ai créé un nouveau dépôt sur GitHub, ajouté les fichiers de base tel que le README et configuré GitHub Pages dans les paramètres du dépôt. , j'ai dû installer Ruby et Jekyll sur mon ordinateur. J'ai suivi les instructions de la documentation officielle de Jekyll pour installer Ruby, Bundler et Jekyll lui-même. Après avoir tout installé, j'ai cloné mon repos Github et l'ai transformé en projet Jekyll local en exécutant la commande `jekyll new .` depuis l'intérieur du repos.

### 3. Personnaliser le thème et le contenu

J'avais choisi un thème de base, Cayman, pour la première version de test du site web en modifiant le fichier `_config.yml`. J'ai également ajouté quelques pages principales et des articles de blog pour commencer. J'ai utilisé le langage de templating Liquid pour personnaliser le layout, le header et le footer de mon site.

J'ai également créé des "cards" pour afficher les pages principales et les articles récents sur la page d'accueil. J'ai utilisé Bootstrap pour mettre en forme les cards et les rendre responsive.

### 4. Résoudre les problèmes et améliorer le site

Au fur et à mesure que je développais le site, j'ai rencontré quelques problèmes, notamment des erreurs de déploiement et des problèmes de style. J'ai utilisé les logs de déploiement de GitHub Pages pour identifier et résoudre les erreurs. J'ai également ajusté le style et la mise en page pour m'assurer que mon site avait l'apparence souhaitée sur différents appareils.

![ouais](/assets/images/Capture d’écran 2023-04-24 221326.png){:.img-fluid .rounded .mx-auto .d-block}

### 5. Déployer le site avec GitHub Pages

Enfin, j'ai déployé mon site web en utilisant GitHub Pages. Mon site est maintenant en ligne et accessible à tous !

En conclusion, créer mon propre site web avec Jekyll et GitHub Pages a été une expérience enrichissante et éducative. J'ai appris à gérer et résoudre les problèmes, et j'ai découvert de nouvelles techniques pour personnaliser et améliorer mon site. Je suis ravi de partager mon travail et mes expériences avec le monde, et j'espère que mon site pourra inspirer d'autres personnes à créer leur propre site web.