"use client";

import { useState } from "react";
import { useAuth, ALL_PAGES } from "../lib/auth-context";
import type { PageId } from "../lib/auth-context";

export default function SettingsPage() {
  const { user, isLoading, enabledPages, updateEnabledPages } = useAuth();
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <span className="text-sm text-muted-foreground">Laster...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.role === "admin";

  const handleTogglePage = async (pageId: PageId) => {
    // "charts" is always enabled and cannot be disabled
    if (pageId === "charts") return;

    setSaving(true);
    try {
      const newPages = enabledPages.includes(pageId)
        ? enabledPages.filter((p) => p !== pageId)
        : [...enabledPages, pageId];
      await updateEnabledPages(newPages);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <h1 className="text-2xl font-bold text-foreground mb-2">Innstillinger</h1>
      <p className="text-muted-foreground mb-8">
        Tilpass appen etter dine behov.
      </p>

      {/* Page visibility settings */}
      <section className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-1">
          Synlige sider
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Velg hvilke sider du ønsker å se i navigasjonen.
          {isAdmin && (
            <span className="block mt-1 text-xs text-primary">
              Som administrator har du alltid tilgang til alle sider.
            </span>
          )}
        </p>

        <div className="space-y-3">
          {ALL_PAGES.map((page) => {
            const isEnabled = isAdmin || enabledPages.includes(page.id);
            const isRequired = page.id === "charts";
            const isDisabled = isAdmin || isRequired || saving;

            return (
              <label
                key={page.id}
                className={`flex items-center justify-between rounded-lg border p-4 transition-colors ${
                  isEnabled
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card/40"
                } ${isDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}`}
              >
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {page.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {page.path}
                    {isRequired && " (alltid aktiv)"}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    disabled={isDisabled}
                    onChange={() => handleTogglePage(page.id)}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-11 h-6 rounded-full transition-colors ${
                      isEnabled ? "bg-primary" : "bg-muted"
                    } ${isDisabled ? "" : "peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50"}`}
                  />
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* User info section */}
      <section className="mt-6 rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Brukerinfo
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">E-post</span>
            <span className="text-foreground">{user.email}</span>
          </div>
          {user.name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Navn</span>
              <span className="text-foreground">{user.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Rolle</span>
            <span className="text-foreground capitalize">{user.role}</span>
          </div>
        </div>
      </section>
    </div>
  );
}
