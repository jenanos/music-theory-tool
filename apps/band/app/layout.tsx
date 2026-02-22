import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";

const outfit = Outfit({ subsets: ["latin"] });

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
        <html lang="no" suppressHydrationWarning>
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
                            <Link href="/" className="font-semibold text-foreground">
                                🎸 Band App
                            </Link>
                            <div className="flex items-center gap-4 text-sm">
                                <Link
                                    href="/songs"
                                    className="text-muted-foreground hover:text-primary hover:underline"
                                >
                                    Sanger
                                </Link>
                                <ThemeToggle />
                            </div>
                        </div>
                    </nav>
                    <div className="flex-1 overflow-hidden">
                        {children}
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
