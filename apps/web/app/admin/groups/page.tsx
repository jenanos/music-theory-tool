"use client";

import { useEffect, useState, useCallback } from "react";

interface GroupMember {
    id: string;
    userId: string;
    role: string;
    name: string | null;
    email: string;
}

interface Group {
    id: string;
    name: string;
    members: GroupMember[];
    songCount: number;
}

export default function AdminGroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newGroupName, setNewGroupName] = useState("");
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [addingMemberToGroupId, setAddingMemberToGroupId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const fetchGroups = useCallback(async () => {
        try {
            const res = await fetch("/api/groups");
            if (!res.ok) throw new Error("Failed to fetch groups");
            setGroups(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ukjent feil");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) return;
        setActionError(null);
        try {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newGroupName.trim() }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Kunne ikke opprette gruppe");
            }
            setNewGroupName("");
            await fetchGroups();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Feil");
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        if (!window.confirm("Slett denne gruppen? Alle gruppemedlemskap fjernes.")) return;
        setActionError(null);
        try {
            const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Kunne ikke slette gruppe");
            await fetchGroups();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Feil");
        }
    };

    const handleAddMember = async (groupId: string) => {
        if (!newMemberEmail.trim()) return;
        setActionError(null);
        try {
            const res = await fetch(`/api/groups/${groupId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newMemberEmail.trim() }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Kunne ikke legge til medlem");
            }
            setNewMemberEmail("");
            setAddingMemberToGroupId(null);
            await fetchGroups();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Feil");
        }
    };

    const handleRemoveMember = async (groupId: string, userId: string) => {
        if (!window.confirm("Fjern dette medlemmet fra gruppen?")) return;
        setActionError(null);
        try {
            const res = await fetch(`/api/groups/${groupId}/members?userId=${userId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Kunne ikke fjerne medlem");
            await fetchGroups();
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Feil");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center">
                <p className="text-destructive">{error}</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-2xl p-6 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Grupper</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Administrer grupper og medlemmer. Blekker kan deles med en gruppe.
                </p>
            </div>

            {actionError && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {actionError}
                </div>
            )}

            {/* Create group */}
            <div className="flex gap-2">
                <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Nytt gruppenavn..."
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateGroup();
                    }}
                />
                <button
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim()}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                    Opprett
                </button>
            </div>

            {/* Groups list */}
            <div className="space-y-4">
                {groups.map((group) => (
                    <div
                        key={group.id}
                        className="rounded-lg border border-border bg-card p-4 space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-foreground">{group.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                    {group.members.length} medlem{group.members.length !== 1 ? "mer" : ""} · {group.songCount} låt{group.songCount !== 1 ? "er" : ""}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDeleteGroup(group.id)}
                                className="rounded p-1.5 text-muted-foreground hover:bg-destructive/15 hover:text-destructive transition-colors"
                                title="Slett gruppe"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 4a2 2 0 012-2h4a2 2 0 012 2h3a1 1 0 110 2h-1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h3zm2-1a1 1 0 00-1 1h6a1 1 0 00-1-1H8zm-2 3v9h8V6H6z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>

                        {/* Members */}
                        <div className="space-y-1">
                            {group.members.map((member) => (
                                <div key={member.id} className="flex items-center justify-between py-1 px-2 rounded text-sm">
                                    <div>
                                        <span className="text-foreground">{member.name || member.email}</span>
                                        {member.name && (
                                            <span className="text-muted-foreground ml-1 text-xs">({member.email})</span>
                                        )}
                                        {member.role === "admin" && (
                                            <span className="ml-2 inline-flex items-center rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                                                admin
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemoveMember(group.id, member.userId)}
                                        className="rounded p-1 text-muted-foreground/70 hover:text-destructive transition-colors"
                                        title="Fjern fra gruppe"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Add member */}
                        {addingMemberToGroupId === group.id ? (
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={newMemberEmail}
                                    onChange={(e) => setNewMemberEmail(e.target.value)}
                                    placeholder="E-postadresse..."
                                    className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleAddMember(group.id);
                                    }}
                                    autoFocus
                                />
                                <button
                                    onClick={() => handleAddMember(group.id)}
                                    disabled={!newMemberEmail.trim()}
                                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                >
                                    Legg til
                                </button>
                                <button
                                    onClick={() => {
                                        setAddingMemberToGroupId(null);
                                        setNewMemberEmail("");
                                    }}
                                    className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Avbryt
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setAddingMemberToGroupId(group.id)}
                                className="text-xs text-primary hover:underline"
                            >
                                + Legg til medlem
                            </button>
                        )}
                    </div>
                ))}
                {groups.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Ingen grupper opprettet ennå.
                    </p>
                )}
            </div>
        </div>
    );
}
