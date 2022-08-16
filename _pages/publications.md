---
layout: page
permalink: /publications/
title: Publications
description: publications by categories in reversed chronological order.
years: ['2022', '2021', '2020', '2019', '2018']
titles: ['TPAMI', 'ICML', 'NeurIPS', 'CVPR', 'TIP', 'AAAI', 'IJCAI', 'MM' ]
authors: ['Yang Zhiyong', 'Xu Qianqian', 'Bao Shilong', 'Zitai Wang', 'Wen Peisong', 'Jiang Yangbangyan' ,'Ma Ke', 'Cao Tianwei', 'Hou Wenzheng', 'Cao Zongsheng', 'Hao Qianxiu', 'Jiang Xuan']
nav: true
nav_order: 1
---
<!-- _pages/publications.md -->
<div class="publications">

{%- for y in page.years %}
  <h2 class="col-sm-10" style="padding-top: 1rem; margin-bottom:2rem; margin-top: 2rem; border-bottom: 1px solid rgba(0,0,0,0.3); color: rgb(189, 37, 181); padding-left: 0px;"><a href="#">{{y}}</a></h2>
  {%- for t in page.titles %}
    {%- for author in page.authors %}
      {% bibliography -f papers -q @*[year={{y}} && abbr={{t}} && first_author={{author}}]* %}
    {% endfor %}
  {% endfor %}
{% endfor %}

</div>
