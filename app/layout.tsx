import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider, themeInitScript } from "@/lib/theme/ThemeProvider";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  metadataBase: new URL("https://example.com"),
  title: {
    default: "Backgammon — Play online with real rules",
    template: "%s · Backgammon",
  },
  description:
    "A modern, open-source backgammon web app: real rules engine, AI opponent, real-time online rooms, leaderboard, chat, and profiles.",
  applicationName: "Backgammon",
  manifest: "/manifest.json",
  openGraph: {
    title: "Backgammon — Play online with real rules",
    description:
      "A modern, open-source backgammon web app: real rules engine, AI opponent, real-time online rooms, leaderboard, chat, and profiles.",
    type: "website",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#14100d" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen antialiased transition-colors">
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <ServiceWorkerRegister />
              <Navbar />
              <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
