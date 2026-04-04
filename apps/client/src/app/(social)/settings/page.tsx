"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/features/auth/context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { Spinner } from "@/components/auth/auth-primitives";

export default function SettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!isLoading && !user) {
      startTransition(() => {
        router.replace("/login");
      });
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-[100dvh] bg-background flex items-center justify-center">
        <Spinner className="h-10 w-10 text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 ml-[70px] lg:ml-[260px] p-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted mt-4">Coming soon...</p>
      </main>
    </div>
  );
}
