import { Activity, ShieldCheck, Scale, Smile } from "lucide-react";
import { AnimatedNumber, Reveal } from "../motion/primitives";

const M = [
  { icon: Activity, value: 100000, suffix: "+", decimals: 0, label: "Transactions analyzed" },
  { icon: ShieldCheck, value: 94.7, suffix: "%", decimals: 1, label: "Fraud detected" },
  { icon: Scale, value: 2.1, suffix: "%", decimals: 1, label: "False positive rate" },
  { icon: Smile, value: 31, suffix: "%", decimals: 0, label: "Lower customer friction" },
];

export function MetricStrip() {
  return (
    <section aria-label="Demo metrics" className="relative z-10 -mt-14 px-5 md:-mt-16 md:px-8">
      <Reveal className="card-light relative mx-auto max-w-[1080px] px-4 pb-6 pt-8 sm:px-8">
        <span className="absolute right-4 top-3 inline-flex items-center gap-1.5 rounded-full bg-paper-3 px-2.5 py-1 text-[11.5px] font-semibold text-ink-3">
          <span className="size-1.5 rounded-full bg-warn" /> Simulated demo
        </span>
        <div className="grid grid-cols-2 gap-y-7 md:grid-cols-4 md:divide-x md:divide-hair">
          {M.map(({ icon: I, value, suffix, decimals, label }) => (
            <div key={label} className="flex items-center gap-3.5 md:px-6">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-50 text-red"><I size={20} /></span>
              <div>
                <p className="text-[26px] font-extrabold leading-none tracking-tight sm:text-[30px]"><AnimatedNumber value={value} suffix={suffix} decimals={decimals} /></p>
                <p className="mt-1 text-[12.5px] font-medium text-ink-3">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
