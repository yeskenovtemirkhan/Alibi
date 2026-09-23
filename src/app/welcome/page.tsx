"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Activity, ArrowLeft, ArrowRight, BarChart3, FlaskConical, Plus, ScanSearch, Sparkles } from "lucide-react";
import { Logo } from "../../components/ui/Logo";
import { RiskRing } from "../../components/ui/Risk";
import { NetworkBackdrop } from "../../components/ui/NetworkBackdrop";
import { EASE, staggerChild, staggerParent } from "../../components/motion/primitives";
import { TransitionLink, useTransitionNav } from "../../components/motion/transition";
import { useWorkspace } from "../../lib/workspace";
import { cn } from "../../lib/utils";

const PREVIEW = [
  { icon: Activity, label: "100K+ Transactions" },
  { icon: ScanSearch, label: "High-risk investigations" },
  { icon: BarChart3, label: "Fraud analytics" },
  { icon: FlaskConical, label: "Interactive simulator" },
];

/** Miniature, non-interactive dark dashboard. */
function DemoPreview() {
  const bars = [34, 52, 41, 66, 58, 78, 92];
  return (
    <div aria-hidden className="relative overflow-hidden rounded-xl border border-white/10 bg-night-950 p-3.5">
      <NetworkBackdrop className="pointer-events-none absolute inset-y-0 right-0 h-full w-[70%] opacity-35" />
      <div className="relative grid grid-cols-3 gap-2">
        {[["Analyzed", "12,482"], ["Prevented", "148"], ["FPR", "2.1%"]].map(([l, v]) => (
          <div key={l} className="rounded-lg border border-white/[0.07] bg-night-900 px-2.5 py-2">
            <p className="text-[10px] font-semibold text-mute">{l}</p>
            <p className="tnum text-[15px] font-extrabold text-white">{v}</p>
          </div>
        ))}
      </div>
      <div className="relative mt-2 grid grid-cols-[1fr_auto] gap-2">
        <div className="rounded-lg border border-white/[0.07] bg-night-900 p-2.5">
          <p className="text-[10px] font-semibold text-mute">Transaction flow</p>
          <div className="mt-2 space-y-1.5">
            {[100, 62, 38, 16].map((w, i) => (
              <div key={w} className="h-1.5 rounded-full" style={{ width: `${w}%`, background: i === 3 ? "#ff1f32" : `rgba(255,255,255,${0.28 - i * 0.06})` }} />
            ))}
          </div>
          <div className="mt-3 flex h-9 items-end gap-1">
            {bars.map((h, i) => <div key={i} className="flex-1 rounded-t-sm bg-gradient-to-t from-red-800 to-red" style={{ height: `${h}%`, opacity: 0.45 + i * 0.08 }} />)}
          </div>
        </div>
        <div className="grid place-items-center rounded-lg border border-red/25 bg-red/[0.06] px-2">
          <RiskRing value={91} size={78} stroke={8} dark label="risk" />
        </div>
      </div>
    </div>
  );
}

