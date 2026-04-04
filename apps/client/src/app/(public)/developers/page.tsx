import { InfoLayout } from "@/components/info-layout";

export default function DevelopersPage() {
  return (
    <InfoLayout
      title="Developers"
      subtitle="The Infrastructure for Your Next Great Idea."
    >
      <section className="space-y-16">
        <div className="space-y-6">
          <h2 className="text-2xl font-bold uppercase tracking-tight">API & SDK</h2>
          <p className="text-lg leading-relaxed text-muted font-medium">
            Integrasikan kekuatan Soplantila ke dalam aplikasi Anda. API kami yang powerful dan SDK yang mudah digunakan memungkinkan Anda membangun fitur chat dan sosial dengan <span className="text-accent font-bold">skalabilitas global</span> dalam hitungan menit.
          </p>
        </div>

        {/* Premium Code Example */}
        <div className="relative group">
          <div className="relative bg-foreground rounded-[2.5rem] p-8 md:p-12 shadow-premium overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-background/10">
              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-background/20"></div>
                  <div className="h-3 w-3 rounded-full bg-background/20"></div>
                  <div className="h-3 w-3 rounded-full bg-background/20"></div>
                </div>
                <span className="text-background/40 text-xs font-mono tracking-widest uppercase ml-4">quick-start.sh</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/10 border border-background/5">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"></div>
                <span className="text-[10px] text-background/60 font-bold tracking-widest uppercase">Live</span>
              </div>
            </div>

            {/* Code Content */}
            <div className="font-mono text-sm overflow-x-auto space-y-4">
               <div className="flex gap-6">
                <span className="text-background/20 select-none">1</span>
                <span className="text-background/40"># Install the Soplantila CLI</span>
              </div>
              <div className="flex gap-6">
                <span className="text-background/20 select-none">2</span>
                <div className="text-background">
                  <span className="opacity-60">curl -sSL</span> https://api.soplantila.com/install <span className="opacity-60">| sh</span>
                </div>
              </div>
              <div className="flex gap-6">
                <span className="text-background/20 select-none">3</span>
                <span className="text-background/40"># Initialize your node</span>
              </div>
              <div className="flex gap-6">
                <span className="text-background/20 select-none">4</span>
                <div className="text-background">
                  soplantila init <span className="text-accent font-bold">my-social-app</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SDK Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "Real-time SDK", desc: "WebSocket & SSE", icon: "⚡" },
            { title: "REST API", desc: "10K req/min limit", icon: "🔌" },
            { title: "GraphQL", desc: "Flexible queries", icon: "📊" },
            { title: "Webhooks", desc: "Event-driven", icon: "🔗" },
            { title: "TypeScript", desc: "Full type safety", icon: "📘" },
            { title: "Analytics", desc: "Built-in metrics", icon: "📈" }
          ].map((feature, i) => (
            <div key={i} className="group p-8 rounded-3xl border border-border-soft bg-surface-dark hover:bg-background hover:shadow-hover transition-all duration-500">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-background border border-border-soft flex items-center justify-center text-xl shadow-premium group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-base font-bold uppercase tracking-tight">{feature.title}</h4>
                  <p className="text-xs text-muted font-medium mt-1">{feature.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Documentation Link */}
        <div className="mt-8 p-12 rounded-[2.5rem] bg-accent text-white shadow-premium">
          <div className="flex flex-col md:flex-row items-center justify-between gap-10 text-center md:text-left">
            <div className="space-y-3">
              <h3 className="text-3xl font-bold tracking-tighter uppercase">Full Documentation</h3>
              <p className="opacity-80 font-medium max-w-md">Pelajari lebih lanjut dengan guides, tutorials, dan API reference lengkap.</p>
            </div>
            <a href="https://docs.soplantila.com" className="bg-white text-accent px-10 py-5 rounded-full text-sm font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-premium">
              Read Docs
            </a>
          </div>
        </div>
      </section>
    </InfoLayout>
  );
}
