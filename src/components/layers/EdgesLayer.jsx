import React from 'react';
import { createHoverProps } from '../../utils/helpers.js';

export const EdgesLayer = React.memo(({ edges, nodes, facesWithNumbers, camera, hoveredTarget, selectedIds, dragState, setHoveredTarget, fractionDigits }) => {
  const invZoom = 1 / camera.zoom;
  return (
    <>
      {edges.map(edge => {
        const n1 = nodes.find(n => n.id === edge.source), n2 = nodes.find(n => n.id === edge.target);
        if (!n1 || !n2) return null;
        const cx = (n1.x + n2.x) / 2, cy = (n1.y + n2.y) / 2, dx = n2.x - n1.x, dy = n2.y - n1.y, len = Math.hypot(dx, dy);
        const isSelected = selectedIds.has(edge.id);
        const isHoveredEdge = hoveredTarget.id === edge.id && hoveredTarget.type === 'edge', isHoveredText = hoveredTarget.id === edge.id && hoveredTarget.type === 'edge_text';
        const hasLength = edge.length !== null;
        
        let targetX = cx, targetY = cy, hasTarget = false, offsetX = 0, offsetY = -14 * invZoom;
        const adjFace = facesWithNumbers.find(f => f.edges.some(e => e?.id === edge.id));
        if (adjFace) { targetX = adjFace.nodes.reduce((s, n) => s + n.x, 0) / 3; targetY = adjFace.nodes.reduce((s, n) => s + n.y, 0) / 3; hasTarget = true; }
        if (len > 0) {
          let nx = -dy / len, ny = dx / len;
          if (hasTarget && nx * (targetX - cx) + ny * (targetY - cy) < 0) { nx = -nx; ny = -ny; }
          else if (!hasTarget && ny > 0) { nx = -nx; ny = -ny; }
          offsetX = nx * 14 * invZoom; offsetY = ny * 14 * invZoom;
        }
        let angle = Math.atan2(dy, dx) * (180 / Math.PI); if (angle > 90 || angle < -90) angle += 180;
        const lengthText = hasLength ? Number(edge.length).toFixed(fractionDigits) : '?';

        const hoverPropsEdge = createHoverProps(edge.id, 'edge', !!dragState.type, setHoveredTarget);
        const hoverPropsText = createHoverProps(edge.id, 'edge_text', !!dragState.type, setHoveredTarget);

        return (
          <g key={edge.id}>
            {(isHoveredEdge || isHoveredText) && <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke={isHoveredText ? "#3b82f6" : "#f97316"} strokeWidth={8 * invZoom} opacity="0.4" pointerEvents="none" strokeLinecap="round" />}
            <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke="transparent" strokeWidth={20 * invZoom} data-id={edge.id} data-type="edge" className="cursor-pointer" {...hoverPropsEdge} />
            <line x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y} stroke={isSelected ? "#2563eb" : (hasLength ? "#334155" : "#e11d48")} strokeWidth={isSelected ? (3 * invZoom) : (2 * invZoom)} strokeDasharray={hasLength ? "none" : `${4 * invZoom} ${4 * invZoom}`} pointerEvents="none" />
            <g transform={`translate(${cx + offsetX}, ${cy + offsetY}) rotate(${angle}) scale(${invZoom})`}>
              <rect x="-25" y="-15" width="50" height="30" fill="transparent" data-id={edge.id} data-type="edge_text" className="cursor-pointer" pointerEvents="all" {...hoverPropsText} />
              <text data-id={edge.id} data-type="edge_text" dominantBaseline="middle" textAnchor="middle" stroke="transparent" strokeWidth="24" strokeLinejoin="round" className="text-base font-semibold cursor-pointer" pointerEvents="all" {...hoverPropsText}>{lengthText}</text>
              <text dominantBaseline="middle" textAnchor="middle" stroke={isHoveredText ? "#bfdbfe" : "white"} strokeWidth={isHoveredText ? "8" : "5"} strokeLinejoin="round" className="text-base font-semibold pointer-events-none transition-all duration-200">{lengthText}</text>
              <text dominantBaseline="middle" textAnchor="middle" className={`text-base font-semibold pointer-events-none ${hasLength ? (isHoveredText ? 'fill-blue-700' : 'fill-slate-800') : 'fill-rose-600'}`}>{lengthText}</text>
            </g>
          </g>
        );
      })}
    </>
  );
});
