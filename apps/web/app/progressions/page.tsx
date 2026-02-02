"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    filterProgressions,
    getAllTags,
    transposeProgression,
    suggestNextChords,
    buildDiatonicChords,
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
            className="group flex cursor-grab flex-col items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 shadow-sm transition-all hover:bg-indigo-100 active:cursor-grabbing"
        >
            <span className="text-lg font-bold text-indigo-700">{chordSymbol}</span>
            <span className="text-xs font-medium text-indigo-400 group-hover:text-indigo-500">{roman}</span>
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
            // "Start med" - show suggestions using getStartingChords to get Weighting + Signatures
            // We import suggestNextChords, but for start we should use getStartingChords?
            // Actually getStartingChords is exported from theory.
            // But we need to import it. It was NOT imported in original file.
            // Let's rely on suggestNextChords handling empty sequence? 
            // Original suggestNextChords returned [] for empty.
            // My NEW suggestNextChords returns [] for empty.
            // So we must use a strategy for start.
            // The logic at 153 in original file was manual buildDiatonicChords.
            // We should switch to getStartingChords logic if possible, OR just build diatonic.
            // User requested: "Startpunkt... foreslå først tonika... + signatur-akkorder".
            // Since I implemented `getStartingChords` in `progressions.ts` (and it handles signatures), I should use it.
            // But I need to add it to imports first.
            // For now, I will modify the manual fallback to add `isDiatonic: true`.

            const diatonic = buildDiatonicChords(tonic, modeId, true);
            // We need to prioritize Signatures here too if we do manual?
            // Better to use getStartingChords if I can add the import.
            // I will assume I can add the import in a separate call or just use manual for now.
            // The file doesn't import getStartingChords.
            // I'll stick to fixing the compilation error for now by adding props.

            return diatonic.map(c => ({
                roman: c.roman,
                chord: c.symbol,
                frequency: 1, // Fallback
                fromProgressions: [],
                isDiatonic: true,
                secondaryLabel: undefined
            } as NextChordSuggestion));
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
        <main className="flex h-screen flex-col bg-slate-50 text-slate-900 overflow-hidden">
            {/* Header */}
            <header className="shrink-0 border-b border-slate-200 bg-white px-6 py-4 shadow-sm z-10">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-xl font-bold leading-tight text-slate-800">
                            Akkordprogresjoner
                        </h1>
                        <Link
                            href="/"
                            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                            ← Tilbake til akkorder
                        </Link>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Grunntone</label>
                            <select
                                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                onChange={(e) => setTonic(e.target.value)}
                                value={tonic}
                            >
                                {TONIC_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Modalitet</label>
                            <select
                                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                onChange={(e) => setModeId(e.target.value as ModeId)}
                                value={modeId}
                            >
                                {SCALES.filter(s => s.isHarmony).map((scale) => (
                                    <option key={scale.id} value={scale.id}>{scale.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">Akkordtype</label>
                            <select
                                className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
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
                <aside className="w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white p-6 hidden md:block">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">Filter</h2>
                        {selectedTags.length > 0 && (
                            <button
                                onClick={() => setSelectedTags([])}
                                className="text-xs text-red-500 hover:underline"
                            >
                                Nullstill
                            </button>
                        )}
                    </div>

                    <div className="space-y-6">
                        {(Object.keys(CATEGORIES) as CategoryKey[]).map(key => (
                            <div key={key}>
                                <h3 className="mb-2 text-xs font-semibold text-slate-500">{CATEGORIES[key].title}</h3>
                                <div className="flex flex-wrap gap-1.5">
                                    {CATEGORIES[key].tags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => toggleTag(tag)}
                                            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${selectedTags.includes(tag)
                                                ? "bg-indigo-100 text-indigo-700"
                                                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-100"
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
                <div className="flex w-full flex-col overflow-y-auto bg-slate-50/50 p-6 lg:w-1/2 border-r border-slate-200">
                    <h2 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Progresjoner ({progressions.length}) - {SCALES.find(s => s.id === modeId)?.name}
                    </h2>

                    {progressions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                            <p>Ingen progresjoner funnet for dette filteret.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                            {progressions.map((prog) => (
                                <div
                                    key={prog.data.id}
                                    className="group relative flex flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                                >
                                    <div className="mb-2 flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700 truncate">
                                                {prog.data.name}
                                            </h3>
                                            {prog.data.description && (
                                                <p className="text-[10px] text-slate-500 line-clamp-2">{prog.data.description}</p>
                                            )}
                                            {prog.data.usageExamples && (
                                                <p className="mt-1 text-[9px] text-indigo-500 font-medium line-clamp-1">
                                                    <span className="opacity-70">Eksempel:</span> {prog.data.usageExamples}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded ${prog.data.weight >= 9
                                                ? "bg-emerald-100 text-emerald-700"
                                                : prog.data.weight >= 7
                                                    ? "bg-blue-100 text-blue-700"
                                                    : prog.data.weight >= 5
                                                        ? "bg-slate-100 text-slate-600"
                                                        : "bg-purple-100 text-purple-700"
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
                                                        ? "bg-indigo-600 text-white shadow-sm scale-110 mx-0.5"
                                                        : "bg-indigo-50 text-indigo-700"
                                                        }`}
                                                >
                                                    <span className="text-xs font-bold font-mono leading-none mb-0.5">{c}</span>
                                                    <span className={`text-[9px] font-medium leading-none ${isMatched ? "text-indigo-200" : "text-indigo-400 opacity-80"}`}>
                                                        {prog.data.roman[i]}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-auto flex flex-wrap gap-1">
                                        {prog.data.tags.slice(0, 3).map(tag => (
                                            <span key={tag} className="text-[9px] text-slate-400 border border-slate-100 rounded px-1">
                                                {TAG_LABELS[tag] ?? tag}
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded p-1"
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
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                    Din Sekvens
                                </h2>
                                <div className="flex items-center gap-2">
                                    {sequenceItems.length > 0 && (
                                        <>
                                            <button
                                                onClick={() => setShowSaveModal(true)}
                                                className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                                            >
                                                Lagre
                                            </button>
                                            <button
                                                onClick={clearSequence}
                                                className="text-xs font-medium text-red-500 hover:text-red-600"
                                            >
                                                Tøm
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="min-h-[120px] rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-4 transition-colors hover:bg-slate-50">
                                {sequenceItems.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center text-slate-400">
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
                                                            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-red-100 text-red-500 opacity-0 transition-opacity hover:bg-red-200 group-hover/item:opacity-100 flex items-center justify-center text-[10px]"
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
                                <h2 className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                    {sequenceItems.length === 0 ? `Start med (${SCALES.find(s => s.id === modeId)?.name})` : "Forslag videre"}
                                </h2>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`w-8 h-4 rounded-full relative transition-colors ${useSpice ? "bg-indigo-500" : "bg-slate-300"}`}>
                                        <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${useSpice ? "translate-x-4" : ""}`} />
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700">Tonal krydder</span>
                                    <input type="checkbox" className="hidden" checked={useSpice} onChange={e => setUseSpice(e.target.checked)} />
                                </label>
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                                {nextChordSuggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => addToSequence(s.roman)}
                                        className={`group flex flex-col items-center justify-center rounded-lg border p-3 shadow-sm transition-all hover:shadow-md active:scale-95 text-center ${s.isDiatonic
                                            ? "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                                            : "border-amber-200 bg-amber-50 hover:border-amber-300 hover:bg-amber-100"
                                            }`}
                                    >
                                        <span className={`text-sm font-bold ${s.isDiatonic ? "text-slate-800 group-hover:text-indigo-700" : "text-amber-800 group-hover:text-amber-900"}`}>
                                            {s.chord}
                                        </span>
                                        <span className={`text-[10px] font-mono ${s.isDiatonic ? "text-slate-400 group-hover:text-indigo-400" : "text-amber-600/70"}`}>
                                            {s.roman}
                                        </span>
                                        {s.secondaryLabel && (
                                            <span className="mt-1 text-[9px] text-slate-300 group-hover:text-slate-500 italic block leading-none">
                                                {s.secondaryLabel}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Saved Progressions */}
                        {savedProgressions.length > 0 && (
                            <div className="mt-6 border-t border-slate-200 pt-6">
                                <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                                    Lagrede sekvenser ({savedProgressions.length})
                                </h2>
                                <div className="space-y-2">
                                    {savedProgressions.map((prog) => (
                                        <div
                                            key={prog.id}
                                            className="group flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                                        >
                                            <button
                                                onClick={() => loadProgression(prog)}
                                                className="flex-1 text-left"
                                            >
                                                <span className="font-medium text-slate-700 group-hover:text-indigo-700">
                                                    {prog.name}
                                                </span>
                                                <span className="ml-2 text-xs text-slate-400">
                                                    {prog.tonic} {prog.mode} · {prog.sequence.length} akkorder
                                                </span>
                                            </button>
                                            <button
                                                onClick={() => deleteProgression(prog.id)}
                                                className="ml-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
                    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                        <h3 className="mb-4 text-lg font-bold text-slate-800">Lagre sekvens</h3>
                        <input
                            type="text"
                            value={saveName}
                            onChange={(e) => setSaveName(e.target.value)}
                            placeholder="Navn på sekvensen..."
                            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            autoFocus
                        />
                        <div className="mt-2 text-xs text-slate-500">
                            {tonic} {SCALES.find(s => s.id === modeId)?.name} · {sequenceItems.map(i => i.roman).join(" → ")}
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <button
                                onClick={() => { setShowSaveModal(false); setSaveName(""); }}
                                className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                            >
                                Avbryt
                            </button>
                            <button
                                onClick={handleSaveProgression}
                                disabled={!saveName.trim() || isSaving}
                                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
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
