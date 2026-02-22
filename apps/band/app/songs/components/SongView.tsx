
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Song, Section } from "../data";
import { Timeline } from "./Timeline";
import { SectionList } from "./SectionList";
import {
    suggestSubstitutions,
    buildDiatonicChords,
    getScale,
    parseKey,
    type ModeId,
    type SubstitutionSuggestion,
    type DiatonicChord
} from "@repo/theory";
import { SubstitutionPanel } from "../../components/SubstitutionPanel";

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
            label: "Vers", // Settes som default for å gi en nyttig start-state
            chordLines: [],
            degreeLines: [],
        };
        const newSections = [...song.sections, newSection];
        // Ensure new sections go into arrangement automatically
        const newItem = { id: generateId(), sectionId: id };
        const newTimelineItems = [...timelineItems, newItem];

        setTimelineItems(newTimelineItems);
        onChange({ ...song, sections: newSections, arrangement: [...song.arrangement, id] });
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
    const [showNotes, setShowNotes] = useState(false);

    // Version history state
    const [showOriginal, setShowOriginal] = useState(false);
    const [originalSong, setOriginalSong] = useState<Song | null>(null);
    const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);

    // Fetch original version when toggle is enabled
    useEffect(() => {
        if (showOriginal && !originalSong) {
            setIsLoadingOriginal(true);
            fetch(`/api/songs/${song.id}/original`)
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to fetch original");
                    return res.json();
                })
                .then((data) => setOriginalSong(data))
                .catch((err) => console.error("Error fetching original:", err))
                .finally(() => setIsLoadingOriginal(false));
        }
    }, [showOriginal, originalSong, song.id]);

    // Use original or current song based on toggle
    const displaySong = showOriginal && originalSong ? originalSong : song;
    const isReadonly = showOriginal;

    // Filter unique sections based on chord lines content
    const visibleSections = showUniqueSections
        ? displaySong.sections.filter((section, index, self) =>
            // Keep the first section that has this specific chord content
            index === self.findIndex((s) =>
                s.chordLines.join('\n') === section.chordLines.join('\n')
            )
        )
        : displaySong.sections;

    // --- SUBSTITUTION LOGIC ---
    type SelectedChordState = {
        symbol: string;
        sectionId: string;
        lineIndex: number;
        chordIndex: number;
        suggestions: SubstitutionSuggestion[];
    };
    const [selectedChord, setSelectedChord] = useState<SelectedChordState | null>(null);

    const handleChordClick = useCallback((chordSymbol: string, sectionId: string, lineIndex: number, chordIndex: number, degree?: string) => {
        if (!song.key) return;

        const keyInfo = parseKey(song.key);
        if (!keyInfo) return;

        const { tonic, mode } = keyInfo;
        const diatonicChords = buildDiatonicChords(tonic, mode, true);

        let targetChord: DiatonicChord | undefined;

        if (degree) {
            const degreeBase = degree.replace(/[^IViv0-9]/g, '');
            targetChord = diatonicChords.find(c => c.roman === degree);
            if (!targetChord) {
                targetChord = diatonicChords.find(c => c.roman.startsWith(degree));
            }
        }

        if (!targetChord) {
            targetChord = diatonicChords.find(c => c.symbol === chordSymbol);
        }

        if (targetChord) {
            const suggestions = suggestSubstitutions({
                tonic,
                mode,
                chord: targetChord,
                allChords: diatonicChords
            });
            setSelectedChord({
                symbol: chordSymbol,
                sectionId,
                lineIndex,
                chordIndex,
                suggestions
            });
        } else {
            console.warn("Kunne ikke finne akkord i kontekst:", chordSymbol, degree);
            setSelectedChord({
                symbol: chordSymbol,
                sectionId,
                lineIndex,
                chordIndex,
                suggestions: []
            });
        }
    }, [song.key]);

    const handleApplySubstitution = useCallback((substitution: SubstitutionSuggestion) => {
        if (!selectedChord) return;
        const { sectionId, lineIndex, chordIndex, symbol } = selectedChord;

        const section = song.sections.find(s => s.id === sectionId);
        if (!section) return;

        const lines = [...section.chordLines];
        if (lineIndex >= lines.length) return;

        const line = lines[lineIndex];
        if (line === undefined) return;

        // Find the N-th chord in the line to match current view parsing logic
        // This regex must match what ChordDisplay uses to split: /[\s|-]+/
        // Use a loop to find the N-th match.
        const chordRegex = /[^|\s-]+/g;
        let match;
        let currentIndex = 0;
        let found = false;

        while ((match = chordRegex.exec(line)) !== null) {
            if (currentIndex === chordIndex) {
                // Found it!
                const start = match.index;
                const end = start + match[0].length;
                const newLine = line.substring(0, start) + substitution.substituteSymbol + line.substring(end);

                lines[lineIndex] = newLine;

                // Update section
                updateSection(sectionId, { chordLines: lines });
                setSelectedChord(null); // Close modal
                found = true;
                break;
            }
            currentIndex++;
        }

        if (!found) {
            console.error("Could not find chord to replace at index", chordIndex);
        }
    }, [selectedChord, song.sections, updateSection]);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-background relative">
            {/* Modal / Overlay for Substitutions */}
            {selectedChord && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
                            <h3 className="font-bold text-lg text-foreground">
                                Substitusjoner for <span className="text-primary">{selectedChord.symbol}</span>
                            </h3>
                            <button
                                onClick={() => setSelectedChord(null)}
                                className="p-1 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <SubstitutionPanel
                                substitutions={selectedChord.suggestions}
                                onSelect={handleApplySubstitution}
                            />
                        </div>
                    </div>
                    {/* Backdrop click to close */}
                    <div
                        className="absolute inset-0 -z-10"
                        onClick={() => setSelectedChord(null)}
                    />
                </div>
            )}

            {/* Header */}
            <div className="border-b border-border bg-card px-6 py-4 flex-none relative z-10">
                <div className="flex items-center gap-4">
                    {isReadonly ? (
                        <>
                            <span className="text-2xl font-bold text-foreground">{displaySong.title}</span>
                            <span className="text-sm font-medium text-muted-foreground">{displaySong.artist || ''}</span>
                            <span className="text-xs text-accent-foreground bg-accent/20 px-2 py-1 rounded-full border border-accent/40">Originalversjon (skrivebeskyttet)</span>
                        </>
                    ) : (
                        <>
                            <input
                                className="text-2xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded px-1 bg-transparent"
                                value={song.title}
                                onChange={(e) => updateTitle(e.target.value)}
                                placeholder="Låttittel"
                            />
                            <input
                                className="text-sm font-medium text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded px-1 bg-transparent"
                                value={song.artist || ""}
                                onChange={(e) => updateArtist(e.target.value)}
                                placeholder="Artist"
                            />
                        </>
                    )}

                    <div className="ml-auto flex items-center gap-3">
                        {/* Version Toggle */}
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                            <button
                                onClick={() => setShowOriginal(false)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!showOriginal
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                Nåværende
                            </button>
                            <button
                                onClick={() => setShowOriginal(true)}
                                disabled={isLoadingOriginal}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${showOriginal
                                    ? 'bg-card text-foreground shadow-sm'
                                    : 'text-muted-foreground hover:text-foreground'
                                    } disabled:opacity-50`}
                            >
                                {isLoadingOriginal ? 'Laster...' : 'Opprinnelig'}
                            </button>
                        </div>

                        <span className="text-xs text-muted-foreground/60">
                            {displaySong.key ? `Key: ${displaySong.key}` : "No key"}
                        </span>

                        {/* Info / Notes Toggle */}
                        {displaySong.notes && (
                            <button
                                onClick={() => setShowNotes(!showNotes)}
                                className={`p-1.5 rounded-full transition-colors ${showNotes ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-primary hover:bg-muted'}`}
                                title={showNotes ? "Skjul låtnotater" : "Vis låtnotater"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Expandable Notes Section */}
                {displaySong.notes && showNotes && (
                    <div className="mt-4 text-sm text-muted-foreground bg-muted p-3 rounded-md border border-border animate-in fade-in slide-in-from-top-1 duration-200">
                        <div className="font-medium text-foreground mb-1">Notater</div>
                        {displaySong.notes}
                    </div>
                )}
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content: Sections */}
                <div className="flex-1 overflow-y-auto p-6 bg-background">
                    <div className="max-w-3xl mx-auto space-y-6">
                        <div className="flex items-center justify-end">
                            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={showUniqueSections}
                                    onChange={(e) => setShowUniqueSections(e.target.checked)}
                                    className="rounded border-border text-primary focus:ring-primary"
                                />
                                Vis unike seksjoner
                            </label>
                        </div>

                        <SectionList
                            sections={visibleSections}
                            songKey={displaySong.key}
                            onUpdate={isReadonly ? undefined : updateSection}
                            onAdd={isReadonly ? undefined : addSection}
                            onDelete={isReadonly ? undefined : deleteSection}
                            onChordClick={handleChordClick}
                        />
                    </div>
                </div>

                {/* Sidebar: Timeline */}
                <div className="w-80 border-l border-border bg-card flex flex-col">
                    <div className="p-4 flex-1 overflow-hidden flex flex-col">
                        <Timeline
                            items={timelineItems}
                            sections={song.sections}
                            onReorder={handleReorder}
                        />

                        {!isReadonly && (
                            <div className="mt-4 pt-4 border-t border-border overflow-y-auto flex-none max-h-[40%]">
                                <span className="text-xs font-medium text-muted-foreground block mb-2 uppercase tracking-wider">
                                    Legg til i arrangement
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {song.sections.map(s => (
                                        <button
                                            key={s.id}
                                            onClick={() => addToArrangement(s.id)}
                                            className="text-xs px-2 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition border border-border"
                                        >
                                            + {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
