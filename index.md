---
layout: default
title: "/"
---

# Le Hub de La Guite

Dans l'insondable néant de l'existence, où la quête de sens se perd dans les méandres de l'absurdité, il est inévitable de se heurter à la terrible réalisation que, pour chaque problème qui s'entrelace dans la trame chaotique de notre réalité, aucune solution parfaite ne peut être trouvée, car l'imperfection est intrinsèquement tissée dans la nature même de notre être, nous rappelant sans cesse notre insignifiance face à l'immensité de l'univers qui nous engloutit sans remords ni pitié. -- La haine brute calmait l'âme sage
{:.blockquote}

<div class="container mt-5">
  <h2 class="mb-4">Derniers articles :</h2>
  <!-- Les cartes pour les articles récents -->
  <div class="row row-cols-1 row-cols-lg-3 row-cols-md-2 g-4">
    {% assign sorted_posts = site.posts | sort: "date" | reverse %}
    {% for post in sorted_posts limit:6 %}
    {% include template-card.html link=post.url title=post.title image=post.image %}
    {% endfor %}
  </div>
</div>
<br>

```c
malloc(ul);
```

### devnull keep

[Ma Sélection "Best of Hardware"](https://www.amazon.fr/hz/wishlist/ls/3IFKSFNZGXTL8?ref_=wl_share)