/** Miniature empty workspace. */
function FreshPreview() {
  return (
    <div aria-hidden className="rounded-xl border border-white/10 bg-night-950 p-3.5">
      <div className="grid grid-cols-3 gap-2">
        {["Transactions", "Blocked", "Approved"].map((l) => (
          <div key={l} className="rounded-lg border border-white/[0.07] bg-night-900 px-2.5 py-2">
            <p className="text-[10px] font-semibold text-mute">{l}</p>
            <p className="tnum text-[15px] font-extrabold text-white/40">0</p>
          </div>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-[1fr_auto] gap-2">
        <div className="grid place-items-center rounded-lg border border-dashed border-white/15 py-4 text-center">
          <span className="grid size-8 place-items-center rounded-full bg-red text-white shadow-[0_0_0_6px_rgba(255,31,50,0.15)]"><Plus size={16} strokeWidth={3} /></span>
          <p className="mt-2 text-[10.5px] font-semibold text-snow">Analyze first transaction</p>
        </div>
        <ol className="space-y-1.5 self-center pr-1 text-[10px] font-semibold text-mute">
          {["Analyze", "Review", "Evidence", "Decide"].map((s, i) => (
            <li key={s} className="flex items-center gap-1.5"><span className={cn("tnum grid size-4 place-items-center rounded-full text-[8.5px]", i === 0 ? "bg-red text-white" : "bg-white/10 text-snow")}>{i + 1}</span>{s}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  const reduced = useReducedMotion();
  const { enterDemo, resumeFresh, freshUser, ready } = useWorkspace();
  const go = useTransitionNav();
  const [highlight, setHighlight] = useState(false);
  useEffect(() => { setHighlight(new URLSearchParams(window.location.search).get("mode") === "demo"); }, []);

  return (
    <div className="landing-wash min-h-screen">
      <header className="mx-auto flex h-[72px] max-w-[1160px] items-center justify-between px-5 md:px-8">
        <Link href="/" aria-label="ALIBI home"><Logo /></Link>
        <Link href="/" className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13.5px] font-semibold text-ink-2 transition hover:bg-black/[0.04] hover:text-ink"><ArrowLeft size={15} /> Back to site</Link>
      </header>

      <main className="mx-auto max-w-[1160px] px-5 pb-16 pt-6 md:px-8 md:pb-24 md:pt-10">
        <motion.div initial={reduced ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-red/25 bg-red-50 px-3 py-1 text-[12px] font-bold tracking-wide text-red-700"><span className="size-1.5 rounded-full bg-red" /> GET STARTED</p>
          <h1 className="mt-4 text-[clamp(2.3rem,5.6vw,3.8rem)] font-extrabold leading-[1.04] tracking-[-0.035em] text-ink">Welcome to <span className="text-red">ALIBI</span></h1>
          <p className="mt-3 text-[17px] text-ink-2">Choose how you want to explore ALIBI.</p>
        </motion.div>

        <motion.div variants={staggerParent(0.09, 0.15)} initial={reduced ? "show" : "hidden"} animate="show" className="mt-9 grid gap-5 lg:grid-cols-[1.12fr_1fr]">
          {/* A — Explore Demo */}
          <motion.section
            variants={staggerChild}
            whileHover={reduced ? undefined : { y: -4 }}
            transition={{ duration: 0.25, ease: EASE }}
            className={cn(
              "relative flex flex-col overflow-hidden rounded-[20px] border border-red/30 p-5 text-white shadow-[0_40px_80px_-36px_rgba(180,18,31,0.6)] md:p-7",
              highlight && "ring-4 ring-red/30",
            )}
            style={{ background: "radial-gradient(80% 70% at 90% 0%, rgba(255,31,50,0.32), transparent 60%), linear-gradient(160deg,#12161b,#080a0d)" }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red px-3 py-1 text-[11.5px] font-bold text-white"><Sparkles size={12} /> Recommended for demo</span>
              <span className="text-[12px] font-semibold text-mute">No sign-up</span>
            </div>
            <div className="mt-5"><DemoPreview /></div>
            <h2 className="mt-6 text-[28px] font-extrabold tracking-tight md:text-[32px]">Explore Demo</h2>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-snow/75">Enter a pre-populated workspace and see how ALIBI detects, investigates and explains suspicious transactions.</p>
            <ul className="mt-5 grid grid-cols-2 gap-2">
              {PREVIEW.map(({ icon: I, label }) => (
                <li key={label} className="flex items-center gap-2 rounded-lg bg-white/[0.05] px-3 py-2 text-[12.5px] font-semibold text-snow"><I size={14} className="shrink-0 text-red" />{label}</li>
              ))}
            </ul>
            <TransitionLink href="/app/dashboard" onClick={enterDemo} className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-red px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,31,50,0.9)] transition hover:bg-red-600 sm:self-start">
              Enter Demo Workspace <ArrowRight size={17} />
            </TransitionLink>
          </motion.section>

          {/* B — Start Fresh */}
          <motion.section variants={staggerChild} whileHover={reduced ? undefined : { y: -4 }} transition={{ duration: 0.25, ease: EASE }} className="card-light flex flex-col p-5 md:p-7">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hair bg-paper-2 px-3 py-1 text-[11.5px] font-bold text-ink-2">Your own workspace</span>
              <span className="text-[12px] font-semibold text-ink-3">~30 seconds</span>
            </div>
            <div className="mt-5"><FreshPreview /></div>
            <h2 className="mt-6 text-[28px] font-extrabold tracking-tight text-ink md:text-[32px]">Start Fresh</h2>
            <p className="mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">Create your workspace and experience ALIBI from the beginning.</p>
            <div className="mt-auto flex flex-wrap items-center gap-3 pt-7">
              <Link href="/welcome/create" className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-ink-2 max-sm:w-full">
                Create Workspace <ArrowRight size={17} />
              </Link>
              {ready && freshUser && (
                <button onClick={() => { resumeFresh(); go("/app/dashboard"); }} className="rounded-lg px-2 py-2 text-[13.5px] font-bold text-ink-2 underline-offset-4 transition hover:text-red hover:underline">
                  Continue as {freshUser.name}
                </button>
              )}
            </div>
          </motion.section>
        </motion.div>

        <p className="mt-8 text-center text-[12.5px] text-ink-3">The demo uses simulated data. A fresh workspace is stored only in this browser — no account or password.</p>
      </main>
    </div>
  );
}
