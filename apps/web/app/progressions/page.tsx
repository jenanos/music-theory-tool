"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    filterProgressions,
    getAllTags,
    transposeProgression,
    suggestNextChords,
    getStartingChords,
    romanToChord,
    SCALES,
    TONIC_OPTIONS,
    type TransposedProgression,
    type NextChordSuggestion,
    type ModeId,
    findMatchingProgressions,
} from "@repo/theory";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ============================================================================
// Constants & Configuration
// ============================================================================

const TAG_LABELS: Record<string, string> = {
    // Sjanger
    common: "Vanlig", pop: "Pop", rock: "Rock", jazz: "Jazz", folk: "Folk", blues: "Blues",
    classical: "Klassisk", "50s": "50-tall", vintage: "Vintage", funk: "Funk", funky: "Funky",
    // Stemning
    emotional: "Emosjonell", melancholic: "Melankolsk", dramatic: "Dramatisk", epic: "Episk",
    bright: "Lyst", dark: "Mørkt", dreamy: "Drømmende", tension: "Spenning", cinematic: "Filmatisk",
    // Teori
    cadence: "Kadens", secondary_dominant: "Sekundærdominant", modal: "Modalt",
    circle_of_fifths: "Kvintsirkel", substitution: "Substitusjon", modal_interchange: "Modal Interchange",
    neapolitan: "Napolitansk", picardy: "Picardy", tritone_sub: "Tritonus-sub", backdoor: "Bakdør",
    chromatic: "Kromatisk", passing: "Gjennomgangstone", deceptive: "Bedragelig", sequence: "Sekvens",
    // Annet
    loop: "Loop", ballad: "Ballade", anthemic: "Anthemisk", ending: "Avslutning",
    rhythm_changes: "Rhythm Changes", experimental: "Eksperimentell", flamenco: "Flamenco"
};

const CATEGORIES = {
    sjanger: {
        title: "Sjanger",
        tags: ["jazz", "blues", "folk", "pop", "rock", "50s", "funky", "flamenco"],
    },
    stemning: {
        title: "Stemning",
        tags: ["emotional", "melancholic", "dramatic", "epic", "bright", "dark", "dreamy", "tension", "cinematic"],
    },
    teori: {
        title: "Teori",
        tags: ["cadence", "secondary_dominant", "modal", "circle_of_fifths", "substitution", "modal_interchange", "neapolitan"],
    },
    annet: {
        title: "Andre",
        tags: ["loop", "ending", "ballad", "common"],
    }
};

type CategoryKey = keyof typeof CATEGORIES;

// ============================================================================
// Components
// ============================================================================

function SortableChordItem({
    id,
    roman,
    chordSymbol
}: {
    id: string;
    roman: string;
    chordSymbol: string;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : "auto",
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="group flex cursor-grab flex-col items-center justify-center rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 shadow-sm transition-all hover:bg-primary/25 active:cursor-grabbing"
        >
            <span className="text-lg font-bold text-primary">{chordSymbol}</span>
            <span className="text-xs font-medium text-primary/70 group-hover:text-primary">{roman}</span>
        </div>
    );
}

// Type for saved progressions
interface SavedProgression {
    id: string;
    name: string;
    tonic: string;
    mode: string;
    sequence: string[];
    createdAt: Date;
}

