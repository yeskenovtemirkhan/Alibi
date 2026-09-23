"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Decision, Scenario, Transaction, TxStatus } from "../types";

/**
 * WORKSPACE MODE — which experience the current visitor sees (pre-populated demo vs. their own empty workspace).
 * This is deliberately separate from DATA MODE (lib/config.ts, NEXT_PUBLIC_DATA_MODE), which decides where data comes from.
 */
export type WorkspaceMode = "demo" | "fresh";

export interface LocalUser {
  name: string;
  email?: string;
  organization?: string;
  role: string;
}

/** A transaction analyzed in a Fresh workspace. Kept in localStorage — no backend. */
export interface LocalAnalysis {
  scenario: Scenario;
  row: Transaction;
}

/** Guided demo: intro modal → dashboard → investigation → compare → finale. */
export type GuideStep = "dashboard" | "investigation" | "compare" | "finale";

export const DEMO_USER: LocalUser = { name: "Aigerim T.", role: "Fraud Analyst", organization: "ALIBI Demo Bank" };
export const ROLES = ["Fraud Analyst", "Risk Manager", "Data Analyst", "Product Manager", "Other"] as const;

interface Stored {
  mode: WorkspaceMode;
  freshUser: LocalUser | null;
  analyses: LocalAnalysis[];
  guideSeen: boolean;
  guide: GuideStep | null;
}

const KEY = "alibi.workspace.v1";
// Visiting /app directly (old links, bookmarks) lands in the demo, so judges never hit a wall.
const INITIAL: Stored = { mode: "demo", freshUser: null, analyses: [], guideSeen: false, guide: null };

function load(): Stored {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return INITIAL;
    const s = { ...INITIAL, ...(JSON.parse(raw) as Partial<Stored>) };
    if (s.mode === "fresh" && !s.freshUser) s.mode = "demo";
    return s;
  } catch {
    return INITIAL;
  }
}

const STATUS: Record<Decision, TxStatus> = { APPROVED: "Approved", BLOCKED: "Blocked", VERIFY: "Investigating" };

function toAnalysis(s: Scenario, n: number): LocalAnalysis {
  const id = `LOC-${String(1000 + n)}`;
  const now = new Date();
  const scenario: Scenario = { ...s, tx: { ...s.tx, id } };
  const row: Transaction = {
    ...scenario.tx,
    time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    date: now.toISOString().slice(0, 10),
    risk: s.finalRisk,
    status: STATUS[s.decision],
  };
  return { scenario, row };
}

interface Ctx {
  ready: boolean;
  mode: WorkspaceMode;
  user: LocalUser;
  freshUser: LocalUser | null;
  analyses: LocalAnalysis[];
  guide: GuideStep | null;
  showGuideIntro: boolean;
  enterDemo: () => void;
  resetDemo: () => void;
  startFresh: (u: LocalUser) => void;
  resumeFresh: () => void;
  addAnalysis: (s: Scenario) => LocalAnalysis;
  setGuide: (g: GuideStep | null) => void;
  dismissGuideIntro: () => void;
}

const WorkspaceCtx = createContext<Ctx | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Stored>(INITIAL);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => { setState(load()); setReady(true); }, []);
  useEffect(() => {
    if (!ready) return;
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: state still works for this tab */ }
  }, [state, ready]);

  const enterDemo = useCallback(() => setState((s) => ({ ...s, mode: "demo" })), []);
  const resetDemo = useCallback(() => setState((s) => ({ ...s, mode: "demo", guideSeen: false, guide: null })), []);
  const startFresh = useCallback((u: LocalUser) => setState((s) => ({ ...s, mode: "fresh", freshUser: u, analyses: [], guide: null })), []);
  const resumeFresh = useCallback(() => setState((s) => (s.freshUser ? { ...s, mode: "fresh", guide: null } : s)), []);
  const setGuide = useCallback((g: GuideStep | null) => setState((s) => ({ ...s, guide: g, guideSeen: true })), []);
  const dismissGuideIntro = useCallback(() => setState((s) => ({ ...s, guideSeen: true })), []);
  const addAnalysis = useCallback((sc: Scenario) => {
    const made = toAnalysis(sc, stateRef.current.analyses.length + 1);
    stateRef.current = { ...stateRef.current, analyses: [made, ...stateRef.current.analyses] };
    setState((s) => ({ ...s, analyses: [made, ...s.analyses.filter((a) => a.row.id !== made.row.id)] }));
    return made;
  }, []);

  const value = useMemo<Ctx>(() => {
    const fresh = state.mode === "fresh" && !!state.freshUser;
    return {
      ready,
      mode: fresh ? "fresh" : "demo",
      user: fresh ? state.freshUser! : DEMO_USER,
      freshUser: state.freshUser,
      analyses: state.analyses,
      guide: fresh ? null : state.guide,
      showGuideIntro: ready && !fresh && !state.guideSeen,
      enterDemo, resetDemo, startFresh, resumeFresh, addAnalysis, setGuide, dismissGuideIntro,
    };
  }, [state, ready, enterDemo, resetDemo, startFresh, resumeFresh, addAnalysis, setGuide, dismissGuideIntro]);

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace() {
  const c = useContext(WorkspaceCtx);
  if (!c) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return c;
}

export const firstName = (u: LocalUser) => u.name.trim().split(/\s+/)[0] || u.name;
export const initials = (u: LocalUser) => u.name.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase() || "?";
export function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 5 ? "Good evening" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
