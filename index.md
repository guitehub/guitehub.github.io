---
layout: default
titre: 127.0.0.1
---

<main class="container mt-5">

  <h2 class="mb-4">Categories :</h2>

  <!-- Les cartes pour les pages principales -->
  <div class="row row-cols-1 row-cols-md-2 g-4">
    {% assign main_pages = site.pages | where_exp: "item", "item.path contains 'pages/blog.md' or item.path contains 'pages/builds.md' or item.path contains 'pages/guides.md' or item.path contains 'pages/sysadm.md'" %}
    {% for page in main_pages %}
    <div class="col">
      <a href="{{ page.url }}" class="text-decoration-none">
        <div class="card card-cover h-100 overflow-hidden text-bg-dark rounded-4 shadow-lg"
          style="background-image: url('{{ site.baseurl }}/assets/images/{{ page.image }}');">
          <div class="d-flex flex-column h-100 p-5 pb-3 text-shadow-1">
            <h3 class="pt-5 mt-5 mb-4 display-6 lh-1 fw-bold">{{ page.title }}</h3>
          </div>
        </div>
      </a>
    </div>
    {% endfor %}
  </div>
  <br>

  <h2 class="mb-4">Derniers articles :</h2>

  <!-- Les cartes pour les articles récents -->
  <div class="row row-cols-1 row-cols-md-2 g-4">
    {% assign sorted_posts = site.posts | sort: "date" | reverse %}
    {% for post in sorted_posts limit:4 %}
    {% include template-card.html link=post.url title=post.title image=post.image icon=post.icon %}
    {% endfor %}
  </div>

# Bienvenu sur GuiteHub, bonne balade

Ici, j'explore le monde fascinant des technologies de l'information, des logiciels aux matériels, en passant par les dernières innovations et tendances.

## 📰 [Blog](./pages/blog.md)
<!-- todo
{% for article in site.articles %}
  <li>
    <a href="{{ article.url | relative_url }}">{{ article.title }}</a>
  </li>
{% endfor %} -->

[Windaube 11](./pages/blog/winpoop11.md)


## Montage :
[Créations de PC](./pages/builds.md)

## Sysadm :
[administration de systèmes windows et linux](./pages/sysadm.md) :

---

## Guide achat / Bons plans
[Le bon NVMe 2TB **PAS CHER**](https://www.amazon.fr/gp/product/B08GVDNTGJ/ref=ppx_yo_dt_b_asin_title_o00_s00?ie=UTF8&psc=1), miam le ssd 

## devnull keep
[AIDA64 license keys](https://gist.github.com/thegreatestminer/af7a7d6cb3cafc0c5c146999c687d58d)

</main>