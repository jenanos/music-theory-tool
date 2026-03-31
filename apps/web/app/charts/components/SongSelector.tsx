
"use client";

import { useState } from "react";
import { Song, SongVisibility } from "../data";

type VisibilityFilter = "all" | SongVisibility;

const VISIBILITY_LABELS: Record<VisibilityFilter, string> = {
    all: "Alle",
    private: "Mine",
    group: "Gruppe",
    shared: "Felles",
};

const VISIBILITY_BADGE: Record<SongVisibility, { label: string; className: string }> = {
    private: { label: "Privat", className: "bg-blue-500/20 text-blue-400" },
    group: { label: "Gruppe", className: "bg-purple-500/20 text-purple-400" },
    shared: { label: "Felles", className: "bg-green-500/20 text-green-400" },
};

interface SongSelectorProps {
    songs: Song[];
    onSelectSong: (songId: string) => void;
    selectedSongId?: string;
    onAddSong?: () => void;
    onDeleteSong?: (songId: string) => Promise<void>;
    isMobile?: boolean;
    visibilityFilter: VisibilityFilter;
    onVisibilityFilterChange: (filter: VisibilityFilter) => void;
    currentUserId?: string;
    isAdmin?: boolean;
}

export function SongSelector({
    songs,
    onSelectSong,
    selectedSongId,
    onAddSong,
    onDeleteSong,
    isMobile,
    visibilityFilter,
    onVisibilityFilterChange,
    currentUserId,
    isAdmin,
}: SongSelectorProps) {
    const [search, setSearch] = useState("");

    const filteredSongs = songs.filter((song) =>
        song.title.toLowerCase().includes(search.toLowerCase())
    );

    const canDeleteSong = (song: Song) => {
        if (isAdmin) return true;
        return song.userId === currentUserId;
    };

    return (
        <div className={`flex flex-col border-r border-border bg-muted h-full ${isMobile ? "w-full" : "w-64"}`}>
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

                {/* Visibility filter tabs */}
                <div className="flex gap-1 mb-2">
                    {(Object.keys(VISIBILITY_LABELS) as VisibilityFilter[]).map((filter) => (
                        <button
                            key={filter}
                            onClick={() => onVisibilityFilterChange(filter)}
                            className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                visibilityFilter === filter
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                            }`}
                        >
                            {VISIBILITY_LABELS[filter]}
                        </button>
                    ))}
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
                    <div
                        key={song.id}
                        className={`group flex items-center ${selectedSongId === song.id
                            ? "bg-primary/20 text-primary font-medium border-r-2 border-primary"
                            : "text-muted-foreground hover:bg-muted/80"
                            }`}
                    >
                        <button
                            onClick={() => onSelectSong(song.id)}
                            className="flex-1 px-4 py-3 text-left text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <span className="truncate">{song.title}</span>
                                {song.visibility && (
                                    <span className={`inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${VISIBILITY_BADGE[song.visibility].className}`}>
                                        {VISIBILITY_BADGE[song.visibility].label}
                                    </span>
                                )}
                            </div>
                            {song.artist && (
                                <div className="truncate text-xs text-muted-foreground">{song.artist}</div>
                            )}
                        </button>
                        {onDeleteSong && canDeleteSong(song) && (
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();

                                    const shouldDeleteSong = window.confirm(
                                        `Slett "${song.title}"? Dette kan ikke angres.`
                                    );

                                    if (!shouldDeleteSong) {
                                        return;
                                    }

                                    try {
                                        await onDeleteSong(song.id);
                                    } catch (error) {
                                        console.error("Error deleting song:", error);
                                        window.alert("Kunne ikke slette låten. Prøv igjen.");
                                    }
                                }}
                                className="mr-3 rounded p-1 text-muted-foreground/70 transition-colors hover:bg-destructive/15 hover:text-destructive"
                                title={`Slett ${song.title}`}
                                aria-label={`Slett ${song.title}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M6 4a2 2 0 012-2h4a2 2 0 012 2h3a1 1 0 110 2h-1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h3zm2-1a1 1 0 00-1 1h6a1 1 0 00-1-1H8zm-2 3v9h8V6H6z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
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
