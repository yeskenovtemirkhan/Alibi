"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { Scenario } from "../types";
import { buildSteps, IDLE_STEP } from "./investigation";

interface Options { speed?: number }

export function useInvestigation(scenario: Scenario, { speed = 1 }: Options = {}) {
  const reduced = useReducedMotion();
  const steps = useMemo(() => buildSteps(scenario), [scenario]);
  const last = steps.length - 1;
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const key = useRef(scenario.key + scenario.tx.id);

  useEffect(() => {
    const k = scenario.key + scenario.tx.id;
    if (key.current !== k) { key.current = k; setIndex(-1); setPlaying(false); }
  }, [scenario]);

  useEffect(() => {
    if (!playing || index < 0) return;
    if (index >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setIndex((i) => Math.min(i + 1, last)), Math.max(120, steps[index].ms * speed));
    return () => clearTimeout(t);
  }, [playing, index, last, steps, speed]);

  const start = useCallback(() => {
    if (reduced) { setIndex(last); setPlaying(false); return; }
    setIndex(0); setPlaying(true);
  }, [reduced, last]);
  const pause = useCallback(() => setPlaying(false), []);
  const resume = useCallback(() => { if (index >= 0 && index < last) setPlaying(true); }, [index, last]);
  const skip = useCallback(() => { setIndex(last); setPlaying(false); }, [last]);
  const reset = useCallback(() => { setIndex(-1); setPlaying(false); }, []);

  const step = index < 0 ? IDLE_STEP : steps[index];
  const progress = index < 0 ? 0 : index / last;
  return { step, index, steps, playing, started: index >= 0, done: index === last, progress, start, pause, resume, skip, reset, replay: start };
}
