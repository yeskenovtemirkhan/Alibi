"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Radar, Search, ShieldCheck, CircleCheckBig } from "lucide-react";
import { cn } from "../../lib/utils";
import { Reveal } from "../motion/primitives";

const STEPS = [
  { n: "01", icon: Radar, title: "Detect", body: "ML identifies suspicious behavior." },
  { n: "02", icon: Search, title: "Investigate", body: "ALIBI checks behavioral context and evidence." },
  { n: "03", icon: ShieldCheck, title: "Verify", body: "When uncertainty remains, ALIBI selects the least disruptive verification." },
  { n: "04", icon: CircleCheckBig, title: "Decide", body: "Approve, Verify or Block based on risk and expected cost." },
];

export function ProcessFlow() {
  const ref = useRef<HTMLOListElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const [active, setActive] = useState(reduced ? 3 : -1);

  useEffect(() => {
    if (!inView || reduced) return;
    const ts = [0, 500, 1000, 1500].map((ms, i) => setTimeout(() => setActive(i), ms));
    return () => ts.forEach(clearTimeout);
  }, [inView, reduced]);

  return (
    <section id="how" className="scroll-mt-20 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <Reveal className="text-center">
          <p className="text-[13px] font-bold tracking-widest text-red">HOW ALIBI WORKS</p>
          <h2 className="mt-3 text-[clamp(2rem,4.6vw,3.4rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">Investigate first. Decide second.</h2>
          <p className="mx-auto mt-3 max-w-lg text-[17px] text-ink-2">From suspicious signal to confident decision.</p>
        </Reveal>

        <ol ref={ref} className="mt-14 grid gap-9 md:mt-20 md:grid-cols-4 md:gap-0">
          {STEPS.map((s, i) => {
            const on = active >= i;
            const hero = i === 1;
            return (
              <li key={s.title} className="relative flex gap-5 md:flex-col md:items-center md:gap-0 md:px-4 md:text-center">
                {i < 3 && (
                  <>
                    <span aria-hidden className="absolute left-[27px] top-[62px] hidden h-[calc(100%-6px)] w-0.5 bg-hair max-md:block" />
                    <motion.span aria-hidden className="absolute left-[27px] top-[62px] hidden h-[calc(100%-6px)] w-0.5 origin-top bg-red max-md:block" initial={false} animate={{ scaleY: active > i ? 1 : 0 }} transition={{ duration: 0.45, ease: "easeInOut" }} />
                    <span aria-hidden className="absolute left-[calc(50%+40px)] right-[calc(-50%+40px)] top-[34px] hidden h-0.5 bg-hair md:block" />
                    <motion.span aria-hidden className="absolute left-[calc(50%+40px)] right-[calc(-50%+40px)] top-[34px] hidden h-0.5 origin-left bg-red md:block" initial={false} animate={{ scaleX: active > i ? 1 : 0 }} transition={{ duration: 0.45, ease: "easeInOut" }} />
                  </>
                )}
                <motion.div
                  initial={false}
                  animate={{ scale: on ? 1 : 0.94 }}
                  className={cn("relative z-10 grid shrink-0 place-items-center rounded-full border-2 transition-colors duration-300", hero ? "size-[68px]" : "size-[56px] md:mt-2", on ? (hero ? "border-red bg-red text-white shadow-[0_14px_30px_-10px_rgba(255,31,50,0.8)]" : "border-red bg-red-50 text-red") : "border-hair bg-white text-ink-3")}
                >
                  <s.icon size={hero ? 28 : 24} />
                </motion.div>
                <div className={cn("md:mt-5", hero && "md:-mt-0")}>
                  <p className={cn("text-[12px] font-bold tracking-wider", on ? "text-red" : "text-ink-3")}>{s.n}</p>
                  <h3 className={cn("mt-0.5 font-extrabold tracking-tight", hero ? "text-[26px]" : "text-[22px]")}>{s.title}</h3>
                  <p className="mt-1.5 max-w-[15rem] text-[14.5px] leading-relaxed text-ink-2 md:mx-auto">{s.body}</p>
                  {hero && <p className="mt-3 inline-block rounded-full bg-red-50 px-3 py-1 text-[12px] font-bold text-red-700">This is the ALIBI layer</p>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
