import React from 'react';
import { getSvgPathFromPoints } from '../../utils/geometry.js';

export const AnnotationsLayer = React.memo(({ lines, texts, camera, hoveredTarget, selectedIds, dragState, setHoveredTarget }) => {
  const invZoom = 1 / camera.zoom;
  return (
    <>
      {lines.map(line => {
        const isSelected = selectedIds.has(line.id), isHovered = hoveredTarget.id === line.id && hoveredTarget.type === 'line';
        const d = getSvgPathFromPoints(line.points, line.isCurve);
        let highlightStroke = "none";
        if (isSelected) highlightStroke = "#3b82f6"; else if (isHovered) highlightStroke = "#f97316";

        const hoverProps = createHoverProps(line.id, 'line', !!dragState.type, setHoveredTarget);

        return (
          <g key={line.id}>
            {(isSelected || isHovered) && <path d={d} fill="none" stroke={highlightStroke} strokeWidth={(line.strokeWidth + 6) * invZoom} opacity="0.4" pointerEvents="none" strokeLinecap="round" strokeLinejoin="round" />}
            <path d={d} fill="none" stroke="transparent" strokeWidth={16 * invZoom} data-id={line.id} data-type="line" className="cursor-pointer" strokeLinecap="round" strokeLinejoin="round" {...hoverProps} />
            <path d={d} fill="none" stroke={line.color} strokeWidth={line.strokeWidth * invZoom} strokeDasharray={line.strokeDasharray === 'none' ? 'none' : line.strokeDasharray.split(' ').map(v=>Number(v)*invZoom).join(' ')} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
          </g>
        );
      })}
      {texts.map(text => {
        const isSelected = selectedIds.has(text.id), isHovered = hoveredTarget.id === text.id && hoveredTarget.type === 'text';
        let highlightStroke = "none";
        if (isSelected) highlightStroke = "#3b82f6"; else if (isHovered) highlightStroke = "#f97316";

        const hoverProps = createHoverProps(text.id, 'text', !!dragState.type, setHoveredTarget);
        const displayFontSize = text.fontSize * 2;

        return (
          <g key={text.id} transform={`translate(${text.x}, ${text.y}) rotate(${text.rotation || 0}) scale(${invZoom})`}>
            {(isSelected || isHovered) && <text dominantBaseline="middle" textAnchor="middle" stroke={highlightStroke} strokeWidth={Math.max(8, displayFontSize * 0.5)} opacity="0.4" fontSize={displayFontSize} fontWeight="bold" pointerEvents="none">{text.text}</text>}
            <text dominantBaseline="middle" textAnchor="middle" stroke="white" strokeWidth={Math.max(3, displayFontSize * 0.25)} strokeLinejoin="round" fill="none" fontSize={displayFontSize} fontWeight="bold" opacity="0.9" pointerEvents="none">{text.text}</text>
            <text data-id={text.id} data-type="text" dominantBaseline="middle" textAnchor="middle" stroke="transparent" strokeWidth={Math.max(16, displayFontSize * 0.8)} fontSize={displayFontSize} fontWeight="bold" className="cursor-pointer select-none" {...hoverProps}>{text.text}</text>
            <text dominantBaseline="middle" textAnchor="middle" fill={text.color} fontSize={displayFontSize} fontWeight="bold" pointerEvents="none">{text.text}</text>
          </g>
        );
      })}
    </>
  );
});
