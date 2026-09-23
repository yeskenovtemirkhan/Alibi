import type { ReactNode } from "react";

export function DemoBadge({ label = "Demo data" }: { label?: string }) {
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 text-[12px] font-bold text-warn-dark"><span className="size-1.5 rounded-full bg-warn-dark" />{label}</span>;
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-extrabold tracking-tight text-white md:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[14.5px] text-mute">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
