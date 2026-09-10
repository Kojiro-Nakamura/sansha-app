import React from 'react';
import { defaultSlopeTypes } from '../../constants/defaults.js';

export const FacesLayer = React.memo(({ facesWithNumbers, faceTypes, faceDeductions, slopeTypes, camera, hoveredTarget, selectedIds, dragState, setHoveredTarget, fractionDigits, currentMode }) => {
  const invZoom = 1 / camera.zoom;
  const deductFaces = facesWithNumbers.filter(f => faceDeductions[f.id] && f.status === 'valid');

  return (
    <>
      <defs>
        <mask id="deduction-mask">
          <rect x="-100000" y="-100000" width="200000" height="200000" fill="white" />
          {deductFaces.map(face => (
            <polygon key={`mask-${face.id}`} points={face.nodes.map(n => `${n.x},${n.y}`).join(' ')} fill="black" />
          ))}
        </mask>
        <pattern id="deduct-pattern" width="10" height="10" patternTransform={`scale(${invZoom}) rotate(45 0 0)`} patternUnits="userSpaceOnUse">
          <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
        </pattern>
      </defs>

      {facesWithNumbers.map(face => {
        const pts = face.nodes.map(n => `${n.x},${n.y}`).join(' '), cx = face.nodes.reduce((sum, n) => sum + n.x, 0) / 3, cy = face.nodes.reduce((sum, n) => sum + n.y, 0) / 3;
        const typeId = faceTypes[face.id] || 't1', sType = slopeTypes.find(t => t.id === typeId) || slopeTypes[0] || defaultSlopeTypes[0];
        const isHovered = hoveredTarget.id === face.id && (hoveredTarget.type === 'face' || hoveredTarget.type === 'face_label');
        const isSelectedFace = selectedIds.has(face.id);
        const shortName = sType.shortName || sType.name.charAt(0), displayName = `${shortName}${face.number}`;
        const isDeduct = faceDeductions[face.id];
        
        let fill = sType.color, fillOpacity = 0.4, stroke = "transparent", strokeW = 0, dashArray = "none";
        
        if (isDeduct) {
          fill = "url(#deduct-pattern)";
          fillOpacity = 1;
          stroke = sType.color;
          strokeW = 2;
          dashArray = `${4 * invZoom} ${4 * invZoom}`;
        }

        if (face.status === 'invalid_triangle') { fill = "#e11d48"; fillOpacity = 0.2; stroke = "transparent"; dashArray = "none"; }
        else if (face.status === 'missing_length') { fillOpacity = 0.1; stroke = sType.color; strokeW = 2; dashArray = `${8 * invZoom} ${6 * invZoom}`; }

        if (isHovered) { fill = face.status === 'invalid_triangle' ? "rgba(225, 29, 72, 0.3)" : "rgba(249, 115, 22, 0.15)"; if (!isSelectedFace && !isDeduct) { stroke = "#fdba74"; strokeW = 2; dashArray = "none"; } }
        if (isSelectedFace) { stroke = "#2563eb"; strokeW = 3; dashArray = "none"; }

        const polygonPointerEvents = (dragState.type || currentMode === 'polygon' || currentMode === 'line' || currentMode === 'curve') ? "none" : "all";
        const labelPointerEvents = dragState.type ? "none" : "all";

        const hoverProps = createHoverProps(face.id, 'face', !!dragState.type, setHoveredTarget);
        const hoverPropsLabel = createHoverProps(face.id, 'face_label', !!dragState.type, setHoveredTarget);
        
        const areaStr = face.area !== null ? (isDeduct ? `-${face.area.toFixed(fractionDigits)}` : face.area.toFixed(fractionDigits)) : '';
        const maskAttr = (!isDeduct && face.status === 'valid') ? "url(#deduction-mask)" : undefined;

        return (
          <g key={face.id}>
            <polygon points={pts} fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeWidth={strokeW * invZoom} strokeDasharray={dashArray} strokeLinejoin="round" pointerEvents={polygonPointerEvents} data-id={face.id} data-type="face" className={polygonPointerEvents === 'all' ? "cursor-pointer" : ""} mask={maskAttr} {...hoverProps} />
            {face.status === 'valid' && (
              <g transform={`translate(${cx}, ${cy}) scale(${invZoom})`}>
                <text y="-10" dominantBaseline="middle" textAnchor="middle" stroke={isHovered ? "#fed7aa" : "white"} strokeWidth={isHovered ? "5" : "3"} strokeLinejoin="round" className="text-xs font-bold opacity-90 cursor-pointer transition-all duration-200" pointerEvents={labelPointerEvents} data-id={face.id} data-type="face_label" {...hoverPropsLabel}>{displayName}</text>
                <text y="-10" dominantBaseline="middle" textAnchor="middle" fill="#334155" className="text-xs font-bold cursor-pointer" pointerEvents={labelPointerEvents} data-id={face.id} data-type="face_label" {...hoverPropsLabel}>{displayName}</text>
                <text y="6" dominantBaseline="middle" textAnchor="middle" stroke={isHovered ? "#fed7aa" : "white"} strokeWidth={isHovered ? "6" : "4"} strokeLinejoin="round" className="text-sm font-bold opacity-90 cursor-pointer transition-all duration-200" pointerEvents={labelPointerEvents} data-id={face.id} data-type="face_label" {...hoverPropsLabel}>{areaStr}㎡</text>
                <text y="6" dominantBaseline="middle" textAnchor="middle" className={`text-sm font-bold ${isDeduct ? 'fill-red-700' : 'fill-slate-800'} cursor-pointer`} pointerEvents={labelPointerEvents} data-id={face.id} data-type="face_label" {...hoverPropsLabel}>{areaStr}㎡</text>
              </g>
            )}
            {face.status === 'missing_length' && (
              <g transform={`translate(${cx}, ${cy}) scale(${invZoom})`}>
                <text y="-10" dominantBaseline="middle" textAnchor="middle" stroke={isHovered ? "#fed7aa" : "white"} strokeWidth={isHovered ? "5" : "3"} strokeLinejoin="round" className="text-xs font-bold opacity-70 cursor-pointer transition-all duration-200" pointerEvents={labelPointerEvents} data-id={face.id} data-type="face_label" {...hoverPropsLabel}>{displayName}</text>
                <text y="-10" dominantBaseline="middle" textAnchor="middle" fill="#94a3b8" className="text-xs font-bold cursor-pointer" pointerEvents={labelPointerEvents} data-id={face.id} data-type="face_label" {...hoverPropsLabel}>{displayName}</text>
                <text y="6" dominantBaseline="middle" textAnchor="middle" stroke={isHovered ? "#fed7aa" : "white"} strokeWidth={isHovered ? "6" : "4"} strokeLinejoin="round" className="text-sm font-bold opacity-70 cursor-pointer transition-all duration-200" pointerEvents={labelPointerEvents} data-id={face.id} data-type="face_label" {...hoverPropsLabel}>? ㎡</text>
                <text y="6" dominantBaseline="middle" textAnchor="middle" className="text-sm font-bold fill-slate-400 cursor-pointer" pointerEvents={labelPointerEvents} data-id={face.id} data-type="face_label" {...hoverPropsLabel}>? ㎡</text>
              </g>
            )}
            {face.status === 'invalid_triangle' && <g transform={`translate(${cx}, ${cy}) scale(${invZoom})`}><text dominantBaseline="middle" textAnchor="middle" className="text-xl font-bold fill-rose-600 pointer-events-none">!</text></g>}
          </g>
        );
      })}
    </>
  );
});
