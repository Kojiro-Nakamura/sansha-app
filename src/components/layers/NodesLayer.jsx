import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createHoverProps } from '../../utils/helpers.js';

export const NodesLayer = React.memo(({ nodes, camera, hoveredTarget, selectedIds, dragState, setHoveredTarget }) => {
  const invZoom = 1 / camera.zoom;
  return (
    <>
      {nodes.map(node => {
        const isSelected = selectedIds.has(node.id), isHovered = hoveredTarget.id === node.id && hoveredTarget.type === 'node';
        const hoverProps = createHoverProps(node.id, 'node', !!dragState.type, setHoveredTarget);
        return (
          <g key={node.id}>
            {isHovered && <circle cx={node.x} cy={node.y} r={12 * invZoom} fill="#f97316" opacity="0.4" pointerEvents="none" />}
            <circle cx={node.x} cy={node.y} r={15 * invZoom} fill="transparent" data-id={node.id} data-type="node" className="cursor-pointer" {...hoverProps} />
            <circle cx={node.x} cy={node.y} r={5 * invZoom} fill={isSelected ? "#2563eb" : "#ffffff"} stroke={isSelected ? "#1d4ed8" : "#475569"} strokeWidth={2 * invZoom} pointerEvents="none" />
          </g>
        );
      })}
    </>
  );
});
