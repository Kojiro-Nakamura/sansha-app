import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import * as Icons from './components/icons/Icons.jsx';
import * as Constants from './constants/defaults.js';
import * as Geometry from './utils/geometry.js';
import { getInitialData } from './utils/migration.js';

import { Toolbar } from './components/ui/Toolbar.jsx';
import { PropertyPanel } from './components/ui/PropertyPanel.jsx';
import { LengthModal } from './components/modals/LengthModal.jsx';
import { TextModal } from './components/modals/TextModal.jsx';
import { FaceModal } from './components/modals/FaceModal.jsx';
import { PrintModal } from './components/modals/PrintModal.jsx';
import { ExportModal } from './components/modals/ExportModal.jsx';
import { ClearModal } from './components/modals/ClearModal.jsx';
import { FacesLayer } from './components/layers/FacesLayer.jsx';
import { EdgesLayer } from './components/layers/EdgesLayer.jsx';
import { NodesLayer } from './components/layers/NodesLayer.jsx';
import { AnnotationsLayer } from './components/layers/AnnotationsLayer.jsx';
import { SelectionUILayer } from './components/layers/SelectionUILayer.jsx';
import { GuidesLayer } from './components/layers/GuidesLayer.jsx';
import './index.css';

import { useHistory } from './hooks/useHistory.js';
import { useCamera } from './hooks/useCamera.js';
import { useFileIO } from './hooks/useFileIO.js';
import { usePointerEvents } from './hooks/usePointerEvents.js';

