import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeToggle } from "./components/ThemeToggle";

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
        <html lang="no" suppressHydrationWarning>
            <body className={geist.className}>
                <ThemeProvider>
                    <nav className="border-b border-border bg-card shrink-0">
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
