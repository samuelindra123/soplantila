import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full text-center space-y-12 animate-reveal">
        
        {/* Decorative Visual Element */}
        <div className="relative mx-auto w-fit">
          <div className="relative z-10 flex items-center justify-center">
            {/* 404 Typography with gradient */}
            <h1 className="text-[140px] md:text-[200px] font-bold tracking-tighter leading-none bg-gradient-to-br from-foreground via-muted to-foreground/40 bg-clip-text text-transparent">
              404
            </h1>
          </div>
          
          {/* Abstract decorative circles */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[400px] md:h-[400px] -z-10">
            <div className="absolute top-0 right-0 w-32 h-32 md:w-48 md:h-48 rounded-full bg-accent/5 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
            <div className="absolute bottom-0 left-0 w-24 h-24 md:w-36 md:h-36 rounded-full bg-accent/10 blur-2xl animate-pulse" style={{ animationDuration: '3s', animationDelay: '1s' }} />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
              Halaman Tidak Ditemukan
            </h2>
            <p className="text-base md:text-lg text-muted font-medium leading-relaxed max-w-lg mx-auto">
              Maaf, halaman yang Anda cari tidak dapat ditemukan atau mungkin sudah dipindahkan.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link 
              href="/dashboard"
              className="group relative flex h-14 items-center justify-center gap-3 rounded-2xl bg-foreground text-background px-8 text-sm font-bold uppercase tracking-[0.15em] transition-all hover:shadow-premium active:scale-[0.98] w-full sm:w-auto"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="h-5 w-5 fill-current transition-transform group-hover:-translate-x-1" 
                aria-hidden="true"
              >
                <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
              </svg>
              <span>Kembali ke Dashboard</span>
            </Link>

            <Link 
              href="/discovery"
              className="group flex h-14 items-center justify-center gap-3 rounded-2xl border-2 border-border-soft bg-surface hover:bg-surface-dark text-foreground px-8 text-sm font-bold uppercase tracking-[0.15em] transition-all hover:border-accent/40 active:scale-[0.98] w-full sm:w-auto"
            >
              <svg 
                viewBox="0 0 24 24" 
                className="h-5 w-5 fill-current" 
                aria-hidden="true"
              >
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
              <span>Jelajahi</span>
            </Link>
          </div>
        </div>

        {/* Footer Help Text */}
        <div className="pt-12 border-t border-border-soft/50">
          <p className="text-sm text-muted">
            Butuh bantuan?{" "}
            <Link href="/about" className="text-accent hover:text-accent-strong font-semibold transition-colors">
              Hubungi Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
