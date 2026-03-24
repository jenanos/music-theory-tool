"use client";

import { useState } from "react";
import { Section } from "../data";
import { ChordDisplay } from "./ChordDisplay";
import { ChordEditor } from "@repo/ui/chord-editor";
import { getSectionColorClass } from "../utils/sectionColor";

interface SectionItemProps {
    section: Section;
    songKey?: string;
    hideRepeats?: boolean;
    showAsPercent?: boolean;
    onUpdate?: (id: string, updates: Partial<Section>) => void;
    onDelete?: (id: string) => void;
    onChordClick?: (chord: string, sectionId: string, lineIndex: number, chordIndex: number, degree?: string) => void;
}

const PRESET_SECTIONS = ["Intro", "Vers", "Pre-chorus", "Refreng", "Bridge", "Mellomspill", "Outro"];

export function SectionItem({ section, songKey, hideRepeats, showAsPercent, onUpdate, onDelete, onChordClick }: SectionItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [isCustomLabel, setIsCustomLabel] = useState(() => {
        return !PRESET_SECTIONS.includes(section.label) && section.label !== "Ny Seksjon";
    });

    const chordText = section.chordLines.join("\n");

    const isReadonly = !onUpdate;

    // Display label: combine label + description
    const displayLabel = section.description
        ? `${section.label} ${section.description}`
        : section.label;

    return (
        <>
            <div
                className={`group relative min-w-[18rem] w-fit rounded-lg border border-border shadow-sm transition-shadow hover:shadow-md ${getSectionColorClass(section.label)} p-2 md:p-3`}
            >
                <div className="flex flex-col gap-1.5 md:gap-3 md:flex-row md:items-start md:gap-4">
                    {/* Left side: Label and controls */}
                    <div className="flex w-full shrink-0 flex-col gap-1 md:gap-2 md:w-40">
                        <div className="flex items-center justify-between gap-1 md:items-start md:gap-2">
                            <div className="flex min-w-0 flex-1 flex-col">
                                {isReadonly ? (
                                    <span className="min-w-0 flex-1 px-0 py-0.5 md:py-1 text-sm md:text-base font-semibold text-foreground">
                                        {displayLabel}
                                    </span>
                                ) : (
                                    <div className="min-w-0 flex-1 flex flex-col gap-1">
                                        {!isCustomLabel ? (
                                            <div className="flex items-center gap-1">
                                                <select
                                                    className="flex-shrink-0 rounded-md border border-input bg-card px-1.5 py-1 md:px-2 md:py-1.5 text-xs md:text-sm font-semibold text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
                                                    value={PRESET_SECTIONS.includes(section.label) ? section.label : (section.label === "Ny Seksjon" ? "default" : "custom")}
                                                    onChange={(e) => {
                                                        if (e.target.value === "custom") {
                                                            setIsCustomLabel(true);
                                                            onUpdate(section.id, { label: "" });
                                                        } else {
                                                            onUpdate(section.id, { label: e.target.value });
                                                        }
                                                    }}
                                                >
                                                    <option value="default" disabled hidden>Velg seksjon...</option>
                                                    {PRESET_SECTIONS.map((s) => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                    <option value="custom">Egendefinert...</option>
                                                </select>
                                                <input
                                                    type="text"
                                                    className="min-w-0 flex-1 rounded-md border border-input bg-card px-1.5 py-1 md:px-2 md:py-1.5 text-xs md:text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 placeholder:font-normal"
                                                    value={section.description || ""}
                                                    onChange={(e) => onUpdate(section.id, { description: e.target.value || undefined })}
                                                    placeholder="beskrivelse..."
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex w-full items-center gap-1">
                                                <input
                                                    type="text"
                                                    autoFocus
                                                    className="w-full rounded-md border border-input bg-card px-1.5 py-1 md:px-2 md:py-1.5 text-xs md:text-sm font-semibold text-foreground focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground placeholder:font-normal"
                                                    value={section.label}
                                                    onChange={(e) => onUpdate(section.id, { label: e.target.value })}
                                                    placeholder="Skriv inn navn..."
                                                />
                                                <button
                                                    onClick={() => {
                                                        setIsCustomLabel(false);
                                                        onUpdate(section.id, { label: "Vers" });
                                                    }}
                                                    className="rounded bg-muted p-1 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                                                    title="Avbryt egendefinert"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 md:h-4 md:w-4">
                                                        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Mobile: compact action buttons inline with label */}
                            <div className="flex items-center gap-0.5 md:hidden">
                                {section.notes && !isEditing && (
                                    <button
                                        onClick={() => setShowNotes(!showNotes)}
                                        className={`p-1 rounded transition-colors ${showNotes ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
                                        title={showNotes ? "Skjul notat" : "Vis notat"}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                                            <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                )}
                                {!isReadonly && (
                                    <>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="p-1 rounded text-muted-foreground transition-colors hover:text-foreground"
                                            title="Rediger"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                                <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.326-.795.594-1.225.794l-3.155 1.262c-.49.196-1.002-.122-1.05-.626-.013-.122.016-.251.085-.36z" />
                                            </svg>
                                        </button>
                                        {onDelete && (
                                            <button
                                                onClick={() => {
                                                    if (confirm("Er du sikker på at du vil slette denne seksjonen?")) {
                                                        onDelete(section.id);
                                                    }
                                                }}
                                                className="p-1 rounded text-muted-foreground transition-colors hover:text-destructive"
                                                title="Slett seksjon"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 001.5.06l.3-7.5z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Desktop: notes toggle and action buttons */}
                        <div className="hidden md:flex md:flex-col md:gap-1">
                            {section.notes && !isEditing && (
                                <button
                                    onClick={() => setShowNotes(!showNotes)}
                                    className="mt-1 flex self-start items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                                    title={showNotes ? "Skjul notater" : "Vis notater"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                                        <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
                                    </svg>
                                    {showNotes ? "Skjul notat" : "Vis notat"}
                                </button>
                            )}
                        </div>

                        {!isReadonly && (
                            <div className="mt-1 hidden flex-col items-stretch gap-1.5 md:flex">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
                                    title="Rediger"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.326-.795.594-1.225.794l-3.155 1.262c-.49.196-1.002-.122-1.05-.626-.013-.122.016-.251.085-.36z" />
                                    </svg>
                                    <span>Rediger</span>
                                </button>
                                {onDelete && (
                                    <button
                                        onClick={() => {
                                            if (confirm("Er du sikker på at du vil slette denne seksjonen?")) {
                                                onDelete(section.id);
                                            }
                                        }}
                                        className="flex w-full items-center justify-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                        title="Slett seksjon"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 001.5.06l.3-7.5z" clipRule="evenodd" />
                                        </svg>
                                        <span>Slett</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2">
                            <ChordDisplay
                                chordLine={chordText}
                                degreeLine={section.degreeLines ? section.degreeLines.join("\n") : ""}
                                className="w-full"
                                hideRepeats={hideRepeats}
                                showAsPercent={showAsPercent}
                                onClick={() => {
                                    if (!isReadonly) {
                                        setIsEditing(true);
                                    }
                                }}
                                onChordClick={onChordClick ? (c, li, ci, d) => onChordClick(c, section.id, li, ci, d) : undefined}
                            />
                            {section.notes && showNotes && (
                                <div className="rounded border border-border bg-muted px-2 py-1.5 md:px-3 md:py-2 text-xs md:text-sm italic text-muted-foreground">
                                    {section.notes}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {isEditing && onUpdate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-4xl rounded-xl border border-border bg-card shadow-xl">
                        <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <h3 className="text-base font-semibold text-foreground">Rediger seksjon: {displayLabel || "Uten navn"}</h3>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                title="Lukk"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                </svg>
                            </button>
                        </div>
                        <div className="max-h-[80vh] overflow-y-auto p-4">
                            <div className="flex flex-col gap-4">
                                <ChordEditor
                                    initialChords={chordText}
                                    songKey={songKey}
                                    onSave={(chords, degrees) => {
                                        onUpdate(section.id, {
                                            chordLines: chords,
                                            degreeLines: degrees,
                                        });
                                        setIsEditing(false);
                                    }}
                                    onCancel={() => setIsEditing(false)}
                                />

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-foreground">Notater (valgfritt)</label>
                                    <textarea
                                        className="w-full resize-y rounded-md border-0 bg-muted p-3 text-sm text-foreground shadow-inner focus:ring-2 focus:ring-primary"
                                        value={section.notes || ""}
                                        onChange={(e) => onUpdate(section.id, { notes: e.target.value })}
                                        placeholder="Notater for denne seksjonen..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10" onClick={() => setIsEditing(false)} />
                </div>
            )}
        </>
    );
}
