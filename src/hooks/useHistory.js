import { useState, useEffect, useCallback } from 'react';
import * as Constants from '../constants/defaults.js';

export function useHistory(currentState, updateState, cancelDraw, closeModalsAndReset, shouldSaveHistory, setShouldSaveHistory) {
  const [history, setHistory] = useState([currentState]);
  const [historyStep, setHistoryStep] = useState(0);

  useEffect(() => {
    if (shouldSaveHistory) {
      const newHistory = history.slice(0, historyStep + 1);
      newHistory.push(currentState);
      if (newHistory.length > 50) newHistory.shift(); 
      setHistory(newHistory);
      setHistoryStep(newHistory.length - 1);
      setShouldSaveHistory(false);
    }
  }, [shouldSaveHistory, currentState, history, historyStep]);

  const applyHistory = useCallback((step) => {
    if (cancelDraw) cancelDraw();
    const state = history[step];
    if (updateState) {
      updateState({
        nodes: state.nodes, 
        edges: state.edges, 
        lines: state.lines || [], 
        texts: state.texts || [],
        faceTypes: state.faceTypes, 
        faceDeductions: state.faceDeductions || {}, 
        slopeTypes: state.slopeTypes, 
        fractionDigits: state.fractionDigits ?? 2, 
        attributes: state.attributes || Constants.defaultAttributes
      });
    }
    setHistoryStep(step);
    if (closeModalsAndReset) closeModalsAndReset();
  }, [history, cancelDraw, updateState, closeModalsAndReset]);

  const undo = useCallback(() => {
    if (historyStep > 0) applyHistory(historyStep - 1);
  }, [historyStep, applyHistory]);

  const redo = useCallback(() => {
    if (historyStep < history.length - 1) applyHistory(historyStep + 1);
  }, [historyStep, history, applyHistory]);

  return { history, historyStep, setHistory, setHistoryStep, shouldSaveHistory, setShouldSaveHistory, undo, redo };
}
