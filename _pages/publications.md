---
layout: page
permalink: /publications/
title: publications
description: publications by categories in reversed chronological order.
years: ['2022', '2021', '2020', '2019']
titles: ['TPAMI', 'ICML', 'NeurIPS', 'CVPR', 'TIP', 'AAAI', 'MM' ]
nav: true
nav_order: 1
---
<!-- _pages/publications.md -->
<div class="publications">

{%- for y in page.years %}
  <h2 class="col-sm-10" style="padding-top: 1rem; margin-bottom:2rem; margin-top: 2rem; border-bottom: 1px solid rgba(0,0,0,0.3); color: rgb(189, 37, 181); padding-left: 0px;">{{y}}</h2>
  {%- for t in page.titles %}
    {% bibliography -f papers -q @*[year={{y}} && abbr={{t}}]* %}
  {% endfor %}
{% endfor %}

</div>
