
"use client";

import React, { useState } from "react";
import { TONIC_OPTIONS, SCALES, type ModeId } from "@repo/theory";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { cn } from "./utils";

const HARMONY_SCALES = SCALES.filter(s => s.isHarmony);

interface CreateSongData {
    id?: string;
    title: string;
    artist?: string;
    key?: string;
    notes?: string;
    arrangement?: string[];
    sections?: {
        id: string;
        label: string;
        chordLines: string[];
        degreeLines: string[];
        notes?: string;
    }[];
}

interface CreateSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateSongData) => Promise<void>;
}

export function CreateSongModal({ isOpen, onClose, onSave }: CreateSongModalProps) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [tonic, setTonic] = useState("C");
    const [modeId, setModeId] = useState<ModeId>("ionian");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [view, setView] = useState<"manual" | "llm">("manual");
    const [llmJson, setLlmJson] = useState("");
    const [llmParseError, setLlmParseError] = useState("");

    const llmPrompt = `Under finner du en JSON-struktur for hvordan en sang skal se ut i min database. Vennligst se på vedlagt bilde eller PDF av noter/låt, og returner en ferdig utfylt JSON basert på denne strukturen.

Slik skal outputen se ut:
{
  "id": "optional-song-id",
  "title": "",
  "artist": "",
  "key": "",
  "notes": "",
  "arrangement": ["section-id-1", "section-id-2"],
  "sections": [
    {
      "id": "section-id",
      "label": "",
      "chordLines": [""],
      "degreeLines": [""],
      "notes": ""
    }
  ]
}

Viktig: Returner kun gyldig JSON. Ingen forklaringer, markdown eller ekstra tekst.`;

    if (!isOpen) return null;

    const resetAndClose = () => {
        onClose();
        setView("manual");
        setError("");
        setLlmParseError("");
        setLlmJson("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Tittel er påkrevd");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await onSave({ title, artist, key: `${tonic} ${modeId}` });
            resetAndClose();
            // Reset form
            setTitle("");
            setArtist("");
            setTonic("C");
            setModeId("ionian");
        } catch (err) {
            setError("Kunne ikke lagre låt. Prøv igjen.");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImportFromLlm = async () => {
        setLlmParseError("");

        try {
            const parsed = JSON.parse(llmJson);
            if (!parsed || typeof parsed !== "object") {
                throw new Error("JSON må være et objekt.");
            }

            if (!parsed.title || typeof parsed.title !== "string") {
                throw new Error("JSON mangler et gyldig felt: title.");
            }

            if (parsed.sections && !Array.isArray(parsed.sections)) {
                throw new Error("Feltet sections må være en liste.");
            }

            if (parsed.arrangement && !Array.isArray(parsed.arrangement)) {
                throw new Error("Feltet arrangement må være en liste.");
            }

            setIsSubmitting(true);
            const normalized: CreateSongData = {
                ...parsed,
                artist: typeof parsed.artist === "string" ? parsed.artist : undefined,
                key: typeof parsed.key === "string" ? parsed.key : undefined,
                notes: typeof parsed.notes === "string" ? parsed.notes : undefined,
                arrangement: Array.isArray(parsed.arrangement)
                    ? parsed.arrangement.filter((item: unknown): item is string => typeof item === "string")
                    : [],
                sections: Array.isArray(parsed.sections)
                    ? parsed.sections.map((section: unknown) => {
                        const candidate = (section ?? {}) as {
                            id?: string;
                            label?: string;
                            chordLines?: unknown;
                            degreeLines?: unknown;
                            notes?: unknown;
                        };

                        if (!candidate.id || !candidate.label) {
                            throw new Error("Hver seksjon må ha feltene id og label.");
                        }

                        return {
                            id: candidate.id,
                            label: candidate.label,
                            chordLines: Array.isArray(candidate.chordLines)
                                ? candidate.chordLines.filter((line): line is string => typeof line === "string")
                                : [],
                            degreeLines: Array.isArray(candidate.degreeLines)
                                ? candidate.degreeLines.filter((line): line is string => typeof line === "string")
                                : [],
                            notes: typeof candidate.notes === "string" ? candidate.notes : undefined,
                        };
                    })
                    : [],
            };

            await onSave(normalized);
            resetAndClose();
            setTitle("");
            setArtist("");
            setTonic("C");
            setModeId("ionian");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Kunne ikke tolke JSON.";
            setLlmParseError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(llmPrompt);
        } catch {
            setLlmParseError("Kunne ikke kopiere prompt automatisk. Marker og kopier manuelt.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className={cn(
                "bg-card rounded-xl shadow-lg border border-border w-full max-w-md overflow-hidden relative z-10",
                "animate-in fade-in zoom-in-95 duration-200"
            )}>
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="p-4 border-b border-border bg-muted/50 flex items-center justify-between">
                        <h3 className="font-bold text-lg text-card-foreground">Ny låt</h3>
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={resetAndClose}
                            className="size-8"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            <span className="sr-only">Lukk</span>
                        </Button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4">
                        {view === "manual" && error && (
                            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                                {error}
                            </div>
                        )}

                        {view === "manual" ? (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="song-title">
                                        Tittel <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="song-title"
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="f.eks. Kjærlighed"
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="song-artist">Artist</Label>
                                    <Input
                                        id="song-artist"
                                        type="text"
                                        value={artist}
                                        onChange={(e) => setArtist(e.target.value)}
                                        placeholder="f.eks. Gete"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Toneart (Key)</Label>
                                    <div className="flex gap-2">
                                        <div className="flex flex-col flex-1">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Grunntone</label>
                                            <select
                                                id="song-key-tonic"
                                                className="rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary"
                                                value={tonic}
                                                onChange={(e) => setTonic(e.target.value)}
                                            >
                                                {TONIC_OPTIONS.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Modalitet</label>
                                            <select
                                                id="song-key-mode"
                                                className="rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary"
                                                value={modeId}
                                                onChange={(e) => setModeId(e.target.value as ModeId)}
                                            >
                                                {HARMONY_SCALES.map((scale) => (
                                                    <option key={scale.id} value={scale.id}>{scale.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-md border border-border bg-muted/30 p-3">
                                    <p className="text-sm text-muted-foreground mb-3">Eller bruk en språkmodell for å generere ferdig JSON fra noter/PDF.</p>
                                    <Button type="button" variant="secondary" onClick={() => setView("llm")}>Legg til med en chatbot / LLM</Button>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
                                    <p className="font-medium text-sm">LLM-import</p>
                                    <p className="text-sm text-muted-foreground">
                                        Kopier prompten under, lim den inn i ChatGPT (eller lignende) sammen med bilde/PDF av låta,
                                        og lim deretter inn JSON-resultatet her.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <Label htmlFor="llm-prompt">Kopierbart prompt</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={copyPrompt}>Kopier prompt</Button>
                                    </div>
                                    <Textarea id="llm-prompt" value={llmPrompt} readOnly className="min-h-56 font-mono text-xs" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="llm-result">Last opp resultat fra språkmodell (JSON)</Label>
                                    <Textarea
                                        id="llm-result"
                                        value={llmJson}
                                        onChange={(e) => setLlmJson(e.target.value)}
                                        placeholder='Lim inn JSON her, f.eks. { "title": "...", "sections": [] }'
                                        className="min-h-40 font-mono text-xs"
                                    />
                                </div>

                                {llmParseError && (
                                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                                        {llmParseError}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border bg-muted/50 flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={resetAndClose}
                            disabled={isSubmitting}
                        >
                            Avbryt
                        </Button>
                        {view === "manual" ? (
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                        Lagrer...
                                    </>
                                ) : (
                                    "Opprett låt"
                                )}
                            </Button>
                        ) : (
                            <>
                                <Button type="button" variant="outline" onClick={() => setView("manual")} disabled={isSubmitting}>
                                    Tilbake
                                </Button>
                                <Button type="button" onClick={handleImportFromLlm} disabled={isSubmitting || !llmJson.trim()}>
                                    {isSubmitting ? "Importerer..." : "Importer JSON"}
                                </Button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
