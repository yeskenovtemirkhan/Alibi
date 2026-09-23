import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "./globals.css";
import { TransitionProvider } from "../components/motion/transition";
import { WorkspaceProvider } from "../lib/workspace";

export const metadata: Metadata = {
  title: "ALIBI — AI Fraud Investigator",
  description: "ALIBI investigates suspicious transactions, finds the context, and helps banks decide: approve, verify or block.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WorkspaceProvider><TransitionProvider>{children}</TransitionProvider></WorkspaceProvider>
      </body>
    </html>
  );
}
