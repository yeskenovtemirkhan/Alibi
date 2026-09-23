"use client";
import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

/** Smoothly tweens a number toward `target`. Returns the current display value. */
export function useTween(target: number, { duration = 0.6, enabled = true, from }: { duration?: number; enabled?: boolean; from?: number } = {}) {
  const reduced = useReducedMotion();
  const [val, setVal] = useState(from ?? target);
  const cur = useRef(from ?? target);
  useEffect(() => {
    if (!enabled) return;
    if (reduced) { cur.current = target; setVal(target); return; }
    const c = animate(cur.current, target, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => { cur.current = v; setVal(v); },
    });
    return () => c.stop();
  }, [target, duration, enabled, reduced]);
  return val;
}
