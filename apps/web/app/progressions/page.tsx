"use client";

import { useMemo, useState } from "react";
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

export default function ProgressionsPage() {
    const [tonic, setTonic] = useState("C");
    const [modeId, setModeId] = useState<ModeId>("ionian");
    const [chordType, setChordType] = useState<"triad" | "seventh" | "all">("all");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Sequence builder state
    // We need unique IDs for sortable items, but the sequence is just strings.
    // We'll wrap them in objects or just generate IDs.
    // For simplicity, let's use an array of objects.
    const [sequenceItems, setSequenceItems] = useState<{ id: string; roman: string }[]>([]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), // 5px movement to start drag
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Derived Data
    const progressions = useMemo(() => {
        const filtered = filterProgressions(
            modeId, // Filter matches current mode strictly? Or all compatible? User said "populate list... filter based on selected mode"
            selectedTags.length > 0 ? selectedTags : undefined,
            chordType
        );
        return filtered.map((p) => transposeProgression(p, tonic));
    }, [tonic, modeId, selectedTags, chordType]);

    const sequenceRomans = sequenceItems.map(i => i.roman);

    const nextChordSuggestions = useMemo(() => {
        if (sequenceRomans.length === 0) {
            // "Start med" - show diatonic chords for current mode
            const diatonic = buildDiatonicChords(tonic, modeId, true);
            return diatonic.map(c => ({
                roman: c.roman,
                chord: c.symbol,
                frequency: 1,
                fromProgressions: []
            } as NextChordSuggestion));
        }
        return suggestNextChords(
            sequenceRomans,
            tonic,
            modeId
        );
    }, [sequenceRomans, tonic, modeId]);

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
                                {SCALES.map((scale) => (
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
                                    key={prog.id}
                                    className="group relative flex flex-col rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
                                >
                                    <div className="mb-2 flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-slate-800 text-sm group-hover:text-indigo-700">
                                                {prog.name}
                                            </h3>
                                            {prog.description && (
                                                <p className="text-[10px] text-slate-500 line-clamp-2">{prog.description}</p>
                                            )}
                                            {prog.usageExamples && (
                                                <p className="mt-1 text-[9px] text-indigo-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                                    <span className="opacity-70">Eksempel:</span> {prog.usageExamples}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex text-amber-400 text-[10px]">
                                            {"★".repeat(Math.min(5, Math.ceil(prog.weight / 2)))}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                        {prog.chords.map((c, i) => (
                                            <span
                                                key={i}
                                                className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 font-mono"
                                            >
                                                {c}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="mt-auto flex flex-wrap gap-1">
                                        {prog.tags.slice(0, 3).map(tag => (
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
                                                ...prog.roman.map(r => ({ id: crypto.randomUUID(), roman: r }))
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
                                {sequenceItems.length > 0 && (
                                    <button
                                        onClick={clearSequence}
                                        className="text-xs font-medium text-red-500 hover:text-red-600"
                                    >
                                        Tøm
                                    </button>
                                )}
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
                            <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                                {sequenceItems.length === 0 ? `Start med (${SCALES.find(s => s.id === modeId)?.name})` : "Forslag videre"}
                            </h2>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
                                {nextChordSuggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => addToSequence(s.roman)}
                                        className="group flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:shadow-md active:scale-95 text-center"
                                    >
                                        <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-700">
                                            {s.chord}
                                        </span>
                                        <span className="text-[10px] font-mono text-slate-400 group-hover:text-indigo-400">
                                            {s.roman}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
