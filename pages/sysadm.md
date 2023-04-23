---
layout: default
title: Sysadm toolbox
categories:
- sysadm
image: 60db33f1d68e4a5665cf9d5eae393e3cf5e4b315.png
is_main: true
---

# Sysadming

42

<div class="row row-cols-1 row-cols-md-2 g-4">
{% for post in site.posts %}
  {% if post.categories contains "sysadm" %}
    {% include template-card.html link=post.url title=post.title image=post.image icon=post.icon %}
  {% endif %}
{% endfor %}
</div>

<br>

## Todo next :

### <i class="bi bi-windows"></i> Windows 
- Comment ....
- Mes setups ....

### <i class="bi bi-code-square"></i> PowerShell
- [Smart-Copie ADUser : script (soon)]()

### <i class="bi bi-braces"></i> Python
- [tuto](../py_start_guide/fu.py)
- [NetScan]()

<br>
<br>