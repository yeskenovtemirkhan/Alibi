"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Maximize2, Play, X } from "lucide-react";
import { Logo } from "../ui/Logo";
import { NetworkBackdrop } from "../ui/NetworkBackdrop";
import { useWorkspace } from "../../lib/workspace";

export interface DemoVideoProps {
  /** Final demo video (mp4/webm URL or /public path). Leave empty to show the placeholder. */
  videoSrc?: string;
  poster?: string;
  /** Shown on the poster, e.g. "3:00". */
  duration?: string;
  title?: string;
}

/** Replace the placeholder by setting NEXT_PUBLIC_DEMO_VIDEO_URL (or passing `videoSrc`). Nothing else to change. */
export function DemoVideo({ videoSrc = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL, poster, duration = "up to 3 min", title = "ALIBI in action" }: DemoVideoProps) {
  const [state, setState] = useState<"poster" | "playing" | "soon">("poster");
  const { enterDemo } = useWorkspace();
  const wrap = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const play = () => setState(videoSrc ? "playing" : "soon");
  const fullscreen = () => (vid.current ?? wrap.current)?.requestFullscreen?.();

  return (
    <div ref={wrap} className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-night-950 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.7)]">
      {state === "playing" && videoSrc ? (
        <video ref={vid} src={videoSrc} poster={poster} controls autoPlay playsInline preload="none" className="absolute inset-0 h-full w-full bg-black" />
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: "radial-gradient(70% 90% at 78% 30%, rgba(255,31,50,0.35), transparent 60%), linear-gradient(135deg,#12161b,#080a0d)" }} />
          <NetworkBackdrop className="absolute inset-0 h-full w-full opacity-70" />
          <div className="absolute left-4 top-4 md:left-6 md:top-5"><Logo dark /></div>
          <button onClick={fullscreen} aria-label="Fullscreen" className="absolute right-4 top-4 grid size-9 place-items-center rounded-lg bg-white/10 text-white backdrop-blur hover:bg-white/20 md:right-6 md:top-5"><Maximize2 size={16} /></button>

          <div className="absolute bottom-5 left-4 hidden w-[230px] rounded-xl border border-white/10 bg-night-900/90 p-3.5 backdrop-blur sm:block md:bottom-7 md:left-7">
            <p className="text-[11px] font-semibold text-mute">ATX-7842 · ₸650,000 · Singapore</p>
            <p className="mt-1.5 flex items-center gap-2 text-[15px] font-extrabold text-white"><span>91%</span><span className="text-mute">→</span><span className="text-ok-dark">0.5%</span><span className="ml-auto rounded bg-ok-dark/15 px-1.5 py-0.5 text-[10.5px] text-ok-dark">APPROVED</span></p>
          </div>

          {state === "soon" ? (
            <div className="absolute inset-0 grid place-items-center bg-night-950/85 p-6 text-center backdrop-blur-sm" role="status">
              <div>
                <p className="text-[clamp(1.2rem,2.6vw,1.8rem)] font-extrabold text-white">Demo video coming soon</p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-mute">Until then, run the same investigation yourself in the live simulator.</p>
                <div className="mt-5 flex justify-center gap-3">
                  <Link href="/app/simulator#compare" onClick={enterDemo} className="rounded-lg bg-red px-4 py-2.5 text-sm font-bold text-white hover:bg-red-600">Open the simulator</Link>
                  <button onClick={() => setState("poster")} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/5"><X size={14} /> Close</button>
                </div>
              </div>
            </div>
          ) : (
            <button onClick={play} aria-label={`Play video: ${title}`} className="group absolute inset-0 grid place-items-center">
              <span className="relative grid size-[76px] place-items-center rounded-full bg-red text-white shadow-[0_0_0_10px_rgba(255,31,50,0.18)] transition group-hover:scale-105 md:size-[92px]"><Play size={30} fill="currentColor" className="ml-1" /></span>
            </button>
          )}
          <span className="absolute bottom-4 right-4 rounded-md bg-black/60 px-2.5 py-1 text-[12px] font-semibold text-white backdrop-blur md:bottom-6 md:right-6">{duration}</span>
        </>
      )}
    </div>
  );
}
