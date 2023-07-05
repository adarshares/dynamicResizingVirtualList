// @flow

import createListComponent from "./createListComponent";

const DEFAULT_ESTIMATED_ITEM_SIZE = 50;

//****************************UNCHECKED FUNCTION*************************************
const queryIndex = (nodeLeft, nodeRight, segIndex, offset, segtree) => {
  if (nodeLeft === nodeRight) {
    return nodeLeft;
  }
  if (segtree[2 * segIndex] < offset) {
    return queryIndex(
      Math.floor((nodeLeft + nodeRight) / 2) + 1,
      nodeRight,
      2 * segIndex + 1,
      offset - segtree[2 * segIndex],
      segtree
    );
  } else {
    return queryIndex(
      nodeLeft,
      Math.floor((nodeLeft + nodeRight) / 2),
      2 * segIndex,
      offset,
      segtree
    );
  }
};

//***PARTIALLY CHECKED FUNCTION ****
const replaceElement = (
  nodeLeft,
  nodeRight,
  segIndex,
  nodeIndex,
  value,
  segtree
) => {
  //nl,nr,n, i,v,
  //console.log(nodeLeft, nodeRight, segIndex, nodeIndex, value, segtree);
  if (nodeIndex === nodeLeft && nodeLeft === nodeRight) {
    segtree[segIndex] = value;
    return;
  }
  const nodeMid = Math.floor((nodeLeft + nodeRight) / 2);
  if (nodeIndex <= nodeMid) {
    replaceElement(nodeLeft, nodeMid, 2 * segIndex, nodeIndex, value, segtree);
  } else {
    replaceElement(
      nodeMid + 1,
      nodeRight,
      2 * segIndex + 1,
      nodeIndex,
      value,
      segtree
    );
  }
  segtree[segIndex] = segtree[2 * segIndex] + segtree[2 * segIndex + 1];
};

const sumquery = (
  nodeLeft,
  nodeRight,
  queryLeft,
  queryRight,
  segIndex,
  segtree
) => {
  if (queryLeft > nodeRight || queryRight < nodeLeft || nodeLeft > nodeRight) {
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
      2 * segIndex,
      segtree
    ) +
    sumquery(
      Math.floor((nodeLeft + nodeRight) / 2) + 1,
      nodeRight,
      queryLeft,
      queryRight,
      2 * segIndex + 1,
      segtree
    )
  );
};
//****************************************************//

const getSize = (segtree, index) => {
  return sumquery(0, segtree.length / 4 - 1, index, index, 1, segtree);
};

const getOffset = (segtree, index) => {
  if (index <= 0) {
    return 0;
  }
  return sumquery(0, segtree.length / 4 - 1, 0, index - 1, 1, segtree);
};

const getIndex = (segtree, offset) => {
  if (offset === 0) {
    return 0;
  }
  return queryIndex(0, segtree.length / 4 - 1, 1, offset, segtree);
};

const setSize = (segtree, index, size) => {
  replaceElement(0, segtree.length / 4 - 1, 1, index, size, segtree);
};

const getItemSize = (props, index, instanceProps) => {
  const { itemSize } = props;
  const { segtree, lastMeasuredIndex } = instanceProps;

  if (index > lastMeasuredIndex) {
    for (let i = lastMeasuredIndex + 1; i <= index; i++) {
      let size = itemSize(i);

      setSize(segtree, i, size);
    }

    instanceProps.lastMeasuredIndex = index;
  }

  return getSize(segtree, index);
};

const getItemOffset = (props, index, instanceProps) => {
  const { itemSize } = props;
  const { segtree, lastMeasuredIndex } = instanceProps;

  if (index > lastMeasuredIndex) {
    for (let i = lastMeasuredIndex + 1; i <= index; i++) {
      let size = itemSize(i);

      setSize(segtree, i, size);
    }

    instanceProps.lastMeasuredIndex = index;
  }

  return getOffset(segtree, index);
};

const findNearestItem = (props, instanceProps, offset) => {
  const { segtree, lastMeasuredIndex } = instanceProps;

  const lastMeasuredItemOffset =
    lastMeasuredIndex > 0 ? getOffset(segtree, lastMeasuredIndex) : 0;

  if (lastMeasuredItemOffset >= offset) {
    // If we've already measured items within this range just use a binary search as it's faster.
    return getIndex(segtree, offset);
  } else {
    // If we haven't yet measured this high, fallback to an exponential search with an inner binary search.
    // The exponential search avoids pre-computing sizes for the full set of items as a binary search would.
    // The overall complexity for this approach is O(log n).
    return findNearestItemExponentialSearch(
      props,
      instanceProps,
      Math.max(0, lastMeasuredIndex),
      offset
    );
  }
};

const findNearestItemExponentialSearch = (
  props,
  instanceProps,
  index,
  offset
) => {
  const { itemCount } = props;
  const { segtree } = instanceProps;
  let interval = 1;

  while (
    index < itemCount &&
    getItemOffset(props, index, instanceProps) < offset
  ) {
    index += interval;
    interval *= 2;
  }

  return getIndex(segtree, offset);
};

