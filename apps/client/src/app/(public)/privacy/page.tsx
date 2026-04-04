import { InfoLayout } from "@/components/info-layout";

export default function PrivacyPage() {
  return (
    <InfoLayout
      title="Privacy"
      subtitle="Your Data. Your Control. Our Promise."
    >
      <section className="space-y-16">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">Privacy Policy</h2>
          <p className="text-lg leading-relaxed text-muted">
            Di Soplantila, privasi bukan sekadar fitur—itu adalah <span className="text-accent font-bold">fondasi</span> dari semua yang kami bangun. Kami menggunakan enkripsi end-to-end (E2EE) secara default untuk semua percakapan dan panggilan.
          </p>
        </div>

        <div className="space-y-6">
          {[
            {
              title: "Zero Logging",
              desc: "Kami tidak menyimpan log aktivitas atau metadata percakapan Anda. Semua komunikasi bersifat ephemeral dan tidak dapat direkonstruksi.",
              icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
              gradient: "bg-accent"
            },
            {
              title: "End-to-End Encryption",
              desc: "Data Anda dienkripsi di perangkat Anda sebelum dikirim. Bahkan kami tidak dapat membaca pesan Anda. Protocol Signal modern.",
              icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
              gradient: "bg-foreground"
            },
            {
              title: "Full Transparency",
              desc: "Anda memiliki hak penuh untuk mengaudit dan menghapus semua data Anda kapan saja. Download arsip lengkap dalam satu klik.",
              icon: <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
              gradient: "bg-accent"
            }
          ].map((item, i) => (
            <div key={i} className="group relative p-10 rounded-[2.5rem] bg-surface-dark border border-border-soft hover:bg-background hover:shadow-hover transition-all duration-700 overflow-hidden">
              <div className="flex flex-col md:flex-row items-start gap-8">
                <div className={`shrink-0 h-14 w-14 rounded-2xl ${item.gradient} flex items-center justify-center shadow-premium group-hover:scale-110 transition-transform duration-500`}>
                  <div className="text-white">
                    {item.icon}
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  <h3 className="text-xl font-bold uppercase tracking-tight">{item.title}</h3>
                  <p className="text-muted text-base leading-relaxed font-medium">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Privacy Features */}
        <div className="mt-16 p-10 rounded-[2.5rem] border border-success/20 bg-success/5 shadow-premium">
          <div className="flex items-start gap-6">
            <div className="shrink-0 mt-1">
              <div className="h-3 w-3 rounded-full bg-success shadow-[0_0_15px_rgba(52,211,153,0.8)] animate-pulse" />
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-success uppercase tracking-tight">GDPR & CCPA Compliant</h3>
              <p className="text-muted leading-relaxed font-medium text-sm">Soplantila sepenuhnya mematuhi regulasi privasi internasional termasuk GDPR (Eropa) dan CCPA (California). Kami melakukan audit keamanan rutin oleh pihak ketiga independen.</p>
            </div>
          </div>
        </div>
      </section>
    </InfoLayout>
  );
}
