'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export interface Stopwatch {
  value: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export const useStopwatch = (): Stopwatch => {
  const [value, setValue] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef(0);
  const pausedValueRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        if(isMounted.current) {
          setValue(pausedValueRef.current + Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const start = useCallback(() => {
    if (isMounted.current) {
      pausedValueRef.current = 0;
      setValue(0);
      setIsRunning(true);
    }
  }, []);

  const stop = useCallback(() => {
    if (isMounted.current && isRunning) {
      setIsRunning(false);
      pausedValueRef.current = value;
    }
  }, [value, isRunning]);

  const reset = useCallback(() => {
    if (isMounted.current) {
      setIsRunning(false);
      pausedValueRef.current = 0;
      setValue(0);
    }
  }, []);

  return { value, isRunning, start, stop, reset };
};
