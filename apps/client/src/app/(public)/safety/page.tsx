import { InfoLayout } from "@/components/info-layout";

export default function SafetyPage() {
  return (
    <InfoLayout
      title="Safety"
      subtitle="Building a Better, Safer Digital Space."
    >
      <section className="space-y-16">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Safety Center</h2>
          <p className="text-lg leading-relaxed text-muted font-medium">
            Keamanan komunitas kami adalah <span className="text-danger font-bold">prioritas utama</span>. Kami menggabungkan moderasi berbasis AI dengan kontrol pengguna yang kuat untuk memastikan Soplantila tetap menjadi tempat yang positif dan aman untuk semua.
          </p>
        </div>

        {/* Main Safety Features */}
        <div className="relative p-10 md:p-12 rounded-[2.5rem] bg-surface-dark border border-border-soft overflow-hidden shadow-premium">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center shadow-premium">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-2xl font-bold uppercase tracking-tight">User Controls</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Block & Report", desc: "Tangani malicious actors secara instant dengan sistem reporting 24/7.", icon: "🛡️" },
                { title: "Custom Filters", desc: "Atur filter otomatis untuk pesan masuk dengan keyword detection.", icon: "⚙️" },
                { title: "Privacy Modes", desc: "Aktifkan disappearing messages dan anonymous browsing.", icon: "👻" },
                { title: "AI Moderation", desc: "Machine learning otomatis mendeteksi spam dan konten berbahaya.", icon: "🤖" }
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-6 rounded-3xl bg-background border border-border-soft hover:shadow-hover transition-all duration-500">
                  <span className="shrink-0 text-2xl">{item.icon}</span>
                  <div className="space-y-1">
                    <h4 className="font-bold text-sm uppercase tracking-tight">{item.title}</h4>
                    <p className="text-xs text-muted font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Additional Safety Cards */}
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="group p-10 rounded-[2.5rem] bg-surface-dark border border-border-soft hover:bg-background hover:shadow-hover transition-all duration-700">
            <div className="space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-danger flex items-center justify-center shadow-premium group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-bold uppercase tracking-tight mb-3">Content Moderation</h4>
                <p className="text-muted leading-relaxed font-medium text-sm">Tim moderasi global kami bekerja 24/7 dengan dukungan AI untuk meninjau konten yang dilaporkan dalam hitungan menit.</p>
              </div>
            </div>
          </div>

          <div className="group p-10 rounded-[2.5rem] bg-surface-dark border border-border-soft hover:bg-background hover:shadow-hover transition-all duration-700">
            <div className="space-y-6">
              <div className="h-12 w-12 rounded-2xl bg-foreground flex items-center justify-center shadow-premium group-hover:scale-110 transition-transform">
                <svg className="h-6 w-6 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <div>
                <h4 className="text-xl font-bold uppercase tracking-tight mb-3">Parental Controls</h4>
                <p className="text-muted leading-relaxed font-medium text-sm">Fitur kontrol orang tua yang komprehensif untuk melindungi pengguna muda dengan batasan konten dan waktu penggunaan.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Support */}
        <div className="p-10 rounded-[2.5rem] border-2 border-danger/20 bg-danger/5 shadow-premium animate-reveal">
          <div className="flex items-start gap-6">
            <div className="shrink-0 mt-1">
              <div className="h-3 w-3 rounded-full bg-danger shadow-[0_0_15px_rgba(248,113,113,0.8)] animate-pulse" />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-danger uppercase tracking-tight">Emergency Support</h3>
              <p className="text-muted leading-relaxed font-medium">Jika Anda mengalami ancaman atau bahaya, hubungi tim darurat kami melalui tombol SOS di aplikasi. Tersedia 24/7 dalam 50+ bahasa.</p>
            </div>
          </div>
        </div>
      </section>
    </InfoLayout>
  );
}
