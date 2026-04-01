"use client";

import Link from "next/link";
import { useAuth, ALL_PAGES } from "./lib/auth-context";

export function Navigation() {
  const { user, isLoading, logout, isPageEnabled } = useAuth();

  if (isLoading) {
    return (
      <nav className="border-b border-white/10 bg-card/60 backdrop-blur-xl shrink-0">
        <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-4 py-2 md:px-6 md:py-3">
          <span className="font-semibold text-foreground text-sm md:text-base">
            🎸 Gitarist-støtteapp
          </span>
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      </nav>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "admin";

  // Determine home link: first enabled page's path
  const firstEnabled = ALL_PAGES.find((p) => isPageEnabled(p.id));
  const homeHref = firstEnabled?.path ?? "/charts";

  return (
    <nav className="border-b border-white/10 bg-card/60 backdrop-blur-xl shrink-0">
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-4 py-2 md:px-6 md:py-3">
        <Link
          href={homeHref}
          className="font-semibold text-foreground text-sm md:text-base"
        >
          🎸 Gitarist-støtteapp
        </Link>
        <div className="flex items-center gap-2 md:gap-4 text-xs md:text-sm">
          {ALL_PAGES.filter((page) => isPageEnabled(page.id)).map((page) => (
            <Link
              key={page.id}
              href={page.path}
              className="text-muted-foreground hover:text-primary hover:underline"
            >
              {page.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              href="/admin/groups"
              className="text-muted-foreground hover:text-primary hover:underline"
            >
              Grupper
            </Link>
          )}
          <Link
            href="/settings"
            className="text-muted-foreground hover:text-primary hover:underline"
          >
            Innstillinger
          </Link>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-destructive hover:underline ml-2"
            title={`Logget inn som ${user.name || user.email}`}
          >
            Logg ut
          </button>
        </div>
      </div>
    </nav>
  );
}
