
"use client";

import { useState } from "react";
import { Song } from "../data";

interface SongSelectorProps {
    songs: Song[];
    onSelectSong: (songId: string) => void;
    selectedSongId?: string;
    onAddSong?: () => void;
}

export function SongSelector({ songs, onSelectSong, selectedSongId, onAddSong }: SongSelectorProps) {
    const [search, setSearch] = useState("");

    const filteredSongs = songs.filter((song) =>
        song.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex w-64 flex-col border-r border-border bg-muted h-full">
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-foreground">Låter</h2>
                    {onAddSong && (
                        <button
                            onClick={onAddSong}
                            className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/20 rounded transition-colors"
                            title="Ny låt"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                        </button>
                    )}
                </div>
                <input
                    type="text"
                    placeholder="Søk..."
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredSongs.map((song) => (
                    <button
                        key={song.id}
                        onClick={() => onSelectSong(song.id)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-muted/80 ${selectedSongId === song.id
                            ? "bg-primary/20 text-primary font-medium border-r-2 border-primary"
                            : "text-muted-foreground"
                            }`}
                    >
                        <div className="truncate">{song.title}</div>
                        {song.artist && (
                            <div className="truncate text-xs text-muted-foreground">{song.artist}</div>
                        )}
                    </button>
                ))}
                {filteredSongs.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Ingen låter funnet
                    </div>
                )}
            </div>
        </div>
    );
}
