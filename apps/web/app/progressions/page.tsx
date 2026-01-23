"use client";

import { useMemo, useState } from "react";
import {
    filterProgressions,
    getAllTags,
    transposeProgression,
    suggestNextChords,
    getStartingChords,
    TONIC_OPTIONS,
    type TransposedProgression,
    type NextChordSuggestion,
} from "@repo/theory";
import Link from "next/link";

// Tag display names in Norwegian
const TAG_LABELS: Record<string, string> = {
    common: "Vanlig",
    pop: "Pop",
    rock: "Rock",
    jazz: "Jazz",
    folk: "Folk",
    blues: "Blues",
    classical: "Klassisk",
    loop: "Loop",
    cadence: "Kadens",
    turnaround: "Turnaround",
    modal_interchange: "Modal Interchange",
    color: "Farge",
    chromatic: "Kromatisk",
    passing: "Gjennomgangstone",
    secondary_dominant: "Sekundærdominant",
    tritone_sub: "Tritonus-sub",
    backdoor: "Bakdør",
    sequence: "Sekvens",
    circle_of_fifths: "Kvintsirkel",
    deceptive: "Bedragelig",
    emotional: "Emosjonell",
    dramatic: "Dramatisk",
    epic: "Episk",
    vintage: "Vintage",
    "50s": "50-tall",
    ballad: "Ballade",
    anthemic: "Anthemisk",
    aeolian: "Aeolisk",
    mixolydian: "Mixolydisk",
    natural_minor: "Naturlig moll",
    minor: "Moll",
    melancholic: "Melankolsk",
    neapolitan: "Napolitansk",
    picardy: "Picardy",
    ending: "Avslutning",
    rhythm_changes: "Rhythm Changes",
};