const getEstimatedTotalSize = (
  { itemCount },
  { segtree, estimatedItemSize, lastMeasuredIndex }
) => {
  let totalSizeOfMeasuredItems = 0;

  // Edge case check for when the number of items decreases while a scroll is in progress.
  // https://github.com/bvaughn/react-window/pull/138
  if (lastMeasuredIndex >= itemCount) {
    lastMeasuredIndex = itemCount - 1;
  }

  if (lastMeasuredIndex >= 0) {
    const [offset, size] = [
      getOffset(segtree, lastMeasuredIndex),
      getSize(segtree, lastMeasuredIndex),
    ];
    totalSizeOfMeasuredItems = offset + size;
  }

  const numUnmeasuredItems = itemCount - lastMeasuredIndex - 1;
  const totalSizeOfUnmeasuredItems = numUnmeasuredItems * estimatedItemSize;

  return totalSizeOfMeasuredItems + totalSizeOfUnmeasuredItems;
};

const VariableSizeList = createListComponent({
  getItemOffset: (props, index, instanceProps) =>
    getItemOffset(props, index, instanceProps),

  getItemSize: (props, index, instanceProps) =>
    getSize(instanceProps.segtree, index),

  getEstimatedTotalSize,

  getOffsetForIndexAndAlignment: (
    props,
    index,
    align,
    scrollOffset,
    instanceProps,
    scrollbarSize
  ) => {
    const { direction, height, layout, width } = props;

    // TODO Deprecate direction "horizontal"
    const isHorizontal = direction === "horizontal" || layout === "horizontal";
    const size = isHorizontal ? width : height;
    const itemMetadata = {
      offset: getItemOffset(props, index, instanceProps),
      size: getItemSize(props, index, instanceProps),
    }; //getItemMetadata(props, index, instanceProps); //instanceProps

    // Get estimated total size after ItemMetadata is computed,
    // To ensure it reflects actual measurements instead of just estimates.
    const estimatedTotalSize = getEstimatedTotalSize(props, instanceProps); //instanceProps

    const maxOffset = Math.max(
      0,
      Math.min(estimatedTotalSize - size, itemMetadata.offset)
    );
    const minOffset = Math.max(
      0,
      itemMetadata.offset - size + itemMetadata.size + scrollbarSize
    );

    if (align === "smart") {
      if (
        scrollOffset >= minOffset - size &&
        scrollOffset <= maxOffset + size
      ) {
        align = "auto";
      } else {
        align = "center";
      }
    }

    switch (align) {
      case "start":
        return maxOffset;
      case "end":
        return minOffset;
      case "center":
        return Math.round(minOffset + (maxOffset - minOffset) / 2);
      case "auto":
      default:
        if (scrollOffset >= minOffset && scrollOffset <= maxOffset) {
          return scrollOffset;
        } else if (scrollOffset < minOffset) {
          return minOffset;
        } else {
          return maxOffset;
        }
    }
  },

  getStartIndexForOffset: (props, offset, instanceProps) =>
    findNearestItem(props, instanceProps, offset), //instanceProps

  getStopIndexForStartIndex: (
    props,
    startIndex,
    scrollOffset,
    instanceProps
  ) => {
    const { direction, height, itemCount, layout, width } = props;

    // TODO Deprecate direction "horizontal"
    const isHorizontal = direction === "horizontal" || layout === "horizontal";
    const size = isHorizontal ? width : height;
    const itemMetadata = {
      offset: getItemOffset(props, startIndex, instanceProps),
      size: getItemSize(props, startIndex, instanceProps),
    }; //getItemMetadata(props, startIndex, instanceProps); //instanceProps
    const maxOffset = scrollOffset + size;

    let offset = itemMetadata.offset + itemMetadata.size;
    let stopIndex = startIndex;

    while (stopIndex < itemCount - 1 && offset < maxOffset) {
      stopIndex++;
      offset += getItemSize(props, stopIndex, instanceProps); //instanceProps
    }

    return stopIndex;
  },

  initInstanceProps(props, instance) {
    const { estimatedItemSize } = props;

    const instanceProps = {
      segtree: new Array(4 * props.itemCount).fill(0),
      estimatedItemSize: estimatedItemSize || DEFAULT_ESTIMATED_ITEM_SIZE,
      lastMeasuredIndex: -1,
    };

    instance.resetAfterIndex = (index, shouldForceUpdate = true) => {
      instanceProps.lastMeasuredIndex = Math.min(
        instanceProps.lastMeasuredIndex,
        index - 1
      );

      // We could potentially optimize further by only evicting styles after this index,
      // But since styles are only cached while scrolling is in progress-
      // It seems an unnecessary optimization.
      // It's unlikely that resetAfterIndex() will be called while a user is scrolling.
      instance._getItemStyleCache(-1);

      if (shouldForceUpdate) {
        instance.forceUpdate();
      }
    };

    return instanceProps;
  },

  shouldResetStyleCacheOnItemSizeChange: false,
  onItemSizeChange: (index, newHeight, instanceProps) => {
    const { segtree } = instanceProps;
    setSize(segtree, index, newHeight);
  },
  validateProps: ({ itemSize }) => {
    if (process.env.NODE_ENV !== "production") {
      if (typeof itemSize !== "function") {
        throw Error(
          'An invalid "itemSize" prop has been specified. ' +
            "Value should be a function. " +
            `"${itemSize === null ? "null" : typeof itemSize}" was specified.`
        );
      }
    }
  },
});

export default VariableSizeList;
