import { OnboardingWizard } from "@/features/onboarding/components/onboarding-wizard";
import { Logo } from "@/components/auth/auth-primitives";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Setup Profil | Soplantila",
  description: "Lengkapi profil Anda untuk mulai menggunakan Soplantila.",
};

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col overflow-hidden">
      {/* Dedicated Onboarding Header */}
      <header className="px-6 py-8 md:px-12 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8 text-foreground" />
          <span className="text-lg font-bold tracking-tight">Setup Profil</span>
        </div>
        <div className="flex items-center gap-6">
           <Link href="mailto:support@soplantila.com" className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] hover:text-foreground transition-colors">Bantuan</Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col relative">
        <OnboardingWizard />
      </main>

      {/* Subtle Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}
