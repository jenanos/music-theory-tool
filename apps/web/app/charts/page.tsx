
"use client";

import { useEffect, useState } from "react";
import { Song } from "./data";
import { SongSelector } from "./components/SongSelector";
import { SongView } from "./components/SongView";
import { CreateSongModal } from "@repo/ui/create-song-modal";

export default function ChartsPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [selectedSongId, setSelectedSongId] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
                if (data.length > 0 && !selectedSongId) {
                    setSelectedSongId(data[0].id);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setIsLoading(false);
            }
        }
        fetchSongs();
    }, []);

    const selectedSong = songs.find((s) => s.id === selectedSongId);

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

    const handleCreateSong = async (data: { title: string; artist: string; key: string }) => {
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
                sections: [],
                arrangement: [],
            };

            setSongs((prev) => [...prev, newSong]);
            setSelectedSongId(result.id);
        }
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

            <SongSelector
                songs={songs}
                onSelectSong={setSelectedSongId}
                selectedSongId={selectedSongId}
                onAddSong={() => setIsCreateModalOpen(true)}
            />
            <div className="flex-1 overflow-hidden">
                {selectedSong ? (
                    <SongView
                        key={selectedSong.id}
                        song={selectedSong}
                        onChange={handleUpdateSong}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                        Velg en låt fra listen til venstre for å begynne.
                    </div>
                )}
            </div>
        </div>
    );
}
