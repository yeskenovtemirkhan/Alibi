"use client";
import { useEffect, useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { Logo } from "../ui/Logo";
import { TransitionLink } from "../motion/transition";
import { cn } from "../../lib/utils";

const LINKS = [
  { href: "#product", label: "Product" },
  { href: "#how", label: "How it works" },
  { href: "#why", label: "Why ALIBI" },
  { href: "#impact", label: "Impact" },
  { href: "#demo", label: "Demo" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 16);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header className={cn("fixed inset-x-0 top-0 z-50 border-b transition-all duration-300", scrolled ? "border-hair bg-white/85 backdrop-blur-md" : "border-transparent bg-transparent")}>
      <nav aria-label="Main" className={cn("mx-auto flex max-w-[1240px] items-center justify-between px-5 transition-all duration-300 md:px-8", scrolled ? "h-[60px]" : "h-[76px]")}>
        <a href="#top" aria-label="ALIBI home"><Logo /></a>
        <ul className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-[14px] font-medium text-ink-2 transition-colors hover:text-red">{l.label}</a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <TransitionLink href="/welcome" className="hidden items-center gap-1.5 rounded-lg bg-red px-4 py-2.5 text-[13.5px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(255,31,50,0.8)] transition hover:bg-red-600 sm:inline-flex">
            Get Started <ArrowRight size={15} />
          </TransitionLink>
          <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="grid size-10 place-items-center rounded-lg border border-hair bg-white md:hidden">
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-hair bg-white px-5 pb-5 pt-2 md:hidden">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}><a href={l.href} onClick={() => setOpen(false)} className="block border-b border-hair py-3.5 text-[15px] font-semibold">{l.label}</a></li>
            ))}
          </ul>
          <TransitionLink href="/welcome" className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red py-3 text-sm font-bold text-white">Get Started <ArrowRight size={15} /></TransitionLink>
        </div>
      )}
    </header>
  );
}
