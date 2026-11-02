---
# ============================================================================
#  TEMPLATE D'ARTICLE — enregistrer sous AAAA-MM-JJ-mon-titre.md pour créer un article
#  (ce fichier-ci, préfixé "_", est ignoré par Jekyll : il ne sera jamais publié)
#  Décommente les lignes voulues, supprime/laisse les commentaires : à toi de voir.
# ============================================================================

layout: post
# layout: build        # ← utilise "build" pour un montage PC (active le bouton PCPartPicker via "link:")

title: "Titre de l'article"
date: 2026-06-13
author: "La Guite"

# --- Catégories : garde décommentée(s) celle(s) qui s'appliquent ------------
#     (au moins une ! sinon l'article n'apparaît dans aucune section)
categories:
  - blog
#  - build
#  - guide
#  - sysadm
#  - project        # app dans projets/ (voir README « Projets et outils »)
#  - tool           # app dans outils/

# --- Optionnel --------------------------------------------------------------
# image: "mon-image.jpg"                          # miniature (liste) + visuel d'en-tête, depuis assets/images/
# link: "https://fr.pcpartpicker.com/b/xxxxxx"    # uniquement pour "layout: build"
#
# --- Pour un projet / outil : bouton vers l'app, juste sous le titre ----------
#     fichier unique : [Ouvrir Nom <i class="bi bi-arrow-right"></i>](/outils/nom.html){: .app-button}
#     dossier        : [Ouvrir Nom <i class="bi bi-arrow-right"></i>](/outils/nom/){: .app-button}
#
# --- Pour un mémo / guide : encadré tl;dr, juste après l'intro ----------------
#     Les commandes à copier, commentées avec le numéro de la section qui les
#     explique. Pas d'antisèche en fin d'article (c'est le tl;dr), et pas de
#     phrase de transition après l'encadré : enchaîner directement sur « --- ».
#     Exemple : _posts/2026-10-21-cle_ssh_github.md
#
#     <div class="tldr" markdown="1">
#     <p class="tldr-tag">tl;dr</p>
#
#     ```bash
#     commande-1          # 1. ce qu'elle fait
#     commande-2          # 2. ce qu'elle fait
#     ```
#     </div>
---

Le contenu de l'article, en **Markdown**.

## Un sous-titre

Du texte, du `code`, etc.
