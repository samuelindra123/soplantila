import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "./auth-primitives";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen w-full flex flex-col lg:grid lg:grid-cols-[1fr_560px] bg-background text-foreground selection:bg-accent/30 overflow-hidden font-sans">

      {/* Visual Side (Desktop) - Premium Editorial Design */}
      <section className="relative hidden lg:flex flex-col items-center justify-center p-20 bg-surface-dark border-r border-border-soft overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-[-20%] left-[-10%] h-[1000px] w-[1000px] rounded-full bg-accent/5 blur-[120px] animate-pulse" />
        
        <div className="relative z-10 w-full max-w-lg space-y-24">
          {/* Branding */}
          <Link href="/" className="group flex items-center gap-3">
            <Logo className="h-10 w-10 text-foreground transition-transform duration-500 group-hover:scale-110" />
            <span className="text-2xl font-bold tracking-tight">Soplantila</span>
          </Link>

          {/* Hero Content */}
          <div className="space-y-10">
            <h1 className="text-7xl font-bold leading-[1.05] tracking-tighter">
              The platform for <br />
              <span className="text-muted">meaningful</span> <br />
              connection.
            </h1>
            <p className="text-xl text-muted leading-relaxed font-medium">
              Join the next generation of social communication. Fast, private, and designed for humans.
            </p>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-2 gap-8 pt-4">
             {[
               { val: "4K", label: "Video Calls" },
               { val: "E2EE", label: "Security" },
               { val: "0ms", label: "Latency" },
               { val: "Free", label: "Unlimited" }
             ].map((f, i) => (
               <div key={i} className="space-y-1">
                 <p className="text-2xl font-bold tracking-tight text-foreground">{f.val}</p>
                 <p className="text-[10px] font-bold tracking-widest text-muted uppercase">{f.label}</p>
               </div>
             ))}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-20 left-20">
           <p className="text-[10px] font-bold tracking-[0.3em] text-muted/30 uppercase">
             © 2026 Soplantila Global Inc.
           </p>
        </div>
      </section>

      {/* Auth Side - Minimal Content Area */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12 relative z-10 bg-background">
        {/* Mobile Nav */}
        <div className="lg:hidden w-full absolute top-0 left-0 p-6 flex items-center justify-between glass border-b border-border-soft">
           <Link href="/" className="flex items-center gap-2">
             <Logo className="h-6 w-6 text-foreground" />
             <span className="text-sm font-bold tracking-tight">Soplantila</span>
           </Link>
           <Link href="/register" className="text-xs font-bold text-accent uppercase tracking-wider">Mulai</Link>
        </div>

        <div className="w-full max-w-[420px] space-y-10 animate-reveal">
          {children}

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] font-bold tracking-[0.2em] text-muted uppercase">
            <Link href="/terms" className="hover:text-foreground transition-colors duration-300">Syarat</Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors duration-300">Privasi</Link>
            <Link href="/safety" className="hover:text-foreground transition-colors duration-300">Keamanan</Link>
            <Link href="/platform" className="hover:text-foreground transition-colors duration-300">Platform</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
