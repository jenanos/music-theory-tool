"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth, ALL_PAGES } from "./lib/auth-context";

export function Navigation() {
  const { user, isLoading, logout, isPageEnabled } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleResize = () => {
      if (window.innerWidth >= 768) setIsMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMenuOpen]);

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

  const firstEnabled = ALL_PAGES.find((p) => isPageEnabled(p.id));
  const homeHref = firstEnabled?.path ?? "/charts";

  const enabledLinks = ALL_PAGES.filter((page) => isPageEnabled(page.id));

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="border-b border-white/10 bg-card/60 backdrop-blur-xl shrink-0 relative z-40">
      <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between gap-2 px-3 py-2 md:px-6 md:py-3">
        <Link
          href={homeHref}
          onClick={closeMenu}
          className="font-semibold text-foreground text-sm md:text-base truncate min-w-0"
        >
          🎸 Gitarist-støtteapp
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4 text-sm">
          {enabledLinks.map((page) => (
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

        {/* Mobile hamburger button */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label={isMenuOpen ? "Lukk meny" : "Åpne meny"}
          aria-expanded={isMenuOpen}
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-foreground hover:bg-muted shrink-0"
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile menu panel */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-card/95 backdrop-blur-xl shadow-lg">
          <div className="flex flex-col px-3 py-2 text-sm">
            {enabledLinks.map((page) => (
              <Link
                key={page.id}
                href={page.path}
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-foreground hover:bg-muted"
              >
                {page.label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/groups"
                onClick={closeMenu}
                className="rounded-md px-3 py-2 text-foreground hover:bg-muted"
              >
                Grupper
              </Link>
            )}
            <Link
              href="/settings"
              onClick={closeMenu}
              className="rounded-md px-3 py-2 text-foreground hover:bg-muted"
            >
              Innstillinger
            </Link>
            <button
              onClick={() => {
                closeMenu();
                logout();
              }}
              className="rounded-md px-3 py-2 text-left text-destructive hover:bg-muted"
              title={`Logget inn som ${user.name || user.email}`}
            >
              Logg ut
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
