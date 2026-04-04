import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function PlatformPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navigation />

      <main>
        {/* --- HERO: IMMERSIVE HEADLINE --- */}
        <section className="px-6 pt-32 pb-40 md:pt-48 md:pb-64 border-b border-border-soft overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="inline-block px-4 py-1.5 rounded-full bg-surface-dark border border-border-soft text-[10px] font-bold tracking-[0.2em] uppercase animate-reveal">
              The Infrastructure of Connection
            </div>
            <h1 className="text-6xl md:text-8xl lg:text-[12rem] font-bold leading-[0.85] tracking-tighter animate-reveal [animation-delay:200ms]">
              Satu Jaringan. <br />
              <span className="text-muted">Tanpa Batas.</span>
            </h1>
            <p className="max-w-3xl text-xl md:text-3xl text-muted font-medium leading-tight animate-reveal [animation-delay:400ms]">
              Arsitektur Soplantila dirancang untuk menangani miliaran interaksi dengan keamanan militer dan kecepatan cahaya.
            </p>
          </div>
        </section>

        {/* --- CORE PILLARS: BENTO IMMERSIVE --- */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto grid gap-8 lg:grid-cols-12">
            
            {/* Messenger Pillar */}
            <div className="lg:col-span-7 group relative p-12 md:p-16 rounded-[3rem] bg-surface-dark border border-border-soft overflow-hidden hover:bg-background transition-all duration-700 shadow-premium hover:shadow-hover">
              <div className="relative z-10 space-y-12">
                <div className="h-16 w-16 rounded-3xl bg-accent flex items-center justify-center text-white shadow-premium">
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </div>
                <div className="space-y-6">
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Messenger <br /> Engine.</h2>
                  <p className="text-xl text-muted font-medium leading-relaxed max-w-md">
                    Protokol komunikasi real-time dengan latensi terendah di industri, mendukung pengiriman media tanpa kompresi yang merusak kualitas.
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-96 h-96 bg-accent/5 rounded-full blur-[100px] group-hover:bg-accent/10 transition-colors" />
            </div>

            {/* Social Pillar */}
            <div className="lg:col-span-5 group relative p-12 md:p-16 rounded-[3rem] bg-foreground text-background overflow-hidden shadow-premium hover:shadow-hover transition-all duration-700">
              <div className="relative z-10 space-y-12">
                <div className="h-16 w-16 rounded-3xl bg-background/10 backdrop-blur-xl flex items-center justify-center text-background shadow-premium">
                   <svg className="h-8 w-8 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <div className="space-y-6">
                  <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Social <br /> Fabric.</h2>
                  <p className="text-lg opacity-70 font-medium leading-relaxed">
                    Sistem algoritma yang didesain untuk kesehatan mental, memprioritaskan interaksi antar manusia yang bermakna di atas iklan.
                  </p>
                </div>
              </div>
            </div>

            {/* Technical Stats Pillar */}
            <div className="lg:col-span-12 grid md:grid-cols-3 gap-8 pt-8">
              {[
                { label: "Uptime", val: "99.99%", desc: "Always online, anywhere." },
                { label: "Security", val: "E2EE", desc: "Military-grade encryption." },
                { label: "Nodes", val: "2,400+", desc: "Global edge locations." }
              ].map((stat, i) => (
                <div key={i} className="p-10 rounded-[2.5rem] bg-surface-dark border border-border-soft shadow-premium">
                   <p className="text-[10px] font-bold tracking-[0.3em] text-muted uppercase mb-4">{stat.label}</p>
                   <p className="text-5xl font-bold mb-2 tracking-tighter">{stat.val}</p>
                   <p className="text-sm text-muted font-medium">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- FULL WIDTH VISIONARY SECTION --- */}
        <section className="py-56 px-6 bg-surface-dark text-center overflow-hidden">
           <div className="max-w-4xl mx-auto space-y-16">
              <h2 className="text-4xl md:text-7xl font-bold tracking-tighter leading-tight">
                Membangun Standar Baru <br /> dalam Komunikasi Global.
              </h2>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                 <div className="px-8 py-4 glass rounded-2xl border border-border-soft shadow-premium flex items-center gap-4 group hover:bg-background transition-all">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-bold tracking-widest uppercase">Verified Infrastructure</span>
                 </div>
                 <div className="px-8 py-4 glass rounded-2xl border border-border-soft shadow-premium flex items-center gap-4 group hover:bg-background transition-all">
                    <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-xs font-bold tracking-widest uppercase">Next-Gen Protocol</span>
                 </div>
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
