import { useCallback } from 'react';
import * as Constants from '../constants/defaults.js';
import * as Geometry from '../utils/geometry.js';

export function usePointerEvents({
  camera, setCamera,
  dragState, setDragState,
  nodes, setNodes,
  edges, setEdges,
  lines, setLines,
  texts, setTexts,
  faces,
  selectedIds, setSelectedIds,
  currentMode,
  svgRef,
  setShouldSaveHistory,
  executeDelete,
  tryCloseModals,
  setLengthModalInfo,
  setFaceModalInfo,
  setTextModalInfo,
  snapLine, setSnapLine,
  hoveredTarget, setHoveredTarget,
  abortCurrentOperation
}) {
  const handlePointerDown = useCallback((e) => {
    let tType = e.target.getAttribute('data-type'), tId = e.target.getAttribute('data-id');
    const isRotateHandle = e.target.classList.contains('rotate-handle'), isMoveHandle = e.target.classList.contains('move-handle');
    
    if (tryCloseModals(e, tType)) return;

    if (tType === 'edge_text') tType = 'edge';
    const pt = Geometry.getLogicalPoint(e.clientX, e.clientY, camera, svgRef.current?.getBoundingClientRect());

    if (e.button === 2 || e.button === 1 || (e.shiftKey && !tId && currentMode !== 'select')) { 
      e.preventDefault();
      if (e.button === 2 && currentMode === 'select' && selectedIds.size > 0 && !tId && !isMoveHandle) { setSelectedIds(new Set()); return; }
      if (e.button === 2 && (dragState.type?.startsWith('draw_line_') || dragState.type?.startsWith('draw_triangle'))) { abortCurrentOperation(); return; }
      if (e.button === 2 && tId && tType !== 'drawing-layer') {
        setDragState({ ...Constants.initialDragState, isDragging: true, type: 'wait_for_pan_or_right_click', startX: e.clientX, startY: e.clientY, logicalStartX: pt.x, logicalStartY: pt.y, targetType: tType, targetId: tId, initCamera: { ...camera } });
        return;
      }
      setDragState(prev => ({ ...prev, isDragging: true, type: 'pan', startX: e.clientX, startY: e.clientY, initCamera: { ...camera }, returnTo: (prev.type === 'draw_line_active' || prev.type === 'draw_line_continue_down') ? 'draw_line_active' : null })); 
      return; 
    }

    if (currentMode === 'select') {
      if (isRotateHandle) {
        const elementsToMove = Geometry.getActiveMovableElements(selectedIds, nodes, lines, texts, edges, faces);
        const bbox = Geometry.getSelectionBoundingBox(nodes, lines, texts, elementsToMove);
        if (bbox) setDragState({ ...Constants.initialDragState, isDragging: true, type: 'rotate_selection', startX: e.clientX, startY: e.clientY, logicalStartX: pt.x, logicalStartY: pt.y, centerX: bbox.cx, centerY: bbox.cy, initialNodes: nodes, initialLines: lines, initialTexts: texts, elementsToMove });
        return;
      }
      if (isMoveHandle) {
        const elementsToMove = Geometry.getActiveMovableElements(selectedIds, nodes, lines, texts, edges, faces);
        setDragState({ ...Constants.initialDragState, isDragging: true, type: 'move_selection', startX: e.clientX, startY: e.clientY, logicalStartX: pt.x, logicalStartY: pt.y, initialNodes: nodes, initialLines: lines, initialTexts: texts, elementsToMove });
        return;
      }
      if (tId && tType !== 'drawing-layer') {
        const newSelected = new Set(e.shiftKey ? selectedIds : []);
        if (e.shiftKey) { if (newSelected.has(tId)) newSelected.delete(tId); else newSelected.add(tId); } 
        else { if (!newSelected.has(tId)) { newSelected.clear(); newSelected.add(tId); } }
        setSelectedIds(newSelected);
        const elementsToMove = Geometry.getActiveMovableElements(newSelected, nodes, lines, texts, edges, faces);
        setDragState({ ...Constants.initialDragState, isDragging: true, type: 'move_selection', startX: e.clientX, startY: e.clientY, logicalStartX: pt.x, logicalStartY: pt.y, initialNodes: nodes, initialLines: lines, initialTexts: texts, elementsToMove });
        return;
      }
      if (!e.shiftKey) setSelectedIds(new Set());
      setDragState({ ...Constants.initialDragState, isDragging: true, type: 'box_select', startX: e.clientX, startY: e.clientY, logicalStartX: pt.x, logicalStartY: pt.y, currentX: pt.x, currentY: pt.y, initCamera: { ...camera } });
      return;
    }

    if (tId && tType !== 'drawing-layer' && !dragState.type?.startsWith('draw_line_')) setSelectedIds(new Set([tId]));

    if (currentMode === 'line' || currentMode === 'curve') {
      let snapPt = { x: pt.x, y: pt.y };
      if (tType === 'node') { const n = nodes.find(n => n.id === tId); if (n) snapPt = { x: n.x, y: n.y }; } 
      else if (tType === 'edge') { const edge = edges.find(ed => ed.id === tId); if (edge) snapPt = Geometry.getEdgeSnapPoint(pt, edge, nodes); }

      if (dragState.type === 'draw_line_active') {
        setDragState(prev => ({ ...prev, isDragging: true, type: 'draw_line_continue_down', startX: e.clientX, startY: e.clientY, currentX: snapPt.x, currentY: snapPt.y, initCamera: { ...camera } }));
      } else {
        if (!tId) setSelectedIds(new Set());
        setDragState({ ...Constants.initialDragState, isDragging: true, type: 'draw_line_start_down', startX: e.clientX, startY: e.clientY, logicalStartX: snapPt.x, logicalStartY: snapPt.y, currentX: snapPt.x, currentY: snapPt.y, initCamera: { ...camera }, isCurveMode: currentMode === 'curve' });
      }
      return;
    }

    if (currentMode === 'text') {
      if (tType === 'text') {
        const textObj = texts.find(t => t.id === tId);
        if (textObj) {
          setTextModalInfo({ isOpen: true, textId: tId, initialText: textObj.text, x: e.clientX, y: e.clientY, logicalX: pt.x, logicalY: pt.y });
          return;
        }
      }
      if (!tId) setSelectedIds(new Set());
      setTextModalInfo({ isOpen: true, textId: null, initialText: '', x: e.clientX, y: e.clientY, logicalX: pt.x, logicalY: pt.y });
      return;
    }

    if (dragState.type === 'draw_triangle_step1') return setDragState(prev => ({ ...prev, isDragging: true, type: 'draw_triangle_step1_end_down' }));
    if (dragState.type === 'draw_triangle_step2') return setDragState(prev => ({ ...prev, isDragging: true, type: 'draw_triangle_step2_end_down' }));

    if (tType === 'node') {
      const trackingNodeIds = edges.filter(ed => ed.source === tId || ed.target === tId).map(ed => ed.source === tId ? ed.target : ed.source);
      setDragState({ ...Constants.initialDragState, isDragging: true, type: 'node_down', sourceNodeId: tId, startX: e.clientX, startY: e.clientY, logicalStartX: pt.x, logicalStartY: pt.y, trackingNodeIds });
      return;
    } 

    if (e.target.getAttribute('data-type') === 'edge_text') {
      setLengthModalInfo({ isOpen: true, edgeId: tId, initialValue: edges.find(ed => ed.id === tId)?.length?.toString() || '', x: e.clientX, y: e.clientY });
      return;
    }

    setDragState({ ...Constants.initialDragState, isDragging: true, type: 'wait_for_pan_or_click', startX: e.clientX, startY: e.clientY, logicalStartX: pt.x, logicalStartY: pt.y, targetType: tType, targetId: tId, initCamera: { ...camera } });
  }, [tryCloseModals, camera, svgRef, currentMode, selectedIds, dragState, nodes, lines, texts, edges, faces, abortCurrentOperation, setLengthModalInfo, setTextModalInfo, setDragState]);

  const handlePointerMove = useCallback((e) => {
    const rawPt = Geometry.getLogicalPoint(e.clientX, e.clientY, camera, svgRef.current?.getBoundingClientRect());

    if (dragState.isDragging) {
      const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY);
      if (dist > 5) {
        if (dragState.type === 'wait_for_pan_or_click' || dragState.type === 'draw_line_start_down' || dragState.type === 'wait_for_pan_or_right_click') {
          setDragState(prev => ({ ...prev, type: 'pan' }));
        } else if (dragState.type === 'draw_line_continue_down') {
          setDragState(prev => ({ ...prev, type: 'pan', returnTo: 'draw_line_active' }));
        } else if (dragState.type === 'node_down') {
          setDragState(prev => ({ ...prev, type: 'move_node' }));
          setNodes(prev => prev.map(n => n.id === dragState.sourceNodeId ? { ...n, x: rawPt.x, y: rawPt.y } : n));
        }
      }
    }

    if (dragState.type === 'pan') { setCamera({ ...camera, x: dragState.initCamera.x + (e.clientX - dragState.startX), y: dragState.initCamera.y + (e.clientY - dragState.startY) }); return; }
    if (dragState.type === 'box_select') { setDragState(prev => ({ ...prev, currentX: rawPt.x, currentY: rawPt.y })); return; }

    if (dragState.type === 'move_selection') {
      const dx = rawPt.x - dragState.logicalStartX, dy = rawPt.y - dragState.logicalStartY;
      const { nodeIds, lineIds, textIds } = dragState.elementsToMove;
      setNodes(dragState.initialNodes.map(n => nodeIds.has(n.id) ? { ...n, x: n.x + dx, y: n.y + dy } : n));
      setLines(dragState.initialLines.map(l => lineIds.has(l.id) ? { ...l, points: l.points.map(p => ({ x: p.x + dx, y: p.y + dy })) } : l));
      setTexts(dragState.initialTexts.map(t => textIds.has(t.id) ? { ...t, x: t.x + dx, y: t.y + dy } : t));
      return;
    }

    if (dragState.type === 'rotate_selection') {
      const { centerX, centerY, elementsToMove } = dragState;
      const initialAngle = Math.atan2(dragState.logicalStartY - centerY, dragState.logicalStartX - centerX);
      const currentAngle = Math.atan2(rawPt.y - centerY, rawPt.x - centerX);
      let dAngle = currentAngle - initialAngle;
      if (e.shiftKey) dAngle = Math.round((dAngle * 180 / Math.PI) / 15) * 15 * Math.PI / 180;
      const cos = Math.cos(dAngle), sin = Math.sin(dAngle);
      const rotatePt = (p) => ({ x: centerX + (p.x - centerX) * cos - (p.y - centerY) * sin, y: centerY + (p.x - centerX) * sin + (p.y - centerY) * cos });

      setNodes(dragState.initialNodes.map(n => elementsToMove.nodeIds.has(n.id) ? { ...n, ...rotatePt(n) } : n));
      setLines(dragState.initialLines.map(l => elementsToMove.lineIds.has(l.id) ? { ...l, points: l.points.map(rotatePt) } : l));
      setTexts(dragState.initialTexts.map(t => elementsToMove.textIds.has(t.id) ? { ...t, ...rotatePt(t), rotation: (t.rotation || 0) + (dAngle * 180 / Math.PI) } : t));
      return;
    }

    if (dragState.type?.startsWith('draw_triangle') || dragState.type?.startsWith('draw_line_') || dragState.type === 'move_node' || !dragState.type) {
      let pt = { ...rawPt }, currentSnapLine = null, currentHoveredTarget = { id: null, type: null };
      
      const excludeIds = [
        dragState.type === 'move_node' ? dragState.sourceNodeId : null,
        dragState.type?.startsWith('draw_triangle_step1') ? dragState.sourceNodeId : null, 
        dragState.type?.startsWith('draw_triangle_step2') ? dragState.triangleNode1 : null, 
        dragState.type?.startsWith('draw_triangle_step2') ? dragState.triangleNode2 : null
      ].filter(Boolean);

      let minDist = 20 / camera.zoom;
      nodes.forEach(n => {
        if (excludeIds.includes(n.id)) return;
        const d = Math.hypot(rawPt.x - n.x, rawPt.y - n.y);
        if (d < minDist) { minDist = d; pt = { x: n.x, y: n.y }; currentHoveredTarget = { id: n.id, type: 'node' }; }
      });
      
      if (!currentHoveredTarget.id) {
        edges.forEach(edge => {
          if (dragState.type === 'move_node' && (edge.source === dragState.sourceNodeId || edge.target === dragState.sourceNodeId)) return;
          const n1 = nodes.find(n => n.id === edge.source), n2 = nodes.find(n => n.id === edge.target);
          if (!n1 || !n2) return;
          const dx = n2.x - n1.x, dy = n2.y - n1.y, lenSq = dx * dx + dy * dy;
          if (lenSq === 0) return;
          const t = ((rawPt.x - n1.x) * dx + (rawPt.y - n1.y) * dy) / lenSq;
          if (t >= 0 && t <= 1) {
            const projX = n1.x + t * dx, projY = n1.y + t * dy;
            const d = Math.hypot(rawPt.x - projX, rawPt.y - projY);
            if (d < minDist) { minDist = d; pt = { x: projX, y: projY }; currentHoveredTarget = { id: edge.id, type: 'edge' }; }
          }
        });
      }

      let tType = e.target.getAttribute('data-type'), tId = e.target.getAttribute('data-id');
      let finalHoveredTarget = { id: null, type: null };
      if (tType === 'node' || tType === 'edge_text' || tType === 'text' || tType === 'face_label') finalHoveredTarget = { id: tId, type: tType };
      else if (currentHoveredTarget.type === 'node') finalHoveredTarget = currentHoveredTarget;
      else if (tType === 'line') finalHoveredTarget = { id: tId, type: tType };
      else if (currentHoveredTarget.type === 'edge') finalHoveredTarget = currentHoveredTarget;
      else if (tType === 'face') finalHoveredTarget = { id: tId, type: tType };

      setHoveredTarget(finalHoveredTarget);

      if (!currentHoveredTarget.id && dragState.trackingNodeIds?.length > 0 && dragState.type !== 'move_node') {
        let minDistLine = 15 / camera.zoom;
        const sourceNode = nodes.find(n => n.id === (dragState.type.startsWith('draw_triangle_step1') ? dragState.sourceNodeId : dragState.triangleNode2));
        if (sourceNode) {
          dragState.trackingNodeIds.forEach(nodeId => {
            const n = nodes.find(nd => nd.id === nodeId);
            if (!n) return;
            const dx = n.x - sourceNode.x, dy = n.y - sourceNode.y, len = Math.hypot(dx, dy);
            if (len === 0) return;
            const ux = dx / len, uy = dy / len, wx = rawPt.x - sourceNode.x, wy = rawPt.y - sourceNode.y, dot = wx * ux + wy * uy, projX = sourceNode.x + dot * ux, projY = sourceNode.y + dot * uy, d = Math.hypot(rawPt.x - projX, rawPt.y - projY);
            if (d < minDistLine) {
              minDistLine = d; pt = { x: projX, y: projY };
              currentSnapLine = { x1: sourceNode.x - ux * 9999, y1: sourceNode.y - uy * 9999, x2: sourceNode.x + ux * 9999, y2: sourceNode.y + uy * 9999 };
            }
          });
        }
      }
      setSnapLine(currentSnapLine); 
      setDragState(prev => ({ ...prev, currentX: pt.x, currentY: pt.y }));

      if (dragState.type === 'move_node') setNodes(prev => prev.map(n => n.id === dragState.sourceNodeId ? { ...n, x: pt.x, y: pt.y } : n));
    }
  }, [camera, svgRef, dragState, nodes, edges, setCamera, setDragState, setNodes, setLines, setTexts, setHoveredTarget, setSnapLine]);

  const handlePointerUp = useCallback((e) => {
    if (dragState.type === 'move_selection' || dragState.type === 'rotate_selection') { setShouldSaveHistory(true); setDragState(Constants.initialDragState); return; }

    if (dragState.type === 'wait_for_pan_or_right_click') {
      const { targetType, targetId } = dragState;
      if (['edge', 'edge_text', 'node', 'face', 'face_label', 'line', 'text'].includes(targetType)) executeDelete(new Set([targetId]));
      setDragState(Constants.initialDragState); setSnapLine(null); setHoveredTarget({ id: null, type: null }); return;
    }

    if (dragState.type === 'box_select') {
      const minX = Math.min(dragState.logicalStartX, dragState.currentX), maxX = Math.max(dragState.logicalStartX, dragState.currentX);
      const minY = Math.min(dragState.logicalStartY, dragState.currentY), maxY = Math.max(dragState.logicalStartY, dragState.currentY);

      const newSelected = new Set(e.shiftKey ? selectedIds : []);
      nodes.forEach(n => { if (n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY) newSelected.add(n.id); });
      lines.forEach(l => {
        const lMinX = Math.min(...l.points.map(p=>p.x)), lMaxX = Math.max(...l.points.map(p=>p.x)), lMinY = Math.min(...l.points.map(p=>p.y)), lMaxY = Math.max(...l.points.map(p=>p.y));
        const cx = (lMinX + lMaxX) / 2, cy = (lMinY + lMaxY) / 2;
        if (cx >= minX && cx <= maxX && cy >= minY && cy <= maxY) newSelected.add(l.id);
      });
      texts.forEach(t => { if (t.x >= minX && t.x <= maxX && t.y >= minY && t.y <= maxY) newSelected.add(t.id); });

      setSelectedIds(newSelected); setDragState(Constants.initialDragState); return;
    }

    if (dragState.type === 'draw_triangle_step1_end_down' || dragState.type === 'draw_triangle_step2_end_down') {
      const isStep1 = dragState.type === 'draw_triangle_step1_end_down';
      const pt = (snapLine || hoveredTarget.id) ? { x: dragState.currentX, y: dragState.currentY } : Geometry.getLogicalPoint(e.clientX, e.clientY, camera, svgRef.current?.getBoundingClientRect());
      const tId = hoveredTarget.id || e.target.getAttribute('data-id'), tType = hoveredTarget.type || e.target.getAttribute('data-type');
      
      let finalTargetId = null, isNode2New = false;
      const invalidIds = isStep1 ? [dragState.sourceNodeId] : [dragState.triangleNode1, dragState.triangleNode2];

      if (tType === 'node' && !invalidIds.includes(tId)) { finalTargetId = tId; }
      else if (tType === 'edge') {
        const edge = edges.find(ed => ed.id === tId), snapPt = Geometry.getEdgeSnapPoint(pt, edge, nodes), newNode = { id: Constants.generateId(), x: snapPt.x, y: snapPt.y };
        setNodes(prev => [...prev, newNode]); finalTargetId = newNode.id; isNode2New = true;
      } else {
        if (tType === 'node' && invalidIds.includes(tId)) { setDragState(p => ({ ...p, isDragging: false, type: isStep1 ? 'draw_triangle_step1' : 'draw_triangle_step2' })); setHoveredTarget({ id: null, type: null }); return; }
        const newNode = { id: Constants.generateId(), x: pt.x, y: pt.y }; setNodes(prev => [...prev, newNode]); finalTargetId = newNode.id; isNode2New = true;
      }

      let newEdge1Id = null;
      if (isStep1) {
        const exists = edges.find(ed => (ed.source === dragState.sourceNodeId && ed.target === finalTargetId) || (ed.target === dragState.sourceNodeId && ed.source === finalTargetId));
        if (!exists) { const newEdge = { id: Constants.generateId(), source: dragState.sourceNodeId, target: finalTargetId, length: null }; setEdges(prev => [...prev, newEdge]); newEdge1Id = newEdge.id; }
        else newEdge1Id = exists.id;

        if (edges.some(e1 => { const w = e1.source === dragState.sourceNodeId ? e1.target : (e1.target === dragState.sourceNodeId ? e1.source : null); return w && w !== finalTargetId && edges.some(e2 => (e2.source === w && e2.target === finalTargetId) || (e2.target === w && e2.source === finalTargetId)); })) {
          setShouldSaveHistory(true); setDragState(Constants.initialDragState); setSnapLine(null); setHoveredTarget({ id: null, type: null }); return;
        }

        const newTracking = [...dragState.trackingNodeIds];
        edges.forEach(ed => { if (ed.source === finalTargetId && !newTracking.includes(ed.target)) newTracking.push(ed.target); if (ed.target === finalTargetId && !newTracking.includes(ed.source)) newTracking.push(ed.source); });
        if (!newTracking.includes(dragState.sourceNodeId)) newTracking.push(dragState.sourceNodeId);
        
        setDragState(p => ({ ...p, isDragging: false, type: 'draw_triangle_step2', triangleNode1: p.sourceNodeId, triangleNode2: finalTargetId, isNode2New, edge1Id: newEdge1Id, currentX: pt.x, currentY: pt.y, trackingNodeIds: newTracking }));
      } else {
        const newEdges = [];
        if (!edges.some(ed => (ed.source === dragState.triangleNode2 && ed.target === finalTargetId) || (ed.target === dragState.triangleNode2 && ed.source === finalTargetId))) newEdges.push({ id: Constants.generateId(), source: dragState.triangleNode2, target: finalTargetId, length: null });
        if (!edges.some(ed => (ed.source === finalTargetId && ed.target === dragState.triangleNode1) || (ed.target === finalTargetId && ed.source === dragState.triangleNode1))) newEdges.push({ id: Constants.generateId(), source: finalTargetId, target: dragState.triangleNode1, length: null });
        if (newEdges.length > 0) setEdges(prev => [...prev, ...newEdges]);
        setShouldSaveHistory(true); setDragState(Constants.initialDragState);
      }
      setSnapLine(null); setHoveredTarget({ id: null, type: null });

    } else if (dragState.type === 'draw_line_start_down') {
      const pt = (snapLine || hoveredTarget.id) ? { x: dragState.currentX, y: dragState.currentY } : Geometry.getLogicalPoint(e.clientX, e.clientY, camera, svgRef.current?.getBoundingClientRect());
      setDragState(prev => ({ ...Constants.initialDragState, type: 'draw_line_active', activeLinePoints: [{ x: pt.x, y: pt.y }], currentX: pt.x, currentY: pt.y, isCurveMode: prev.isCurveMode }));
    } else if (dragState.type === 'draw_line_continue_down') {
      const pt = (snapLine || hoveredTarget.id) ? { x: dragState.currentX, y: dragState.currentY } : Geometry.getLogicalPoint(e.clientX, e.clientY, camera, svgRef.current?.getBoundingClientRect());
      const lastPt = dragState.activeLinePoints[dragState.activeLinePoints.length - 1];
      if (Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y) > 0.1) setDragState(prev => ({ ...prev, type: 'draw_line_active', activeLinePoints: [...prev.activeLinePoints, { x: pt.x, y: pt.y }], currentX: pt.x, currentY: pt.y }));
      else setDragState(prev => ({ ...prev, type: 'draw_line_active', currentX: pt.x, currentY: pt.y }));
    } else if (dragState.type === 'wait_for_pan_or_click') {
      const { targetType, targetId, logicalStartX, logicalStartY, startX, startY } = dragState, pt = { x: logicalStartX, y: logicalStartY };

      if (targetType === 'face' || targetType === 'face_label') {
        setSelectedIds(new Set([targetId])); setDragState(Constants.initialDragState); setFaceModalInfo({ isOpen: true, faceId: targetId, x: startX, y: startY });
      } else if (targetType === 'edge') {
        setSelectedIds(new Set());
        const edge = edges.find(ed => ed.id === targetId), snapPt = Geometry.getEdgeSnapPoint(pt, edge, nodes), newNode = { id: Constants.generateId(), x: snapPt.x, y: snapPt.y };
        setNodes(prev => [...prev, newNode]);
        setDragState({ ...Constants.initialDragState, type: 'draw_triangle_step1', sourceNodeId: newNode.id, startX: snapPt.x, startY: snapPt.y, currentX: snapPt.x, currentY: snapPt.y, isNewNode: true, trackingNodeIds: edge ? [edge.source, edge.target] : [] });
        setSelectedIds(new Set([newNode.id]));
      } else {
        setSelectedIds(new Set());
        const newNode = { id: Constants.generateId(), x: pt.x, y: pt.y }; setNodes(prev => [...prev, newNode]);
        setDragState({ ...Constants.initialDragState, type: 'draw_triangle_step1', sourceNodeId: newNode.id, startX: pt.x, startY: pt.y, currentX: pt.x, currentY: pt.y, isNewNode: true });
        setSelectedIds(new Set([newNode.id]));
      }
    } else if (dragState.type === 'node_down') {
      setDragState({ ...Constants.initialDragState, type: 'draw_triangle_step1', sourceNodeId: dragState.sourceNodeId, startX: dragState.logicalStartX, startY: dragState.logicalStartY, currentX: dragState.logicalStartX, currentY: dragState.logicalStartY, trackingNodeIds: dragState.trackingNodeIds });
      setHoveredTarget({ id: null, type: null });
    } else if (dragState.type === 'pan') {
      if (dragState.returnTo === 'draw_line_active') setDragState(prev => ({ ...prev, isDragging: false, type: 'draw_line_active' }));
      else { setDragState(Constants.initialDragState); setSnapLine(null); setHoveredTarget({ id: null, type: null }); }
    } else if (dragState.type === 'move_node') {
      setShouldSaveHistory(true); setDragState(Constants.initialDragState); setSnapLine(null); setHoveredTarget({ id: null, type: null });
    }
  }, [dragState, selectedIds, nodes, lines, texts, edges, camera, svgRef, snapLine, hoveredTarget, setFaceModalInfo, executeDelete, setShouldSaveHistory, setDragState, setSnapLine, setHoveredTarget, setSelectedIds, setNodes, setEdges]);

  const getHintText = useCallback(() => {
    if (currentMode === 'select') {
      if (dragState.type === 'box_select') return "ドラッグで矩形選択しています...";
      if (dragState.type === 'move_selection') return "選択した要素をまとめて移動中...";
      if (dragState.type === 'rotate_selection') return "選択した要素を回転中...";
      return "左ドラッグで矩形選択 / 要素をクリックで選択 (Shiftで追加) / 選択後ドラッグで移動・回転";
    }
    if (dragState.type?.startsWith('draw_triangle')) return "次のポイントをクリックして三角形を作図 (右クリックでキャンセル)";
    if (dragState.type === 'move_node') return "要素を移動中...";
    if (dragState.type?.startsWith('draw_line_')) return "次のポイントをクリックして線を引く (右クリックで確定して終了)";
    if (dragState.type === 'pan' || dragState.type === 'wait_for_pan_or_click') return "キャンバスを移動中...";
    if (currentMode === 'line') return "左クリックで直線の始点を決定 / 要素クリックで選択";
    if (currentMode === 'curve') return "左クリックで曲線の始点を決定 / 要素クリックで選択";
    if (currentMode === 'text') return "クリックした場所にテキストを追加 / 要素クリックで編集";
    if (hoveredTarget.type === 'face') return "面：左クリックで種類を選択 / 右クリックで削除";
    if (hoveredTarget.type === 'edge') return "辺：左クリックでポイント追加・作図開始 / 右クリックで削除";
    if (hoveredTarget.type === 'node') return "頂点：ドラッグで移動 / 左クリックで作図開始 / 右クリックで削除";
    return "何もない場所を左クリックで新しいポイントを追加 / 右ドラッグで視点移動";
  }, [currentMode, dragState.type, hoveredTarget.type]);

  return {
    handlePointerDown, handlePointerMove, handlePointerUp,
    getHintText
  };
}
