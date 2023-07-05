var segtree = [];

const replaceElement = (nodeLeft, nodeRight, segIndex, nodeIndex, value) => {
  //nl,nr,n, i,v,
  if (nodeIndex === nodeLeft && nodeLeft === nodeRight) {
    segtree[segIndex] = value;
    return;
  }
  const nodeMid = Math.floor((nodeLeft + nodeRight) / 2);
  if (nodeIndex <= nodeMid) {
    replaceElement(nodeLeft, nodeMid, 2 * segIndex, nodeIndex, value);
  } else {
    replaceElement(nodeMid + 1, nodeRight, 2 * segIndex + 1, nodeIndex, value);
  }
  segtree[segIndex] = segtree[2 * segIndex] + segtree[2 * segIndex + 1];
};

const sumquery = (nodeLeft, nodeRight, queryLeft, queryRight, segIndex) => {
  if (queryLeft > nodeRight || queryRight < nodeLeft) {
    return 0;
  }
  if (nodeLeft >= queryLeft && nodeRight <= queryRight) {
    return segtree[segIndex];
  }
  return (
    sumquery(
      nodeLeft,
      Math.floor((nodeLeft + nodeRight) / 2),
      queryLeft,
      queryRight,
      2 * segIndex
    ) +
    sumquery(
      Math.floor((nodeLeft + nodeRight) / 2) + 1,
      nodeRight,
      queryLeft,
      queryRight,
      2 * segIndex + 1
    )
  );
};

segtree = new Array(4 * n).fill(0);
//upar checked partially
//unchecked niche

const queryIndex = (nodeLeft, nodeRight, segIndex, offset) => {
  if (nodeLeft === nodeRight) {
    return nodeLeft;
  }
  if (segtree[2 * segIndex] < offset) {
    return queryIndex(
      Math.floor((nodeLeft + nodeRight) / 2) + 1,
      nodeRight,
      2 * segIndex + 1,
      offset - segtree[2 * segIndex]
    );
  } else {
    return queryIndex(
      nodeLeft,
      Math.floor((nodeLeft + nodeRight) / 2),
      2 * segIndex,
      offset
    );
  }
};
