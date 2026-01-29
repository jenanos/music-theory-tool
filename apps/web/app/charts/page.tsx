
"use client";

import { useState } from "react";
import { initialSongs, Song } from "./data";
import { SongSelector } from "./components/SongSelector";
import { SongView } from "./components/SongView";

export default function ChartsPage() {
    const [songs, setSongs] = useState<Song[]>(initialSongs);
    const [selectedSongId, setSelectedSongId] = useState<string | undefined>(
        initialSongs[0]?.id
    );

    const selectedSong = songs.find((s) => s.id === selectedSongId);

    const handleUpdateSong = (updatedSong: Song) => {
        setSongs((prevSongs) =>
            prevSongs.map((s) => (s.id === updatedSong.id ? updatedSong : s))
        );
    };

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
