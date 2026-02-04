
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { getChordSuggestions, getChordDegree } from "@repo/theory";
import { Button } from "./button";
import { Label } from "./label";
import { Textarea } from "./textarea";
import { cn } from "./utils";

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

    // Filter valid key for theory functions
    const validKey = songKey || "C Major"; // Default if missing

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
        const tokens = textBefore.trim().split(/[\s|-|\|]+/);
        const lastToken = tokens[tokens.length - 1];
        if (lastToken) {
            setCurrentChordContext(lastToken);
        } else {
            setCurrentChordContext(null);
        }
    };

    const suggestions = useMemo(() => {
        // If we have a context chord, we could ask for "what follows X".
        // Current theory package `getChordSuggestions` implementation returns *diatonic chords for the key*.
        // It ignores the input `currentChord` argument mostly (except for placeholder logic).
        // So effectively it returns the "Key Palette".
        // This is perfect for "Suggestions" button list.
        return getChordSuggestions(currentChordContext || "C", validKey);
    }, [validKey, currentChordContext]);


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
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Forslag ({validKey})
                </span>
                <div className="flex flex-wrap gap-2">
                    {suggestions.map((chord: string) => (
                        <Button
                            key={chord}
                            onClick={() => insertChord(chord)}
                            variant="secondary"
                            size="sm"
                        >
                            {chord}
                        </Button>
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
