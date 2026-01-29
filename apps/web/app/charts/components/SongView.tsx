
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

    const [showUniqueSections, setShowUniqueSections] = useState(true);

    // Filter unique sections based on chord lines content
    const visibleSections = showUniqueSections
        ? song.sections.filter((section, index, self) =>
            // Keep the first section that has this specific chord content
            index === self.findIndex((s) =>
                s.chordLines.join('\n') === section.chordLines.join('\n')
            )
        )
        : song.sections;

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* Header */}
            <div className="border-b border-slate-200 bg-white px-6 py-4 flex-none">
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

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content: Sections */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="flex items-center justify-end">
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={showUniqueSections}
                                    onChange={(e) => setShowUniqueSections(e.target.checked)}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                                />
                                Vis unike seksjoner
                            </label>
                        </div>

                        <SectionList
                            sections={visibleSections}
                            onUpdate={updateSection}
                            onAdd={addSection}
                            onDelete={deleteSection}
                        />
                    </div>
                </div>

                {/* Sidebar: Timeline */}
                <div className="w-80 border-l border-slate-200 bg-white flex flex-col">
                    <div className="p-4 flex-1 overflow-hidden flex flex-col">
                        <Timeline
                            items={timelineItems}
                            sections={song.sections}
                            onReorder={handleReorder}
                        />

                        <div className="mt-4 pt-4 border-t border-slate-100 overflow-y-auto flex-none max-h-[40%]">
                            <span className="text-xs font-medium text-slate-500 block mb-2 uppercase tracking-wider">
                                Legg til i arrangement
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {song.sections.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => addToArrangement(s.id)}
                                        className="text-xs px-2 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition border border-slate-200"
                                    >
                                        + {s.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
