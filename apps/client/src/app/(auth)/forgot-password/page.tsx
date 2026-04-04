import type { Metadata } from "next";

import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Forgot Password | Client",
  description: "Pulihkan akses account Client Anda dengan mengirim reset link ke email terdaftar.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  );
}
