import { cn } from "../../lib/utils";

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="#ff1f32" />
      <path d="M9 24 L16 7 L23 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.4 18.2 H19.6" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="13" r="1.7" fill="#fff" />
    </svg>
  );
}

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className={cn("text-[19px] font-extrabold tracking-tight", dark ? "text-white" : "text-ink")}>ALIBI</span>
    </span>
  );
}
