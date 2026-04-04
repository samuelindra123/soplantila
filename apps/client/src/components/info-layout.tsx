import Link from "next/link";
import { Logo } from "@/components/auth/auth-primitives";

interface InfoLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function InfoLayout({ children, title, subtitle }: InfoLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 w-full px-6 py-4 glass border-b border-border-soft">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-3">
            <Logo className="h-7 w-7 text-foreground transition-transform duration-500 group-hover:scale-110" />
            <span className="text-base font-bold tracking-tight">Soplantila</span>
          </Link>
          <div className="flex gap-6">
            <Link href="/login" className="text-sm font-semibold hover:opacity-70 transition-opacity">Masuk</Link>
            <Link href="/register" className="text-sm font-bold bg-foreground text-background px-4 py-1.5 rounded-full">Daftar</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-20 md:py-32">
        <div className="grid lg:grid-cols-[280px_1fr] gap-20">
          {/* Sidebar Nav */}
          <aside className="hidden lg:block space-y-12 sticky top-40 h-fit">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Informasi</h4>
              <nav className="flex flex-col gap-3">
                {[
                  { label: "Platform", href: "/platform" },
                  { label: "Tentang Kami", href: "/about" },
                  { label: "Developers", href: "/developers" },
                  { label: "Privacy", href: "/privacy" },
                  { label: "Safety", href: "/safety" },
                  { label: "Terms", href: "/terms" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-semibold text-muted hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="p-6 rounded-2xl bg-surface-dark border border-border-soft">
              <p className="text-xs font-bold leading-relaxed">
                Butuh bantuan lebih lanjut? <br />
                <Link href="mailto:support@soplantila.com" className="text-accent underline">Hubungi Tim Kami</Link>
              </p>
            </div>
          </aside>

          {/* Content */}
          <article className="space-y-16 animate-reveal">
            <header className="space-y-6">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.1]">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xl md:text-2xl text-muted font-medium leading-relaxed max-w-2xl">
                  {subtitle}
                </p>
              )}
              <div className="h-px w-full bg-border-soft pt-8" />
            </header>

            <div className="prose prose-lg dark:prose-invert max-w-none 
              prose-headings:tracking-tight prose-headings:font-bold
              prose-p:text-muted prose-p:leading-relaxed prose-p:font-medium
              prose-li:text-muted prose-li:font-medium
              prose-strong:text-foreground prose-strong:font-bold">
              {children}
            </div>
          </article>
        </div>
      </main>

      {/* Mini Footer */}
      <footer className="py-20 px-6 border-t border-border-soft mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-xs font-bold text-muted uppercase tracking-widest">© 2026 Soplantila Global</p>
          <div className="flex gap-8 text-xs font-bold text-muted uppercase tracking-widest">
             <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
             <Link href="/terms" className="hover:text-foreground">Terms</Link>
             <Link href="/safety" className="hover:text-foreground">Safety</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
