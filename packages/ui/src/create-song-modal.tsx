
"use client";

import React, { useState } from "react";
import { TONIC_OPTIONS, SCALES, type ModeId } from "@repo/theory";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
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
        description?: string;
        chordLines: string[];
        degreeLines: string[];
        notes?: string;
    }[];
    visibility?: "private" | "group" | "shared";
    groupId?: string | null;
}

type SongVisibility = "private" | "group" | "shared";

interface GroupOption {
    id: string;
    name: string;
}

const VISIBILITY_OPTIONS = [
    { value: "private" as const, label: "Privat", desc: "Kun for deg" },
    { value: "group" as const, label: "Gruppe", desc: "Delt med en gruppe" },
    { value: "shared" as const, label: "Felles", desc: "Synlig for alle" },
] as const;

function VisibilitySelector({
    visibility,
    onVisibilityChange,
    selectedGroupId,
    onGroupIdChange,
    groups,
    idSuffix = "",
}: {
    visibility: SongVisibility;
    onVisibilityChange: (v: SongVisibility) => void;
    selectedGroupId: string;
    onGroupIdChange: (id: string) => void;
    groups: GroupOption[];
    idSuffix?: string;
}) {
    return (
        <div className="space-y-2">
            <Label>Synlighet</Label>
            <div className="flex gap-2">
                {VISIBILITY_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onVisibilityChange(opt.value)}
                        className={cn(
                            "flex-1 rounded-md border p-2 text-left transition-colors",
                            visibility === opt.value
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-muted text-muted-foreground hover:border-foreground/30"
                        )}
                    >
                        <div className="text-sm font-medium">{opt.label}</div>
                        <div className="text-[10px]">{opt.desc}</div>
                    </button>
                ))}
            </div>
            {visibility === "group" && groups.length > 0 && (
                <div className="mt-2">
                    <Label htmlFor={`song-group${idSuffix}`}>Gruppe</Label>
                    <select
                        id={`song-group${idSuffix}`}
                        className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-primary mt-1"
                        value={selectedGroupId}
                        onChange={(e) => onGroupIdChange(e.target.value)}
                    >
                        <option value="">Velg gruppe...</option>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                </div>
            )}
            {visibility === "group" && groups.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                    Du har ingen grupper ennå. Be admin om å opprette en.
                </p>
            )}
        </div>
    );
}

const PRESET_LABELS = ["Intro", "Vers", "Pre-chorus", "Refreng", "Bridge", "Mellomspill", "Outro"];

/** Try to split a label like "Vers del 1 (atmos)" into { label: "Vers", description: "del 1 (atmos)" } */
function normalizeSectionLabel(rawLabel: string, rawDescription?: string): { label: string; description?: string } {
    // If already a preset label, keep as-is
    if (PRESET_LABELS.includes(rawLabel)) {
        return { label: rawLabel, description: rawDescription || undefined };
    }

    // Try to find a preset that the label starts with (case-insensitive)
    const lower = rawLabel.toLowerCase();
    for (const preset of PRESET_LABELS) {
        if (lower.startsWith(preset.toLowerCase())) {
            const rest = rawLabel.slice(preset.length).trim();
            const desc = [rest, rawDescription].filter(Boolean).join(" ").trim();
            return { label: preset, description: desc || undefined };
        }
    }

    // Also check common aliases
    const aliases: Record<string, string> = {
        "ref": "Refreng", "chorus": "Refreng",
        "bro": "Bridge", "stikk": "Bridge",
        "introriff": "Intro", "riff": "Mellomspill",
        "solo": "Mellomspill", "instrumental": "Mellomspill",
        "ending": "Outro", "outro": "Outro",
    };

    // Check if the first word is an alias
    const firstWord = rawLabel.split(/\s+/)[0]?.toLowerCase() ?? "";
    if (aliases[firstWord]) {
        const rest = rawLabel.slice(firstWord.length).trim();
        const desc = [rest, rawDescription].filter(Boolean).join(" ").trim();
        return { label: aliases[firstWord], description: desc || undefined };
    }

    // Check whole label as alias
    if (aliases[lower]) {
        return { label: aliases[lower], description: rawDescription || undefined };
    }

    // Fallback: keep as-is (will show as custom)
    return { label: rawLabel, description: rawDescription || undefined };
}

interface CreateSongModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateSongData) => Promise<void>;
    groups?: GroupOption[];
}

