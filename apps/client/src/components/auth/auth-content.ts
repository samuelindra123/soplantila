export type AuthHeroMetric = {
  label: string;
  value: string;
};

export type AuthHeroQuote = {
  body: string;
  author: string;
  role: string;
};

export type AuthShellContent = {
  eyebrow: string;
  title: string;
  description: string;
  bulletPoints: string[];
  metrics: AuthHeroMetric[];
  quote: AuthHeroQuote;
};

export const authShellContent: Record<"login" | "register" | "forgot-password", AuthShellContent> = {
  login: {
    eyebrow: "Welcome back",
    title: "Kembali ke ruang kerja yang tenang dan terfokus.",
    description:
      "Akses ekosistem kolaborasi Anda dengan keamanan tingkat tinggi dan pengalaman tanpa hambatan.",
    bulletPoints: [
      "Integrasi session yang aman dan terenkripsi.",
      "Optimasi antarmuka untuk kecepatan akses maksimal.",
      "Proteksi privasi data standar industri global.",
    ],
    metrics: [
      { label: "Uptime Rate", value: "99.99%" },
      { label: "Auth Speed", value: "< 1.2s" },
      { label: "Active Users", value: "850k+" },
    ],
    quote: {
      body: "Platform ini memberikan keseimbangan sempurna antara keamanan yang ketat dan kemudahan penggunaan yang luar biasa.",
      author: "Adrian Zuse",
      role: "CTO at Nexus Corp",
    },
  },
  register: {
    eyebrow: "Start Journey",
    title: "Bangun masa depan produk Anda mulai hari ini.",
    description:
      "Bergabunglah dengan komunitas inovator global dan rasakan standar baru dalam manajemen workflow tim.",
    bulletPoints: [
      "Onboarding yang dipersonalisasi untuk kebutuhan Anda.",
      "Akses instan ke semua fitur premium selama masa trial.",
      "Dukungan prioritas untuk setup infrastruktur tim.",
    ],
    metrics: [
      { label: "Global Nodes", value: "120+" },
      { label: "Security Layers", value: "5 Levels" },
      { label: "Support", value: "24/7" },
    ],
    quote: {
      body: "Proses pendaftaran yang sangat mulus. Saya bisa langsung fokus pada pekerjaan dalam hitungan menit.",
      author: "Sarah Jenkins",
      role: "Product Lead at FlowState",
    },
  },
  "forgot-password": {
    eyebrow: "Account Recovery",
    title: "Kami akan membantu Anda memulihkan akses.",
    description:
      "Prosedur pemulihan akun yang aman, cepat, dan transparan untuk memastikan data Anda tetap terlindungi.",
    bulletPoints: [
      "Verifikasi identitas berlapis untuk keamanan maksimal.",
      "Proses reset password yang instan dan terpandu.",
      "Notifikasi keamanan otomatis ke perangkat terdaftar.",
    ],
    metrics: [
      { label: "Recovery Rate", value: "98.5%" },
      { label: "Avg. Time", value: "2 Mins" },
      { label: "Security", value: "AES-256" },
    ],
    quote: {
      body: "Sistem pemulihan yang sangat handal. Memberikan rasa aman bahkan dalam situasi yang paling mendesak.",
      author: "Michael Chen",
      role: "Security Analyst",
    },
  },
};
