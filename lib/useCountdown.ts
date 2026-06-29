'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/** A simple countdown timer, computed from a fixed end timestamp rather
 *  than decrementing a counter each tick. This makes it immune to timing
 *  issues from interval drift, tab backgrounding, or re-renders — at any
 *  moment, secondsLeft is just "how much time is left until endTime",
 *  recalculated fresh, rather than state that could fall out of sync with
 *  reality if a tick is ever missed or delayed.
 *
 *  Used for the rest-between-sets timer on gym exercises — intentionally
 *  minimal (no pause/resume) since a rest timer is start-and-watch. */
export function useCountdown() {
  const [endTime, setEndTime] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      clearTick();
      const end = Date.now() + seconds * 1000;
      setEndTime(end);
      setSecondsLeft(seconds);
      intervalRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        setSecondsLeft(remaining);
        if (remaining <= 0) {
          clearTick();
          setEndTime(null);
        }
      }, 250); // tick faster than 1s so the displayed second changes promptly
    },
    [clearTick]
  );

  const stop = useCallback(() => {
    clearTick();
    setEndTime(null);
    setSecondsLeft(0);
  }, [clearTick]);

  useEffect(() => clearTick, [clearTick]);

  return { secondsLeft, isRunning: endTime !== null, start, stop };
}
