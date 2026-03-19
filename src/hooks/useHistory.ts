import { useState, useCallback, useRef } from "react";

export function useHistory<T>(initialState: T) {
  const [state, setStateInternal] = useState(initialState);
  const pastRef = useRef<T[]>([]);
  const futureRef = useRef<T[]>([]);

  const setState = useCallback(
    (newState: T | ((prev: T) => T)) => {
      setStateInternal((prev) => {
        const next = typeof newState === "function" ? (newState as (p: T) => T)(prev) : newState;
        pastRef.current = [...pastRef.current, prev];
        futureRef.current = [];
        return next;
      });
    },
    []
  );

  const undo = useCallback(() => {
    setStateInternal((current) => {
      if (pastRef.current.length === 0) return current;
      const previous = pastRef.current[pastRef.current.length - 1];
      pastRef.current = pastRef.current.slice(0, -1);
      futureRef.current = [current, ...futureRef.current];
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setStateInternal((current) => {
      if (futureRef.current.length === 0) return current;
      const next = futureRef.current[0];
      futureRef.current = futureRef.current.slice(1);
      pastRef.current = [...pastRef.current, current];
      return next;
    });
  }, []);

  const reset = useCallback(
    (newState: T) => {
      pastRef.current = [];
      futureRef.current = [];
      setStateInternal(newState);
    },
    []
  );

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    reset,
  };
}
