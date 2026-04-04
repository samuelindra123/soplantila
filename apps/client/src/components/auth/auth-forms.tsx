"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { registerAction, loginAction } from "@/features/auth/actions";
import { useAuth } from "@/features/auth/context/auth-context";
import { useRouter } from "next/navigation";

import {
  AuthInput,
  EyeIcon,
  EyeOffIcon,
  FieldWrapper,
  FormCard,
  Spinner,
  StatusMessage,
} from "./auth-primitives";

type LoginState = {
  identifier: string;
  password: string;
  remember: boolean;
};

type RegisterState = {
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors<T extends string> = Partial<Record<T, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string) {
  return EMAIL_REGEX.test(email);
}

function getPasswordStrength(password: string) {
  if (!password) return { label: "Kosong", tone: "bg-border-soft", width: "w-0" };
  
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];

  const score = checks.filter(Boolean).length;

  if (score <= 2) {
    return { label: "Lemah", tone: "bg-danger", width: "w-1/3" };
  }

  if (score === 3 || score === 4) {
    return { label: "Cukup", tone: "bg-amber-500", width: "w-2/3" };
  }

  return { label: "Kuat", tone: "bg-success", width: "w-full" };
}

function PasswordField({
  error,
  hint,
  id,
  label,
  onChange,
  placeholder,
  required,
  value,
}: {
  error?: string;
  hint?: string;
  id: string;
  label: string;
  onChange: (nextValue: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <FieldWrapper error={error} hint={hint} id={id} label={label} required={required}>
      <div className="relative">
        <AuthInput
          id={id}
          error={error}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={id.includes("login") ? "current-password" : "new-password"}
          className="pr-12 text-foreground"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button 
            type="button"
            onClick={() => setVisible(!visible)}
            className="p-1 text-muted hover:text-foreground transition-colors outline-none focus:text-foreground"
            aria-label={visible ? "Hide password" : "Show password"}
          >
            {visible ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </FieldWrapper>
  );
}

export function LoginForm() {
  const [form, setForm] = useState<LoginState>({
    identifier: "",
    password: "",
    remember: true,
  });
  const [errors, setErrors] = useState<FieldErrors<keyof LoginState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const { refreshUser } = useAuth();
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    const nextErrors: FieldErrors<keyof LoginState> = {};
    if (!form.identifier.trim()) nextErrors.identifier = "Silakan masukkan email atau username Anda.";
    if (!form.password) nextErrors.password = "Silakan masukkan password Anda.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setFormMessage("Memverifikasi identitas...");

    try {
      const result = await loginAction({
        identifier: form.identifier,
        password: form.password,
      });

      if (result.success) {
        setFormMessage("Berhasil masuk. Mengalihkan...");
        await refreshUser();

        // Redirect based on nextStep
        if (result.nextStep === "COMPLETE_ONBOARDING") {
          router.push("/onboarding");
        } else if (result.nextStep === "DASHBOARD") {
          router.push("/dashboard");
        } else {
          router.push("/verify-otp?email=" + encodeURIComponent(form.identifier));
        }
      } else {
        setFormMessage(result.error || "Gagal masuk. Cek kembali kredensial Anda.");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      setFormMessage(error.message || "Gagal masuk. Cek kembali kredensial Anda.");
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard
      footer={
        <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
          Belum punya akun?{" "}
          <Link href="/register" className="text-foreground hover:opacity-70 transition-all">
            Daftar Sekarang
          </Link>
        </p>
      }
    >
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Selamat Datang</h2>
          <p className="text-[14px] text-muted font-medium leading-relaxed">Masuk ke akun Anda untuk melanjutkan perjalanan.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <FieldWrapper id="login-id" label="Email atau Username" error={errors.identifier}>
            <AuthInput
              id="login-id"
              type="text"
              value={form.identifier}
              autoComplete="username"
              placeholder="name@example.com"
              onChange={(e) => setForm(c => ({ ...c, identifier: e.target.value }))}
              className="text-foreground"
            />
          </FieldWrapper>

          <div className="space-y-2">
            <PasswordField
              id="login-pass"
              label="Password"
              required
              value={form.password}
              error={errors.password}
              placeholder="Masukkan password"
              onChange={(password) => setForm(c => ({ ...c, password }))}
            />
            <div className="flex justify-end">
              <Link href="/forgot-password" title="Lupa Password" className="text-[10px] font-bold text-muted uppercase tracking-widest transition-colors hover:text-accent">
                Lupa Password?
              </Link>
            </div>
          </div>

          {formMessage && (
            <StatusMessage tone={errors.identifier || errors.password || formMessage.includes("Gagal") ? "error" : "neutral"}>
              {formMessage}
            </StatusMessage>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-foreground text-background px-8 text-[13px] font-bold uppercase tracking-[0.15em] transition-all hover:shadow-premium active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            {isSubmitting ? <Spinner /> : null}
            <span className="relative z-10">Masuk</span>
          </button>
        </form>
      </div>
    </FormCard>
  );
}

export function RegisterForm() {
  const [form, setForm] = useState<RegisterState>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FieldErrors<keyof RegisterState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const router = useRouter();

  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormMessage(null);

    const nextErrors: FieldErrors<keyof RegisterState> = {};
    if (!form.email.trim()) nextErrors.email = "Silakan masukkan email Anda.";
    else if (!validateEmail(form.email)) nextErrors.email = "Format email tidak valid.";
    if (!form.password) nextErrors.password = "Silakan buat password.";
    else if (form.password.length < 8) nextErrors.password = "Minimal 8 karakter.";
    if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "Password tidak cocok.";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    setFormMessage("Membuat akun...");
    
    const result = await registerAction(form);
    
    if (result.success) {
      setFormMessage("Akun berhasil dibuat. Mengalihkan ke verifikasi...");
      router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`);
    } else {
      setFormMessage(result.error || "Gagal mendaftar. Silakan coba lagi.");
      setIsSubmitting(false);
    }
  }

  return (
    <FormCard
      footer={
        <p className="text-[11px] font-bold text-muted uppercase tracking-widest">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-foreground hover:opacity-70 transition-all">
            Masuk
          </Link>
        </p>
      }
    >
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Daftar Akun</h2>
          <p className="text-[14px] text-muted font-medium leading-relaxed">Mulai petualangan Anda di Soplantila hari ini.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <FieldWrapper id="reg-email" label="Alamat Email" error={errors.email}>
            <AuthInput
              id="reg-email"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => setForm(c => ({ ...c, email: e.target.value }))}
              className="text-foreground"
            />
          </FieldWrapper>

          <div className="space-y-4">
            <PasswordField
              id="reg-pass"
              label="Password"
              required
              error={errors.password}
              placeholder="Buat password baru"
              value={form.password}
              onChange={(password) => setForm(c => ({ ...c, password }))}
            />
            
            {form.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.1em] text-muted uppercase">Keamanan</span>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                    passwordStrength.label === "Kuat" ? "text-success" : 
                    passwordStrength.label === "Cukup" ? "text-amber-500" : "text-danger"
                  }`}>{passwordStrength.label}</span>
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-surface-dark">
                  <div className={`h-full transition-all duration-700 ease-out ${passwordStrength.width} ${
                    passwordStrength.label === "Kuat" ? "bg-success" : 
                    passwordStrength.label === "Cukup" ? "bg-amber-500" : "bg-danger"
                  }`} />
                </div>
              </div>
            )}
          </div>

          <PasswordField
            id="reg-conf"
            label="Konfirmasi Password"
            required
            error={errors.confirmPassword}
            placeholder="Ulangi password"
            value={form.confirmPassword}
            onChange={(confirmPassword) => setForm(c => ({ ...c, confirmPassword }))}
          />

          <div className="py-2">
            <p className="text-[11px] font-medium leading-relaxed text-muted text-center">
              Dengan mendaftar, Anda menyetujui <Link href="/terms" className="text-foreground hover:underline">Ketentuan Layanan</Link> dan <Link href="/privacy" className="text-foreground hover:underline">Kebijakan Privasi</Link> kami.
            </p>
          </div>

          {formMessage && (
            <StatusMessage tone={Object.keys(errors).length > 0 || formMessage.includes("Gagal") ? "error" : "success"}>
              {formMessage}
            </StatusMessage>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-accent text-white px-8 text-[13px] font-bold uppercase tracking-[0.15em] transition-all shadow-premium hover:shadow-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              {isSubmitting ? <Spinner /> : null}
              <span className="relative z-10">Buat Akun</span>
            </button>
          </div>
        </form>
      </div>
    </FormCard>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError("Silakan masukkan alamat email Anda.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Silakan masukkan email yang valid.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    // Placeholder for forgot password action
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  }

  return (
    <FormCard
      footer={
        <Link href="/login" className="text-[10px] font-bold text-muted uppercase tracking-widest transition-colors hover:text-foreground">
          Kembali ke Login
        </Link>
      }
    >
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Lupa Password</h2>
          <p className="text-[14px] text-muted font-medium leading-relaxed">Masukkan email Anda dan kami akan mengirimkan instruksi pemulihan.</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <FieldWrapper id="reset-email" label="Alamat Email" error={error || undefined}>
            <AuthInput
              id="reset-email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-foreground"
            />
          </FieldWrapper>

          {isSuccess && (
            <StatusMessage tone="success">
              Link reset password telah dikirim ke email Anda.
            </StatusMessage>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-foreground text-background px-8 text-[13px] font-bold uppercase tracking-[0.15em] transition-all hover:shadow-premium active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              {isSubmitting ? <Spinner /> : null}
              <span className="relative z-10">Kirim Link Reset</span>
            </button>
          </div>
        </form>
      </div>
    </FormCard>
  );
}
