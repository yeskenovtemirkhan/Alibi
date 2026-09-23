"use client";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowRight, Compass, X } from "lucide-react";
import { LEGIT_ID } from "../../data/demo/scenarios";
import { useWorkspace, type GuideStep } from "../../lib/workspace";
import { LogoMark } from "../ui/Logo";
import { NetworkBackdrop } from "../ui/NetworkBackdrop";
import { EASE } from "../motion/primitives";

export const GUIDE_TX = LEGIT_ID;

function Modal({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <motion.div className="fixed inset-0 z-[60] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px]" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.32, ease: EASE }}
        className="relative w-full max-w-[460px] overflow-hidden rounded-[18px] border border-red/30 p-6 text-center shadow-[0_40px_90px_-30px_rgba(180,18,31,0.6)] md:p-8"
        style={{ background: "radial-gradient(90% 70% at 85% 0%, rgba(255,31,50,0.3), transparent 60%), linear-gradient(160deg,#12161b,#080a0d)" }}
      >
        <NetworkBackdrop className="pointer-events-none absolute inset-0 h-full w-full opacity-30" />
        <div className="relative">{children}</div>
      </motion.div>
    </motion.div>
  );
}

const STEP_COPY: Record<Exclude<GuideStep, "finale">, { n: number; title: string; body: string; cta: string }> = {
  dashboard: { n: 1, title: "A high-risk transaction just arrived.", body: `${GUIDE_TX}: ₸650,000 at Apple Store, Singapore, far from home on a new phone. Let's see what ALIBI finds.`, cta: "Investigate" },
  investigation: { n: 2, title: "Watch ALIBI investigate.", body: "It starts from the model's risk score, then looks for context and evidence before it decides.", cta: "Compare Two Transactions" },
  compare: { n: 3, title: "Same purchase. Two customers.", body: "Same amount, same merchant, same city. ALIBI investigates both side by side.", cta: "" },
};

const FLOW = ["Model risk", "Context & evidence", "Updated risk", "Decision"];

export function GuidedDemo() {
  const router = useRouter();
  const { guide, showGuideIntro, setGuide, dismissGuideIntro } = useWorkspace();

  const next = () => {
    if (guide === "dashboard") { setGuide("investigation"); router.push(`/app/investigation/${GUIDE_TX}`); }
    else if (guide === "investigation") { setGuide("compare"); router.push("/app/simulator#compare"); }
  };

  const step = guide && guide !== "finale" ? STEP_COPY[guide] : null;

  return (
    <>
      <AnimatePresence>
        {showGuideIntro && !guide && (
          <Modal label="Welcome to the ALIBI demo">
            <div className="mx-auto w-fit"><LogoMark size={44} /></div>
            <h2 className="mt-5 text-[26px] font-extrabold leading-tight tracking-tight text-white md:text-[30px]">See why ALIBI is different</h2>
            <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-snow/75">Follow a suspicious transaction from detection to decision.</p>
            <p className="mt-1 text-[12.5px] text-mute">3 short steps · about a minute</p>
            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
              <button autoFocus onClick={() => { setGuide("dashboard"); router.push("/app/dashboard"); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-red px-5 py-3 text-[14.5px] font-bold text-white shadow-[0_14px_28px_-12px_rgba(255,31,50,0.85)] transition hover:bg-red-600">
                <Compass size={16} /> Start Guided Demo
              </button>
              <button onClick={dismissGuideIntro} className="rounded-xl border border-white/15 px-5 py-3 text-[14.5px] font-bold text-white transition hover:bg-white/5">Explore Myself</button>
            </div>
          </Modal>
        )}

        {guide === "finale" && (
          <Modal label="Guided demo complete">
            <p className="text-[12px] font-bold tracking-widest text-red">GUIDED DEMO COMPLETE</p>
            <h2 className="mt-3 text-[clamp(1.7rem,4.5vw,2.3rem)] font-extrabold leading-[1.08] tracking-tight text-white">Same purchase.<br />Different reality.</h2>
            <p className="mt-3 text-[17px] font-bold text-snow">ALIBI found the difference.</p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <span className="rounded-lg border border-ok-dark/30 bg-ok-dark/12 px-3 py-1.5 text-[13px] font-extrabold text-ok-dark">APPROVED</span>
              <span className="text-[12px] font-semibold text-mute">vs</span>
              <span className="rounded-lg border border-red/35 bg-red/14 px-3 py-1.5 text-[13px] font-extrabold text-[#ff5a68]">BLOCKED</span>
            </div>
            <button autoFocus onClick={() => setGuide(null)} className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-red px-6 py-3 text-[14.5px] font-bold text-white transition hover:bg-red-600">Explore ALIBI <ArrowRight size={16} /></button>
          </Modal>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step && (
          <motion.aside
            key={guide}
            aria-live="polite"
            aria-label="Guided demo"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-red/35 bg-night-800/95 p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9),0_0_0_4px_rgba(255,31,50,0.08)] backdrop-blur md:inset-x-auto md:bottom-5 md:right-5 md:w-[360px]"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11.5px] font-bold tracking-widest text-red">GUIDED DEMO · {step.n} / 3</p>
              <button onClick={() => setGuide(null)} aria-label="Exit guided demo" className="grid size-7 place-items-center rounded-md text-mute transition hover:bg-white/5 hover:text-white"><X size={15} /></button>
            </div>
            <div className="mt-2 flex gap-1" aria-hidden>{[1, 2, 3].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= step.n ? "bg-red" : "bg-white/10"}`} />)}</div>
            <p className="mt-3 text-[16px] font-extrabold text-white">{step.title}</p>
            <p className="mt-1 text-[13px] leading-relaxed text-snow/75">{step.body}</p>
            {guide === "investigation" && (
              <ol className="mt-3 flex flex-wrap items-center gap-1 text-[11.5px] font-semibold text-snow">
                {FLOW.map((f, i) => (
                  <li key={f} className="flex items-center gap-1">
                    <span className="rounded-md bg-white/[0.06] px-2 py-1">{f}</span>
                    {i < FLOW.length - 1 && <ArrowDown size={12} className="-rotate-90 text-red" />}
                  </li>
                ))}
              </ol>
            )}
            {step.cta && (
              <button onClick={next} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red px-4 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-red-600">{step.cta} <ArrowRight size={15} /></button>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
