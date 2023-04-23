---
layout: default
title: Montages de PC
image: 22bfaabf-0395-4b34-81f6-e49faa659567.png
---

# Montages

Astuces, conseils et tutoriels pour vous aider à choisir les composants adaptés à vos besoins, apprendre les techniques de montage et optimiser les performances de votre machine. Que vous soyez un débutant curieux ou un bricoleur expérimenté.

<div class="row row-cols-1 row-cols-md-2 g-4">
{% for post in site.posts %}
  {% if post.categories contains "build" %}
    {% include template-card.html link=post.url title=post.title image=post.image icon=post.icon %}
  {% endif %}
{% endfor %}
</div>

## liens

- [The "MKBHD" (mat black everything)](https://fr.pcpartpicker.com/b/fcMv6h)

- ["do all" balanced build](https://fr.pcpartpicker.com/b/GxL2FT)

- [DICOM Workstation](https://fr.pcpartpicker.com/b/vwcTwP)

- [DICOM Workstation 2](./builds/PRIMEINT2304.md)