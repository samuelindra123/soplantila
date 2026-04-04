import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function DiscoveryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navigation />

      <main>
        {/* --- HERO: EXPLORE THE WORLD --- */}
        <section className="px-6 pt-32 pb-40 md:pt-48 md:pb-64 border-b border-border-soft overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-end justify-between gap-12">
            <div className="max-w-3xl space-y-12">
              <div className="inline-block px-4 py-1.5 rounded-full bg-foreground text-background text-[10px] font-bold tracking-[0.2em] uppercase animate-reveal">
                Discovery & Communities
              </div>
              <h1 className="text-6xl md:text-[10rem] font-bold leading-[0.8] tracking-tighter animate-reveal [animation-delay:200ms]">
                Jelajahi <br /> 
                Dunia.
              </h1>
            </div>
            <p className="max-w-md text-xl md:text-2xl text-muted font-medium leading-tight animate-reveal [animation-delay:400ms] pb-4">
              Temukan komunitas yang sejalan dengan minat Anda dan biarkan feed cerdas kami menginspirasi hari Anda.
            </p>
          </div>
        </section>

        {/* --- THE BENTO DISCOVERY --- */}
        <section className="py-32 px-6">
           <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-12 md:grid-rows-2 h-full md:h-[1000px]">
              
              {/* Featured Content */}
              <div className="md:col-span-8 md:row-span-2 relative rounded-[4rem] bg-surface-dark border border-border-soft overflow-hidden shadow-premium group">
                 <div className="absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent z-10" />
                 <div className="absolute bottom-16 left-16 z-20 space-y-6">
                    <h3 className="text-4xl md:text-6xl font-bold tracking-tight">Smart Feed.</h3>
                    <p className="text-xl text-muted font-medium max-w-md leading-relaxed">
                       Algoritma yang mengerti konteks, bukan hanya sekadar klik. Relevansi adalah prioritas kami.
                    </p>
                 </div>
                 <div className="absolute top-0 right-0 p-12">
                    <div className="h-20 w-20 rounded-full bg-accent flex items-center justify-center text-white text-3xl shadow-premium">✨</div>
                 </div>
              </div>

              {/* Community Card */}
              <div className="md:col-span-4 relative rounded-[3rem] bg-foreground text-background p-12 overflow-hidden shadow-premium group">
                 <div className="relative z-10 space-y-6">
                    <h3 className="text-3xl font-bold tracking-tight">Komunitas.</h3>
                    <p className="text-sm opacity-70 font-medium leading-relaxed">
                       Bergabunglah dengan ribuan grup diskusi dari astronomi hingga desain minimalis.
                    </p>
                 </div>
                 <div className="absolute -bottom-4 -right-4 h-32 w-32 bg-background/10 rounded-full blur-2xl" />
              </div>

              {/* Creators Card */}
              <div className="md:col-span-4 relative rounded-[3rem] bg-accent text-white p-12 overflow-hidden shadow-premium group">
                 <div className="relative z-10 space-y-6">
                    <h3 className="text-3xl font-bold tracking-tight">Kreator.</h3>
                    <p className="text-sm opacity-80 font-medium leading-relaxed">
                       Alat monetisasi yang adil dan transparan untuk mendukung karya Anda.
                    </p>
                 </div>
                 <div className="absolute -bottom-4 -right-4 h-32 w-32 bg-white/10 rounded-full blur-2xl" />
              </div>

           </div>
        </section>

        {/* --- CTA: JOIN THE MOVEMENT --- */}
        <section className="py-56 px-6 text-center">
           <div className="max-w-4xl mx-auto space-y-12">
              <h2 className="text-5xl md:text-8xl font-bold tracking-tighter leading-none">
                 Siap Menemukan <br /> Hal Baru?
              </h2>
              <div className="pt-8">
                 <button className="bg-foreground text-background px-12 py-6 rounded-full text-xl font-bold shadow-premium hover:scale-105 transition-all">
                    Mulai Eksplorasi
                 </button>
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
