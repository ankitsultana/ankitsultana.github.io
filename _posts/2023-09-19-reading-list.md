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
Exploiting Cloud Object Storage for High Performance Analytics
 <a href="https://www.vldb.org/pvldb/vol16/p2769-durner.pdf">link</a>
</div>

OLAP use-cases have always been latency sensitive. The reduction in prices of SSDs over the last
decade have allowed an increasing number of OLAP use-cases to adopt SSDs, leading to a corresponding increase
in demand for OLAP databases. Even for use-cases which may not be mission-critical, one wants and can
get low-latency at a reasonable price.

However, SSDs continue to be much more expensive than HDDs and Object Stores, and there are quite a number of use-cases where
users have a large amount of data (100s of TB), modest QPS (in the 10s or <100) and sub-second p90 latency requirements.
Often, such use-cases have some access-pattern characteristics which allow data to be either cached or tiered. For instance,
Startree has implemented [Tiered Storage in Pinot](https://www.youtube.com/watch?v=G8pVMnLmtok) and Apache
Pinot even comes with a basic [time-based](https://docs.pinot.apache.org/v/release-0.11.0/operators/operating-pinot/tiered-storage)
tiered storage feature; Singlestore Helios supports "[unlimited storage](https://docs.singlestore.com/cloud/manage-data/database-storage/)"
when one of the cloud workspaces is used, etc.

Object Stores are also quite popular in vector databases. e.g. [Turbopuffer](https://turbopuffer.com/blog/turbopuffer#:~:text=Apply%20for%20access-,turbopuffer%3A%20fast%20search%20on%20object%20storage,-July%2008%2C%202024) is aiming to be "Object Storage Native".

All of this is to say: even though SSDs have become cheaper over the last decade, HDDs and Object Stores are still
significantly cheaper than SSDs. More and more OLAP systems are trying to support queries against
data in Object Stores.

This paper (from TUM again) proposes AnyBlob: a download manager that can be plugged into database engines to maximize
throughput while minimizing CPU. The paper also presents "a blueprint" for performing efficient analytics on Object Stores,
and shares a ton of really useful insights.

To summarize, the key insights regarding Object Store based analytics are: 1) Many cloud providers have instances that can
support 8-12 GBps network throughput, which surpasses the disk throughput (bandwidth) they support for their I/O optimized SSDs.
2) Object store retrieval is priced at per-request and is independent of the response size. Fetching a 1 KB and a 1 TB object
has the same cost. 3) Per-object download bandwidth has very high variance ranging from 25 to 95 MiB/s. 4) Retrieval latency
per object starts increasing roughly linearly around 8-16 MiB. For smaller sizes, first-byte latency dominates total runtime
indicating RTT is the bottleneck. 5) For AWS, since inter-region and inter-AZ network traffic is auto-encrypted, and within
region no one is able to intercept traffic due to VPC isolation, they have claimed that HTTPS is unnecessary and all experiments
of theirs were with HTTP. 6) Using HTTPS had 2x the CPU resource requirement of HTTP, but E2E AES only increased CPU by 30%.
7) AnyBlob supports request hedging, and they restart a download if there's no response for ~600ms. 8) They were also able
to conclude that Object Stores are based on HDDs given the per-object bandwidth was ~50 MBps and access latency was in the
tens of ms. 9) They had found that a significant part of the CPU time was spent in dealing with Networking. Anyblob improves
it, but it underscores why Object Stores need to manage CPU well. 10) They claim that Umbra integrated with AnyBlob was
able to beat state of the art data warehouses.

Given the above, AnyBlob tries to maximize the number of concurrent requests (up to 256) to maximize throughput, while keeping the per-request
size around 8-16 MiB. With this, they were able to achieve 9+ GBps of median bandwidth in AWS. As you would expect, AnyBlob
uses io_uring to manage multiple connections per thread asynchronously. The paper has also described how they have integrated
AnyBlob into Umbra and its Morsel based scheduler.

I would highly recommend you to read this paper, especially section-4 and onwards because I couldn't cover the database
engine design specifics in a way which would be compatible with the summarized nature of these notes.

