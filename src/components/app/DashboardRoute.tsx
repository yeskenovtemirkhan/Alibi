"use client";
import { DashboardView } from "./DashboardView";
import { FreshDashboard } from "./FreshDashboard";
import { GUIDE_TX } from "./GuidedDemo";
import { firstName, greeting, useWorkspace } from "../../lib/workspace";
import type { DashboardOverview } from "../../types";

/** Picks the populated demo dashboard or the empty Fresh workspace. */
export function DashboardRoute({ data }: { data: DashboardOverview }) {
  const { mode, user, guide } = useWorkspace();
  if (mode === "fresh") return <FreshDashboard />;
  return <DashboardView data={data} greetingText={`${greeting()}, ${firstName(user)}`} highlightId={guide === "dashboard" ? GUIDE_TX : undefined} />;
}
