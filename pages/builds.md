---
layout: default
title: Montages de PC
image: 22bfaabf-0395-4b34-81f6-e49faa659567.png
is_main: true
---

# Montages

Astuces, conseils et tutoriels pour vous aider à choisir les composants adaptés à vos besoins, apprendre les techniques de montage et optimiser les performances de votre machine.

Plus de détails sur [pcpartpicker.com](https://fr.pcpartpicker.com/user/gchamort/builds/){:target="_blank"} <i class="bi bi-pci-card"></i>

<div class="row row-cols-1 row-cols-md-2 g-4">
{% for post in site.posts %}
  {% if post.categories contains "build" %}
    {% include template-card.html link=post.url title=post.title image=post.image icon=post.icon %}
  {% endif %}
{% endfor %}
</div>

<br>
<br>