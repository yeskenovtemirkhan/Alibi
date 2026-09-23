"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DashboardView } from "../app/DashboardView";
import { SidebarBody } from "../app/AppShell";
import { TransitionLink } from "../motion/transition";
import { Reveal } from "../motion/primitives";
import type { DashboardOverview } from "../../types";
import { useWorkspace } from "../../lib/workspace";

const INNER_W = 1320;

export function ProductPreview({ data }: { data: DashboardOverview }) {
  const section = useRef<HTMLElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);
  const reduced = useReducedMotion();
  const { enterDemo } = useWorkspace();
  const { scrollYProgress } = useScroll({ target: section, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [36, -28]);

  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / INNER_W));
    ro.observe(el); setScale(el.clientWidth / INNER_W);
    return () => ro.disconnect();
  }, []);

  const viewH = Math.round(INNER_W * scale * 0.56);

  return (
    <section ref={section} id="product" className="relative scroll-mt-16 overflow-hidden pb-24 pt-20 md:pb-32 md:pt-28" style={{ background: "linear-gradient(180deg,#fff 0%,#fff 24%,#12161b 58%,#080a0d 100%)" }}>
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[13px] font-bold tracking-widest text-red">THE PRODUCT</p>
          <h2 className="mt-3 text-[clamp(2rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">Built for the people making fraud decisions.</h2>
        </Reveal>

        <motion.div style={{ y }} className="mt-12 md:mt-16">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-night-950 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,31,50,0.12)]">
            <div className="flex items-center gap-2 border-b border-white/[0.07] bg-night-900 px-4 py-2.5">
              <span className="size-2.5 rounded-full bg-[#ff5f57]" /><span className="size-2.5 rounded-full bg-[#febc2e]" /><span className="size-2.5 rounded-full bg-[#28c840]" />
              <span className="mx-auto rounded-md bg-white/[0.05] px-10 py-1 text-[11.5px] font-medium text-mute">ALIBI · Fraud Command Center</span>
            </div>
            <div ref={box} className="relative w-full overflow-hidden" style={{ height: viewH }}>
              <p className="sr-only">Preview of the ALIBI dashboard with KPIs, transaction flow, risk distribution and recent high-risk transactions.</p>
              <div aria-hidden className="app-surface pointer-events-none absolute left-0 top-0 flex origin-top-left select-none" style={{ width: INNER_W, transform: `scale(${scale})` }} {...({ inert: "" } as object)}>
                <div className="w-[232px] shrink-0 border-r hairline-dark bg-night-950" style={{ minHeight: 1500 }}><SidebarBody pathname="/app/dashboard" preview /></div>
                <div className="min-w-0 flex-1 p-7"><DashboardView data={data} preview /></div>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-night-950 to-transparent" />
            </div>
          </div>
        </motion.div>

        <Reveal className="mt-10 text-center">
          <TransitionLink href="/app/dashboard" onClick={enterDemo} className="inline-flex items-center gap-2 rounded-xl bg-red px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,31,50,0.85)] transition hover:bg-red-600">Open Dashboard <ArrowRight size={17} /></TransitionLink>
        </Reveal>
      </div>
    </section>
  );
}
