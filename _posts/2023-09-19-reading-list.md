---
title: Database Reading List
layout: default
tags: [databases]
pinned: true
blog_post: true
---

## Database Reading List

I started reading DB and Systems related literature in June'23, and I try to keep this page
updated with some of the papers, blogs and talks I found interesting. More recently read
papers should be at the top, but often I catalog some old papers just to make sure I actually
remember what they were about.

Please report errors [on GitHub](https://github.com/ankitsultana/ankitsultana.github.io).

### Recommended

---

<div class="paper-desc">
The Log-Structured Merge-Tree (LSM-Tree). <a href="https://www.cs.umb.edu/~poneil/lsmtree.pdf">link</a>
</div>

This seminal paper from the 90s introduced what would become the foundation of many NoSQL and KV databases.
Highlights of the paper (for me) were: 1) the motivation for this was to support indexing for use-cases with
high-write throughput 2) key difference with B-Trees was the approach to buffer writes in-memory and flush
to the first level after a threshold is reached 3) the mathematical proof for the theorem that states that
for a given largest-component size of a LSM Tree with some given ingestion rate, the total page I/O rate
to perform all merges is minimized when the ratios between consecutive components is a common value. In other
words, the component sizes should form a geometric progression.

To be honest, I didn't go super deep into this paper and I hope to do that once I implement a LSM Tree
in Zig/Rust later.

