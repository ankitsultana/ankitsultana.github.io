---
title: Vanilla and Implicit Treaps
layout: default
tags: [algorithms, data-structures]
blog_post: true
---

## [Draft] Vanilla and Implicit Treaps

// Put a foreword here to clarify the 3 part series.

Most of the commonly known Balanced Binary Search Trees (BBSTs) (like Red-Black, AVL, etc.) are quite hard
and tricky to implement.

Treaps are significantly less popular when compared to most data-structures, are very simple to code and understand, offer all
the functionalities of a BST in O(log(n)) time (with fairly highly probability), and even give some functionalities of skip-lists.

### Things You Can Do With Treaps

Treaps can represent both Binary Search Trees (Vanilla Treaps) as well as Dynamic Arrays (Implicit Treaps). Implicit Treaps
in particular are quite powerful and require very little code.
Together, they allow you to do things like the following:

1. General Binary Search Tree operations like maintaining an ordered set or multiset, finding k-th order statistics, etc. You can also split a Treap into
two treaps (one with values <= k and the other with values > k). If you have two treaps such that the maximum value in one is less than the minimum value
in the other, then you can merge those two treaps as well.
2. Maintaining a dynamic array with operations like inserting an element at any position, deleting any element, removing an entire sub-array from the main array,
reversing a sub-array, merging two dynamic arrays, etc., all the while maintaining an aggregate function (like sum) to answer queries like range-sum.
3. All the operations listed above with [persistence](https://en.wikipedia.org/wiki/Persistent_data_structure). Even operations like merging two dynamic arrays
and deleting an entire sub-array are supported. However, there's a memory cost for implementing Treaps with persistence as every operation will create
O(log(N)) new nodes.

All the operations above can be done in O(log(N)) (with fairly high probability) where N is the number of elements prior to that operation.

### So, What is a Treap?

Treaps are a specialization of cartesian trees, which are defined as follows:

1. **Cartesian Tree**: A tree where each node has two keys, and the tree is BST ordered on one key and Heap ordered
on the other.
2. **Treaps**: A Cartesian Tree where the heap ordering keys are created randomly.

To visualize, this is how a Treap node would look like:

<div style="text-align: center">
	<img style="max-width: 300px; text-align: center" src="/images/vanilla-treaps/vanilla-treap-legend.png" />
</div>

To understand more, let's use Treaps as Binary Search Trees.

### Treap as a Binary Search Tree

Let's understand how Treaps work as a Binary Search Tree. In a later section, we will look at

This is how a Treap with BST Keys `{1, 2, 3, 10, 13, 20}` can look like:

<div style="text-align: center">
	<img style="max-width: 600px; text-align: center" src="/images/vanilla-treaps/sample-treap.png" />
</div>


Since Heap keys are randomly generated, the structure could be different for every run. Moreover,
in this particular case the Heap values create a Min-Heap, but a Treap can also have Heap keys
forming a Max-Heap.

#### Main Treap Operations

The core operations to modify a Treap are Merge and Split. 

**MERGE(Treap L, Treap R)**

*What This Operation Does*

This operation takes in two Treaps (say L and R) and combines them.
The original Treaps L and R are lost. However, if you implement a Persistent Treap, then the original
the Treaps are also retained.

*Constraints on the Input and Output*

Input: Treaps L and R should be such that the max value in L is <= to the min value in R.

Output: As long as the MERGE call is valid (contingent on the input), the output will have all the values of both L and R
combined in a single Treap. The original two Treaps will be lost.

*Time and Space Complexity*

The Merge operation takes O(log(N)) time where N is the size of the output Treap.

Based on how you implement, the Space complexity can be kept O(1) since the nodes of the original Treaps
can be retained and only the references for left/right child need to be changed.

**SPLIT(Treap T, Value K)**

*What this operation does*

This operations takes in a Treap T and a value K and returns two Treaps L and R such that all values in L
are <= K and all values in R are > K.

*Constraints on the Input and Output*

None that stand out.

*Time and Space Complexity*

The Split operation takes O(log(N)) time where N is the size of the input Treap T.

Based on how you implement, the Space complexity can be kept O(1) since the nodes of the original Treaps
can be retained and only the references for left/right child need to be changed.

Now assuming we have implemented MERGE and SPLIT, the question is...

#### What Can We Do With MERGE and SPLIT?

You can use Merge and Split literally as defined per se to either merge two Treaps or Split two treaps.

You can also use Merge and Split to INSERT or DELETE an element:

If you have to INSERT a value V to a Treap T:

```
INSERT(Treap T, Value V)  {
    NewNode := TreapNode(Bst_Value=V)
    if T is empty:
      return NewNode
    L, R := SPLIT(T, V)
    IntermediateTreap := MERGE(L, NewNode)
    CombinedTreap := MERGE(IntermediateTreap, R)
    // Note that after the MERGE operation, the arguments are modified and
    // no longer point to the Treaps they originally pointed to.
    return CombinedTreap
}
```

If you have to DELETE a value V (single instance) in a Treap T:

```
DELETE(Treap T, Value V) {
    // Step-1: Do a traversal of T to find the node with value V. Let's say it's NodeWithValueV.
    // Step-2: Get a reference to NodeWithValueV's parent, and call it ParentNode.
    LeftChild := NodeWithValue.GetLeftChild()
    RightChild := NodeWithValue.GetRightChild()
    if LeftChild == null and RightChild == null:
        ParentNode.ReplaceChild(NodeWithValueV, null)
        return
    NodeWithValue.SetLeftChild(null)
    NodeWithValue.SetRightChild(null)
    ReplacementNode := MERGE(LeftChild, RightChild)
    ParentNode.ReplaceChild(NodeWithValueV, ReplacementNode)
    destroy NodeWithValueV
}
```

Let's take a look at

#### How These Operations Work

Usually, if you are implementing a Binary Search Tree yourself, you might also want to keep room for maintaining an
aggregate function in every Tree node (for example: Sum of Values in the Sub-Tree, Size of Sub-Tree, etc.).

For the following examples, we will keep the sum of BST Values in the Sub-Tree as the aggregate function in
every node. This is how a single node would look like:

<div style="text-align: center">
	<img style="max-width: 400px; text-align: center" src="/images/vanilla-treaps/vanilla-treap-agg-legend.png" />
</div>

##### MERGE(Treap L, Treap R)

Let's say we want to merge the following two Treaps. Note that the treaps satisfy the input constraint mentioned above:

<div style="text-align: center">
	<img style="max-width: 600px; text-align: center" src="/images/vanilla-treaps/treaps-to-merge.png" />
</div>

We will recursively call MERGE, assuming that the arguments are pointers to the root nodes in the first call.

Logic when expressed as pseudocode is as follows:

```
MERGE(Treap L, Treap R) {
    // Handle when at least one argument is Null.
    if (L == Null && R == Null) {
        return Null
    } else if (L == Null) {
        return R
    } else if (R == Null) {
        return L
    }
    Lvalue := L.HeapValue()
    Rvalue := R.HeapValue()
    if Lvalue <= Rvalue {
        // Since the left treap has a lower Heap Value, this node should be the new
        // root and the right treap should be merged with the right child of L.
        L.SetRightChild(MERGE(L.GetRightChild(), R))  // Branch-1
        L.FixAggregateValue()
        return L
    } else {
        // Since the right treap has a lower Heap Value, this node should be the new
        // root and the left treap should become be merged with the left child of R.
        R.SetleftChild(MERGE(L, R.GetLeftChild()))    // Branch-2
        R.FixAggregateValue()
        return R
    }
}
```

Some crucial observations:

1. Any sub-tree of a given Treap is a valid Treap. In a way, the recursive calls are made with standalone Treaps
and the MERGE call returns the new root of the merged Treaps that are passed as arguments.
2. In every MERGE call, the Heap Values determine the new root, and the BST Values determine which child
of the chosen root will be merged with the other Treap.
3. In each MERGE call, we descend through at least one of the Treaps, so if the height of the both of the passed Treaps is
O(log(N)), then the MERGE call should also be O(log(N)).

This is how the first MERGE call for the example above looks like. The node highlighted with a Yellow border is the one which
is chosen as the Root, since it's heap value (11) is less than the other (21). This is corresponding to "Branch-1"
in the pseudocode above.

<div style="text-align: center">
	<img style="max-width: 600px; text-align: center" src="/images/vanilla-treaps/merge-treaps-1.png" />
</div>

Next, MERGE is called on the node with the BST value (10) and the Treap pointed to by R. Since R has a lesser Heap priority,
"Branch-2" is triggered and the node pointed to by R is made the root, with MERGE recursively called on the Treaps as shown below:

<div style="text-align: center">
	<img style="max-width: 600px; text-align: center" src="/images/vanilla-treaps/merge-treaps-2.png" />
</div>

Next, MERGE is called on the node with BST value 10 and the left child of R.
Since the node with BST value 10 has lesser priority, "Branch-1" is triggered and that node is
made the new root, with Merge called recursively on it's right child (which is Null) and the other argument.

<div style="text-align: center">
	<img style="max-width: 600px; text-align: center" src="/images/vanilla-treaps/merge-treaps-3.png" />
</div>

Finally, we get the following Treap:

<div style="text-align: center">
	<img style="max-width: 600px; text-align: center" src="/images/vanilla-treaps/merge-treaps-4.png" />
</div>

Note that at this point our recursion stasck is at the node highlighted in yellow, and the aggregate
values in the nodes that are its ancestors are inaccurate.

So as we go up the stack we can fix these aggregate values, by simply taking the sum of the
node's value, the left sub-tree's value and the right sub-tree's value, since the structure
doens't change as the recursion stack returns.

After the aggregate values are fixed, this is what we are left with:

<div style="text-align: center">
	<img style="max-width: 600px; text-align: center" src="/images/vanilla-treaps/merge-treaps-5.png" />
</div>

You'll notice that the resulting Treap forms a BST (orange values) and a Heap (green values) as expected.
Also the original pointers L and R don't point to the same Treap.

##### SPLIT(Treap T, Value V)

Let's say we want to split the following Treap:

#### Sample Implementation

Here's a sample Go based implementation: TODO

### How to Test Your Own Implementation

You can try submitting the following questions:

1. ORDERSET
2. GSS something.
