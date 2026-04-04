import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/auth-forms";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Register | Client",
  description: "Buat account baru di Client untuk memulai pengalaman produk Anda.",
};

export default function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
