
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Song, SongVisibility, GroupInfo } from "./data";
import { SongSelector } from "./components/SongSelector";
import { SongView } from "./components/SongView";
import { CreateSongModal } from "@repo/ui/create-song-modal";
import { useIsMobile } from "@repo/ui/use-mobile";
import { useAuth } from "../lib/auth-context";

type VisibilityFilter = "all" | SongVisibility;

// How long to wait after the last change before persisting. Editing fields
// fires one update per keystroke; without debouncing every keystroke becomes
// a PUT that deletes and recreates all sections.
const SAVE_DEBOUNCE_MS = 800;

export default function ChartsPage() {
    const { user } = useAuth();
    const [songs, setSongs] = useState<Song[]>([]);
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [selectedSongId, setSelectedSongId] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");
    const isMobile = useIsMobile();
    const [showMobileList, setShowMobileList] = useState(true);

    const isAdmin = user?.role === "admin";

    // Per-song bookkeeping for debounced persistence:
    // - lastSaved: the last version the server confirmed (rollback target)
    // - pending: the latest optimistic version awaiting a save
    const lastSavedRef = useRef<Map<string, Song>>(new Map());
    const pendingSavesRef = useRef<Map<string, Song>>(new Map());
    const saveTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
        new Map()
    );

    // Fetch songs and groups from API on mount
    useEffect(() => {
        async function fetchData() {
            try {
                const [songsRes, groupsRes] = await Promise.all([
                    fetch("/api/songs"),
                    fetch("/api/groups"),
                ]);
                if (!songsRes.ok) throw new Error("Failed to fetch songs");
                const songsData: Song[] = await songsRes.json();
                setSongs(songsData);
                setSelectedSongId((prev) => prev ?? songsData[0]?.id);
                songsData.forEach((song) =>
                    lastSavedRef.current.set(song.id, song)
                );

                if (groupsRes.ok) {
                    setGroups(await groupsRes.json());
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    // Flush any pending saves when the page is being left (navigation, reload,
    // tab close) or the component unmounts. keepalive lets the request outlive
    // the page so mid-flight saves are not aborted and truncated.
    useEffect(() => {
        const flushPendingSaves = () => {
            saveTimersRef.current.forEach((timer) => clearTimeout(timer));
            saveTimersRef.current.clear();
            for (const song of pendingSavesRef.current.values()) {
                fetch(`/api/songs/${song.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(song),
                    keepalive: true,
                }).catch(() => {
                    // The page is going away; nothing sensible to do here.
                });
            }
            pendingSavesRef.current.clear();
        };

        window.addEventListener("pagehide", flushPendingSaves);
        return () => {
            window.removeEventListener("pagehide", flushPendingSaves);
            flushPendingSaves();
        };
    }, []);

    // Filter songs based on visibility
    const filteredSongs =
        visibilityFilter === "all"
            ? songs
            : songs.filter((s) => s.visibility === visibilityFilter);

    const selectedSong = songs.find((s) => s.id === selectedSongId);

    // Mirrors the server's write rules (canAccessSong with requireWrite):
    // admins and owners may edit everything; group songs may be edited by
    // group members; shared songs are read-only for everyone else.
    const canEditSong = (song: Song): boolean => {
        if (!user) return false;
        if (isAdmin) return true;
        if (song.userId === user.id) return true;
        if (song.visibility === "group" && song.groupId) {
            const group = groups.find((g) => g.id === song.groupId);
            return Boolean(
                group?.members?.some((m) => m.userId === user.id)
            );
        }
        return false;
    };

    const handleSelectSong = (songId: string) => {
        setSelectedSongId(songId);
        if (isMobile) {
            setShowMobileList(false);
        }
    };

    const persistSong = useCallback(async (songToSave: Song) => {
        pendingSavesRef.current.delete(songToSave.id);
        try {
            const response = await fetch(`/api/songs/${songToSave.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(songToSave),
                keepalive: true,
            });

            if (!response.ok) {
                throw new Error(
                    response.status === 403
                        ? "Du har ikke tilgang til å endre denne låten."
                        : "Failed to update song"
                );
            }
            lastSavedRef.current.set(songToSave.id, songToSave);
            setSaveError(null);
        } catch (err) {
            console.error("Error updating song:", err);
            // Roll back to the last server-confirmed version, but only if no
            // newer edit has replaced our optimistic state. A later save is
            // built on top of this state and sends the whole song document,
            // so if it succeeded the server already has everything.
            setSongs((prev) =>
                prev.map((s) => {
                    if (s.id !== songToSave.id || s !== songToSave) return s;
                    return lastSavedRef.current.get(songToSave.id) ?? s;
                })
            );
            setSaveError(
                err instanceof Error && err.message.startsWith("Du har ikke")
                    ? err.message
                    : "Kunne ikke lagre endringene. Prøv igjen."
            );
        }
    }, []);

    const handleUpdateSong = (updatedSong: Song) => {
        // Optimistic update right away, debounced persistence afterwards.
        setSongs((prevSongs) =>
            prevSongs.map((s) => (s.id === updatedSong.id ? updatedSong : s))
        );

        pendingSavesRef.current.set(updatedSong.id, updatedSong);
        const timers = saveTimersRef.current;
        const existingTimer = timers.get(updatedSong.id);
        if (existingTimer) clearTimeout(existingTimer);
        timers.set(
            updatedSong.id,
            setTimeout(() => {
                timers.delete(updatedSong.id);
                const pending = pendingSavesRef.current.get(updatedSong.id);
                if (pending) persistSong(pending);
            }, SAVE_DEBOUNCE_MS)
        );
    };

    const handleCreateSong = async (data: {
        id?: string;
        title: string;
        artist?: string;
        key?: string;
        notes?: string;
        arrangement?: string[];
        sections?: {
            id: string;
            label: string;
            chordLines: string[];
            degreeLines: string[];
            notes?: string;
        }[];
        visibility?: SongVisibility;
        groupId?: string | null;
    }) => {
        const response = await fetch("/api/songs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            throw new Error("Failed to create song");
        }

        const result = await response.json();

        if (result.success && result.id) {
            const newSong: Song = {
                id: result.id,
                title: data.title,
                artist: data.artist,
                key: data.key,
                notes: data.notes,
                sections: data.sections ?? [],
                arrangement: data.arrangement ?? [],
                visibility: data.visibility ?? "private",
                userId: user!.id,
                groupId: data.groupId ?? null,
            };

            setSongs((prev) => [...prev, newSong]);
            setSelectedSongId(result.id);
            lastSavedRef.current.set(newSong.id, newSong);
        }
    };

    const handleDeleteSong = async (songId: string) => {
        // Drop any pending save for the song being deleted.
        const timer = saveTimersRef.current.get(songId);
        if (timer) clearTimeout(timer);
        saveTimersRef.current.delete(songId);
        pendingSavesRef.current.delete(songId);

        const response = await fetch(`/api/songs/${songId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Failed to delete song");
        }

        lastSavedRef.current.delete(songId);

        setSongs((prevSongs) => {
            const updatedSongs = prevSongs.filter((song) => song.id !== songId);

            setSelectedSongId((currentSelectedSongId) => {
                if (currentSelectedSongId !== songId) {
                    return currentSelectedSongId;
                }

                return updatedSongs[0]?.id;
            });

            return updatedSongs;
        });
    };

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
                    <span className="text-sm text-muted-foreground">Laster sanger...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-background">
                <div className="rounded-lg border border-destructive/40 bg-destructive/15 p-6 text-center">
                    <p className="text-destructive">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
                    >
                        Prøv igjen
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full overflow-hidden bg-background relative">
            {saveError && (
                <div className="absolute left-1/2 top-3 z-[60] flex max-w-[90%] -translate-x-1/2 items-center gap-3 rounded-md border border-destructive/40 bg-destructive/15 px-4 py-2 text-sm text-destructive shadow-md backdrop-blur-sm">
                    <span>{saveError}</span>
                    <button
                        onClick={() => setSaveError(null)}
                        className="rounded p-0.5 hover:bg-destructive/20"
                        aria-label="Lukk feilmelding"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                        </svg>
                    </button>
                </div>
            )}
            <CreateSongModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateSong}
                groups={groups}
            />

            {/* Mobile: show list OR view; Desktop: show both side-by-side */}
            {(!isMobile || showMobileList) && (
                <SongSelector
                    songs={filteredSongs}
                    onSelectSong={handleSelectSong}
                    selectedSongId={selectedSongId}
                    onAddSong={() => setIsCreateModalOpen(true)}
                    onDeleteSong={handleDeleteSong}
                    isMobile={isMobile}
                    visibilityFilter={visibilityFilter}
                    onVisibilityFilterChange={setVisibilityFilter}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                />
            )}
            {(!isMobile || !showMobileList) && (
                <div className="flex-1 overflow-hidden">
                    {selectedSong ? (
                        <SongView
                            key={selectedSong.id}
                            song={selectedSong}
                            canEdit={canEditSong(selectedSong)}
                            onChange={handleUpdateSong}
                            onBackToList={isMobile ? () => setShowMobileList(true) : undefined}
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground px-4 text-center">
                            {isMobile ? (
                                <button
                                    onClick={() => setShowMobileList(true)}
                                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                                >
                                    Velg en låt
                                </button>
                            ) : (
                                "Velg en låt fra listen til venstre for å begynne."
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
