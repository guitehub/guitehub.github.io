---
layout: post
title: "Mise en place d’un environnement de développement Jekyll"
date: 2024-12-09
categories:
- guide
- dev
author: "La Guite"
image: "jekyll-logo-dark-solid.jpg"
---

### **Guide pratique : Mise en place d’un environnement de développement Jekyll**

Ce guide explique comment configurer un environnement de développement pour un site Jekyll sur Windows, en tenant compte des spécificités de cet OS et des éventuels problèmes liés aux dépendances.

<div class="tldr" markdown="1">
<p class="tldr-tag">tl;dr</p>

```bash
# 1. installer Ruby 3.2.x avec DevKit (rubyinstaller.org) et Git
gem update --system                # 2. mettre RubyGems à jour
gem install bundler                # 2. Bundler
ridk install                       # 2. outils de compilation (MSYS2)
gem install jekyll                 # 3. Jekyll
jekyll new mon-site                # 3. nouveau site (ou git clone, voir 4.)
cd mon-site
bundle install                     # 3. dépendances du projet
bundle exec jekyll serve           # 3. → http://localhost:4000
```
</div>

---

### **1. Pré-requis**
Avant de commencer, assurez-vous d'avoir installé :
1. **Ruby** :  
   Téléchargez Ruby **avec DevKit** depuis [rubyinstaller.org](https://rubyinstaller.org/).  
   - Choisissez la version 3.2.x (recommandée pour Jekyll).
   - Pendant l'installation, activez l’option pour configurer **MSYS2**.
   
2. **Node.js** (optionnel, pour certains plugins) :  
   Installez la version LTS depuis [nodejs.org](https://nodejs.org/).

3. **Git** :  
   Téléchargez et installez depuis [git-scm.com](https://git-scm.com/).

4. **Navigateur web** :  
   Pour prévisualiser le site (par défaut, disponible à `http://localhost:4000`).

---

### **2. Configuration initiale**

#### a. Installer Ruby et vérifier les outils
1. **Installer Ruby avec DevKit**.  
   Pendant l’installation, suivez les instructions pour configurer MSYS2.

2. **Mettre à jour RubyGems et Bundler** :
   ```bash
   gem update --system
   gem install bundler
   ```

3. **Vérifier les outils de développement (Windows)** :  
   Assurez-vous que les outils nécessaires sont installés avec MSYS2 :
   ```bash
   ridk install
   ridk exec pacman -Syu
   ridk exec pacman -S --needed base-devel mingw-w64-x86_64-toolchain
   ```

---

### **3. Créer un nouveau site Jekyll**

#### a. Installation de Jekyll
Installez Jekyll globalement :
```bash
gem install jekyll
```

#### b. Créer un nouveau projet
Générez un nouveau site Jekyll :
```bash
jekyll new mon-site
cd mon-site
```

#### c. Installer les dépendances du projet
```bash
bundle install
```

#### d. Démarrer le serveur Jekyll
Lancez le serveur de développement :
```bash
bundle exec jekyll serve
```

Visitez le site dans votre navigateur à [http://localhost:4000](http://localhost:4000).

---

### **4. Travailler sur un site existant**

#### a. Récupérer le dépôt
Clonez le dépôt de votre site :
```bash
git clone https://github.com/votre-utilisateur/votre-repo.git
cd votre-repo
```

#### b. Installer les dépendances
Assurez-vous d’avoir le fichier `Gemfile` et exécutez :
```bash
bundle install
```

#### c. Résolution des problèmes courants
- **Erreur avec `wdm` sous Windows** :  
  Si vous rencontrez des erreurs liées à `wdm`, commentez cette ligne dans le `Gemfile` :
  ```ruby
  # gem "wdm", "~> 0.1.1", platforms: [:mingw, :x64_mingw, :mswin]
  ```
  Relancez l’installation :
  ```bash
  bundle install
  ```

- **Dépendances obsolètes ou en conflit** :  
  Si une erreur persiste, essayez :
  ```bash
  bundle update
  ```

---

### **5. Notes et astuces importantes**

#### a. Contexte Windows
- **Compatibilité des gems** :  
  Certains gems nécessitent des compilations natives (ex. : `ffi`, `wdm`). Assurez-vous que MSYS2 est correctement installé.
- **Pas de `wdm` ?** : Utilisez cette commande pour éviter les problèmes de rechargement automatique :
  ```bash
  bundle exec jekyll serve --no-watch
  ```

#### b. Verrouiller les versions
Pour éviter les conflits futurs, utilisez des versions précises dans votre `Gemfile`. Par exemple :
```ruby
gem "jekyll", "~> 4.3.4"
gem "minima", "~> 2.5.2"
```

#### c. Résolution des warnings Sass
Vous pouvez migrer vos fichiers Sass pour remplacer les règles `@import` par `@use` :
- Remplacez :
  ```scss
  @import "minima";
  ```
- Par :
  ```scss
  @use "minima";
  ```

---

### **6. Ressources supplémentaires**

- [Documentation officielle de Jekyll](https://jekyllrb.com/docs/)
- [Dépôt GitHub de Jekyll](https://github.com/jekyll/jekyll)
- [Dépôt GitHub pour `wdm`](https://github.com/Maher4Ever/wdm)

---

En suivant ce guide, vous devriez pouvoir configurer un environnement fonctionnel pour travailler avec Jekyll, même sur Windows. En cas de problème, les logs d’erreur sont souvent très utiles pour identifier et résoudre les conflits. 😊