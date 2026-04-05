"use client";

import Link from "next/link";
import { Logo } from "@/components/auth/auth-primitives";
import { useEffect, useState } from "react";

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    // Check initial scroll position on mount
    handleScroll();
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav 
      className={`sticky top-0 z-[100] w-full px-6 transition-all duration-500 ${
        isScrolled ? "glass border-b border-border-soft py-3" : "bg-transparent py-4"
      }`}
      suppressHydrationWarning
    >
      <div className="flex items-center justify-between gap-4">
        {/* Left: Logo & Menu */}
        <div className="flex items-center gap-12">
          <Link href="/" className="group flex items-center gap-3">
            <Logo className="h-8 w-8 text-foreground transition-transform duration-500 group-hover:scale-110" />
            <span className="text-lg font-bold tracking-tight">Soplantila</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Platform", href: "/platform" },
              { label: "Discovery", href: "/discovery" },
              { label: "Tentang Kami", href: "/about" },
            ].map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                className="text-sm font-medium text-muted hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Right: Auth Buttons */}
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold hover:opacity-70 transition-opacity px-4">
            Masuk
          </Link>
          <Link href="/register" className="bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-premium">
            Mulai Sekarang
          </Link>
        </div>
      </div>
    </nav>
  );
}
