import { useState, useCallback } from 'react';
import { migrateData } from '../utils/migration.js';
import { exportToHTML } from '../utils/export.js';
import * as Geometry from '../utils/geometry.js';

export function useFileIO({
  updateState,
  setHistory,
  setHistoryStep,
  setSelectedIds,
  handleFitToView,
  currentState
}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileLoad = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => { 
      try { 
        const parsed = JSON.parse(ev.target.result); 
        const migrated = migrateData(parsed);
        if (migrated) {
          updateState({
            nodes: migrated.nodes,
            edges: migrated.edges,
            lines: migrated.lines,
            texts: migrated.texts,
            faceTypes: migrated.faceTypes,
            faceDeductions: migrated.faceDeductions,
            slopeTypes: migrated.slopeTypes,
            fractionDigits: migrated.fractionDigits,
            attributes: migrated.attributes
          });
          setHistory([migrated]); 
          setHistoryStep(0); 
          setSelectedIds(new Set()); 
          
          setTimeout(() => {
            const newFaces = Geometry.computeFaces(migrated.nodes, migrated.edges, migrated.fractionDigits);
            const newFacesWithNumbers = Geometry.computeFacesWithNumbers(newFaces, migrated.faceTypes);
            handleFitToView(migrated.nodes, migrated.lines, migrated.texts, migrated.edges, newFacesWithNumbers);
          }, 100); 
        } 
      } catch (err) { console.error('ファイルの読み込みに失敗しました。', err); } 
    }; 
    reader.readAsText(file);
  }, [updateState, setHistory, setHistoryStep, setSelectedIds, handleFitToView]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); e.stopPropagation(); if (!e.currentTarget.contains(e.relatedTarget)) setIsDraggingOver(false); }, []);
  const handleDrop = useCallback((e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) handleFileLoad(e.dataTransfer.files[0]); }, [handleFileLoad]);

  const handlePrintHTML = useCallback((printOptions, printModalSetOpen) => {
    printModalSetOpen(false);
    exportToHTML(printOptions, currentState);
  }, [currentState]);

  const handleExport = useCallback((fileName, exportModalSetOpen) => {
    exportModalSetOpen(false);
    if (!fileName || !fileName.trim()) return;
    const finalFileName = fileName.endsWith('.json') ? fileName : fileName + '.json';
    const { facesWithNumbers, totalArea, ...dataToExport } = currentState; 
    const data = JSON.stringify(dataToExport, null, 2);
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = finalFileName; a.click(); URL.revokeObjectURL(url);
  }, [currentState]);

  return { isDraggingOver, handleFileLoad, handleDragOver, handleDragLeave, handleDrop, handlePrintHTML, handleExport };
}
