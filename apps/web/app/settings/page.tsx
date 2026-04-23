"use client";

import { useEffect, useState } from "react";
import { useAuth, ALL_PAGES } from "../lib/auth-context";
import type { PageId } from "../lib/auth-context";

interface GroupSummary {
    id: string;
    name: string;
    enabledPages: PageId[];
    role: string;
}

export default function SettingsPage() {
    const { user, isLoading, enabledPages } = useAuth();
    const [groups, setGroups] = useState<GroupSummary[]>([]);
    const [groupsLoaded, setGroupsLoaded] = useState(false);

    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const res = await fetch("/api/groups");
                if (res.ok) {
                    const data = (await res.json()) as {
                        id: string;
                        name: string;
                        enabledPages: PageId[];
                        members: { userId: string; role: string }[];
                    }[];
                    setGroups(
                        data.map((g) => ({
                            id: g.id,
                            name: g.name,
                            enabledPages: g.enabledPages,
                            role:
                                g.members.find((m) => m.userId === user.id)?.role ?? "member",
                        }))
                    );
                }
            } finally {
                setGroupsLoaded(true);
            }
        })();
    }, [user]);

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

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Innstillinger</h1>
            <p className="text-muted-foreground mb-8">
                Oversikt over kontoen din og tilgangene dine.
            </p>

            {/* User info */}
            <section className="rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
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

            {/* Access summary */}
            <section className="mt-6 rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-1">
                    Sider du har tilgang til
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                    {isAdmin
                        ? "Som administrator har du tilgang til alle sider."
                        : "Tilgangene dine er summen av hva gruppene dine åpner for."}
                </p>

                <div className="flex flex-wrap gap-2">
                    {ALL_PAGES.map((page) => {
                        const isEnabled = isAdmin || enabledPages.includes(page.id);
                        return (
                            <span
                                key={page.id}
                                className={`rounded-full border px-3 py-1 text-xs ${
                                    isEnabled
                                        ? "border-primary bg-primary/15 text-primary"
                                        : "border-border bg-card text-muted-foreground"
                                }`}
                            >
                                {page.label}
                            </span>
                        );
                    })}
                </div>

                {!isAdmin && enabledPages.length === 0 && groupsLoaded && (
                    <p className="mt-4 text-sm text-muted-foreground">
                        Du er ikke med i noen grupper som har åpnet sider enda. Kontakt
                        administrator for tilgang.
                    </p>
                )}
            </section>

            {/* Groups */}
            <section className="mt-6 rounded-xl border border-border bg-card/60 backdrop-blur-xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4">
                    Grupper
                </h2>
                {!groupsLoaded ? (
                    <p className="text-sm text-muted-foreground">Laster...</p>
                ) : groups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        Du er ikke medlem av noen grupper.
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {groups.map((group) => (
                            <li
                                key={group.id}
                                className="rounded-lg border border-border bg-card/40 p-4"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-medium text-foreground">
                                        {group.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground capitalize">
                                        {group.role}
                                    </span>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                    {group.enabledPages.length === 0 ? (
                                        <span className="text-xs text-muted-foreground">
                                            Ingen sider aktivert
                                        </span>
                                    ) : (
                                        group.enabledPages.map((pageId) => {
                                            const page = ALL_PAGES.find(
                                                (p) => p.id === pageId
                                            );
                                            return (
                                                <span
                                                    key={pageId}
                                                    className="rounded-full border border-border bg-card/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                                                >
                                                    {page?.label ?? pageId}
                                                </span>
                                            );
                                        })
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
