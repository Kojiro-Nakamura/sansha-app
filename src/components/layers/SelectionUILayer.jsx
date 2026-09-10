import React, { useState, useRef, useMemo, useEffect } from 'react';

export const SelectionUILayer = React.memo(({ selectedIds, currentMode, nodes, lines, texts, edges, faces, camera }) => {
  if (selectedIds.size === 0 || currentMode !== 'select') return null;
  const elementsToMove = getActiveMovableElements(selectedIds, nodes, lines, texts, edges, faces);
  const bbox = getSelectionBoundingBox(nodes, lines, texts, elementsToMove);
  if (!bbox) return null;

  const invZoom = 1 / camera.zoom;
  const pad = 10 * invZoom;

  return (
    <g pointerEvents="none">
      <rect x={bbox.minX - pad} y={bbox.minY - pad} width={bbox.w + pad*2} height={bbox.h + pad*2} fill="transparent" stroke="none" pointerEvents="all" className="move-handle cursor-move" />
      <rect x={bbox.minX - pad} y={bbox.minY - pad} width={bbox.w + pad*2} height={bbox.h + pad*2} fill="none" stroke="#3b82f6" strokeWidth={1.5 * invZoom} strokeDasharray={`${5 * invZoom} ${5 * invZoom}`} />
      <circle cx={bbox.cx} cy={bbox.cy} r={3 * invZoom} fill="#3b82f6" />
      <line x1={bbox.cx} y1={bbox.minY - pad} x2={bbox.cx} y2={bbox.minY - pad - 20 * invZoom} stroke="#3b82f6" strokeWidth={1.5 * invZoom} />
      <circle cx={bbox.cx} cy={bbox.minY - pad - 20 * invZoom} r={6 * invZoom} fill="white" stroke="#3b82f6" strokeWidth={2 * invZoom} className="rotate-handle cursor-crosshair" pointerEvents="all" />
    </g>
  );
});
