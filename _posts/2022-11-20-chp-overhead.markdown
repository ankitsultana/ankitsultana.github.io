---
title: Java ConcurrentHashMap Memory Overhead
layout: default
tags: [java]
blog_post: true
---

## Java Concurrent HashMap Overhead

Today I was wondering if there exists an easy optimization for improving the memory usage for Apache Pinot's
Upsert feature. 

### Context

[Apache Pinot](https://pinot.apache.org/) is an open-source in-memory realtime OLAP database.
Pinot's biggest feature is its support for consuming data from streams like Kafka, allowing Kafka streams to be queried in
realtime. The realtime tables are append-only, but there were several use-cases which required the ability to "overwrite"
(or Upsert) an existing row. So support for Upsert tables was added.

Users need to define the primary-key columns for an upsert table.
For these tables, Pinot continues to append events and the segment structure is pretty much the same.
To make Upsert work, Pinot maintains an in-memory ConcurrentHashMap (CHP) from the primary-key of a row to its newest version.

### The Problem

Pinot MMAPs the segments in-memory but the Upsert CHP has to be kept in heap space and can't be MMAP'ed out.
As the number of primary keys on a server grow, the memory usage also grows, possibly becoming a bottleneck.

### Coming Back

So, around 2 hours ago I was wondering whether it's possible to improve this "easily". One premise was that perhaps CHP may
have a bit of memory overhead and it may be possible to replace it with a more efficient implementation. I ran some tests
for curiosity's sake and that premise seems wrong.

<div class="callout">
Pinot already provides a way to use a hashing function to hash the primary-keys to a 16-byte hash but that can cause
correctness issues due to hash-collision.
</div>

To estimate how much I might be able to optimize the memory overhead in CHP, I ran a test where I stored a bunch of (key, value)
pairs in a CHP, and for comparison I also ran a test where I stored the same objects in vanilla Arrays and ArrayLists.
Based on those, I found that **CHP adds a ~15% memory overhead** when compared with vanilla Array and ArrayLists.
Note that we can't meet the same functional requirements using Array/ArrayList, but the purpose of using them was
to find the least amount of memory I'll need to simply store the keys and values.

Moreover, the memory usage for a HashMap was roughly the same as that for a CHP, implying that CHP has a very low overhead
over a HashMap.

For the tests, I used POJOs which resemble the ones used by Pinot for storing Upsert metadata, however the tests don't really
rely on any special properties of the POJOs since the memory numbers are supposed to be assessed relative to each other.
I tested with a few different heap-sizes: ~200MB, ~1GB, etc. which were able to support 1M to 5M hash-map/array entries.

To estimate the memory needed for each of my tests, I essentially tried to find the lowest `Xmx` value that doesn't result in OOM.

The code for the tests is on [GitHub](https://github.com/ankitsultana/weekend/tree/main/java-map). Feel free to report any issues.

