import React from "react";
import VariableSizeList from "./customChanges/VariableSizeList";
import CellRenderer from "./CellRenderer";

const rowHeights = new Array(1000)
  .fill(true)
  .map(() => 25 + Math.round(Math.random() * 50));

const getItemSize = (index) => rowHeights[index];

const Row = ({ index, style }) => <div style={style}>Row {index}</div>;

const Grid = () => {
  return (
    <VariableSizeList
      height={500}
      itemCount={1000}
      itemSize={(index) => 75}
      width={220}
    >
      {CellRenderer}
    </VariableSizeList>
  );
};

export default Grid;
