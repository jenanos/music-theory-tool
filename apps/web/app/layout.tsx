import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import Image from "next/image";
import { prisma } from "@repo/db";
import { AuthProvider } from "./lib/auth-context";
import { auth } from "./lib/auth";
import {
  DEFAULT_USER_THEME,
  getThemeRootClass,
  isUserTheme,
} from "./lib/theme";
import { Navigation } from "./Navigation";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Blekke | Akkorder, grep og substitusjoner",
  description:
    "Utforsk diatoniske akkorder, se grep/voicings på gitaren, og få substitusjonsforslag basert på funksjon og delte toner.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const storedTheme = session?.user?.id
    ? (
        await prisma.user.findUnique({
          where: { id: session.user.id },
          select: { theme: true },
        })
      )?.theme
    : null;
  const theme =
    storedTheme && isUserTheme(storedTheme) ? storedTheme : DEFAULT_USER_THEME;

  return (
    <html
      lang="no"
      className={getThemeRootClass(theme)}
      data-theme={theme}
      suppressHydrationWarning
    >
      <body
        className={`${outfit.className} bg-transparent text-foreground antialiased min-h-screen relative`}
      >
        {/* Background Image Layer */}
        <div className="fixed inset-0 -z-50 overflow-hidden">
          <Image
            src="/album-cover.webp"
            alt="Background"
            fill
            className="object-cover scale-110 blur-[8px] transition-opacity duration-300"
            style={{ opacity: "var(--app-background-image-opacity)" }}
            priority
          />
          <div
            className="absolute inset-0"
            style={{ background: "var(--app-background-overlay)" }}
          />
        </div>

        <AuthProvider initialTheme={theme}>
          <Navigation />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