export default function ProgressionsPage() {
    const [tonic, setTonic] = useState("C");
    const [modeId, setModeId] = useState<ModeId>("ionian");
    const [chordType, setChordType] = useState<"triad" | "seventh" | "all">("all");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [useSpice, setUseSpice] = useState(false);

    // Sequence builder state
    const [sequenceItems, setSequenceItems] = useState<{ id: string; roman: string }[]>([]);

    // Saved progressions state
    const [savedProgressions, setSavedProgressions] = useState<SavedProgression[]>([]);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Fetch saved progressions on mount
    useEffect(() => {
        fetch("/api/progressions")
            .then(res => res.json())
            .then(data => setSavedProgressions(data))
            .catch(err => console.error("Failed to fetch saved progressions:", err));
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // 5px movement to start drag
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Derived Data
    const progressions = useMemo(() => {
        const filtered = filterProgressions(
            modeId,
            selectedTags.length > 0 ? selectedTags : undefined,
            chordType
        );

        const currentSeq = sequenceItems.map(i => i.roman);

        if (currentSeq.length > 0) {
            // Find matches
            const matches = findMatchingProgressions(currentSeq, filtered);
            return matches.map(m => ({
                data: transposeProgression(m.progression, tonic),
                matchedIndices: m.matchedIndices
            }));
        }

        // Default behavior if no sequence
        return filtered.map((p) => ({
            data: transposeProgression(p, tonic),
            matchedIndices: [] as number[]
        }));
    }, [tonic, modeId, selectedTags, chordType, sequenceItems]);

    const sequenceRomans = sequenceItems.map(i => i.roman);

    const nextChordSuggestions = useMemo(() => {
        if (sequenceRomans.length === 0) {
            return getStartingChords(modeId, tonic, { useSpice });
        }
        return suggestNextChords(
            sequenceRomans,
            tonic,
            modeId,
            { useSpice }
        );
    }, [sequenceRomans, tonic, modeId, useSpice]);

    // Handlers
    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const addToSequence = (roman: string) => {
        setSequenceItems(prev => [...prev, { id: crypto.randomUUID(), roman }]);
    };

    const removeSequenceItem = (id: string) => {
        setSequenceItems(prev => prev.filter(i => i.id !== id));
    };

    const clearSequence = () => {
        setSequenceItems([]);
    };

    // Save progression to database
    const handleSaveProgression = async () => {
        if (!saveName.trim() || sequenceItems.length === 0) return;

        setIsSaving(true);
        try {
            const response = await fetch("/api/progressions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: saveName.trim(),
                    tonic,
                    mode: modeId,
                    sequence: sequenceItems.map(i => i.roman),
                }),
            });

            if (response.ok) {
                const { id } = await response.json();
                setSavedProgressions(prev => [{
                    id,
                    name: saveName.trim(),
                    tonic,
                    mode: modeId,
                    sequence: sequenceItems.map(i => i.roman),
                    createdAt: new Date(),
                }, ...prev]);
                setShowSaveModal(false);
                setSaveName("");
            }
        } catch (err) {
            console.error("Failed to save progression:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // Load a saved progression
    const loadProgression = (prog: SavedProgression) => {
        setTonic(prog.tonic);
        setModeId(prog.mode as ModeId);
        setSequenceItems(prog.sequence.map(roman => ({ id: crypto.randomUUID(), roman })));
    };

    // Delete a saved progression
    const deleteProgression = async (id: string) => {
        try {
            await fetch(`/api/progressions?id=${id}`, { method: "DELETE" });
            setSavedProgressions(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            console.error("Failed to delete progression:", err);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setSequenceItems((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    return (
        <main className="flex h-full flex-col bg-background text-foreground overflow-hidden">
            {/* Header */}
            <header className="shrink-0 border-b border-border bg-card px-6 py-4 shadow-sm z-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-bold leading-tight text-foreground">
                            Akkordprogresjoner
                        </h1>
                        <Link
                            href="/"
                            className="text-xs font-medium text-primary hover:text-primary/80 hover:underline"
                        >
                            ← Tilbake til akkorder
                        </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Grunntone</label>
                            <select
                                className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary"
                                onChange={(e) => setTonic(e.target.value)}
                                value={tonic}
                            >
                                {TONIC_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Modalitet</label>
                            <select
                                className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary"
                                onChange={(e) => setModeId(e.target.value as ModeId)}
                                value={modeId}
                            >
                                {SCALES.filter(s => s.isHarmony).map((scale) => (
                                    <option key={scale.id} value={scale.id}>{scale.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Akkordtype</label>
                            <select
                                className="rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-primary"
                                onChange={(e) => setChordType(e.target.value as any)}
                                value={chordType}
                            >
                                <option value="all">Alle</option>
                                <option value="triad">Triader</option>
                                <option value="seventh">Septim</option>
                            </select>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Filters */}
                <aside className="w-64 shrink-0 overflow-y-auto border-r border-border bg-card p-6 hidden md:block">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Filter</h2>
                        {selectedTags.length > 0 && (
                            <button
                                onClick={() => setSelectedTags([])}
                                className="text-xs text-destructive hover:underline"
                            >
                                Nullstill
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {(Object.keys(CATEGORIES) as CategoryKey[]).map(key => (
                            <div key={key}>
                                <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{CATEGORIES[key].title}</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {CATEGORIES[key].tags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${selectedTags.includes(tag)
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground hover:bg-muted/80 border border-border"
                                                }`}
                                        >
                                            {TAG_LABELS[tag] ?? tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Left: Progressions List */}
                <div className="flex w-full flex-col overflow-y-auto bg-card/70 p-6 lg:w-1/2 border-r border-border">
                    <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                        Progresjoner ({progressions.length}) - {SCALES.find(s => s.id === modeId)?.name}
                    </h2>

                    {progressions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <p>Ingen progresjoner funnet for dette filteret.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                            {progressions.map((prog) => (
                                <div
                                    key={prog.data.id}
                                    className="group relative flex flex-col rounded-lg border border-border bg-card p-3 shadow-sm transition-all hover:border-primary/60 hover:shadow-md"
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-foreground text-sm group-hover:text-primary truncate">
                                                {prog.data.name}
                                            </h3>
                                            {prog.data.description && (
                                                <p className="text-[10px] text-muted-foreground line-clamp-2">{prog.data.description}</p>
                                            )}
                                            {prog.data.usageExamples && (
                                                <p className="mt-1 text-[9px] text-primary font-medium line-clamp-1">
                                                    <span className="opacity-70">Eksempel:</span> {prog.data.usageExamples}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded ${prog.data.weight >= 9
                                            ? "bg-primary/20 text-primary"
                                            : prog.data.weight >= 7
                                                ? "bg-accent/20 text-accent-foreground"
                                                : prog.data.weight >= 5
                                                    ? "bg-muted text-muted-foreground"
                                                    : "bg-secondary text-secondary-foreground"
                                            }`}>
                                            {prog.data.weight >= 9
                                                ? "Klassiker"
                                                : prog.data.weight >= 7
                                                    ? "Vanlig"
                                                    : prog.data.weight >= 5
                                                        ? "Sjelden"
                                                        : "Eksperimentell"}
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {prog.data.chords.map((c, i) => {
                                            const isMatched = prog.matchedIndices.includes(i);
                                            return (
                                                <div
                                                    key={i}
                                                    className={`flex flex-col items-center justify-center rounded px-2 py-1 transition-all ${isMatched
                                                        ? "bg-primary text-primary-foreground shadow-sm scale-110 mx-0.5"
                                                        : "bg-muted text-muted-foreground"
                                                        }`}
                                                >
                                                    <span className="text-xs font-bold font-mono leading-none mb-0.5">{c}</span>
                                                    <span className={`text-[9px] font-medium leading-none ${isMatched ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                                                        {prog.data.roman[i]}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-auto flex flex-wrap gap-1">
                                        {prog.data.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[9px] text-muted-foreground border border-border rounded px-1">
                                                {TAG_LABELS[tag] ?? tag}
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 text-primary hover:bg-primary/30 rounded p-1"
                                        title="Kopier til sekvens"
                                        onClick={() => {
                                            setSequenceItems(prev => [
                                                ...prev,
                                                ...prog.data.roman.map(r => ({ id: crypto.randomUUID(), roman: r }))
                                            ]);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right: Builder */}
                <div className="flex-1 flex flex-col overflow-hidden bg-background">
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                    Din Sekvens
                                </h2>
                                <div className="flex items-center gap-2">
                                    {sequenceItems.length > 0 && (
                                        <>
                                            <button
                                                onClick={() => setShowSaveModal(true)}
                                                className="text-xs font-medium text-primary hover:text-primary/80"
                                            >
                                                Lagre
                                            </button>
                                            <button
                                                onClick={clearSequence}
                                                className="text-xs font-medium text-destructive hover:text-destructive/80"
                                            >
                                                Tøm
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="min-h-[120px] rounded-xl border-2 border-dashed border-border bg-muted/40 p-4 transition-colors hover:bg-muted/60">
                                {sequenceItems.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                                        <p className="text-sm font-medium">Sekvensen er tom</p>
                                        <p className="text-xs">Velg akkorder fra forslagene eller en progresjon.</p>
                                    </div>
                                ) : (
                                    <DndContext
                                        sensors={sensors}
                                        collisionDetection={closestCenter}
                                        onDragEnd={handleDragEnd}
                                    >
                                        <SortableContext
                                            items={sequenceItems.map(i => i.id)}
                                            strategy={horizontalListSortingStrategy}
                                        >
                                            <div className="flex flex-wrap gap-2">
                                                {sequenceItems.map((item) => (
                                                    <div key={item.id} className="relative group/item">
                                                        <SortableChordItem
                                                            id={item.id}
                                                            roman={item.roman}
                                                            chordSymbol={romanToChord(item.roman, tonic, modeId)}
                                                        />
                                                        <button
                                                            onClick={() => removeSequenceItem(item.id)}
                                                            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-destructive/20 text-destructive opacity-0 transition-opacity hover:bg-destructive/30 group-hover/item:opacity-100 flex items-center justify-center text-[10px]"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </SortableContext>
                                    </DndContext>
                                )}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                    {sequenceItems.length === 0 ? `Start med (${SCALES.find(s => s.id === modeId)?.name})` : "Forslag videre"}
                                </h2>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${useSpice ? "bg-primary" : "bg-muted"}`}>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-card rounded-full transition-transform ${useSpice ? "translate-x-4" : ""}`} />
                                    </div>
                                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">Tonal krydder</span>
                                    <input type="checkbox" className="hidden" checked={useSpice} onChange={e => setUseSpice(e.target.checked)} />
                                </label>
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                                {nextChordSuggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => addToSequence(s.roman)}
                                        className={`group flex flex-col items-center justify-center rounded-lg border p-3 shadow-sm transition-all hover:shadow-md active:scale-95 text-center ${s.isDiatonic
                                            ? "border-border bg-card hover:border-primary/60 hover:bg-primary/10"
                                            : "border-destructive/40 bg-destructive/10 hover:border-destructive/60 hover:bg-destructive/20"
                                            }`}
                                    >
                                        <span className={`text-sm font-bold ${s.isDiatonic ? "text-foreground group-hover:text-primary" : "text-destructive group-hover:text-destructive"}`}>
                                            {s.chord}
                                        </span>
                                        <span className={`text-[10px] font-mono ${s.isDiatonic ? "text-muted-foreground group-hover:text-primary/80" : "text-destructive/80"}`}>
                                            {s.roman}
                                        </span>
                                        {s.secondaryLabel && (
                                            <span className="mt-1 text-[9px] text-muted-foreground group-hover:text-foreground italic block leading-none">
                                                {s.secondaryLabel}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Saved Progressions */}
                        {savedProgressions.length > 0 && (
                            <div className="mt-6 border-t border-border pt-6">
                                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                                    Lagrede sekvenser ({savedProgressions.length})
                                </h2>
                                <div className="space-y-2">
                                    {savedProgressions.map((prog) => (
                                        <div
                                            key={prog.id}
                                            className="group flex items-center justify-between rounded-lg border border-border bg-muted p-3 hover:border-primary/60 hover:bg-primary/10 transition-colors"
                                        >
                                            <button
                                                onClick={() => loadProgression(prog)}
                                                className="flex-1 text-left"
                                            >
                                                <span className="font-medium text-foreground group-hover:text-primary">
                                                    {prog.name}
                                                </span>
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    {prog.tonic} {prog.mode} · {prog.sequence.length} akkorder
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => deleteProgression(prog.id)}
                                                className="ml-2 p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M3 6h18" />
                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Save Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl">
                        <h3 className="mb-4 text-lg font-bold text-foreground">Lagre sekvens</h3>
                        <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="Navn på sekvensen..."
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
                            autoFocus
                        />
                        <div className="mt-2 text-xs text-muted-foreground">
                            {tonic} {SCALES.find(s => s.id === modeId)?.name} · {sequenceItems.map(i => i.roman).join(" → ")}
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => { setShowSaveModal(false); setSaveName(""); }}
                                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={handleSaveProgression}
                                disabled={!saveName.trim() || isSaving}
                                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isSaving ? "Lagrer..." : "Lagre"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
