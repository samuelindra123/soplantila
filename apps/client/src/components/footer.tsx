import Link from "next/link";
import { Logo } from "@/components/auth/auth-primitives";

export function Footer() {
  return (
    <footer className="py-32 px-6 border-t border-border-soft">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-16 md:gap-8">
        <div className="col-span-2 space-y-8">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-8 text-foreground" />
            <span className="text-xl font-bold tracking-tight">Soplantila</span>
          </div>
          <p className="max-w-xs text-muted font-medium leading-relaxed">
            Platform komunikasi global yang mengedepankan keamanan, kecepatan, dan estetika premium.
          </p>
          <div className="flex gap-6">
             {[1, 2, 3, 4].map(i => <div key={i} className="h-5 w-5 rounded-full bg-foreground/10" />)}
          </div>
        </div>
        
        <div className="space-y-6">
          <h4 className="text-sm font-bold uppercase tracking-widest">Produk</h4>
          <ul className="space-y-4 text-sm font-medium text-muted">
            <li><Link href="/platform" className="hover:text-foreground">Fitur Utama</Link></li>
            <li><Link href="/messenger" className="hover:text-foreground">Messenger</Link></li>
            <li><Link href="/discovery" className="hover:text-foreground">Social Feed</Link></li>
            <li><Link href="/developers" className="hover:text-foreground">Untuk Developer</Link></li>
          </ul>
        </div>

        <div className="space-y-6">
          <h4 className="text-sm font-bold uppercase tracking-widest">Perusahaan</h4>
          <ul className="space-y-4 text-sm font-medium text-muted">
            <li><Link href="/about" className="hover:text-foreground">Tentang Kami</Link></li>
            <li><Link href="/privacy" className="hover:text-foreground">Privasi</Link></li>
            <li><Link href="/terms" className="hover:text-foreground">Syarat & Ketentuan</Link></li>
            <li><Link href="/safety" className="hover:text-foreground">Pusat Keamanan</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-32 pt-12 border-t border-border-soft text-center md:text-left flex flex-col md:flex-row justify-between gap-8">
        <p className="text-xs font-bold text-muted uppercase tracking-widest">© 2026 Soplantila Global Inc.</p>
        <p className="text-xs font-medium text-muted">Dirancang dengan ❤️ untuk masa depan yang lebih terkoneksi.</p>
      </div>
    </footer>
  );
}
