"use client";
import { ArrowRight } from "lucide-react";
import { TransitionLink } from "../motion/transition";
import { NetworkBackdrop } from "../ui/NetworkBackdrop";
import { Logo } from "../ui/Logo";
import { useWorkspace } from "../../lib/workspace";

export function FinalCTA() {
  const { enterDemo } = useWorkspace();
  return (
    <>
      <section className="relative overflow-hidden bg-night-950 py-24 md:py-32" style={{ background: "radial-gradient(60% 80% at 80% 40%, rgba(255,31,50,0.38), transparent 65%), radial-gradient(50% 60% at 0% 100%, rgba(255,31,50,0.16), transparent 70%), #080a0d" }}>
        <NetworkBackdrop className="pointer-events-none absolute inset-0 h-full w-full opacity-55" />
        <div className="relative mx-auto max-w-[1240px] px-5 md:px-8">
          <h2 className="max-w-3xl text-[clamp(2.2rem,5.6vw,4.2rem)] font-extrabold leading-[1.03] tracking-[-0.035em] text-white">Context turns risk into understanding.</h2>
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-snow/75">Investigate suspicious transactions, understand the evidence, and make clearer decisions.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <TransitionLink href="/app/dashboard" onClick={enterDemo} className="inline-flex items-center gap-2 rounded-xl bg-red px-6 py-3.5 text-[15px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(255,31,50,0.9)] transition hover:bg-red-600">Open Live Demo <ArrowRight size={17} /></TransitionLink>
            <TransitionLink href="/welcome" className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-[15px] font-bold text-white transition hover:bg-white/5">Explore Product</TransitionLink>
          </div>
        </div>
      </section>
      <footer className="border-t border-white/[0.07] bg-night-950 py-8">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-3 px-5 text-[12.5px] text-mute md:px-8">
          <Logo dark />
          <p>Simulated demo. No real customers, partners or transactions are shown.</p>
        </div>
      </footer>
    </>
  );
}
