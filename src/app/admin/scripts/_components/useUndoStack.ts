'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  ScriptBeatRow, ScriptSceneRow, ScriptBeatReferenceRow, ScriptStoryboardFrameRow,
} from '@/types/scripts';

// ── Types ──

export type UndoEntryType =
  | 'delete-beat'
  | 'delete-scene'
  | 'delete-beats-batch'
  | 'update-beat'
  | 'update-scene';

export interface UndoEntry {
  type: UndoEntryType;
  timestamp: number;
  label: string; // human-readable for toast, e.g. "Delete beat 1101a"
  payload: {
    beats?: ScriptBeatRow[];
    scene?: ScriptSceneRow;
    references?: ScriptBeatReferenceRow[];
    frames?: ScriptStoryboardFrameRow[];
    previousValues?: { id: string; field: string; value: string }[];
  };
}

interface UseUndoStackOptions {
  maxSize?: number;
}

export function useUndoStack({ maxSize = 50 }: UseUndoStackOptions = {}) {
  const [undoStack, setUndoStack] = useState<UndoEntry[]>([]);
  const [redoStack, setRedoStack] = useState<UndoEntry[]>([]);
  // Track in-flight undo/redo to prevent double-fires
  const processingRef = useRef(false);

  const push = useCallback((entry: UndoEntry) => {
    setUndoStack(prev => {
      const next = [...prev, entry];
      if (next.length > maxSize) next.shift();
      return next;
    });
    // New action clears redo stack
    setRedoStack([]);
  }, [maxSize]);

  const popUndo = useCallback((): UndoEntry | null => {
    if (processingRef.current) return null;
    let entry: UndoEntry | null = null;
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      entry = next.pop()!;
      return next;
    });
    if (entry) {
      setRedoStack(prev => [...prev, entry!]);
    }
    return entry;
  }, []);

  const popRedo = useCallback((): UndoEntry | null => {
    if (processingRef.current) return null;
    let entry: UndoEntry | null = null;
    setRedoStack(prev => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      entry = next.pop()!;
      return next;
    });
    if (entry) {
      setUndoStack(prev => [...prev, entry!]);
    }
    return entry;
  }, []);

  const clear = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return {
    push,
    popUndo,
    popRedo,
    clear,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    undoLabel: undoStack.length > 0 ? undoStack[undoStack.length - 1].label : null,
    redoLabel: redoStack.length > 0 ? redoStack[redoStack.length - 1].label : null,
    processingRef,
  };
}
