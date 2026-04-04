import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground selection:bg-accent/30 font-sans">
      
      {/* --- PRE-NAV ANNOUNCEMENT --- */}
      <div className="w-full bg-foreground text-background py-2.5 text-center overflow-hidden">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase animate-reveal">
          Memperkenalkan Soplantila 2.0 — Masa Depan Koneksi Digital
        </p>
      </div>

      <Navigation />

      <main>
        {/* --- HERO SECTION: THE HUMAN CONNECTION --- */}
        <section className="relative px-6 pt-24 pb-32 md:pt-40 md:pb-56 overflow-hidden">
          <div className="max-w-7xl mx-auto text-center space-y-12">
            <div className="space-y-6 animate-reveal">
              <h1 className="text-5xl md:text-8xl lg:text-[10rem] font-bold leading-[0.9] tracking-tighter">
                Lebih Dekat. <br />
                <span className="text-muted/20">Lebih Nyata.</span>
              </h1>
              <p className="max-w-2xl mx-auto text-lg md:text-2xl text-muted leading-relaxed font-medium">
                Soplantila bukan sekadar aplikasi. Ini adalah ruang digital di mana setiap percakapan terasa personal dan setiap koneksi terasa bermakna.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-reveal [animation-delay:200ms]">
              <Link href="/register" className="w-full sm:w-auto bg-accent text-white px-10 py-5 rounded-full text-lg font-bold shadow-premium hover:shadow-hover hover:-translate-y-1 transition-all">
                Coba Gratis
              </Link>
              <Link href="/platform" className="w-full sm:w-auto glass-strong px-10 py-5 rounded-full text-lg font-bold hover:bg-surface-dark transition-all">
                Pelajari Fitur
              </Link>
            </div>
          </div>

          {/* Hero Mockup: The Immersive UI */}
          <div className="mt-24 md:mt-40 max-w-[1400px] mx-auto px-4 animate-reveal [animation-delay:400ms]">
            <div className="relative aspect-[16/10] w-full rounded-[2.5rem] md:rounded-[4rem] bg-surface-dark border border-border-soft shadow-premium overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-transparent" />
              
              {/* Fake UI Elements for visual density */}
              <div className="absolute top-12 left-12 w-72 h-96 glass-strong rounded-3xl p-6 hidden lg:block shadow-premium animate-reveal [animation-delay:600ms]">
                <div className="h-4 w-32 bg-foreground/10 rounded-full mb-8" />
                <div className="space-y-6">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="h-10 w-10 rounded-full bg-foreground/5" />
                      <div className="space-y-2 flex-1">
                        <div className="h-2 w-full bg-foreground/10 rounded-full" />
                        <div className="h-2 w-2/3 bg-foreground/5 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-12 right-12 w-80 h-64 glass-strong rounded-3xl p-6 hidden lg:block shadow-premium animate-reveal [animation-delay:800ms]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-3 w-3 rounded-full bg-success" />
                  <span className="text-[10px] font-bold tracking-widest uppercase">Live Activity</span>
                </div>
                <div className="h-32 rounded-2xl bg-gradient-to-br from-accent/20 to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 1: MESSENGER (THE SPEED OF THOUGHT) --- */}
        <section className="py-32 px-6 bg-surface-dark">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-24 items-center">
            <div className="space-y-8">
              <div className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-widest uppercase">
                Instant Messenger
              </div>
              <h2 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
                Komunikasi Tanpa <br /> Jeda, Tanpa Batas.
              </h2>
              <p className="text-xl text-muted leading-relaxed">
                Messenger kami dirancang untuk kecepatan. Kirim pesan, bagikan media, dan lakukan panggilan HD dengan teknologi kompresi tercanggih yang menghemat kuota tanpa mengurangi kualitas.
              </p>
              <ul className="space-y-4 pt-4">
                {[
                  "Enkripsi End-to-End standar militer",
                  "Panggilan video 4K yang jernih",
                  "Transfer file besar hingga 4GB",
                  "Self-destructing messages untuk privasi total"
                ].map(text => (
                  <li key={text} className="flex items-center gap-4 text-sm font-semibold">
                    <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square glass rounded-[3rem] shadow-premium flex flex-col p-8">
                 {/* Chat Mockup Rendering */}
                 <div className="flex-1 space-y-6">
                    <div className="max-w-[80%] glass-strong p-5 rounded-3xl rounded-bl-md shadow-sm">
                      <p className="text-sm font-medium">Hai! Bagaimana progres update Soplantila? 🚀</p>
                    </div>
                    <div className="max-w-[80%] ml-auto bg-accent text-white p-5 rounded-3xl rounded-br-md shadow-premium">
                      <p className="text-sm font-medium italic opacity-80">Mengetik...</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: DISCOVERY (THE SOCIAL NETWORK) --- */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto space-y-24">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Temukan Inspirasi di Setiap Scroll.</h2>
              <p className="text-xl text-muted">Feed yang cerdas, konten yang relevan, dan komunitas yang mendukung hobi dan minat Anda.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Smart Feed", desc: "Algoritma yang memahami apa yang Anda sukai, bukan apa yang ingin dijual pada Anda.", icon: "🧠" },
                { title: "Communities", desc: "Bergabunglah dengan jutaan grup minat dari teknologi hingga seni rupa.", icon: "🌐" },
                { title: "Creators First", desc: "Alat monetisasi transparan untuk Anda yang ingin berkarya secara profesional.", icon: "🎨" }
              ].map((card, i) => (
                <div key={i} className="group p-10 rounded-[2.5rem] bg-surface-dark border border-border-soft hover:bg-white hover:shadow-hover transition-all duration-500">
                  <div className="text-4xl mb-8">{card.icon}</div>
                  <h3 className="text-2xl font-bold mb-4">{card.title}</h3>
                  <p className="text-muted leading-relaxed font-medium">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- SECTION 3: PRIVACY (THE APPLE APPROACH) --- */}
        <section className="py-40 px-6 bg-foreground text-background">
          <div className="max-w-5xl mx-auto text-center space-y-16">
            <div className="space-y-8">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full border-2 border-background/20 flex items-center justify-center text-3xl">🛡️</div>
              </div>
              <h2 className="text-5xl md:text-7xl font-bold tracking-tight">Privasi Anda. <br /> Bukan Komoditas Kami.</h2>
              <p className="text-xl md:text-2xl opacity-60 leading-relaxed font-medium">
                Kami membangun Soplantila dengan filosofi bahwa data Anda adalah milik Anda. Kami tidak menjual data ke pengiklan, dan kami tidak pernah bisa membaca pesan Anda.
              </p>
            </div>
            
            <Link href="/privacy" className="inline-block text-lg font-bold border-b-2 border-background hover:opacity-70 transition-opacity">
              Baca Komitmen Privasi Kami →
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
