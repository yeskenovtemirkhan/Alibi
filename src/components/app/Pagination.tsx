"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (p: number) => void }) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between border-t hairline-dark px-1 pt-4">
      <p className="text-[12.5px] text-mute">Page {page} of {pageCount}</p>
      <div className="flex gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page" className="grid size-8 place-items-center rounded-lg border hairline-dark text-white disabled:opacity-30"><ChevronLeft size={16} /></button>
        <button disabled={page >= pageCount} onClick={() => onChange(page + 1)} aria-label="Next page" className="grid size-8 place-items-center rounded-lg border hairline-dark text-white disabled:opacity-30"><ChevronRight size={16} /></button>
      </div>
    </nav>
  );
}
