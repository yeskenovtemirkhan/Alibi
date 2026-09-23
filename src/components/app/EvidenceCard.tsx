"use client";
import { motion } from "framer-motion";
import { Lock, ShieldAlert } from "lucide-react";
import type { Evidence } from "../../types";
import { cn } from "../../lib/utils";

const TRUST_CLS = { HIGH: "text-ok-dark", MEDIUM: "text-warn-dark", LOW: "text-mute" } as const;

export function EvidenceCard({ e, revealed, locked }: { e: Evidence; revealed: boolean; locked?: boolean }) {
  const helps = e.impact < 0;
  return (
    <motion.li
      initial={false}
      animate={{ opacity: revealed ? 1 : 0.25, x: revealed ? 0 : -8, filter: revealed ? "blur(0px)" : "blur(1px)" }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("rounded-xl border p-3.5 transition-colors", revealed ? (locked ? "border-ok/35 bg-ok/[0.07]" : "hairline-dark bg-white/[0.02]") : "hairline-dark bg-transparent")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          {locked ? <Lock size={15} className="mt-0.5 shrink-0 text-ok-dark" /> : <ShieldAlert size={15} className="mt-0.5 shrink-0 text-mute" />}
          <div>
            <p className="text-[14px] font-bold text-white">{e.name}</p>
            <p className="mt-0.5 text-[12.5px] text-mute">{e.source} · <span className={TRUST_CLS[e.trust]}>{e.trust} TRUST</span></p>
          </div>
        </div>
        <span className={cn("tnum shrink-0 rounded-md px-2 py-0.5 text-[12.5px] font-extrabold", helps ? "bg-ok-dark/12 text-ok-dark" : "bg-warn/12 text-warn-dark")}>{helps ? "" : "+"}{e.impact}</span>
      </div>
      <p className="mt-2 pl-[26px] text-[12.5px] leading-relaxed text-mute">{e.detail}</p>
    </motion.li>
  );
}
