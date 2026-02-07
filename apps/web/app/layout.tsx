import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });

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
      <body className={geist.className}>
        <nav className="border-b border-border bg-card shrink-0">
          <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-6 py-3">
            <Link href="/" className="font-semibold text-foreground">
              🎸 Gitarist-støtteapp
            </Link>
            <div className="flex gap-4 text-sm">
              <Link
                href="/"
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                Akkorder
              </Link>
              <Link
                href="/progressions"
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                Progresjoner
              </Link>
              <Link
                href="/charts"
                className="text-muted-foreground hover:text-primary hover:underline"
              >
                Blekker
              </Link>
            </div>
          </div>
        </nav>
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