I feel this is one of the best papers I have read in a while. Thanks to Andy Pavlo for resuming his
[PVLDB Bot](https://x.com/pvldb?lang=en) which helped me discover this.

---

<div class="paper-desc">
Measures in SQL
 <a href="https://dl.acm.org/doi/pdf/10.1145/3626246.3653374">link</a>
</div>

One of the most common OLAP use-cases is the ability to compute business metrics across multiple
dimensions. BI Tools or [Decision Support Systems](https://www.dremio.com/wiki/decision-support-system/) like Power BI, Tableau and Looker
aim to provide a really easy-to-use interface for 1. users who interact with the tools using GUIs, and 2. data scientists/analysts who define how the backing data is modeled (refer [2] for more).

The 90s saw the rise of [Multidimensional Databases](https://www.topcoder.com/thrive/articles/An%20Introduction%20to%20Multidimensional%20Databases) (MDDs),
which were built on the premise that traditional relational databases' two-dimensional storage model was unsuitable for OLAP. These databases
had no query language and were tied to their user interface. Subsequently, attempts were made to standardize the API used to access MDDs,
and finally a query language (MDX) was built for dimensional queries.

There were multiple implementations of MDX: Microsoft Analysis Services, Mondrian, SAP BW and SAS. Some of these were backed by
relational databases (a technique termed ROLAP) and dimensional languages came to be seen as a semantic layer on top of
the relational model.

The authors of the paper claim that the main contribution of the semantic layer was not cubes, but the ability to define
calculations central to the business just once, and to associate columns with some presentation metadata.

The language used by these semantic layers was vendor specific (not SQL) with limited expressibility and
vendor specific features. This is where Measures in SQL and the paper comes in: it proposes a way to use SQL as the
language of the semantic layer, by providing a way to express "re-usable calculations" in SQL.

SQL already has a lot of features to express pretty much everything one may want for BI use-cases: CUBES, ROLLUP,
Window Function, WITHIN GROUP, etc. One may think that re-usable calculations could be achieved via SQL Views,
but it doesn't always work: for instance if a view defines an aggregation on a particular grouping set, then
you can only use a subset of that grouping set with a subset of the aggregation functions in your query.

I'll share a quick summary of the Measure syntax with an example. Consider the following query:

```
SELECT
  prodName, orderYear,
  profitMargin,
  profitMargin AT (SET orderYear = CURRENT orderYear - 1) AS profitMarginLastYear
FROM (
    SELECT
      *,
      (SUM(revenue) - SUM(cost)) / SUM(revenue) AS MEASURE profitMargin,
      YEAR (orderDate) AS orderYear
    FROM Orders
  )
WHERE orderYear = 2024
GROUP BY prodName, orderYear;
```

The sub-query in the `FROM` clause can be thought of as a View that defines the `profitMargin` measure. A Measure is not exactly an aggregation,
it simply tells SQL how to compute a metric. The outer query computes the profit margin for the year 2024 and the year 2023.

The `profitMarginLastYear` column illustrates the context-sensitive nature of measures.
The paper defines context sensitive expressions as expressions whose value is determined by an evaluation context.
And an evaluation context is a predicate whose terms are one or more columns. The `CURRENT` keyword
is an example of a "context modifier", which is used to alter the evaluation context.

Finally, this feature has been added to Apache Calcite and hence can be used by many engines now
([CALCITE-5105](https://issues.apache.org/jira/browse/CALCITE-5105)).

**Related**:

1. You can check out [Gooddata and MAQL](https://www.gooddata.com/docs/cloud/create-metrics/maql/maql-and-multidimensionality/) for an example of a company in this domain.
2. It also really helps to go through the [LookML](https://cloud.google.com/looker/docs/what-is-lookml) documentation and understand their semantic modeling.
3. Kishore, who is the founder of [Startree](https://startree.ai/), has a great talk on the [Startree Index](https://docs.pinot.apache.org/basics/indexing/star-tree-index) in Pinot. The talk shares the Index's relevance
in a broader context and isn't only about implementation details.

---

<div class="paper-desc">
TAO: Facebook's Distributed Data Store for the Social Graph
 <a href="https://www.usenix.org/system/files/conference/atc13/atc13-bronson.pdf">link</a>
</div>

Published in 2013, TAO is a PB scale graph datastore built on top of MySQL and uses "graph-aware" Memcache, that was serving billions of reads per second at the time. It is eventually consistent and mainly focuses on availability and scalability. It is heavily optimized for reads as their client traffic is 99.8% reads.

Their data-model consists of two types: Objects and Associations. Objects are identified by a globally unique 64-bit integer, and associations are identified by source object id, association type and destination object id. Both objects and associations can contain key-value data pairs, and the schema is defined for each atype (key names and the value's types are defined). Each association also has a 32-bit time field which is used for showing the "most recent" data. Finally, actions may be modeled either as an object or as an association. Associations are good at modeling binary transitions (e.g. event invite accepts).

Queries for associations return data in descending order by time-field. This greatly helps with sustaining large QPS because you get localized cache-friendly data access.

Each shard of the data is located in a single logical database, and Database servers are responsible for one or more shards. For objects, sharding is done based on their id. Associations are stored on the shards of their source object.

TAO uses read-through caching with LRU eviction. Multiple caching servers form a "tier" which can serve any TAO request. Each request maps to a single cache server in a tier using the aforementioned sharding scheme. Writes for associations go to the cache-server corresponding to source-id. If the association has an invert,
the cache server will first issue a write to the caching server of destination-id. If that write succeeds, the local write will go through.
There's no atomicity of operations here and they use async reconciliation jobs to clean this up.

These peer to peer calls between caching servers don't scale well when there are a lot of cache servers in a tier. Hence they split their cache into two levels: a leader tier and multiple follower tiers. All reads go to the follower tier, and in case of a cache miss, the follower node will issue a read to one of the leader tier cache server. Each Database has a single cache server in the leader tier. Clients always hit a follower-tier and never the leader-tier.

Writes also go to the respective server in the chosen follower tier. That server will forward the write to the respective server in the leader tier, which will finally forward the update to MySQL. On success, the cache for the leader tier and that particular follower tier will be updated. To propagate the write to other follower tiers, each server in a follower tier subscribes to the CDC events of the MySQL DB which are used for invalidation.

Due to the enormity of the data, they had to expand beyond a single-region. Multi-region TAO configuration involves a single master region; the other regions are followers. Writes from leader tier of a follower region go to the leader tier of the master region. When the master region's leader tier receives a write, it propagates the write to the master DB.
The CDC changes of master DB are propagated to each follower region. Within each follower region, the change is applied to its local DB as well as its leader cache tier.

---

<div class="paper-desc">
FSST: Fast Random Access String Compression
 <a href="https://www.vldb.org/pvldb/vol13/p2649-boncz.pdf">link</a>
</div>

FSST is a lightweight compression algorithm which has been
[adopted by DuckDB](https://duckdb.org/2022/10/28/lightweight-compression.html).
For a given blob, it will split it into 4MB chunks, create a sample of 16KB for each chunk, compute an optimal
symbol table, and use it to compress the chunk. The symbol table is very small: it has 255 1-byte keys (called codes),
and the values are at most 8 byte values (symbols). (chunk and sample size are configurable)

Some advantages of this over algorithms like LZ4 are: 1) You can evaluate some filters like exact match without decompression.
This can be achieved by compressing the argument itself with the symbol table, and then running the exact match against
the compressed data. 2) You can do random reads without having to decompress entire blocks. This can alleviate
I/O stalls and reduce CPU load. 3) Performance and compression factor of this is better than LZ4 in some cases.

The authors even proposed compressing the Dictionary of a dict-encoded string column using FSST. This seems like a great
idea to me because: 1) For Dict Encoded Strings, the Dictionary usually takes a much larger amount of space than the
dictionary integers. 2) Dictionaries often require binary-search, which simulates the random-read access pattern where
FSST does well. 3) Given the low overhead, you could choose to always compress String Dictionaries.

Additionally, I think FSST can be really helpful for running expensive scans against large volumes of data,
particularly where prefetching is not implemented (e.g. DBs using MMAP).

However, there are cases where FSST fares much worse than LZ4. Examples: large XML, JSON files, Binary files, etc.

The [implementation](https://github.com/cwida/fsst) shared by the authors employs quite a lot of clever optimizations.
To highlight some: 1) They have intentionally chosen 8-byte symbols, because you can do unaligned loads on almost every system.
The small symbol length and the symbol-table size also bodes well for cache efficiency.
2) If the symbol is smaller than 8-bytes, they still use 8 bytes to store it in the symbol-table. During decompression,
they always copy 8 bytes, but increment the pointer in the target buffer by the length of the symbol that is stored
separately, helping them avoid branches and also reduce instruction count.

---

<div class="paper-desc">
Cinnamon: Using Century Old Tech to Build a Mean Load Shedder (Uber EngBlog)
 <a href="https://www.uber.com/blog/cinnamon-using-century-old-tech-to-build-a-mean-load-shedder/">link</a>
</div>

This 3-part blog explains how Uber designed its new load shedder, Cinnamon. The previous implementation,
[QALM](https://www.uber.com/blog/qalm-qos-load-management-framework), was based on CoDel and had the
following issues: 1) maximum number of concurrent requests had to be set by users. this number is
hard to come up with and is bound to change over time. 2) priorities alone wasn't helping much, since
a upstream high-priority service may be receiving test traffic. 3) though what seems like a implementation
detail, using channels for load shedding was turning out to be expensive due to synchronization (and contention?).

Cinnamon solved these by requiring no configuration and has better support for handling priorities. The library
has 2 main parts:

**[PID Controller](https://www.uber.com/blog/pid-controller-for-cinnamon/)**

This controls the rejection percentage to minimize the queueing time, while ensuring that it doesn't overshoot in 
rejection and can still keep service utilization high. Priorities for each request are computed using two variables:
tier of request/calling-service and a "cohort". Cohort allows creating finer granularity for
traffic in a given tier, and is computed using consistent hashing of the caller. For example: Uber has 6 tiers
of services, and one could generate 32 cohorts for each tier. This would yield 192 priority values.

The input to the PID Controller is the inflow of requests to the queue, the outflow of requests from the queue, and the
number of "free slots" in the system. It outputs a single value: the ratio of requests to reject.
However since we don't want to randomly reject requests, the ratio needs to be mapped back to a priority value.
For this, Cinammon looks at a sample of 1000 requests, and then finds a threshold based on the CDF.

While the above answers how requests are selected for rejection, how does the PID Controller ensure that it doesn't
completely kill the service utilization?

**Answer**: The [target function](https://blog.uber-cdn.com/cdn-cgi/image/width=350,quality=80,onerror=redirect,format=auto/wp-content/uploads/2023/11/equation1_resized.png) 
also depends on number of "free slots" available for running requests.

**[Auto Tuner](https://www.uber.com/blog/cinnamon-auto-tuner-adaptive-concurrency-in-the-wild/)**

It should be noted that PID Controller does NOT control the max *allowed* concurrent requests— it only tries to
ensure that the service is running as many requests as the service allows.

The natural next question would be: how do we set the max concurrent requests that a service should allow?

One option for this could be to allow users to configure this, but as mentioned already: it is hard to come up
with a number and either ways it will continue to change over time.

The Auto-Tuner solves this problem. More generally, it solves the problem of keeping throughput high by adjusting
the maximum number of concurrent requests allowed in a service. This is built based on a modification of 
the [TCP-Vegas](https://en.wikipedia.org/wiki/TCP_Vegas) congestion control algorithm. The algorithm
finds the current latency values of the requests and compares them against a target latency. If the latency value
is higher, then the max concurrent requests allowed should be reduced and vice versa. So the three questions are:
what value/statistic do we use to calculate the current latency value, how do we compute the target latency, and
what is the action taken after the same.

To get the latency value, they compute p90 and apply a median filter and exponential smoothing. Moreover, they
use T-Digest for [computing quantiles](https://github.com/tdunning/t-digest/blob/974f3cc1e754c55f5d8ed018320437b7674fa0cb/core/src/main/java/com/tdunning/math/stats/TDigest.java#L120-L137). 
To control the action and check whether it is actually helping, they look at a set of time windows (50 intervals) and 
compute the estimated throughput using [Little's Law](https://en.wikipedia.org/wiki/Little%27s_law).
Finally, they compute the covariance of the throughput and the target latency on these 50 intervals, and if it is negative,
the auto-tuner will reduce the inflight limit.

**Side Notes**:

1. T-Digest is also [used by Dremio](https://youtu.be/IOIgcgzw93Y?si=rY_tbYC1pKbZwgL4&t=1168).
2. Uber has taken inspiration from similar work shared by other companies (e.g. [Netflix](https://github.com/Netflix/concurrency-limits/tree/master)).

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
