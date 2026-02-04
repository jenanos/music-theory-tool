
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
        <div className="flex w-64 flex-col border-r border-slate-200 bg-slate-50 h-full">
            <div className="p-4 border-b border-slate-200">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="font-semibold text-slate-800">Låter</h2>
                    {onAddSong && (
                        <button
                            onClick={onAddSong}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
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
