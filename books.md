---
layout: main
---

## Books

I started reading regularly in Dec'2019 and have not stopped since. I enjoy fiction the most
but occasionally also try books around personal-development, biographies, etc.

I use this page to get myself into the habit of writing more. Below you can find
a list of my recommended books; books that I have read recently; and, some
random ramblings around the same.

I am quite active on [Goodreads](https://www.goodreads.com/user/show/33989424-ankit-sultana)
as well.

---

### Ramblings

<ul class="related-posts">

{% assign blog_posts = site.posts | where: 'book_rambling', true %}
{% for post in blog_posts %}
    <li class="main-page-list">
        <h4>
            <div style="display: inline-block; width: 90px">
                <small>{{ post.date | date: "%Y-%m-%d" }}</small>
            </div>
        <a class="una" href="{{ site.baseurl }}{{ post.url }}">
            <span>{{ post.title }}</span>
        </a>
        </h4>
    </li>
    {% if forloop.last %}</ul>{% endif %}
{% endfor %}

---

### Recommended

<ul class="related-posts">

{% assign blog_posts = site.posts | where: 'recommended_book', true %}
{% for post in blog_posts %}
        <li class="main-page-list">
            <h4>
            <a class="una" href="{{ post.goodreads_url }}">
                <span>{{ post.title }}</span>
            </a>
                <small>by {{ post.author }}.</small>
                <small>published {{ post.year }}.</small>
            </h4>
        </li>
        {% if forloop.last %}</ul>{% endif %}
{% endfor %}


---

### Recently Read

<ul class="related-posts">

{% assign book_reviews = site.posts | where: 'book', true %}
{% for post in book_reviews limit:10 %}
        <li class="main-page-list">
            <h4>
            <div style="display: inline-block; width: 90px">
                <small>{{ post.date | date: "%Y-%m-%d" }}</small>
            </div>
            <div>
            <a class="una" href="{{ post.goodreads_url }}">
                <span>{{ post.title }}.</span>
            </a>
            <small>by {{ post.author }}.</small>
            <small>published {{ post.year }}.</small>
            </div>
            </h4>
        </li>
        {% if forloop.last %}</ul>{% endif %}
{% endfor %}