export default function ProgressionsPage() {
    const [tonic, setTonic] = useState("C");
    const [progressionMode, setProgressionMode] = useState<"major" | "minor">("major");
    const [chordType, setChordType] = useState<"triad" | "seventh" | "all">("all");
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    // Sequence builder state
    const [sequence, setSequence] = useState<string[]>([]);

    const allTags = useMemo(() => getAllTags(), []);

    const progressions = useMemo(() => {
        const filtered = filterProgressions(
            progressionMode,
            selectedTags.length > 0 ? selectedTags : undefined,
            chordType
        );
        return filtered.map((p) => transposeProgression(p, tonic));
    }, [tonic, progressionMode, selectedTags, chordType]);

    const nextChordSuggestions = useMemo(() => {
        if (sequence.length === 0) {
            return getStartingChords(progressionMode, tonic);
        }
        return suggestNextChords(sequence, tonic, progressionMode === "minor" ? "aeolian" : "ionian");
    }, [sequence, tonic, progressionMode]);

    const toggleTag = (tag: string) => {
        setSelectedTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    };

    const addToSequence = (roman: string) => {
        setSequence((prev) => [...prev, roman]);
    };

    const removeLastFromSequence = () => {
        setSequence((prev) => prev.slice(0, -1));
    };

    const clearSequence = () => {
        setSequence([]);
    };

    return (
        <main className="min-h-screen bg-slate-50 pb-16 text-slate-900">
            <div className="mx-auto max-w-6xl px-6 pb-10 pt-12">
                <header className="mb-10 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
                            Akkordprogresjoner
                        </p>
                        <Link
                            href="/"
                            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                            ← Tilbake til akkorder
                        </Link>
                    </div>
                    <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
                        Finn din neste progresjon
                    </h1>
                    <p className="max-w-3xl text-base text-slate-600">
                        Utforsk vanlige og spennende akkordprogresjoner, eller bygg din egen
                        sekvens og få forslag til hva som kommer neste.
                    </p>
                </header>

                {/* Controls */}
                <section className="mb-8 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1fr,1fr,1fr]">
                    <div>
                        <label className="text-xs font-semibold uppercase text-slate-500">
                            Tonic
                        </label>
                        <select
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            onChange={(e) => setTonic(e.target.value)}
                            value={tonic}
                        >
                            {TONIC_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase text-slate-500">
                            Modus
                        </label>
                        <select
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            onChange={(e) => setProgressionMode(e.target.value as "major" | "minor")}
                            value={progressionMode}
                        >
                            <option value="major">Dur (Major)</option>
                            <option value="minor">Moll (Minor)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-semibold uppercase text-slate-500">
                            Akkordtype
                        </label>
                        <select
                            className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            onChange={(e) => setChordType(e.target.value as "triad" | "seventh" | "all")}
                            value={chordType}
                        >
                            <option value="all">Alle</option>
                            <option value="triad">Triader</option>
                            <option value="seventh">Septimakkorder</option>
                        </select>
                    </div>
                </section>

                {/* Tag filters */}
                <section className="mb-8">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Filtrer på stil
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {allTags.map((tag) => (
                            <button
                                key={tag}
                                onClick={() => toggleTag(tag)}
                                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${selectedTags.includes(tag)
                                        ? "bg-indigo-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {TAG_LABELS[tag] ?? tag}
                            </button>
                        ))}
                        {selectedTags.length > 0 && (
                            <button
                                onClick={() => setSelectedTags([])}
                                className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-200"
                            >
                                Nullstill
                            </button>
                        )}
                    </div>
                </section>

                <div className="grid gap-8 lg:grid-cols-[1.2fr,1fr]">
                    {/* Progressions list */}
                    <section>
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Progresjoner ({progressions.length})
                        </h2>
                        <div className="space-y-3">
                            {progressions.slice(0, 20).map((prog) => (
                                <ProgressionCard key={prog.id} progression={prog} />
                            ))}
                            {progressions.length > 20 && (
                                <p className="text-sm text-slate-500">
                                    ...og {progressions.length - 20} til. Filtrer for å se flere.
                                </p>
                            )}
                            {progressions.length === 0 && (
                                <p className="text-sm text-slate-500">
                                    Ingen progresjoner matcher filtrene dine.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Sequence builder */}
                    <section>
                        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
                            Bygg din sekvens
                        </h2>
                        <SequenceBuilder
                            sequence={sequence}
                            tonic={tonic}
                            mode={progressionMode}
                            suggestions={nextChordSuggestions}
                            onAddChord={addToSequence}
                            onRemoveLast={removeLastFromSequence}
                            onClear={clearSequence}
                        />
                    </section>
                </div>
            </div>
        </main>
    );
}

// ============================================================================
// Sub-components
// ============================================================================

function ProgressionCard({ progression }: { progression: TransposedProgression }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-2 flex items-start justify-between">
                <h3 className="font-medium text-slate-800">{progression.name}</h3>
                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(progression.weight, 5) }).map((_, i) => (
                        <span key={i} className="text-xs text-amber-500">
                            ★
                        </span>
                    ))}
                </div>
            </div>

            {/* Roman numerals */}
            <div className="mb-2 flex flex-wrap gap-1">
                {progression.roman.map((r, i) => (
                    <span
                        key={i}
                        className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600"
                    >
                        {r}
                    </span>
                ))}
            </div>

            {/* Transposed chords */}
            <div className="mb-3 flex flex-wrap gap-1">
                {progression.chords.map((c, i) => (
                    <span
                        key={i}
                        className="rounded bg-indigo-100 px-2 py-0.5 text-sm font-medium text-indigo-700"
                    >
                        {c}
                    </span>
                ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1">
                {progression.tags.slice(0, 4).map((tag) => (
                    <span
                        key={tag}
                        className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-500"
                    >
                        {TAG_LABELS[tag] ?? tag}
                    </span>
                ))}
            </div>
        </div>
    );
}

interface SequenceBuilderProps {
    sequence: string[];
    tonic: string;
    mode: "major" | "minor";
    suggestions: NextChordSuggestion[];
    onAddChord: (roman: string) => void;
    onRemoveLast: () => void;
    onClear: () => void;
}

function SequenceBuilder({
    sequence,
    tonic,
    mode,
    suggestions,
    onAddChord,
    onRemoveLast,
    onClear,
}: SequenceBuilderProps) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            {/* Current sequence */}
            <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    Din sekvens
                </p>
                {sequence.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        Klikk på et forslag nedenfor for å starte
                    </p>
                ) : (
                    <div className="flex flex-wrap items-center gap-2">
                        {sequence.map((r, i) => (
                            <span
                                key={i}
                                className="rounded-lg bg-indigo-600 px-3 py-1 text-sm font-medium text-white"
                            >
                                {r}
                            </span>
                        ))}
                        <button
                            onClick={onRemoveLast}
                            className="rounded-lg bg-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-300"
                        >
                            ← Angre
                        </button>
                        <button
                            onClick={onClear}
                            className="rounded-lg bg-red-100 px-2 py-1 text-xs text-red-600 hover:bg-red-200"
                        >
                            Tøm
                        </button>
                    </div>
                )}
            </div>

            {/* Suggestions */}
            <div>
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                    {sequence.length === 0 ? "Start med" : "Hva kommer neste?"}
                </p>
                {suggestions.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        Ingen forslag – prøv en annen akkord
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => onAddChord(s.roman)}
                                className="group flex flex-col items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                            >
                                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">
                                    {s.chord}
                                </span>
                                <span className="text-xs font-mono text-slate-400">{s.roman}</span>
                                <span className="mt-1 text-xs text-slate-400">
                                    {s.frequency}×
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
