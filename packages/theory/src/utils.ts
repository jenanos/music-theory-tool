
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
