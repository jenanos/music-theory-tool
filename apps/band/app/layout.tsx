import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import Image from "next/image";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Gete | Akkorder og setlister",
    description: "Enkel visning av akkorder for bandmedlemmer.",
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

                <ThemeProvider>
                    <nav className="border-b border-white/5 dark:border-white/10 bg-card/60 backdrop-blur-xl shrink-0">
                        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-6 py-3">
                            <Link href="/" className="font-serif italic font-bold text-xl tracking-wider text-foreground">
                                gete
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
