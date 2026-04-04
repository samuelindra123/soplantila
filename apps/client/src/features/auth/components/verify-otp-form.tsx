"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyOtpAction, resendOtpAction } from "@/features/auth/actions";
import { useAuth } from "@/features/auth/context/auth-context";
import { FormCard, AuthInput, FieldWrapper, StatusMessage, Spinner } from "@/components/auth/auth-primitives";

function VerifyOtpFormInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  
  const email = searchParams.get("email") || "";
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "neutral" | "success" | "error" } | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      router.replace("/register");
    }
  }, [email, router]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      setMessage({ text: "Masukkan 6 digit kode OTP.", tone: "error" });
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: "Memverifikasi kode...", tone: "neutral" });

    const result = await verifyOtpAction(email, otp);
    
    if (result.success) {
      setMessage({ text: "Email berhasil diverifikasi!", tone: "success" });
      await refreshUser();
    } else {
      setMessage({ text: result.error || "Kode OTP tidak valid atau kadaluwarsa.", tone: "error" });
      setIsSubmitting(false);
    }
  }

  async function handleResend() {
    if (countdown > 0 || isResending) return;

    setIsResending(true);
    const result = await resendOtpAction(email);
    
    if (result.success) {
      setMessage({ text: "Kode baru telah dikirim ke email Anda.", tone: "success" });
      setCountdown(60);
    } else {
      setMessage({ text: result.error || "Gagal mengirim ulang kode.", tone: "error" });
    }
    setIsResending(false);
  }

  return (
    <FormCard>
      <div className="space-y-8">
        <div className="space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Verifikasi Email</h2>
          <p className="text-[14px] text-muted font-medium leading-relaxed">
            Kami telah mengirimkan kode 6-digit ke <span className="text-foreground font-bold">{email}</span>.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <FieldWrapper id="otp" label="Kode OTP">
            <AuthInput
              id="otp"
              type="text"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-[0.5em] font-bold text-foreground"
              autoFocus
            />
          </FieldWrapper>

          {message && (
            <StatusMessage tone={message.tone}>
              {message.text}
            </StatusMessage>
          )}

          <button
            type="submit"
            disabled={isSubmitting || otp.length !== 6}
            className="group relative flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-foreground text-background px-8 text-[13px] font-bold uppercase tracking-[0.15em] transition-all hover:shadow-premium active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
          >
            {isSubmitting ? <Spinner /> : null}
            <span className="relative z-10">Verifikasi</span>
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className="text-[10px] font-bold text-muted uppercase tracking-widest hover:text-accent transition-colors disabled:opacity-50"
            >
              {countdown > 0 ? `Kirim ulang dalam ${countdown}s` : "Kirim Ulang Kode"}
            </button>
          </div>
        </form>
      </div>
    </FormCard>
  );
}

export function VerifyOtpForm() {
  return (
    <Suspense fallback={<div className="flex justify-center p-12"><Spinner /></div>}>
      <VerifyOtpFormInner />
    </Suspense>
  );
}
