"use client";

import { useEffect, useState } from "react";
import { Song } from "./data";
import { SongSelector } from "./components/SongSelector";
import { SongView } from "./components/SongView";

export default function ChartsPage() {
    const [songs, setSongs] = useState<Song[]>([]);
    const [selectedSongId, setSelectedSongId] = useState<string | undefined>();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    if (isLoading) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                    <span className="text-sm text-slate-500">Laster sanger...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full w-full items-center justify-center bg-slate-50">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
                    >
                        Prøv igjen
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full overflow-hidden bg-slate-50">
            <SongSelector
                songs={songs}
                onSelectSong={setSelectedSongId}
                selectedSongId={selectedSongId}
            />
            <div className="flex-1 overflow-hidden">
                {selectedSong ? (
                    <SongView
                        key={selectedSong.id}
                        song={selectedSong}
                        onChange={handleUpdateSong}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                        Velg en låt fra listen til venstre for å begynne.
                    </div>
                )}
            </div>
        </div>
    );
}
