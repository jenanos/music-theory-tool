"use client";

import { useState } from "react";
import { Section } from "../data";
import { ChordDisplay } from "./ChordDisplay";
import { ChordEditor } from "@repo/ui/chord-editor";
import { getSectionColorClass } from "../utils/sectionColor";

interface SectionItemProps {
    section: Section;
    songKey?: string;
    onUpdate?: (id: string, updates: Partial<Section>) => void;
    onDelete?: (id: string) => void;
    onChordClick?: (chord: string, sectionId: string, lineIndex: number, chordIndex: number, degree?: string) => void;
}

const PRESET_SECTIONS = ["Intro", "Vers", "Pre-chorus", "Refreng", "Bridge", "Mellomspill", "Outro"];

export function SectionItem({ section, songKey, onUpdate, onDelete, onChordClick }: SectionItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [isCustomLabel, setIsCustomLabel] = useState(() => {
        return !PRESET_SECTIONS.includes(section.label) && section.label !== "Ny Seksjon";
    });

    const chordText = section.chordLines.join("\n");

    const isReadonly = !onUpdate;

    return (
        <div
            className={`group relative rounded-lg border border-border shadow-sm transition-shadow hover:shadow-md ${getSectionColorClass(section.label)} p-4`}
        >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                {/* Left side: Label and controls */}
                <div className="flex w-full shrink-0 flex-col gap-2 md:w-48">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col w-full">
                            {isReadonly ? (
                                <span className="min-w-0 flex-1 px-0 py-1 font-semibold text-foreground">
                                    {section.label}
                                </span>
                            ) : (
                                <div className="min-w-0 flex-1">
                                    {!isCustomLabel ? (
                                        <select
                                            className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm font-semibold text-foreground focus:border-primary focus:ring-1 focus:ring-primary"
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
                                    ) : (
                                        <div className="flex items-center gap-1 w-full">
                                            <input
                                                type="text"
                                                autoFocus
                                                className="w-full rounded-md border border-input bg-card px-2 py-1.5 text-sm font-semibold text-foreground focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-muted-foreground placeholder:font-normal"
                                                value={section.label}
                                                onChange={(e) => onUpdate(section.id, { label: e.target.value })}
                                                placeholder="Skriv inn navn..."
                                            />
                                            <button
                                                onClick={() => {
                                                    setIsCustomLabel(false);
                                                    onUpdate(section.id, { label: "Vers" }); // Default back to something sensible
                                                }}
                                                className="shrink-0 p-1.5 text-muted-foreground hover:text-foreground rounded bg-muted hover:bg-muted/80"
                                                title="Avbryt egendefinert"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* Note Toggle Button */}
                            {section.notes && !isEditing && (
                                <button
                                    onClick={() => setShowNotes(!showNotes)}
                                    className="self-start mt-1 flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                                    title={showNotes ? "Skjul notater" : "Vis notater"}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                                        <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
                                    </svg>
                                    {showNotes ? "Skjul notat" : "Vis notat"}
                                </button>
                            )}
                        </div>

                        {!isReadonly && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 shrink-0 z-10 bg-inherit rounded-md pl-1">
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    className={`p-1 text-muted-foreground hover:text-primary ${isEditing ? 'text-primary' : 'opacity-0 group-hover:opacity-100'}`}
                                    title={isEditing ? "Ferdig" : "Rediger"}
                                >
                                    {isEditing ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                                            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                                            <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.326-.795.594-1.225.794l-3.155 1.262c-.49.196-1.002-.122-1.05-.626-.013-.122.016-.251.085-.36z" />
                                        </svg>
                                    )}
                                </button>
                                {onDelete && (
                                    <button
                                        onClick={() => {
                                            if (confirm("Er du sikker på at du vil slette denne seksjonen?")) {
                                                onDelete(section.id);
                                            }
                                        }}
                                        className="p-1 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                                        title="Slett seksjon"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 20 20"
                                            fill="currentColor"
                                            className="h-5 w-5"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 001.5.06l.3-7.5z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {!isReadonly && (
                        <div className="flex items-center gap-2 mt-2">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors ${isEditing ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'}`}
                                title={isEditing ? "Ferdig" : "Rediger"}
                            >
                                {isEditing ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.326-.795.594-1.225.794l-3.155 1.262c-.49.196-1.002-.122-1.05-.626-.013-.122.016-.251.085-.36z" />
                                    </svg>
                                )}
                                <span className="text-xs font-medium">{isEditing ? "Ferdig" : "Rediger"}</span>
                            </button>
                            {onDelete && (
                                <button
                                    onClick={() => {
                                        if (confirm("Er du sikker på at du vil slette denne seksjonen?")) {
                                            onDelete(section.id);
                                        }
                                    }}
                                    className="px-2 py-1.5 flex items-center gap-1.5 rounded-md bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                    title="Slett seksjon"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        className="h-4 w-4"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 001.5.06l.3-7.5z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span className="text-xs font-medium">Slett</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    {isEditing && onUpdate ? (
                        <div className="flex flex-col gap-4">
                            <ChordEditor
                                initialChords={chordText}
                                songKey={songKey}
                                onSave={(chords, degrees) => {
                                    onUpdate(section.id, {
                                        chordLines: chords,
                                        degreeLines: degrees
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
                    ) : (
                        <div className="flex flex-col gap-2">
                            <ChordDisplay
                                chordLine={chordText}
                                degreeLine={section.degreeLines ? section.degreeLines.join("\n") : ""}
                                className="w-full"
                                onClick={() => setIsEditing(true)}
                                onChordClick={onChordClick ? (c, li, ci, d) => onChordClick(c, section.id, li, ci, d) : undefined}
                            />
                            {section.notes && showNotes && (
                                <div className="text-sm text-muted-foreground italic px-3 py-2 bg-muted rounded border border-border">
                                    {section.notes}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
