---
layout: default
title: "/"
---

# Le Hub de La Guite

Des builds de PC, des notes de sysadmin tirées du terrain, des apps et outils pratiques.
Fait d'abord pour mon usage personnel, laissé en libre accès pour qui veut s'en inspirer.

## Derniers articles

<ul class="post-list">
  {% assign sorted_posts = site.posts | sort: "date" | reverse %}
  {% for post in sorted_posts limit:8 %}
    {% include post-list.html %}
  {% endfor %}
</ul>

```c
malloc(ul);
```

### devnull keep

[Ma Sélection "Best of Hardware"](https://www.amazon.fr/hz/wishlist/ls/3IFKSFNZGXTL8?ref_=wl_share)
