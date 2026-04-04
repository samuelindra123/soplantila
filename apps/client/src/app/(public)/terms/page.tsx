import { InfoLayout } from "@/components/info-layout";

export default function TermsPage() {
  return (
    <InfoLayout
      title="Terms"
      subtitle="The Rules of the Soplantila Network."
    >
      <section className="space-y-16">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Terms of Service</h2>
          <p className="text-lg leading-relaxed text-muted font-medium">
            Dengan menggunakan Soplantila, Anda menyetujui persyaratan layanan berikut. Kami menjaga agar aturan ini tetap <span className="text-accent font-bold">adil dan transparan</span> untuk semua pengguna di jaringan kami.
          </p>
        </div>

        <div className="grid gap-6">
          {[
            {
              num: "1",
              title: "Acceptable Use",
              desc: "Anda setuju untuk tidak menggunakan platform ini untuk aktivitas ilegal, pelecehan, spam, atau penyebaran konten berbahaya.",
              icon: "🛡️"
            },
            {
              num: "2",
              title: "Account Responsibility",
              desc: "Anda bertanggung jawab penuh atas keamanan kredensial akun dan semua aktivitas yang terjadi di bawah identitas Anda.",
              icon: "🔑"
            },
            {
              num: "3",
              title: "Intellectual Property",
              desc: "Konten yang Anda upload tetap menjadi milik Anda. Anda memberikan kami lisensi untuk menampilkan konten tersebut.",
              icon: "📄"
            },
            {
              num: "4",
              title: "Service Modifications",
              desc: "Kami berhak untuk memodifikasi, menangguhkan, atau menghentikan layanan kapan saja sesuai kebutuhan operasional.",
              icon: "⚙️"
            },
            {
              num: "5",
              title: "Limitation of Liability",
              desc: "Soplantila disediakan \"as is\" tanpa warranty. Kami tidak bertanggung jawab atas kehilangan data atau kerugian lainnya.",
              icon: "⚖️"
            },
            {
              num: "6",
              title: "Dispute Resolution",
              desc: "Segala perselisihan akan diselesaikan melalui arbitrase yang mengikat sesuai dengan hukum yang berlaku.",
              icon: "🤝"
            }
          ].map((term) => (
            <div key={term.num} className="group relative p-8 rounded-[2.5rem] bg-surface-dark border border-border-soft hover:bg-background hover:shadow-hover transition-all duration-700">
              <div className="flex items-start gap-8">
                {/* Number Badge */}
                <div className="shrink-0 h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center font-bold text-xl shadow-premium group-hover:scale-110 transition-transform">
                  {term.num}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{term.icon}</span>
                    <h3 className="text-xl font-bold uppercase tracking-tight">{term.title}</h3>
                  </div>
                  <p className="text-muted leading-relaxed font-medium">{term.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Last Updated Notice */}
        <div className="mt-8 p-8 rounded-3xl border border-border-soft bg-surface-dark text-center shadow-premium">
          <p className="text-xs font-bold text-muted uppercase tracking-widest">
            Last Updated: January 2026 • Version 2.0
          </p>
          <p className="text-xs text-muted/60 mt-2 font-medium">
            Kami akan memberitahu Anda melalui email jika ada perubahan material pada Terms of Service ini.
          </p>
        </div>

        {/* Contact for Questions */}
        <div className="p-12 rounded-[2.5rem] bg-accent text-white shadow-premium text-center space-y-4">
          <h3 className="text-2xl font-bold uppercase tracking-tight">Questions?</h3>
          <p className="opacity-80 font-medium max-w-xl mx-auto">
            Jika Anda memiliki pertanyaan tentang Terms of Service ini, silakan hubungi tim legal kami di{" "}
            <a href="mailto:legal@soplantila.com" className="underline font-bold">
              legal@soplantila.com
            </a>
          </p>
        </div>
      </section>
    </InfoLayout>
  );
}
