import React, { useState, useRef } from "react";
import "./../App.css";

const CellRenderer = ({ index, style, onHeightChange }) => {
  const [height, setHeight] = useState(style.height); // Initial height
  const [isResizing, setIsResizing] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = (event) => {
    setIsResizing(true);
    startY.current = event.clientY;
    startHeight.current = height;
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  const handleMouseMove = (event) => {
    if (!isResizing) return;

    const delta = event.clientY - startY.current;
    const newHeight = startHeight.current + delta;
    setHeight(newHeight);
    onHeightChange({ index, newHeight });
  };
  const handleMouseLeave = () => {
    setIsResizing(false);
  };
  return (
    <div
      style={{
        ...style,
        width: 200,
        height: height,
        border: "1px solid black",
        boxSizing: "border-box",
        resize: "vertical",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          height: 8,
          background: "gray",
          position: "absolute",
          bottom: 0,
          cursor: "ns-resize",
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      ResizableDiv{index}
    </div>
  );
};

export default CellRenderer;
