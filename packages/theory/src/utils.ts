
import { MODES } from "./data";

export const SHARP_NOTES = [
    "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
];

export const FLAT_NOTES = [
    "C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"
];

export const NOTE_TO_PC: Record<string, number> = {
    C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6,
    G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11,
};

export const FLAT_PREFERRED_TONICS = new Set([
    "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "d", "g", "c", "f", "bb", "eb" // Added minors typically using flats
]);

export function parseNoteName(note: string): number {
    const normalized = note.trim();
    const pc = NOTE_TO_PC[normalized];
    if (pc === undefined) {
        // Attempt basic normalization if needed, but strict is fine for now
        throw new Error(`Ukjent tone: ${note}`);
    }
    return pc;
}

export function prefersFlats(note: string): boolean {
    if (note.includes("b")) return true;
    if (note.includes("#")) return false;
    return FLAT_PREFERRED_TONICS.has(note);
}

export function noteName(pc: number, useFlats: boolean): string {
    const nameSet = useFlats ? FLAT_NOTES : SHARP_NOTES;
    return nameSet[((pc % 12) + 12) % 12]!;
}

export function getScaleIntervals(modeId: string): number[] {
    return MODES[modeId]?.intervals || MODES.ionian!.intervals;
}

import { ModeId } from "./types";

/**
 * Robustly parses a key string into tonic and mode.
 * Handles cases like "Fm", "F Major", "F# dorisk", "Eb", "FM".
 */
export function parseKey(keyString: string): { tonic: string; mode: ModeId } | null {
    if (!keyString) return null;

    // Normalize spaces and trim
    const input = keyString.trim().replace(/\s+/g, ' ');
    if (input.length === 0) return null;

    // 1. Extract Tonic
    // Match note name at start: A-G, optionally # or b/flat, case insensitive mostly but first letter upper
    // Regex: ^([A-G](?:#|b|flat)?)(.*)$
    // Actually, let's keep it simple. `utils.ts` has `NOTE_TO_PC` but that expects specific formatting.
    // Let's manually parse the start.

    const match = input.match(/^([A-Ga-g])(#|b|flat)?(.*)$/i);
    if (!match) return null;

    let tonicBase = match[1]!.toUpperCase();
    let accidental = match[2] || "";
    let rest = match[3] || "";

    // Normalize accidental
    if (accidental.toLowerCase() === "flat") accidental = "b";
    let tonic = tonicBase + accidental;

    let mode: ModeId = "ionian"; // Default

    // 2. Analyze the rest of the string to find Mode
    // "m", "min", "minor", "moll" -> aeolian
    // "M", "Maj", "Major", "dur" -> ionian
    // "dim" -> locrian? No, usually implied minor/diminished context, but let's stick to standard modes.

    const restLower = rest.toLowerCase();

    // Check strict "m" suffix specifically directly after tonic which usually means minor
    // BUT "FM" could mean "F Major" in some contexts, but usually "m" = minor, "M" = Major.
    // However, the user error "Unknown note: FM" suggests they typed "FM" and it was parsed as note "FM".
    // "FM" is often used for F Major. "Fm" for F Minor.
    // Let's look at the original input casing for the suffix "m" vs "M" if it's just one letter.

    if (rest.trim() === "m") {
        mode = "aeolian";
    } else if (rest.trim() === "M") {
        mode = "ionian";
    } else {
        // Search for keywords
        if (restLower.includes("min") || restLower.includes("moll") || restLower.includes("aeol")) {
            mode = "aeolian";
        } else if (restLower.includes("maj") || restLower.includes("dur") || restLower.includes("ion")) {
            mode = "ionian";
        } else if (restLower.includes("dor")) {
            mode = "dorian";
        } else if (restLower.includes("phryg") || restLower.includes("fryg")) {
            mode = "phrygian";
        } else if (restLower.includes("lyd")) {
            mode = "lydian";
        } else if (restLower.includes("mix") || restLower.includes("mik")) {
            mode = "mixolydian";
        } else if (restLower.includes("locr") || restLower.includes("lokr")) {
            mode = "locrian";
        } else {
            // Default behavior if just "F" or "F#" -> Major (Ionian) matches standard lead sheet convention
            // UNLESS the tonic itself looked like "Am" (A minor).
            // But our regex split "Am" into "A" + "" + "m". So that's handled by `rest`.
            // What if `parseKey("Fm7")`? "m7" implies minor.
            if (restLower.includes("m") && !restLower.includes("maj") && !restLower.includes("mix")) {
                // Heuristic: if it has 'm' and not 'major'/'mixolydian', likely minor
                // Risk: "F mixolydian" has 'm'.
                // So checking "mix" above protects us.
                // "dim"? -> locrian maybe, or just treat as logic for chords.
                // For key signature, usually maps to Minor.
                mode = "aeolian";
            }
        }
    }

    // Special fix for "FM" -> F Major if the user typed uppercase M
    if (rest.trim() === "M") {
        mode = "ionian";
    }

    return { tonic, mode };
}
