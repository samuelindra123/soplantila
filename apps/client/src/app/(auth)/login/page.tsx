import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Login | Client",
  description: "Masuk ke account Anda untuk melanjutkan ke workspace Client.",
};

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
