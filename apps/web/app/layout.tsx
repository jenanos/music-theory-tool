import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Image from "next/image";
import { AuthProvider } from "./lib/auth-context";
import { Navigation } from "./Navigation";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Gitarist-støtteapp | Akkorder, grep og substitusjoner",
  description:
    "Utforsk diatoniske akkorder, se grep/voicings på gitaren, og få substitusjonsforslag basert på funksjon og delte toner.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no" className="dark">
      <body className={`${outfit.className} bg-transparent text-foreground antialiased min-h-screen relative`} style={{ backgroundColor: '#011315' }}>
        {/* Background Image Layer */}
        <div className="fixed inset-0 -z-50 overflow-hidden">
          <Image
            src="/album-cover.webp"
            alt="Background"
            fill
            className="object-cover scale-110 blur-[8px]"
            priority
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(3, 43, 48, 0.4), rgba(1, 26, 29, 0.8))' }}
          />
        </div>

        <AuthProvider>
          <Navigation />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
