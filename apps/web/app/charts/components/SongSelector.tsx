
"use client";

import { useState } from "react";
import { Song } from "../data";

interface SongSelectorProps {
    songs: Song[];
    onSelectSong: (songId: string) => void;
    selectedSongId?: string;
}

export function SongSelector({ songs, onSelectSong, selectedSongId }: SongSelectorProps) {
    const [search, setSearch] = useState("");

    const filteredSongs = songs.filter((song) =>
        song.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex w-64 flex-col border-r border-slate-200 bg-slate-50 h-full">
            <div className="p-4 border-b border-slate-200">
                <h2 className="mb-2 font-semibold text-slate-800">Låter</h2>
                <input
                    type="text"
                    placeholder="Søk..."
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto">
                {filteredSongs.map((song) => (
                    <button
                        key={song.id}
                        onClick={() => onSelectSong(song.id)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors hover:bg-slate-100 ${selectedSongId === song.id
                                ? "bg-indigo-50 text-indigo-700 font-medium border-r-2 border-indigo-600"
                                : "text-slate-600"
                            }`}
                    >
                        <div className="truncate">{song.title}</div>
                        {song.artist && (
                            <div className="truncate text-xs text-slate-400">{song.artist}</div>
                        )}
                    </button>
                ))}
                {filteredSongs.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-400">
                        Ingen låter funnet
                    </div>
                )}
            </div>
        </div>
    );
}
