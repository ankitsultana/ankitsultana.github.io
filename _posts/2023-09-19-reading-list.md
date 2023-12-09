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

### Log

---

<div class="paper-desc">
BtrBlocks: Efficient Columnar Compression for Data Lakes <a href="https://www.cs.cit.tum.de/fileadmin/w00cfj/dis/papers/btrblocks.pdf">link</a>
</div>

Yet another great paper from folks at TUM. This paper introduces a new storage format for open data lakes that
supposedly gives 2.2x faster scans and is 1.8x cheaper (when compared with Parquet/ORC on a given benchmark).
The format combines 7 existing encoding schemes and 1 new encoding scheme (called Pseudodecimal Encoding).

Paper is , but I'll share a few things I found most noteworthy:
1) Parquet uses RLE, Dictionary, Bit-packing and variants of Delta encoding. The paper claims that
Parquet's set of rules to choose encoding schemes per-column is "simplistic". 2) BtrBlocks supports RLE,
Dictionary, Frequency, FOR + Bit-packing, FSST, Null vectors via Roaring,
and Pseudodecimal Encoding. 3) They have also used a variation of Frequency encoding, where they store the
top-value using a bitmap and the exception values separately. 4) Finding the right schemes to apply is hard
with these many schemes, hence they use a empirical approach, where they run each scheme on a sample and then
pick the best one. The overhead of this is kept low by keeping sample size to ~1%. The sample is computed
by taking consecutive runs of data across random samples 5) Pseudodecimal encoding is very interesting and I'd
recommend checking it out. At a high-level: it's a encoding scheme for floating point numbers. It works by
breaking down the number to 3 columns (2 integer columns and 1 floating point column for exceptions).
The integer columns store the significant digits and the exponent respectively. These 3 columns are then compressed
using separate compression schemes. However, some hit to decompression speed is expected.

Finally, I'd echo this aphorism on benchmarking: most benchmarks aren't fair, so don't rely on them for crucial decisions.

---

<div class="paper-desc">
Fair Benchmarking Considered Difficult: Common Pitfalls in Database Performance Testing <a href="https://mytherin.github.io/papers/2018-dbtest.pdf">link</a>
</div>

Not a lot to highlight here, but I'd like to use it as an excuse to echo the message: benchmarking is quite hard,
and a significant chunk of benchmarking shared online is either unfair, inaccurate, or intentionally
misleading. The paper does share some good examples to highlight that Database systems are quite complex, and many decisions
which may seem like minutiae can impact performance significantly. For instance, they outline one benchmark where MariaDB
performance was worse in comparison to some other DBs, mainly because one of the column types was set to DOUBLE
instead of DECIMAL.

One other example I'd share is the [CH benchmark](https://benchmark.clickhouse.com). The benchmark numbers indicate that Pinot
is 37x slower than CH, but when you look at the table-config you'll see that the [Pinot table](https://github.com/ClickHouse/ClickBench/blob/main/pinot/offline_table.json) used in the tests did not have any indexes.

In my opinion, there's no practical way to devise a "fair benchmark" for *most* databases. As a Engineer or Architect,
if you have to make a decision about which storage technology you should use, you need to do your own research or consult
some experts on the subject. Another thing I'd like to call out: there are *very few* people who have an
expertise in more than 1 Database.

---

<div class="paper-desc">
Umbra: A Disk-Based System with In-Memory Performance <a href="https://www.cidrdb.org/cidr2020/papers/p29-neumann-cidr20.pdf">link</a>
</div>

If you look at [the publications](https://umbra-db.com/#publications) section of Umbra's website,
you'll find that most of the papers seem really amazing and interesting. There's a lot of really cool work being done at
[TUM](https://www.tum.de/en/). Umbra is the successor to HyPer, which was a database optimized for in-memory workloads.

This paper though short is really dense with content. Some highlights: 1) They use Morsel based execution
(which they developed as part of HyPer), and they are able to pause queries in high load scenarios.
2) Their Buffer manager uses variable sized pages, which is implemented using anonymous mmap. They use madv_dontneed
when the page needs to be evicted. 3) Reads/Writes are using pread/pwrite. 4) Pointer swizzling via swips allows them to
avoid the necessity of having a PID to Page hash-table. This creates a problem during page eviction since multiple
swips may point to the same page. To solve this, they ensure that no two swips can point to the same page. This
also means that all their data structures have to be trees.

There's also a talk by Thomas in the [CMU DB group](https://www.youtube.com/watch?v=pS2_AJNIxzU) which is quite
informative. Some interesting highlights from that for me were: 1) Thomas mentioned that a big part of why Umbra was able to
beat HyPer in terms of performance was because of better statistics thanks to Reservoir Sampling during inserts and
HLL for column cardinality estimation. 2) They didn't use LLVM IR and instead went ahead with their own lightweight
implementation, which can do compilation for a query with 2k+ table joins in ~30ms.

---

<div class="paper-desc">
Velox: Meta's Unified Execution Engine <a href="https://vldb.org/pvldb/vol15/p3372-pedreira.pdf">link</a>
</div>

Velox made a big splash last year and it definitely marks a new phase in large scale database systems.
Velox is a pluggable, modular vectorized execution engine that can be plugged into many Data Processing Systems.
Meta in their paper confirmed that they have used it in around a dozen systems:
Presto, Spark, XStream (their Flink equivalent?), etc. The paper also mentions that many companies have
already started using Velox, and it was also discussed in CMU's
[Advanced Databases Course](https://www.youtube.com/watch?v=Zx4caucPF7s) this year.

At a minimum Velox's benefits are three-fold: 1) Written in C++, it is a execution engine that can be optimized
for the latest industry hardware 2) Existing systems like Presto can get 2-10x speedup based on the workload
3) Being pluggable it can be used across many systems.

For me the highlights of the paper were: 1) Velox uses the StringView representation presented in
[Umbra](https://db.in.tum.de/~freitag/papers/p29-neumann-cidr20.pdf) which differs from Arrow. 2) To optimize
for branch prediction failures, they create a bitmask out of the condition and subsequently process each
branch in a vectorised manner (I suspect this may be slower for some workloads) 3) If a deterministic
function is run on dictionary encoded input then only the distinct values can be transformed to their new
values (aka Peeling). 4) Velox's execution framework is based on Tasks, supports pausing execution via
a process wide memory arbiter and leverages memory pools for larger objects such as hash-tables for
locality and avoiding fragmentation (I didn't get how they avoid fragmentation).

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

~~One important thing to understand about the Roaring design is: it doesn't use RLE and is instead designed for optimized random reads. WAH and Concise can give better compression  when there are long runs of consecutive values in the dataset.~~ [see Errata #1]

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
[better than MySQL](http://smalldatum.blogspot.com/2023/01/the-insert-benchmark-on-arm-and-x86.html) in some cases, etc.)

---

### Errata

**1. 2023-11-04:** I claimed that Roaring doesn't use RLE in the Roaring paper summary. The paper does say that, but Roaring
as of version 0.5 (released in 2015) does support RLE via its RunContainers. You can read more about it
[in this great blog post](https://richardstartin.github.io/posts/roaringbitmap-performance-tricks) from Richard Startin.
