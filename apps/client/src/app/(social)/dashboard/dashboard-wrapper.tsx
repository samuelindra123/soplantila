"use client";

import dynamic from "next/dynamic";

// Disable SSR for protected dashboard page to avoid hydration mismatch
// Auth state differs between server and client, so we only render on client
const DashboardContent = dynamic(() => import("./dashboard-content"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center">
      <div className="h-10 w-10 border-4 border-muted border-t-accent rounded-full animate-spin" />
    </div>
  ),
});

export default function DashboardPageWrapper() {
  return <DashboardContent />;
}
