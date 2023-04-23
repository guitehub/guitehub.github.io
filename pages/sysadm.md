---
layout: default
title: Sysadm toolbox
categories:
- sysadm
image: 60db33f1d68e4a5665cf9d5eae393e3cf5e4b315.png
is_main: true
---

<main class="container mt-5">
  <h1>Articles de "{{ page.categories }}"</h1>

  {% for post in site.posts %}
  {% if post.categories contains page.categories %}
    <h3>{{ post.title }}</h3>
    <p>{{ post.content }}</p>
  {% endif %}
  {% endfor %}

</main>

<hr>

## <i class="bi bi-windows"></i> Windows 
- Comment ....
- Mes setups ....

## <i class="bi bi-code-square"></i> PowerShell
- [AD-users-mgmt_GUI](/_posts/AD-users-mgmt_GUI.md)
- [Smart-Copie ADUser : script (soon)]()

## <i class="bi bi-ubuntu"></i> Unix
- [Guide : First setup Ubuntu Serveur](./pages/guides/ubuntu_first_setup.md)

## <i class="bi bi-braces"></i> Python
- [tuto](../py_start_guide/fu.py)
- [NetScan]()

<div class="row row-cols-1 row-cols-md-2 g-4">
{% for post in site.posts %}
  {% if post.categories contains "sysadm" %}
    {% include template-card.html link=post.url title=post.title image=post.image icon=post.icon %}
  {% endif %}
{% endfor %}
</div>

<br>
<br>