import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";

export default function MessengerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <Navigation />

      <main>
        {/* --- HERO: SPEED OF THOUGHT --- */}
        <section className="px-6 pt-32 pb-40 md:pt-48 md:pb-64 text-center overflow-hidden">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-[10px] font-bold tracking-[0.2em] uppercase animate-reveal">
              The Messenger Engine
            </div>
            <h1 className="text-6xl md:text-9xl font-bold leading-[0.9] tracking-tighter animate-reveal [animation-delay:200ms]">
              Kecepatan <br /> 
              <span className="text-muted">Pikiran.</span>
            </h1>
            <p className="max-w-2xl mx-auto text-xl md:text-2xl text-muted font-medium leading-relaxed animate-reveal [animation-delay:400ms]">
              Bukan sekadar mengirim pesan. Soplantila Messenger adalah perpanjangan dari cara Anda berpikir dan berinteraksi secara instan.
            </p>
          </div>
        </section>

        {/* --- INTERACTIVE SHOWCASE --- */}
        <section className="py-32 px-6 bg-surface-dark">
           <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
              <div className="space-y-12">
                 <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-none">Privasi Tanpa Kompromi.</h2>
                 <p className="text-xl text-muted font-medium leading-relaxed">
                    Setiap kata, gambar, dan suara dienkripsi secara end-to-end sebelum meninggalkan perangkat Anda. Kami menggunakan protokol Signal generasi terbaru untuk keamanan mutlak.
                 </p>
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <p className="text-3xl font-bold">AES-256</p>
                       <p className="text-xs font-bold text-muted uppercase tracking-widest">Encryption Standard</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-3xl font-bold">Perfect</p>
                       <p className="text-xs font-bold text-muted uppercase tracking-widest">Forward Secrecy</p>
                    </div>
                 </div>
              </div>
              <div className="relative">
                 <div className="aspect-square glass rounded-[4rem] shadow-premium p-12 flex flex-col justify-between overflow-hidden group border border-border-soft">
                    <div className="space-y-6">
                       <div className="h-2 w-32 bg-accent/20 rounded-full" />
                       <div className="h-4 w-full bg-foreground/5 rounded-2xl" />
                       <div className="h-4 w-2/3 bg-foreground/5 rounded-2xl" />
                    </div>
                    <div className="relative h-48 bg-gradient-to-br from-accent to-blue-600 rounded-3xl shadow-premium flex items-center justify-center">
                       <svg className="h-12 w-12 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section className="py-40 px-6">
           <div className="max-w-7xl mx-auto space-y-24">
              <h2 className="text-4xl md:text-6xl font-bold text-center tracking-tight">Kekuatan di Tangan Anda.</h2>
              <div className="grid md:grid-cols-3 gap-12">
                 {[
                   { title: "4K Video Calls", desc: "Kualitas sinematik untuk setiap panggilan video, bahkan dalam koneksi rendah.", icon: "🎥" },
                   { title: "4GB File Sharing", desc: "Kirim file besar tanpa kompresi dan tanpa batas ukuran yang menyulitkan.", icon: "📂" },
                   { title: "Voice Notes 2.0", desc: "Transkripsi otomatis bertenaya AI untuk setiap pesan suara yang Anda terima.", icon: "🎙️" }
                 ].map((feat, i) => (
                   <div key={i} className="p-12 rounded-[3rem] bg-surface-dark border border-border-soft hover:bg-background transition-all duration-700 shadow-premium group">
                      <div className="text-5xl mb-8 group-hover:scale-110 transition-transform">{feat.icon}</div>
                      <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{feat.title}</h3>
                      <p className="text-muted font-medium leading-relaxed">{feat.desc}</p>
                   </div>
                 ))}
              </div>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
