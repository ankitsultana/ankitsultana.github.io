---
layout: main
---

## About

Hi! I am Ankit and welcome to this ever so unkempt corner of the internet that is my blog.
You can find my incoherent ramblings about things like books, tech, music, etc.

I am currently working as a software engineer at Uber which takes up most of my weekdays.

---

## Recently Written

<ul class="related-posts">

{% assign blog_posts = site.posts | where: 'blog_post', true %}
{% for post in blog_posts limit:3 %}
    <li class="main-page-list">
        <h4>
            <div style="display: inline-block; width: 90px">
                <small>{{ post.date | date: "%Y-%m-%d" }}</small>
            </div>
            <a href="{{ site.baseurl }}{{ post.url }}">
                <span>{{ post.title }}</span>
            </a>
        </h4>
    </li>
    {% if forloop.last %}</ul>{% endif %}
{% endfor %}


## What I Read Recently

<ul class="related-posts">

{% assign book_reviews = site.posts | where: 'book', true %}
{% for post in book_reviews limit:7 %}
    <li class="main-page-list">
        <h4>
        <a href="{{ post.goodreads_url }}">
            <span>{{ post.title }}</span>
        </a>
            <small>by {{ post.author }}.</small>
            <small>published {{ post.year }}.</small>
        </h4>
    </li>
    {% if forloop.last %}</ul>{% endif %}
{% endfor %}
