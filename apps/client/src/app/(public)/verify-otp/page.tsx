import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyOtpForm } from "@/features/auth/components/verify-otp-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verifikasi OTP | Soplantila",
  description: "Verifikasi email Anda untuk melanjutkan pendaftaran.",
};

export default function VerifyOtpPage() {
  return (
    <AuthShell>
      <VerifyOtpForm />
    </AuthShell>
  );
}
