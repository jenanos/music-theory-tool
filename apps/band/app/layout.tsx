import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Band App | Akkorder og setlister",
    description: "Enkel visning av akkorder for bandmedlemmer.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="no">
            <body className={geist.className}>
                <nav className="border-b border-slate-200 bg-white shrink-0">
                    <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-6 py-3">
                        <Link href="/" className="font-semibold text-slate-800">
                            🎸 Band App
                        </Link>
                        <div className="flex gap-4 text-sm">
                            <Link
                                href="/songs"
                                className="text-slate-600 hover:text-indigo-600 hover:underline"
                            >
                                Sanger
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
