"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Play, ShieldCheck } from "lucide-react";
import { TransitionLink } from "../motion/transition";
import { HeroGlobe } from "./HeroGlobe";
import { EASE } from "../motion/primitives";
import { useWorkspace } from "../../lib/workspace";

export function Hero() {
  const reduced = useReducedMotion();
  const { enterDemo } = useWorkspace();
  const enter = (delay: number) => ({ initial: reduced ? false : { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: EASE } } as const);
  const watch = () => document.getElementById("video")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "center" });

  return (
    <section id="top" className="landing-wash relative overflow-hidden pb-24 pt-[104px] md:pb-32 md:pt-[120px]">
      <div className="mx-auto grid max-w-[1240px] items-center gap-6 px-5 md:px-8 lg:grid-cols-[1fr_1.08fr]">
        <div className="relative z-10">
          <motion.p {...enter(0.1)} className="inline-flex items-center gap-2 rounded-full border border-red/25 bg-red-50 px-3 py-1 text-[12px] font-bold tracking-wide text-red-700">
            <span className="size-1.5 rounded-full bg-red" /> AI FRAUD INVESTIGATOR
          </motion.p>
          <motion.h1 {...enter(0.2)} className="mt-5 text-[clamp(2.6rem,6.4vw,4.7rem)] font-extrabold leading-[1.03] tracking-[-0.035em] text-ink">
            Smarter<br /><span className="text-red">fraud protection</span><br />for a more open world.
          </motion.h1>
          <motion.p {...enter(0.4)} className="mt-6 max-w-[30rem] text-[17px] leading-relaxed text-ink-2">
            ALIBI analyzes transactions, investigates context, and helps banks make the right decision — not just a fast one.
          </motion.p>
          <motion.div {...enter(0.55)} className="mt-8 flex flex-wrap items-center gap-3">
            <TransitionLink href="/app/dashboard" onClick={enterDemo} className="inline-flex items-center gap-2 rounded-xl bg-red px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,31,50,0.85)] transition hover:bg-red-600">
              See Live Demo <ArrowRight size={17} />
            </TransitionLink>
            <button onClick={watch} className="inline-flex items-center gap-2.5 rounded-xl border border-hair bg-white px-5 py-3.5 text-[15px] font-bold text-ink shadow-sm transition hover:border-ink/20">
              <span className="grid size-6 place-items-center rounded-full bg-ink text-white"><Play size={11} fill="currentColor" /></span> Watch Video
            </button>
          </motion.div>
          <motion.p {...enter(0.7)} className="mt-9 inline-flex items-center gap-2 text-[13.5px] font-medium text-ink-3">
            <ShieldCheck size={16} className="text-red" /> Built for modern financial teams
          </motion.p>
        </div>
        <div className="relative">
          <HeroGlobe />
          <motion.div {...enter(1.3)} className="absolute bottom-[4%] right-0 hidden max-w-[210px] rounded-xl bg-night-900/95 p-3.5 text-[12.5px] leading-snug text-white shadow-2xl ring-1 ring-white/10 sm:block">
            <span className="font-bold">Real context.</span> Fast, explainable decisions.
          </motion.div>
        </div>
      </div>
    </section>
  );
}
