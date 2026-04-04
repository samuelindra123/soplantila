import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navigation />

      <main>
        {/* --- HERO: THE STORYTELLING START --- */}
        <section className="px-6 pt-32 pb-40 md:pt-48 md:pb-64 text-center overflow-hidden">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold tracking-[0.2em] uppercase animate-reveal">
              The Soplantila Story
            </div>
            <h1 className="text-6xl md:text-9xl font-bold leading-[0.9] tracking-tighter animate-reveal [animation-delay:200ms]">
              Teknologi untuk <br /> 
              <span className="text-muted">Kemanusiaan.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl md:text-2xl text-muted font-medium leading-relaxed animate-reveal [animation-delay:400ms]">
              Kami percaya bahwa di balik setiap baris kode, harus ada detak jantung. Soplantila dibangun untuk mengembalikan esensi komunikasi yang hilang.
            </p>
          </div>
        </section>

        {/* --- IMMERSIVE VALUE: THE VISION --- */}
        <section className="py-40 px-6 bg-foreground text-background">
           <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                 <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">Visi Kami Adalah <br /> Kebebasan Anda.</h2>
                 <p className="text-xl md:text-2xl opacity-60 font-medium leading-relaxed">
                    Di dunia yang semakin terfragmentasi, kami membangun jembatan. Soplantila adalah ruang di mana privasi tidak ditawar, dan koneksi tidak dibatasi oleh batas geografis atau politik.
                 </p>
              </div>
              <div className="aspect-[4/5] rounded-[4rem] bg-background/5 border border-background/10 flex items-center justify-center p-12 text-center">
                 <p className="text-3xl italic font-serif opacity-40 leading-relaxed">
                    "Komunikasi yang benar adalah ketika dua jiwa dapat berbicara tanpa rasa takut akan pengawasan atau penghakiman."
                 </p>
              </div>
           </div>
        </section>

        {/* --- BENTO: THE PHILOSOPHY --- */}
        <section className="py-40 px-6">
           <div className="max-w-7xl mx-auto space-y-32">
              <div className="grid md:grid-cols-3 gap-12">
                 {[
                   { title: "Empati", desc: "Kami mendesain dengan hati, memikirkan dampak emosional dari setiap fitur.", icon: "🤍" },
                   { title: "Kejujuran", desc: "Transparansi mutlak dalam cara kami mengelola data dan algoritma.", icon: "✨" },
                   { title: "Keberanian", desc: "Berani menantang status quo industri teknologi demi kebaikan pengguna.", icon: "⚔️" }
                 ].map((v, i) => (
                   <div key={i} className="space-y-8 p-10 rounded-[3rem] bg-surface-dark border border-border-soft hover:bg-background transition-all duration-500 shadow-premium">
                      <div className="text-5xl">{v.icon}</div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight">{v.title}</h3>
                      <p className="text-muted font-medium leading-relaxed">{v.desc}</p>
                   </div>
                 ))}
              </div>

              {/* Human Focus Footer */}
              <div className="text-center space-y-12 py-20">
                 <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Dibuat oleh Manusia, <br /> untuk Manusia.</h2>
                 <p className="max-w-2xl mx-auto text-xl text-muted font-medium leading-relaxed">
                    Kami adalah tim global desainer, insinyur, and pemikir yang bermimpi tentang masa depan digital yang lebih cerah, lebih aman, dan lebih bermakna bagi semua orang.
                 </p>
                 <div className="h-px w-32 bg-accent mx-auto" />
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
