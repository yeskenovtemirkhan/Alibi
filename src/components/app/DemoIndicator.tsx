"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus, RotateCcw } from "lucide-react";
import { useWorkspace } from "../../lib/workspace";
import { cn } from "../../lib/utils";

/** Persistent, honest "Demo data" pill shown in the app shell while in the Demo Workspace. */
export function DemoIndicator({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { resetDemo } = useWorkspace();

  useEffect(() => {
    if (!open) return;
    const click = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", click);
    window.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", click); window.removeEventListener("keydown", esc); };
  }, [open]);

  const action = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-bold transition";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn/10 font-bold text-warn-dark transition hover:bg-warn/15",
          compact ? "px-2.5 py-1.5 text-[12px]" : "w-full justify-between px-3 py-1.5 text-[12.5px]",
        )}
      >
        <span className="inline-flex items-center gap-1.5"><span className="relative flex size-1.5"><span className="absolute inset-0 animate-ping rounded-full bg-warn-dark/70" /><span className="relative size-1.5 rounded-full bg-warn-dark" /></span>Demo data</span>
        <ChevronDown size={13} className={cn("transition-transform", open && "rotate-180", compact && "hidden")} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Demo workspace"
            initial={{ opacity: 0, y: compact ? -6 : 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: compact ? -6 : 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className={cn(
              "absolute z-50 w-[260px] rounded-xl border hairline-dark bg-night-800 p-3 shadow-[0_24px_48px_-16px_rgba(0,0,0,0.8)]",
              compact ? "right-0 top-full mt-2" : "bottom-full left-0 mb-2",
            )}
          >
            <p className="px-1 text-[12.5px] leading-relaxed text-snow/85">This workspace uses simulated data for demonstration purposes.</p>
            <div className="mt-2.5 space-y-1 border-t hairline-dark pt-2.5">
              <button onClick={() => { setOpen(false); resetDemo(); router.push("/app/dashboard"); }} className={cn(action, "text-white hover:bg-white/[0.06]")}><RotateCcw size={14} className="text-mute" /> Reset Demo</button>
              <button onClick={() => { setOpen(false); router.push("/welcome/create"); }} className={cn(action, "text-white hover:bg-white/[0.06]")}><Plus size={14} className="text-red" /> Start Fresh</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
