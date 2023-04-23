---
layout: default
title: Articles
image: 12e8ca3f-c436-49c7-9712-6b14c233272d.png
---

# Bonjour Monde.

Technologies émergentes, cybersécurité, réseaux, programmation, ... Découvertes, analyses et réflexions pour se tenir au courant ou donner l'inspiration. Que vous soyez un pro de l'informatique, un amateur curieux ou un débutant dans le monde de la technologie.

##### basicaly du shitposting

<div class="row row-cols-1 row-cols-md-2 g-4">
{% for post in site.posts %}
  {% if post.categories contains "blog" %}
    {% include template-card.html link=post.url title=post.title image=post.image icon=post.icon %}
  {% endif %}
{% endfor %}
</div>