On a related note, there are a ton of resources online for LSM Trees from some of the most popular DBs.
This talk [by Igor and Mark](https://www.youtube.com/watch?v=jGCv4r8CJEI) from Facebook explains the high-level
design for RocksDB really well. [TigerBeetle](https://docs.tigerbeetle.com/internals/lsm) folks have notes to
make it easy to understand their LSM code. Neon also has their own implementation which is briefly talked 
about [in this talk](https://www.youtube.com/watch?v=rES0yzeERns).

**Digression**: In programming competitions, the concept of leveraging powers of two is extremely common in certain 
data-structures and algorithms. Examples: Heavy Light Decomposition, [Sparse Table / RMQ / Tree LCA](https://www.topcoder.com/thrive/articles/Range%20Minimum%20Query%20and%20Lowest%20Common%20Ancestor), etc.

---

<div class="paper-desc">
A Deep Dive into Common Open Formats for Analytical DBMSs. <a href="https://arxiv.org/pdf/1402.6407.pdf">link</a>
</div>

This paper analyzes three popular open formats: ORC, Parquet and Arrow, and compares results across many relevant
factors: compression ratios at data-type level, transcoding throughput, query performance, etc. The paper also goes
deep into why a certain format does/does-not perform well for certain benchmarks. There are too many great results
shared in the paper to be included in a brief description and I found myself highlighting a significant chunk of
the paper, but I can share three which I found most relevant for myself: 1) Parquet has better disk size compression
than ORC 2) ORC has better query performance 3) Both ORC and Parquet automatically switch from dict encoding to
plain encoding when number of distinct values is greater than a threshold.

---

<div class="paper-desc">
Better bitmap performance with Roaring bitmaps. <a href="https://arxiv.org/pdf/1402.6407.pdf">link</a>
</div>

Roaring is one of the most commonly used bitmap implementations: it is used in Pinot, Druid, Spark, M3, etc. Roaring can be used
as a bitmap for ~2<sup>32</sup> elements. It partitions the range of all elements into chunks of 2<sup>16</sup>, with each chunk
sharing the 16 MSBs. When a chunk contains <4096 elements, it is stored as a sorted array of 2<sup>16</sup> bit integers. Otherwise,
a bitmap is used. The paper also shares the algorithms used for union and intersection, and compares the performance of Roaring
with other Bitmap implementations (BitSet, Concise, WAH).

One important thing to understand about the Roaring design is: it doesn't use RLE and is instead designed for optimized
random reads. WAH and Concise can give better compression when there are long runs of consecutive values in the dataset.

Moreover, for low cardinality random set of integers, it is [2-3x worse](https://github.com/ankitsultana/weekend/tree/main/roaring/src/main/java/com/ankitsultana/experiments) in terms of size (vs if you were to store the set as
a array of 4-byte integers directly). The paper also calls it out and they do mention that for density lower than 0.1% a
bitmap is anyways unlikely to be the proper data structure. A direct implication of this is that keeping a inverted index
in Databases for high cardinality columns like Pinot/Druid which use Roaring for the same will add quite a bit of overhead.

However, the "quite a bit of overhead" claim has a nuance of its own: usually the index overhead is measured relative to the
data size. So if your column was a string type with mostly unique UUIDs, the overhead would be relatively lower vs if the column
was a Int/Long type with mostly unique values.

---

<div class="paper-desc">
Volcano— An Extensible and Parallel Query Evaluation System. <a href="https://paperhub.s3.amazonaws.com/dace52a42c07f7f8348b08dc2b186061.pdf">link</a>
</div>

A seminal paper, Volcano introduced the `Operator#getNextBlock` based design which is used by Apache Pinot.
It also introduced the concept of supporting query parallelism with the help of the exchange operator.
A volcano based design has demand driven dataflow within processes and data-driven dataflow across
processes. This is also how Pinot's Multistage Engine is designed.

The paper describes several foundational concepts: the build/probe phases for a hash join,
horizontal, vertical and bushy parallelism, etc. Having worked on Pinot's Multistage Engine, I was surprised by 
how much of what is described in the Volcano paper is still prevalent in modern systems like Pinot.

---

<div class="paper-desc">
Morsel-Driven Parallelsim: A NUMA-Aware Query Evaluation Framework for the Many-Core Age <a href="https://db.in.tum.de/~leis/papers/morsels.pdf">link</a>
</div>

Shared by the folks at [HyPer](https://dbdb.io/db/hyper) DB 
([acquired by Tableau](https://www.tableau.com/about/press-releases/2016/tableau-acquires-hyper) in 2016), this paper
introduces a new approach to scheduling queries which can lead to huge speedups in query performance in NUMA systems.
The paper first talks about the Volcano based approach of query execution which it calls plan-driven query execution.
It highlights that in Volcano-based parallel query execution frameworks, parallelism is hidden from the operators
and shared state is avoided. The operators do partitioning and implement parallelism using Exchange operators.
The authors state that Morsel-wise processing can be implemented into many existing systems.

In [one of the DuckDB talks](https://www.youtube.com/watch?v=5fXCKlZAHGA&t=1236s) by Mark, it is pointed out that implementing
this is a bit more complex than implementing Volcano style operators, because when operators become parallelism aware,
exactly what the operator does starts to matter.

In the talk it is also claimed that Volcano style query execution has issues with parallel execution because of "load imbalance",
"plan explosion" and "materialization costs". "Load Imbalance" refers to scenarios where # of rows for one key can be much higher than
other keys. This does make sense as it can lead to higher latencies and under-utilization of resources. "Plan Explosion" I think can
be avoided by reusing the plan, since each Operator chain in a Volcano based model is running the same plan anyways.
"Materialization Costs" can definitely be a issue if one relies on Exchange to increase/decrease parallelism (for a in-memory system).

---

<div class="paper-desc">
DiDi: Mitigating The Performance Impact of TLB Shootdowns Using a Shared TLB Directory. <a href="https://yoav.net.technion.ac.il/files/2016/05/DiDi-PACT-2011.pdf">link</a>
</div>

This is a really well-written paper imo and I think anyone with even a minimal background would enjoy reading it. The
paper talks about how a TLB Shootdown looks like at the chip level and even shares some numbers on the percentage of
CPU time lost due to the same. A big highlight for me was that the percentage of CPU time lost can go as high as 20+%
with even 64 cores (depending on the access pattern). One problem highlighted by the paper is that the OS page table
often contains false positives: some cores that don't have a page cached are marked as if they have it, and during a
TLB shootdown this leads to more processors getting interrupted than needed. This not only increases the time taken
by the CPU that triggered the shootdown to resume execution, it also of course interrupts more cores than needed.
Moreover, the percentage of false positives increases with an increase in the number of cores, leading to particularly
worse off performance for high core system.

The proposed solution, DiDi (Dictionary Directory), is designed to minimize these false positives, and it can
yield 1-3x speedup.

I am not sure what the status of this proposal is though, and if anyone has implemented it or not.

---

<div class="paper-desc">
The Part of PostgreSQL We Hate the Most <a href="https://ottertune.com/blog/the-part-of-postgresql-we-hate-the-most">link</a>
</div>

Explains why Postgres' MVCC sucks: Postgres uses a append-only storage scheme and even for single column updates copies over
the entire row from the previous version, which leads to huge write amplification; dead tuples occupy quite a lot of space,
particularly when compared with MySQL's approach of storing delta versions, which leaves a lot for Vacuum to deal with;
single column update requires updating all the indexes for that table since indexes store the physical location of the
latest tuple; and finally, Vacuum management is a bit tricky with a bunch of configs.

This is one of those articles that's worth a re-read, and during a re-read I was wondering: Postgres' storage engine might be
a good fit for some TSDB use-cases. Afaik [TimescaleDB](https://dbdb.io/db/timescaledb) is based on Postgres and
is under active development.

I would also call out that they mention [Uber's blog post](https://www.uber.com/blog/postgres-to-mysql-migration/) about
why they switched from Postgres to MySQL. That is also a great blog post and I'd highly recommend if you have not read it
already.

One final note on the Ottertune blog: as they have called out, Postgres is still quite an amazing choice particularly for
use-cases that are not write heavy (has a ton of extensions, query throughput/latency can be 
[better than MySQL](http://smalldatum.blogspot.com/2023/01/the-insert-benchmark-on-arm-and-x86.html), etc.)
