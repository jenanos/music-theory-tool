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
    <html lang="no">
      <body className={geist.className}>
        <nav className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="font-semibold text-slate-800">
              🎸 Gitarist-støtteapp
            </Link>
            <div className="flex gap-4 text-sm">
              <Link
                href="/"
                className="text-slate-600 hover:text-indigo-600 hover:underline"
              >
                Akkorder
              </Link>
              <Link
                href="/progressions"
                className="text-slate-600 hover:text-indigo-600 hover:underline"
              >
                Progresjoner
              </Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

