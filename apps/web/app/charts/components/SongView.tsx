
"use client";

import { useState, useCallback } from "react";
import { Song, Section } from "../data";
import { Timeline } from "./Timeline";
import { SectionList } from "./SectionList";

interface SongViewProps {
    song: Song;
    onChange: (updatedSong: Song) => void;
}

interface TimelineItem {
    id: string; // Unique ID for dnd
    sectionId: string;
}

// Simple ID generator that works everywhere
function generateId() {
    return Math.random().toString(36).substring(2, 9);
}

export function SongView({ song, onChange }: SongViewProps) {
    // Initialize timeline items directly from song.arrangement.
    // Because "key={song.id}" is used in the parent, this component is 
    // freshly mounted for each song, guaranteeing correct initialization.
    const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() =>
        song.arrangement.map((sectionId) => ({
            id: generateId(),
            sectionId,
        }))
    );

    const handleReorder = useCallback(
        (newItems: TimelineItem[]) => {
            setTimelineItems(newItems);
            // Sync back to song model
            onChange({
                ...song,
                arrangement: newItems.map((i) => i.sectionId),
            });
        },
        [song, onChange]
    );

    const updateSection = (id: string, updates: Partial<Section>) => {
        const newSections = song.sections.map((s) =>
            s.id === id ? { ...s, ...updates } : s
        );
        onChange({ ...song, sections: newSections });
    };

    const addSection = () => {
        const id = `section-${Date.now()}`;
        const newSection: Section = {
            id,
            label: "Ny Seksjon",
            chordLines: [],
        };
        onChange({ ...song, sections: [...song.sections, newSection] });
    };

    const deleteSection = (id: string) => {
        const newSections = song.sections.filter((s) => s.id !== id);
        // Remove all instances from arrangement
        const newArrangement = song.arrangement.filter((sId) => sId !== id);
        const newTimelineItems = timelineItems.filter((item) => item.sectionId !== id);

        setTimelineItems(newTimelineItems);
        onChange({ ...song, sections: newSections, arrangement: newArrangement });
    };

    const addToArrangement = (sectionId: string) => {
        const newItem = { id: generateId(), sectionId };
        const newItems = [...timelineItems, newItem];
        setTimelineItems(newItems);
        onChange({ ...song, arrangement: newItems.map(i => i.sectionId) });
    };

    const updateTitle = (newTitle: string) => {
        onChange({ ...song, title: newTitle });
    };

    const updateArtist = (newArtist: string) => {
        onChange({ ...song, artist: newArtist });
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* Header */}
            <div className="border-b border-slate-200 bg-white px-6 py-4">
                <div className="flex items-center gap-4">
                    <input
                        className="text-2xl font-bold text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
                        value={song.title}
                        onChange={(e) => updateTitle(e.target.value)}
                        placeholder="Låttittel"
                    />
                    <input
                        className="text-sm font-medium text-slate-500 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded px-1"
                        value={song.artist || ""}
                        onChange={(e) => updateArtist(e.target.value)}
                        placeholder="Artist"
                    />
                    <span className="text-xs text-slate-300 ml-auto">
                        {song.key ? `Key: ${song.key}` : "No key"}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Timeline */}
                <section>
                    <Timeline
                        items={timelineItems}
                        sections={song.sections}
                        onReorder={handleReorder}
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs text-slate-500 py-1">Legg til i arrangement:</span>
                        {song.sections.map(s => (
                            <button
                                key={s.id}
                                onClick={() => addToArrangement(s.id)}
                                className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                            >
                                + {s.label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Sections */}
                <section>
                    <SectionList
                        sections={song.sections}
                        onUpdate={updateSection}
                        onAdd={addSection}
                        onDelete={deleteSection}
                    />
                </section>
            </div>
        </div>
    );
}