export default function App() {
  const [currentMode, setCurrentMode] = useState('polygon');
  const [initData] = useState(() => getInitialData());

  const [nodes, setNodes] = useState(initData?.nodes || Constants.defaultNodes);
  const [edges, setEdges] = useState(initData?.edges || Constants.defaultEdges);
  const [lines, setLines] = useState(initData?.lines || Constants.defaultLines);
  const [texts, setTexts] = useState(initData?.texts || Constants.defaultTexts);
  const [faceTypes, setFaceTypes] = useState(initData?.faceTypes || Constants.defaultFaceTypes);
  const [faceDeductions, setFaceDeductions] = useState(initData?.faceDeductions || Constants.defaultFaceDeductions);
  const [slopeTypes, setSlopeTypes] = useState(initData?.slopeTypes || Constants.defaultSlopeTypes);
  const [fractionDigits, setFractionDigits] = useState(initData?.fractionDigits ?? Constants.defaultFractionDigits);
  const [attributes, setAttributes] = useState(initData?.attributes || Constants.defaultAttributes);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const [dragState, setDragState] = useState(Constants.initialDragState);
  const [snapLine, setSnapLine] = useState(null);
  const [hoveredTarget, setHoveredTarget] = useState({ id: null, type: null });

  const [lengthModalInfo, setLengthModalInfo] = useState({ isOpen: false, edgeId: null, initialValue: '', x: 0, y: 0 });
  const [faceModalInfo, setFaceModalInfo] = useState({ isOpen: false, faceId: null, x: 0, y: 0 });
  const [textModalInfo, setTextModalInfo] = useState({ isOpen: false, textId: null, initialText: '', x: 0, y: 0, logicalX: 0, logicalY: 0 });
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [defaultApplyLength, setDefaultApplyLength] = useState(false);

  const [shouldSaveHistory, setShouldSaveHistory] = useState(false);

  const faces = useMemo(() => Geometry.computeFaces(nodes, edges, fractionDigits), [nodes, edges, fractionDigits]);
  const facesWithNumbers = useMemo(() => Geometry.computeFacesWithNumbers(faces, faceTypes), [faces, faceTypes]);
  const totalArea = useMemo(() => {
    return faces.filter(f => f.status === 'valid').reduce((sum, f) => {
      const isDeduction = faceDeductions[f.id];
      return sum + (isDeduction ? -f.area : f.area);
    }, 0);
  }, [faces, faceDeductions]);

  const currentState = useMemo(() => ({ nodes, edges, lines, texts, faceTypes, faceDeductions, slopeTypes, fractionDigits, attributes, facesWithNumbers, totalArea }), [nodes, edges, lines, texts, faceTypes, faceDeductions, slopeTypes, fractionDigits, attributes, facesWithNumbers, totalArea]);

  const svgRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => { document.documentElement.lang = 'ja'; }, []);
  useEffect(() => { localStorage.setItem('sansha_draw_data', JSON.stringify({ nodes, edges, lines, texts, faceTypes, faceDeductions, slopeTypes, fractionDigits, attributes })); }, [nodes, edges, lines, texts, faceTypes, faceDeductions, slopeTypes, fractionDigits, attributes]);

  const { camera, setCamera, handleFitToView, handleWheel } = useCamera(svgRef, { x: 0, y: 0, zoom: 1 });

  const updateState = useCallback((newState) => {
    if (newState.nodes) setNodes(newState.nodes);
    if (newState.edges) setEdges(newState.edges);
    if (newState.lines) setLines(newState.lines);
    if (newState.texts) setTexts(newState.texts);
    if (newState.faceTypes) setFaceTypes(newState.faceTypes);
    if (newState.faceDeductions) setFaceDeductions(newState.faceDeductions);
    if (newState.slopeTypes) setSlopeTypes(newState.slopeTypes);
    if (newState.fractionDigits !== undefined) setFractionDigits(newState.fractionDigits);
    if (newState.attributes) setAttributes(newState.attributes);
  }, []);

  const closeModalsAndReset = useCallback(() => {
    setLengthModalInfo(p => ({ ...p, isOpen: false })); setFaceModalInfo(p => ({ ...p, isOpen: false })); setTextModalInfo(p => ({ ...p, isOpen: false }));
    setPrintModalOpen(false); setExportModalOpen(false); setClearModalOpen(false);
    setHoveredTarget({ id: null, type: null });
  }, []);

  const cancelDraw = useCallback(() => {
    if (dragState.type?.startsWith('draw_triangle') || dragState.type?.startsWith('draw_line_')) {
      if ((dragState.type === 'draw_line_active' || dragState.type === 'draw_line_continue_down') && dragState.activeLinePoints && dragState.activeLinePoints.length >= 2) {
        setLines(prev => [...prev, { id: Constants.generateId(), points: dragState.activeLinePoints, color: '#64748b', strokeWidth: 2, strokeDasharray: 'none', isCurve: dragState.isCurveMode }]);
        setShouldSaveHistory(true);
      }
      setDragState(Constants.initialDragState); setSnapLine(null); setHoveredTarget({ id: null, type: null });
    }
  }, [dragState, setShouldSaveHistory]);

  const tryCloseModals = useCallback((e, tType) => {
    let closed = false;
    if (lengthModalInfo.isOpen && tType !== 'edge_text') { setLengthModalInfo(p => ({ ...p, isOpen: false })); closed = true; }
    if (faceModalInfo.isOpen && tType !== 'face' && !e.target.closest('.face-modal-content')) { setFaceModalInfo(p => ({ ...p, isOpen: false })); closed = true; }
    if (textModalInfo.isOpen && tType !== 'text') { setTextModalInfo(p => ({ ...p, isOpen: false })); closed = true; }
    if (closed) setHoveredTarget({ id: null, type: null });
    return closed;
  }, [lengthModalInfo.isOpen, faceModalInfo.isOpen, textModalInfo.isOpen]);

  const abortCurrentOperation = useCallback(() => {
    if (dragState.type?.startsWith('draw_triangle_step2')) {
      if (dragState.isNode2New) setNodes(prev => prev.filter(n => n.id !== dragState.triangleNode2));
      setEdges(prev => prev.filter(ed => ed.id !== dragState.edge1Id));
    }
    if (dragState.type?.startsWith('draw_triangle') && dragState.isNewNode) setNodes(prev => prev.filter(n => n.id !== dragState.sourceNodeId));
    if (dragState.type?.startsWith('draw_line_')) cancelDraw();
    
    setDragState(Constants.initialDragState); setSelectedIds(new Set()); setSnapLine(null); setHoveredTarget({ id: null, type: null });
  }, [dragState, cancelDraw]);

  const executeDelete = useCallback((idsToDelete = selectedIds) => {
    if (idsToDelete.size === 0) return;
    let currentNodes = [...nodes], currentEdges = [...edges], currentLines = [...lines], currentTexts = [...texts], currentFaceTypes = { ...faceTypes }, currentFaceDeductions = { ...faceDeductions };

    idsToDelete.forEach(targetId => {
      if (currentNodes.find(n => n.id === targetId)) {
        currentNodes = currentNodes.filter(n => n.id !== targetId);
        currentEdges = currentEdges.filter(edge => edge.source !== targetId && edge.target !== targetId);
      } else if (currentEdges.find(e => e.id === targetId)) {
        currentEdges = currentEdges.filter(edge => edge.id !== targetId);
      } else if (currentLines.find(l => l.id === targetId)) {
        currentLines = currentLines.filter(l => l.id !== targetId);
      } else if (currentTexts.find(t => t.id === targetId)) {
        currentTexts = currentTexts.filter(t => t.id !== targetId);
      } else if (faces.find(f => f.id === targetId)) {
        const face = faces.find(f => f.id === targetId);
        if (face) {
          const otherFaces = faces.filter(f => f.id !== targetId && !idsToDelete.has(f.id));
          const edgesToRemove = face.edges.filter(edge => !otherFaces.some(of => of.edges.some(e => e && e.id === edge.id))).map(e => e.id);
          currentEdges = currentEdges.filter(e => !edgesToRemove.includes(e.id));
          delete currentFaceTypes[targetId];
          delete currentFaceDeductions[targetId];
        }
      }
    });

    const activeNodeIds = new Set();
    currentEdges.forEach(e => { activeNodeIds.add(e.source); activeNodeIds.add(e.target); });
    currentNodes = currentNodes.filter(n => activeNodeIds.has(n.id) || nodes.some(on => on.id === n.id && !edges.some(e => e.source === n.id || e.target === n.id)));

    setNodes(currentNodes); setEdges(currentEdges); setLines(currentLines); setTexts(currentTexts); setFaceTypes(currentFaceTypes); setFaceDeductions(currentFaceDeductions);
    
    if (idsToDelete === selectedIds) setSelectedIds(new Set());
    else { const newSelected = new Set(selectedIds); idsToDelete.forEach(id => newSelected.delete(id)); setSelectedIds(newSelected); }
    
    closeModalsAndReset(); setShouldSaveHistory(true);
  }, [selectedIds, nodes, edges, lines, texts, faceTypes, faceDeductions, faces, closeModalsAndReset]);

  const { history, historyStep, setHistory, setHistoryStep, undo, redo } = useHistory(
    currentState, updateState, cancelDraw, closeModalsAndReset, shouldSaveHistory, setShouldSaveHistory
  );

  const { isDraggingOver, handleFileLoad, handleDragOver, handleDragLeave, handleDrop, handlePrintHTML, handleExport } = useFileIO({
    updateState, setHistory, setHistoryStep, setSelectedIds, handleFitToView, currentState
  });

  const { handlePointerDown, handlePointerMove, handlePointerUp, getHintText } = usePointerEvents({
    camera, setCamera, dragState, setDragState, nodes, setNodes, edges, setEdges, lines, setLines, texts, setTexts,
    faces, selectedIds, setSelectedIds, currentMode, svgRef, setShouldSaveHistory, executeDelete, tryCloseModals,
    setLengthModalInfo, setFaceModalInfo, setTextModalInfo, snapLine, setSnapLine, hoveredTarget, setHoveredTarget, abortCurrentOperation
  });

  useEffect(() => { setTimeout(() => handleFitToView(nodes, lines, texts, edges, facesWithNumbers), 100); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (e.key === 'Escape') {
        if (lengthModalInfo.isOpen || faceModalInfo.isOpen || textModalInfo.isOpen || printModalOpen || exportModalOpen || clearModalOpen) {
          closeModalsAndReset();
        }
        abortCurrentOperation();
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && e.target.tagName.toLowerCase() !== 'input' && selectedIds.size > 0) {
        executeDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, dragState, lengthModalInfo.isOpen, history, historyStep, faceModalInfo.isOpen, textModalInfo.isOpen, undo, redo, closeModalsAndReset, abortCurrentOperation, executeDelete, printModalOpen, exportModalOpen, clearModalOpen]);

  const handleClearAll = useCallback(() => {
    setNodes([]); setEdges([]); setLines([]); setTexts([]); setFaceTypes({}); setFaceDeductions({}); setAttributes(Constants.defaultAttributes);
    setShouldSaveHistory(true); setClearModalOpen(false); setDragState(Constants.initialDragState);
    setSelectedIds(new Set()); setHoveredTarget({ id: null, type: null }); setCamera({ x: 0, y: 0, zoom: 1 });
  }, []);

  const updateEdgeLength = useCallback((id, newLengthStr) => {
    const val = parseFloat(newLengthStr);
    setEdges(prev => prev.map(e => e.id === id ? { ...e, length: isNaN(val) ? null : val } : e));
  }, []);

  const applyLengthToNode = useCallback((edgeId, newLengthValStr) => {
    const val = parseFloat(newLengthValStr);
    if (isNaN(val) || val <= 0) return;
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;
    const n1 = nodes.find(n => n.id === edge.source), n2 = nodes.find(n => n.id === edge.target);
    if (n1 && n2) {
      const newPxLen = val * 20, currentPxLen = Math.hypot(n2.x - n1.x, n2.y - n1.y);
      if (currentPxLen > 0) {
        const n1FacesCount = faces.filter(f => f.nodes.some(n => n.id === n1.id)).length, n2FacesCount = faces.filter(f => f.nodes.some(n => n.id === n2.id)).length;
        let movingNodeId = n2.id, fixedNodeId = n1.id;
        if (n1FacesCount < n2FacesCount) { movingNodeId = n1.id; fixedNodeId = n2.id; }
        else if (n1FacesCount === n2FacesCount) {
          const n1EdgesCount = edges.filter(e => e.source === n1.id || e.target === n1.id).length, n2EdgesCount = edges.filter(e => e.source === n2.id || e.target === n2.id).length;
          if (n1EdgesCount < n2EdgesCount) { movingNodeId = n1.id; fixedNodeId = n2.id; }
        }
        const fixedNode = movingNodeId === n2.id ? n1 : n2, movingNode = movingNodeId === n2.id ? n2 : n1;
        const dx = movingNode.x - fixedNode.x, dy = movingNode.y - fixedNode.y;
        setNodes(prev => prev.map(n => n.id === movingNodeId ? { ...n, x: fixedNode.x + (dx / currentPxLen) * newPxLen, y: fixedNode.y + (dy / currentPxLen) * newPxLen } : n));
      }
    }
  }, [edges, nodes, faces]);

  const handleConfirmLength = useCallback((edgeId, valStr, shouldApply) => {
    setDefaultApplyLength(shouldApply);
    if (shouldApply) applyLengthToNode(edgeId, valStr);
    updateEdgeLength(edgeId, valStr);
    closeModalsAndReset(); setSelectedIds(new Set()); setShouldSaveHistory(true);
  }, [applyLengthToNode, updateEdgeLength, closeModalsAndReset]);

  const handleConfirmText = useCallback((textId, textValue, logicalX, logicalY) => {
    if (!textValue.trim()) {
      if (textId) executeDelete(new Set([textId]));
      closeModalsAndReset(); return;
    }
    if (textId) setTexts(prev => prev.map(t => t.id === textId ? { ...t, text: textValue } : t));
    else setTexts(prev => [...prev, { id: Constants.generateId(), x: logicalX, y: logicalY, text: textValue, color: '#334155', fontSize: 8, rotation: 0 }]);
    closeModalsAndReset(); setSelectedIds(new Set()); setShouldSaveHistory(true);
  }, [executeDelete, closeModalsAndReset]);

  const handleSelectFaceType = useCallback((faceId, typeId) => {
    setFaceTypes(prev => ({ ...prev, [faceId]: typeId }));
    setShouldSaveHistory(true);
  }, []);

  const handleAddFaceType = useCallback((faceId, newName) => {
    const newId = Constants.generateId(), colors = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#10b981', '#f59e0b', '#ec4899'];
    const match = newName.match(/^(.)[^a-zA-Z0-9]*([a-zA-Z0-9]+)$/);
    const shortName = match ? `${match[1]}${match[2]}` : newName.charAt(0);
    setSlopeTypes(prev => [...prev, { id: newId, name: newName, shortName: shortName, color: colors[Math.floor(Math.random() * colors.length)], isDeduction: false }]);
    setFaceTypes(prev => ({ ...prev, [faceId]: newId }));
    setShouldSaveHistory(true);
  }, []);

  return (
    <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-800 overflow-hidden select-none relative" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      <Toolbar currentMode={currentMode} setCurrentMode={setCurrentMode} onUndo={undo} onRedo={redo} canUndo={historyStep > 0} canRedo={historyStep < history.length - 1} onDelete={() => executeDelete()} canDelete={selectedIds.size > 0} onClearClick={() => setClearModalOpen(true)} onFitToView={() => handleFitToView(nodes, lines, texts, edges, facesWithNumbers)} onPrintClick={() => setPrintModalOpen(true)} onExport={() => setExportModalOpen(true)} onImport={e => { handleFileLoad(e.target.files[0]); e.target.value = null; }} fileInputRef={fileInputRef} cancelDraw={cancelDraw} />
      <div className="flex-1 relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iI2QxZDVkYiIvPjwvc3ZnPg==')]">
        <svg ref={svgRef} className={`w-full h-full touch-none ${dragState.type === 'pan' ? 'cursor-grabbing' : 'cursor-crosshair'}`} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onWheel={handleWheel} onContextMenu={e => e.preventDefault()}>
          <g id="drawing-layer" transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
            <FacesLayer facesWithNumbers={facesWithNumbers} faceTypes={faceTypes} faceDeductions={faceDeductions} slopeTypes={slopeTypes} camera={camera} hoveredTarget={hoveredTarget} selectedIds={selectedIds} dragState={dragState} setHoveredTarget={setHoveredTarget} fractionDigits={fractionDigits} currentMode={currentMode} />
            <EdgesLayer edges={edges} nodes={nodes} facesWithNumbers={facesWithNumbers} camera={camera} hoveredTarget={hoveredTarget} selectedIds={selectedIds} dragState={dragState} setHoveredTarget={setHoveredTarget} fractionDigits={fractionDigits} />
            <AnnotationsLayer lines={lines} texts={texts} camera={camera} hoveredTarget={hoveredTarget} selectedIds={selectedIds} dragState={dragState} setHoveredTarget={setHoveredTarget} />
            <SelectionUILayer selectedIds={selectedIds} currentMode={currentMode} nodes={nodes} lines={lines} texts={texts} edges={edges} faces={faces} camera={camera} />
            <GuidesLayer dragState={dragState} snapLine={snapLine} hoveredTarget={hoveredTarget} nodes={nodes} edges={edges} camera={camera} />
            {(currentMode === 'polygon' || currentMode === 'select') && <NodesLayer nodes={nodes} camera={camera} hoveredTarget={hoveredTarget} selectedIds={selectedIds} dragState={dragState} setHoveredTarget={setHoveredTarget} />}
          </g>
        </svg>

        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-800/80 backdrop-blur text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-md pointer-events-none z-20 flex items-center gap-2"><Icons.IconInfo size={16} className="text-blue-300"/> {getHintText()}</div>

        <LengthModal info={lengthModalInfo} defaultApply={defaultApplyLength} onClose={() => { setLengthModalInfo(p => ({ ...p, isOpen: false })); setHoveredTarget({ id: null, type: null }); setSelectedIds(new Set()); }} onConfirm={handleConfirmLength} />
        <FaceModal info={faceModalInfo} slopeTypes={slopeTypes} faceTypes={faceTypes} faceDeductions={faceDeductions} onClose={() => { setFaceModalInfo(p => ({ ...p, isOpen: false })); setHoveredTarget({ id: null, type: null }); setSelectedIds(new Set()); }} onSelect={handleSelectFaceType} onAdd={handleAddFaceType} onToggleDeduction={(faceId, isDeduct) => { setFaceDeductions(prev => ({ ...prev, [faceId]: isDeduct })); setShouldSaveHistory(true); }} />
        <TextModal info={textModalInfo} onClose={() => { setTextModalInfo(p => ({ ...p, isOpen: false })); setHoveredTarget({ id: null, type: null }); setSelectedIds(new Set()); }} onConfirm={handleConfirmText} />
        <PrintModal isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} onPrint={(options) => handlePrintHTML(options, setPrintModalOpen)} />
        <ExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} onConfirm={(name) => handleExport(name, setExportModalOpen)} />
        <ClearModal isOpen={clearModalOpen} onClose={() => setClearModalOpen(false)} onConfirm={handleClearAll} />
      </div>

      <PropertyPanel selectedIds={selectedIds} faces={facesWithNumbers} edges={edges} nodes={nodes} lines={lines} texts={texts} faceTypes={faceTypes} faceDeductions={faceDeductions} slopeTypes={slopeTypes} totalArea={totalArea} attributes={attributes} setFaceTypes={setFaceTypes} setFaceDeductions={setFaceDeductions} setShouldSaveHistory={setShouldSaveHistory} updateEdgeLength={updateEdgeLength} applyLengthToNode={applyLengthToNode} setSlopeTypes={setSlopeTypes} fractionDigits={fractionDigits} setFractionDigits={setFractionDigits} setLines={setLines} setTexts={setTexts} setAttributes={setAttributes} />
      
      {isDraggingOver && (
        <div className="absolute inset-0 z-[200] bg-blue-500/20 backdrop-blur-sm flex items-center justify-center border-4 border-blue-500 border-dashed m-4 rounded-2xl pointer-events-none transition-all duration-200"><div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-200"><Icons.IconUpload size={48} className="text-blue-500 animate-bounce" /><p className="text-xl font-bold text-slate-700">JSONファイルをドロップして読み込み</p></div></div>
      )}
    </div>
  );
}