"use client";
import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Check, X } from "lucide-react";
import { ANALYTICS } from "../../data/demo/analytics";
import { Reveal, AnimatedNumber } from "../motion/primitives";

const pick = (k: string) => ANALYTICS.metrics.find((m) => m.key === k)!;

function Compare({ label, trad, alibi, fmt, delay }: { label: string; trad: number; alibi: number; fmt: (n: number) => string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const on = useInView(ref, { once: true, amount: 0.6 });
  const max = Math.max(trad, alibi);
  const cut = Math.round((1 - alibi / trad) * 100);
  return (
    <div ref={ref} className="py-5 first:pt-0">
      <div className="flex items-baseline justify-between"><p className="text-[15px] font-bold">{label}</p><p className="text-[13px] font-bold text-ok">−{cut}%</p></div>
      {[{ n: "Score only", v: trad, c: "bg-ink/25" }, { n: "With ALIBI", v: alibi, c: "bg-red" }].map((r, i) => (
        <div key={r.n} className="mt-2.5 grid grid-cols-[84px_1fr_72px] items-center gap-3 text-[13px]">
          <span className="font-medium text-ink-3">{r.n}</span>
          <div className="h-3 rounded-full bg-paper-3"><motion.div className={`h-full rounded-full ${r.c}`} initial={false} animate={{ width: on ? `${(r.v / max) * 100}%` : 0 }} transition={{ duration: 0.8, delay: delay + i * 0.15 }} /></div>
          <span className="tnum text-right font-bold">{fmt(r.v)}</span>
        </div>
      ))}
    </div>
  );
}

export function Impact() {
  const fp = pick("fp"), loss = pick("loss"), fr = pick("friction");
  return (
    <section id="impact" className="scroll-mt-20 bg-white py-20 md:py-28">
      <div className="mx-auto grid max-w-[1240px] gap-12 px-5 md:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <Reveal>
          <p className="text-[13px] font-bold tracking-widest text-red">IMPACT</p>
          <h2 className="mt-3 text-[clamp(2rem,4.2vw,3.1rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">Fewer wrong blocks. Less fraud loss.</h2>
          <p className="mt-4 max-w-md text-[16.5px] leading-relaxed text-ink-2">What changes when a decision comes with evidence. Every number here is a simulated demo comparison, not a production result.</p>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-paper-3 px-3 py-1.5 text-[12.5px] font-semibold text-ink-3"><span className="size-1.5 rounded-full bg-warn" /> Simulated demo</p>
          <div className="mt-10">
            <p className="text-[13px] font-bold text-ink-3">Total business loss, demo comparison</p>
            <p className="mt-1 text-[44px] font-extrabold leading-none tracking-tight text-red"><AnimatedNumber value={pick("total").alibi} decimals={1} prefix="₸" suffix="M" /></p>
            <p className="mt-1 text-[13.5px] text-ink-3">vs ₸{pick("total").traditional}M with score-only detection</p>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="card-light divide-y divide-hair p-6 md:p-8">
          <Compare label="False positives (legit transactions blocked)" trad={fp.traditional} alibi={fp.alibi} fmt={(n) => n.toLocaleString("en-US")} delay={0} />
          <Compare label="Fraud loss" trad={loss.traditional} alibi={loss.alibi} fmt={(n) => `₸${n}M`} delay={0.15} />
          <Compare label="Customer friction (legit customers challenged)" trad={fr.traditional} alibi={fr.alibi} fmt={(n) => `${n}%`} delay={0.3} />
          <div className="py-5 last:pb-0">
            <p className="text-[15px] font-bold">Explainability</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[13.5px]">
              <ul className="space-y-1.5 rounded-xl bg-paper-2 p-3.5 text-ink-3"><li className="font-bold text-ink-2">Score only</li>{["Risk score", "Reasons", "Evidence"].map((t, i) => <li key={t} className="flex items-center gap-2">{i === 0 ? <Check size={14} /> : <X size={14} />}{t}</li>)}</ul>
              <ul className="space-y-1.5 rounded-xl bg-red-50 p-3.5"><li className="font-bold text-red-700">With ALIBI</li>{["Risk score", "Reasons", "Evidence"].map((t) => <li key={t} className="flex items-center gap-2 font-medium text-ink"><Check size={14} className="text-ok" />{t}</li>)}</ul>
            </div>
          </div>
        </Reveal>
      </div>
      <div className="mx-auto mt-16 max-w-[1240px] px-5 md:px-8">
        <p className="text-center text-[13px] font-bold text-ink-3">Designed for modern financial ecosystems</p>
        <ul className="mt-4 flex flex-wrap justify-center gap-2.5">
          {["Retail banks", "Payment networks", "Travel platforms", "Device intelligence", "Merchant acquirers", "Card issuers"].map((c) => <li key={c} className="rounded-full border border-hair px-4 py-1.5 text-[13.5px] font-semibold text-ink-2">{c}</li>)}
        </ul>
        <p className="mt-3 text-center text-[12px] text-ink-3">Categories represent potential integration contexts, not current partnerships.</p>
      </div>
    </section>
  );
}
