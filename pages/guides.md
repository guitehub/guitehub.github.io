---
layout: default
title: Guides/tutos
image: 4ba74bc3-ec0f-4fc0-98e1-643cea9c8247.png
is_main: true
---

# Guides.

Guides et tutoriels logiciels ! Ici, retrouvez conseils, astuces et étapes pour maîtriser divers logiciels et applications. Que vous cherchiez à optimiser votre productivité, à apprendre de nouvelles compétences ou à résoudre des problèmes courants.

<div class="row row-cols-1 row-cols-md-2 g-4">
{% for post in site.posts %}
  {% if post.categories contains "guides" %}
    {% include template-card.html link=post.url title=post.title image=post.image icon=post.icon %}
  {% endif %}
{% endfor %}
</div>

<br>
<br>