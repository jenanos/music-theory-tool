
export type ModeId =
    | "ionian"
    | "dorian"
    | "phrygian"
    | "lydian"
    | "mixolydian"
    | "aeolian"
    | "locrian"
    | "harmonic_minor";

export type ChordQuality = "major" | "minor" | "diminished" | "augmented" | "half-diminished";

export type HarmonicFunction = "tonic" | "predominant" | "dominant" | "subdominant" | "variable";

export interface DiatonicChord {
    degree: number;
    roman: string;
    symbol: string;
    quality: string;
    function: HarmonicFunction;
    tones: number[]; // MIDI pitch classes
    toneNames: string[];
    intervalNames: string[];
}

export interface SubstitutionSuggestion {
    targetSymbol: string;
    substituteSymbol: string;
    category: "basic" | "functional" | "jazz" | "modal_interchange" | "chromatic";
    reason: string;
    score: number;
    sharedTones: number;
    requirements?: string[];
}

export interface ScaleDefinition {
    id: ModeId;
    name: string;
    intervals: number[];
}
