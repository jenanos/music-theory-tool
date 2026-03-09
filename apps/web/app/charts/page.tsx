
"use client";

import { useEffect, useState } from "react";
import { Song } from "./data";
import { SongSelector } from "./components/SongSelector";
import { SongView } from "./components/SongView";
import { CreateSongModal } from "@repo/ui/create-song-modal";
import { useIsMobile } from "@repo/ui/use-mobile";

export default function ChartsPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [selectedSongId, setSelectedSongId] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const isMobile = useIsMobile();
    const [showMobileList, setShowMobileList] = useState(true);

    // Fetch songs from API on mount
    useEffect(() => {
        async function fetchSongs() {
            try {
                const response = await fetch("/api/songs");
                if (!response.ok) {
                    throw new Error("Failed to fetch songs");
                }
                const data = await response.json();
                setSongs(data);
                setSelectedSongId((prev) => prev ?? data[0]?.id);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsLoading(false);
            }
        }
        fetchSongs();
    }, []);

    const selectedSong = songs.find((s) => s.id === selectedSongId);

    const handleSelectSong = (songId: string) => {
        setSelectedSongId(songId);
        if (isMobile) {
            setShowMobileList(false);
        }
    };

    const handleUpdateSong = async (updatedSong: Song) => {
        // Optimistic update
        setSongs((prevSongs) =>
            prevSongs.map((s) => (s.id === updatedSong.id ? updatedSong : s))
        );

        // Persist to database
        try {
            const response = await fetch(`/api/songs/${updatedSong.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedSong),
            });

            if (!response.ok) {
                throw new Error("Failed to update song");
            }
        } catch (err) {
            console.error("Error updating song:", err);
            // Optionally: revert optimistic update or show error to user
        }
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
            };

            setSongs((prev) => [...prev, newSong]);
            setSelectedSongId(result.id);
        }
    };

    const handleDeleteSong = async (songId: string) => {
        const response = await fetch(`/api/songs/${songId}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Failed to delete song");
        }

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
            <CreateSongModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSave={handleCreateSong}
            />

            {/* Mobile: show list OR view; Desktop: show both side-by-side */}
            {(!isMobile || showMobileList) && (
                <SongSelector
                    songs={songs}
                    onSelectSong={handleSelectSong}
                    selectedSongId={selectedSongId}
                    onAddSong={() => setIsCreateModalOpen(true)}
                    onDeleteSong={handleDeleteSong}
                    isMobile={isMobile}
                />
            )}
            {(!isMobile || !showMobileList) && (
                <div className="flex-1 overflow-hidden">
                    {selectedSong ? (
                        <SongView
                            key={selectedSong.id}
                            song={selectedSong}
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
