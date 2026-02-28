
import { parseChordSymbol } from "./chord_richness";
import { parseKey, parseNoteName, noteName, prefersFlatsForKey } from "./utils";
import type { ModeId } from "./types";

/** Minimal section shape needed for transposition. */
interface TransposeSection {
    chordLines: string[];
    [key: string]: unknown;
}

/**
 * Transpose a single chord symbol by a given number of semitones.
 * Returns the transposed chord with Unicode accidentals (♭/♯) matching
 * the convention used in chord lines.
 */
export function transposeChord(
    chordSymbol: string,
    semitones: number,
    useFlats: boolean,
): string {
    const trimmed = chordSymbol.trim();
    if (!trimmed) return chordSymbol;

    // Normalise to 0–11
    const shift = ((semitones % 12) + 12) % 12;
    if (shift === 0) return chordSymbol;

    const parsed = parseChordSymbol(trimmed);
    if (!parsed) return chordSymbol; // Unparseable – return as-is

    // Transpose root
    const newRootPc = (parsed.rootPc + shift) % 12;
    const newRoot = toUnicode(noteName(newRootPc, useFlats));

    // Transpose slash bass if present
    let slashPart = "";
    if (parsed.slashBass && parsed.slashBassPc !== undefined) {
        const newBassPc = (parsed.slashBassPc + shift) % 12;
        slashPart = "/" + toUnicode(noteName(newBassPc, useFlats));
    }

    return newRoot + parsed.body + slashPart;
}

/**
 * Transpose every chord token in a chord line string.
 * Preserves separators (spaces, hyphens, pipes) exactly as they appear.
 */
export function transposeChordLine(
    line: string,
    semitones: number,
    useFlats: boolean,
): string {
    // Match chord tokens (same regex used elsewhere in the codebase)
    return line.replace(/[^|\s-]+/g, (token) =>
        transposeChord(token, semitones, useFlats),
    );
}

/**
 * Transpose all chord lines in every section of a song when the key changes.
 * Returns new sections with updated chordLines (degreeLines stay the same since
 * they are relative to the key and therefore remain valid).
 */
export function transposeSongSections<T extends TransposeSection>(
    sections: T[],
    oldKey: string,
    newTonic: string,
    newMode: ModeId,
): T[] {
    const parsedOld = parseKey(oldKey);
    if (!parsedOld) return sections;

    const oldTonicPc = parseNoteName(parsedOld.tonic);
    const newTonicPc = parseNoteName(newTonic);
    const semitones = ((newTonicPc - oldTonicPc) % 12 + 12) % 12;

    if (semitones === 0) return sections;

    const useFlats = prefersFlatsForKey(newTonic, newMode);

    return sections.map((section) => ({
        ...section,
        chordLines: section.chordLines.map((line) =>
            transposeChordLine(line, semitones, useFlats),
        ),
    }));
}

/** Convert ASCII accidentals to Unicode for display in chord lines. */
function toUnicode(note: string): string {
    return note.replace(/#/g, "♯").replace(/b/g, "♭");
}
