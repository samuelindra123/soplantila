import type { Metadata } from "next";
import "./globals.css";
import "plyr/dist/plyr.css";
import { AuthProvider } from "@/features/auth/context/auth-context";
import { getSessionUser } from "@/lib/server/session";

export const metadata: Metadata = {
  title: {
    default: "Soplantila | Next-Gen Communication Platform",
    template: "%s | Soplantila",
  },
  description: "Platform komunikasi global yang mengedepankan keamanan, kecepatan, dan estetika premium.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const sessionUser = await getSessionUser();

  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Apply system theme to html ONLY if not in a themed wrapper
                // This enables dark mode for public pages based on system preference
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  document.documentElement.classList.add('dark-system');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <AuthProvider
          initialUser={sessionUser}
          initialNextStep={sessionUser?.nextStep ?? null}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
