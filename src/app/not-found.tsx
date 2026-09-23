import Link from "next/link";
import { Logo } from "../components/ui/Logo";

export default function NotFound() {
  return (
    <div className="landing-wash grid min-h-screen place-items-center px-6 text-center">
      <div>
        <Logo className="mx-auto" />
        <p className="mt-8 text-[15px] font-semibold text-ink-3">404</p>
        <h1 className="mt-2 text-2xl font-extrabold">This page doesn't exist.</h1>
        <Link href="/" className="mt-6 inline-flex rounded-lg bg-red px-5 py-3 text-sm font-bold text-white">Back to ALIBI</Link>
      </div>
    </div>
  );
}
