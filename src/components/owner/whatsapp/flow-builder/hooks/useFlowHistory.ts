import { useState, useCallback } from 'react';

interface HistoryState {
  nodes: any[];
  edges: any[];
}

export const useFlowHistory = (maxHistory = 50) => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const addToHistory = useCallback((nodes: any[], edges: any[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push({ nodes: [...nodes], edges: [...edges] });
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    setCurrentIndex(prev => Math.min(prev + 1, maxHistory - 1));
  }, [currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [currentIndex, history]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [currentIndex, history]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const reset = useCallback((nodes: any[], edges: any[]) => {
    setHistory([{ nodes, edges }]);
    setCurrentIndex(0);
  }, []);

  return {
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    historyLength: history.length,
    currentIndex
  };
};
