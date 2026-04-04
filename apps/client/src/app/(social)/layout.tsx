import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/theme-provider";

export default function SocialLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ThemeProvider defaultTheme="system">
      {children}
    </ThemeProvider>
  );
}