export function CreateSongModal({ isOpen, onClose, onSave, groups = [] }: CreateSongModalProps) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [tonic, setTonic] = useState("C");
    const [modeId, setModeId] = useState<ModeId>("ionian");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [view, setView] = useState<"manual" | "llm">("manual");
    const [llmJson, setLlmJson] = useState("");
    const [llmParseError, setLlmParseError] = useState("");
    const [promptCopied, setPromptCopied] = useState(false);
    const [visibility, setVisibility] = useState<SongVisibility>("private");
    const [selectedGroupId, setSelectedGroupId] = useState<string>("");

    const llmPrompt = `Under finner du en JSON-struktur for hvordan en sang skal se ut i min database. Vennligst se på vedlagt bilde eller PDF av noter/låt, og returner en ferdig utfylt JSON basert på denne strukturen.

Slik skal outputen se ut:
{
  "title": "",
  "artist": "",
  "key": "",
  "notes": "",
  "arrangement": ["section-id-1", "section-id-2"],
  "sections": [
    {
      "id": "section-id",
      "label": "",
      "description": "",
      "chordLines": [""],
      "degreeLines": [""],
      "notes": ""
    }
  ]
}

REGLER FOR SEKSJONER:
- "label" MÅ være en av disse forhåndsdefinerte verdiene: "Intro", "Vers", "Pre-chorus", "Refreng", "Bridge", "Mellomspill", "Outro".
- "description" er valgfritt og brukes for tilleggsinformasjon, f.eks. "del 1 (atmos)", "(groove)", "2" osv. Bruk dette istedenfor å lage egendefinerte labels.
- Eksempel: istedenfor label="Vers del 1 (atmos)", bruk label="Vers" og description="del 1 (atmos)".

REGLER FOR chordLines:
- Akkorder separeres med " - " (mellomrom-bindestrek-mellomrom).
- Hver linje i chordLines representerer én linje/rad med akkorder.
- Taktartskifter skrives INLINE foran akkordene de gjelder for, som et eget token separert med mellomrom (IKKE med " - ").
  Eksempel: "5/4 Cmaj7 - G/B - 6/4 B/D# - Em" betyr at Cmaj7 og G/B spilles i 5/4, mens B/D# og Em spilles i 6/4.
  Skriv kun taktart der den faktisk endres. Hvis hele seksjonen er i 4/4, utelat taktarten.
- IKKE inkluder repetisjoner som "x2", "x4" osv. som akkorder. Hvis en linje gjentas, skriv den ut eksplisitt som separate linjer, eller noter det i "notes"-feltet.
- IKKE inkluder taktangivelser som "(4 takter)" eller lignende som akkorder.

REGLER FOR degreeLines:
- degreeLines skal IKKE inneholde taktarter. Taktarter hører kun hjemme i chordLines.
- Grader/trinn skrives med romertall: i, ii, III, IV, V, vi, vii osv.
- Bruk " - " som separator, tilsvarende chordLines (men uten taktarter).

Viktig: Returner kun gyldig JSON. Ingen forklaringer, markdown eller ekstra tekst.`;

    if (!isOpen) return null;

    const resetAndClose = () => {
        onClose();
        setView("manual");
        setError("");
        setLlmParseError("");
        setLlmJson("");
        setPromptCopied(false);
        setVisibility("private");
        setSelectedGroupId("");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Tittel er påkrevd");
            return;
        }

        if (visibility === "group" && !selectedGroupId) {
            setError("Velg en gruppe for gruppesynlighet");
            return;
        }

        setIsSubmitting(true);
        setError("");

        try {
            await onSave({
                title,
                artist,
                key: `${tonic} ${modeId}`,
                visibility,
                groupId: visibility === "group" ? selectedGroupId : null,
            });
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

            // Treat empty or whitespace-only id as undefined
            const songId = (typeof parsed.id === "string" && parsed.id.trim()) ? parsed.id.trim() : undefined;

            const normalizedData: CreateSongData = {
                ...parsed,
                id: songId,
                artist: typeof parsed.artist === "string" && parsed.artist.trim() ? parsed.artist : undefined,
                key: typeof parsed.key === "string" && parsed.key.trim() ? parsed.key : undefined,
                notes: typeof parsed.notes === "string" && parsed.notes.trim() ? parsed.notes : undefined,
                arrangement: Array.isArray(parsed.arrangement)
                    ? parsed.arrangement.filter((item: unknown): item is string => typeof item === "string")
                    : [],
                sections: Array.isArray(parsed.sections)
                    ? parsed.sections.map((section: unknown) => {
                        const candidate = (section ?? {}) as {
                            id?: string;
                            label?: string;
                            description?: string;
                            chordLines?: unknown;
                            degreeLines?: unknown;
                            notes?: unknown;
                        };

                        if (!candidate.id || !candidate.label) {
                            throw new Error("Hver seksjon må ha feltene id og label.");
                        }

                        const normalized = normalizeSectionLabel(
                            candidate.label,
                            typeof candidate.description === "string" ? candidate.description : undefined,
                        );

                        return {
                            id: candidate.id,
                            label: normalized.label,
                            description: normalized.description,
                            chordLines: Array.isArray(candidate.chordLines)
                                ? candidate.chordLines.filter((line): line is string => typeof line === "string")
                                : [],
                            degreeLines: Array.isArray(candidate.degreeLines)
                                ? candidate.degreeLines.filter((line): line is string => typeof line === "string")
                                : [],
                            notes: typeof candidate.notes === "string" && candidate.notes.trim() ? candidate.notes : undefined,
                        };
                    })
                    : [],
                visibility,
                groupId: visibility === "group" ? selectedGroupId : null,
            };

            await onSave(normalizedData);
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
            setPromptCopied(true);
            setTimeout(() => setPromptCopied(false), 2000);
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
                "bg-card rounded-xl shadow-lg border border-border w-full max-w-lg overflow-hidden relative z-10 max-h-[90vh] flex flex-col",
                "animate-in fade-in zoom-in-95 duration-200"
            )}>
                <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="flex-none p-4 border-b border-border bg-muted/50 flex items-center justify-between">
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

                    {/* Content - scrollable */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
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

                                {/* Visibility selector */}
                                <VisibilitySelector
                                    visibility={visibility}
                                    onVisibilityChange={setVisibility}
                                    selectedGroupId={selectedGroupId}
                                    onGroupIdChange={setSelectedGroupId}
                                    groups={groups}
                                />

                                <div className="rounded-md border border-border bg-muted/30 p-3">
                                    <p className="text-sm text-muted-foreground mb-3">Eller bruk en språkmodell for å generere ferdig JSON fra noter/PDF.</p>
                                    <Button type="button" variant="secondary" onClick={() => setView("llm")} className="w-full">Importer med LLM</Button>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Step 1: Copy prompt */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex-none size-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">1</span>
                                        <Label className="text-sm font-medium">Kopier prompten</Label>
                                    </div>
                                    <p className="text-xs text-muted-foreground ml-7">
                                        Lim den inn i ChatGPT (e.l.) sammen med bilde/PDF av låta.
                                    </p>
                                    <div className="ml-7">
                                        <details className="group">
                                            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground select-none">
                                                Vis prompt
                                            </summary>
                                            <Textarea value={llmPrompt} readOnly className="mt-2 min-h-32 font-mono text-[10px] leading-tight" />
                                        </details>
                                        <Button type="button" variant="outline" size="sm" onClick={copyPrompt} className="mt-2">
                                            {promptCopied ? "Kopiert!" : "Kopier prompt"}
                                        </Button>
                                    </div>
                                </div>

                                {/* Step 2: Paste JSON */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex-none size-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">2</span>
                                        <Label htmlFor="llm-result" className="text-sm font-medium">Lim inn JSON-resultatet</Label>
                                    </div>
                                    <div className="ml-7">
                                        <Textarea
                                            id="llm-result"
                                            value={llmJson}
                                            onChange={(e) => setLlmJson(e.target.value)}
                                            placeholder='{ "title": "...", "sections": [...] }'
                                            className="min-h-32 font-mono text-xs"
                                        />
                                    </div>
                                </div>

                                {llmParseError && (
                                    <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md border border-destructive/20">
                                        {llmParseError}
                                    </div>
                                )}

                                {/* Visibility selector in LLM view */}
                                <VisibilitySelector
                                    visibility={visibility}
                                    onVisibilityChange={setVisibility}
                                    selectedGroupId={selectedGroupId}
                                    onGroupIdChange={setSelectedGroupId}
                                    groups={groups}
                                    idSuffix="-llm"
                                />
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex-none p-4 border-t border-border bg-muted/50 flex justify-end gap-2">
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
                                    {isSubmitting ? "Importerer..." : "Importer"}
                                </Button>
                            </>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
