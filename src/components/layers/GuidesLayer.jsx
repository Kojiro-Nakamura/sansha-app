import React, { useState, useRef, useMemo, useEffect } from 'react';

export const GuidesLayer = React.memo(({ dragState, snapLine, hoveredTarget, nodes, edges, camera }) => {
  let drawEndX = dragState.currentX, drawEndY = dragState.currentY;
  if (dragState.type?.startsWith('draw_triangle') || dragState.type?.startsWith('draw_line_')) {
    if (hoveredTarget.type === 'node' && hoveredTarget.id !== dragState.sourceNodeId && hoveredTarget.id !== dragState.triangleNode1 && hoveredTarget.id !== dragState.triangleNode2) { const n = nodes.find(n => n.id === hoveredTarget.id); if (n) { drawEndX = n.x; drawEndY = n.y; } }
    else if (hoveredTarget.type === 'edge') { const edge = edges.find(ed => ed.id === hoveredTarget.id); if (edge) { const snapPt = getEdgeSnapPoint({x: dragState.currentX, y: dragState.currentY}, edge, nodes); drawEndX = snapPt.x; drawEndY = snapPt.y; } }
  }
  return (
    <>
      {dragState.type === 'box_select' && (
        <rect x={Math.min(dragState.logicalStartX, dragState.currentX)} y={Math.min(dragState.logicalStartY, dragState.currentY)} width={Math.abs(dragState.currentX - dragState.logicalStartX)} height={Math.abs(dragState.currentY - dragState.logicalStartY)} fill="rgba(59, 130, 246, 0.1)" stroke="#3b82f6" strokeWidth={1.5 / camera.zoom} pointerEvents="none" />
      )}
      {snapLine && dragState.type && (dragState.type.startsWith('draw_triangle') || dragState.type === 'move_node' || dragState.type.startsWith('draw_line_')) && <line x1={snapLine.x1} y1={snapLine.y1} x2={snapLine.x2} y2={snapLine.y2} stroke="#eab308" strokeWidth={1.5 / camera.zoom} strokeDasharray={`${5 / camera.zoom} ${5 / camera.zoom}`} pointerEvents="none" />}
      {(dragState.type === 'draw_triangle_step1' || dragState.type === 'draw_triangle_step1_end_down') && <line x1={nodes.find(n=>n.id===dragState.sourceNodeId)?.x || dragState.startX} y1={nodes.find(n=>n.id===dragState.sourceNodeId)?.y || dragState.startY} x2={drawEndX} y2={drawEndY} stroke="#94a3b8" strokeWidth={2 / camera.zoom} strokeDasharray={`${4 / camera.zoom} ${4 / camera.zoom}`} pointerEvents="none" />}
      {(dragState.type === 'draw_triangle_step2' || dragState.type === 'draw_triangle_step2_end_down') && <><line x1={nodes.find(n=>n.id===dragState.triangleNode1)?.x} y1={nodes.find(n=>n.id===dragState.triangleNode1)?.y} x2={drawEndX} y2={drawEndY} stroke="#94a3b8" strokeWidth={2 / camera.zoom} strokeDasharray={`${4 / camera.zoom} ${4 / camera.zoom}`} pointerEvents="none" /><line x1={nodes.find(n=>n.id===dragState.triangleNode2)?.x} y1={nodes.find(n=>n.id===dragState.triangleNode2)?.y} x2={drawEndX} y2={drawEndY} stroke="#94a3b8" strokeWidth={2 / camera.zoom} strokeDasharray={`${4 / camera.zoom} ${4 / camera.zoom}`} pointerEvents="none" /></>}
      {dragState.type?.startsWith('draw_line_') && dragState.activeLinePoints && dragState.activeLinePoints.length > 0 && (
        <path d={getSvgPathFromPoints([...dragState.activeLinePoints, {x: drawEndX, y: drawEndY}], dragState.isCurveMode)} stroke="#94a3b8" strokeWidth={2 / camera.zoom} fill="none" strokeDasharray={`${4 / camera.zoom} ${4 / camera.zoom}`} strokeLinecap="round" strokeLinejoin="round" pointerEvents="none" />
      )}
    </>
  );
});
