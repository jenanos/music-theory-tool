
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getChordDegree, getNextChordSuggestionsFromSequence } from "@repo/theory";
import { Button } from "./button";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { cn } from "./utils";

type SuggestionProfile = "triad" | "seventh" | "jazz";

interface ChordEditorProps {
    initialChords: string;
    songKey?: string;
    onSave: (chords: string[], degrees: string[]) => void;
    onCancel: () => void;
}

export function ChordEditor({ initialChords, songKey, onSave, onCancel }: ChordEditorProps) {
    const [chordText, setChordText] = useState(initialChords);
    const [degreesText, setDegreesText] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Current chord for suggestions (the one under cursor or last typed)
    const [currentChordContext, setCurrentChordContext] = useState<string | null>(null);
    const [selectedProfile, setSelectedProfile] = useState<SuggestionProfile | "auto">("auto");

    // Filter valid key for theory functions
    const validKey = songKey || "C Major"; // Default if missing

    const sequence = useMemo(() => {
        return chordText
            .split(/\n/)
            .flatMap((line) => line.split(/[\s|-]+/))
            .map((token) => token.trim())
            .filter(Boolean);
    }, [chordText]);

    const inferredProfile = useMemo<SuggestionProfile>(() => {
        const firstChord = sequence[0]?.toLowerCase() ?? "";
        if (firstChord.includes("7") || firstChord.includes("9") || firstChord.includes("11") || firstChord.includes("13")) {
            return "seventh";
        }
        return "triad";
    }, [sequence]);

    const activeProfile: SuggestionProfile = selectedProfile === "auto" ? inferredProfile : selectedProfile;

    // --- Degree Calculation Logic ---
    useEffect(() => {
        if (!validKey) {
            setDegreesText("");
            return;
        }

        const lines = chordText.split("\n");
        const calculatedLines = lines.map(line => {
            // Split by separators but keep them to preserve structure
            // Regex: split by (space+ or | or -)
            const parts = line.split(/(\s+|\||-)/);

            const degreeParts = parts.map(part => {
                const trimmed = part.trim();
                // Check if it's likely a chord (simple heuristic or use getChordDegree return)
                if (!trimmed || trimmed === "|" || trimmed === "-") return part;

                const degree = getChordDegree(trimmed, validKey);
                return degree ? degree : part; // Keep original text if no degree found (e.g. lyrics/comments in chord line? unlikely but safe)
            });

            return degreeParts.join("");
        });

        setDegreesText(calculatedLines.join("\n"));
    }, [chordText, validKey]);

    // --- Cursor Tracking for Suggestions ---
    const handleCursorChange = () => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const { selectionStart, value } = textarea;
        // Find the "word" at the cursor
        // Look back for separator
        const textBefore = value.substring(0, selectionStart);

        // Simplified: Just suggest based on the Key directly (Palette)
        // AND maybe context if we could parse the previous chord.

        // Let's identify the *previous* chord token before cursor
        const tokens = textBefore.trim().split(/[\s|-]+/);
        const lastToken = tokens[tokens.length - 1];
        if (lastToken) {
            setCurrentChordContext(lastToken);
        } else {
            setCurrentChordContext(null);
        }
    };

    const suggestions = useMemo(() => {
        const suggestionInput = sequence.length > 0
            ? sequence
            : (currentChordContext ? [currentChordContext] : []);

        return getNextChordSuggestionsFromSequence(suggestionInput, validKey, {
            profile: activeProfile,
        });
    }, [validKey, currentChordContext, sequence, activeProfile]);


    const insertChord = (chord: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        // Insert with a trailing space if needed
        const newText = value.substring(0, start) + chord + " " + value.substring(end);

        setChordText(newText);

        // Reset focus and move cursor
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = start + chord.length + 1;
            textarea.selectionEnd = start + chord.length + 1;
            handleCursorChange();
        }, 0);
    };

    const handleSave = () => {
        const cLines = chordText.split("\n");
        const dLines = degreesText.split("\n");
        onSave(cLines, dLines);
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">

            {/* Suggestions Toolbar */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Forslag ({validKey})
                    </span>
                    <select
                        value={selectedProfile}
                        onChange={(e) => setSelectedProfile(e.target.value as SuggestionProfile | "auto")}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                    >
                        <option value="auto">Auto ({inferredProfile})</option>
                        <option value="triad">Triad</option>
                        <option value="seventh">Seventh</option>
                        <option value="jazz">Jazz</option>
                    </select>
                </div>
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                        <div key={`${suggestion.roman}-${suggestion.chord}`} className="flex items-center gap-1">
                            <Button
                                onClick={() => insertChord(suggestion.chord)}
                                variant="secondary"
                                size="sm"
                            >
                                {suggestion.chord}
                            </Button>
                            {suggestion.variants?.[0] && (
                                <button
                                    type="button"
                                    onClick={() => insertChord(suggestion.variants![0]!)}
                                    className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                                    title="Variant"
                                >
                                    +{suggestion.variants[0]}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Editor Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                    <Label htmlFor="chord-input">Akkorder</Label>
                    <Textarea
                        ref={textareaRef}
                        id="chord-input"
                        className={cn(
                            "h-48 font-mono resize-none",
                            "bg-background"
                        )}
                        value={chordText}
                        onChange={(e) => {
                            setChordText(e.target.value);
                            handleCursorChange();
                        }}
                        onKeyUp={handleCursorChange}
                        onClick={handleCursorChange}
                        placeholder="Skriv inn akkorder her..."
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Label>Trinn (Automatisk)</Label>
                        <span className="text-xs text-muted-foreground">Genereres automatisk</span>
                    </div>
                    <Textarea
                        readOnly
                        className={cn(
                            "h-48 font-mono resize-none",
                            "bg-muted text-muted-foreground cursor-not-allowed"
                        )}
                        value={degreesText}
                        placeholder="Trinn vises her..."
                    />
                </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 mt-2 border-t border-border pt-4">
                <Button variant="outline" onClick={onCancel}>
                    Avbryt
                </Button>
                <Button onClick={handleSave}>
                    Lagre
                </Button>
            </div>
        </div>
    );
}
