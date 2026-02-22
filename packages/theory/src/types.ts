
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

export type ChordRichnessProfile = "triad" | "seventh" | "jazz";

export type ChordBaseQuality = "major" | "minor" | "diminished" | "half-diminished" | "suspended";

export type ChordSeventhType = "none" | "7" | "maj7" | "ø7" | "°7";

export type ChordExtensionToken =
    | "6"
    | "add9"
    | "9"
    | "11"
    | "13"
    | "sus2"
    | "sus4"
    | "b9"
    | "#9"
    | "#11"
    | "b13";

export interface ChordVariantOption {
    symbol: string;
    score: number;
    family: string;
}

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
    /**
     * Alias for substituteSymbol to support clearer UI/data usage.
     */
    symbol: string;
    roman?: string;
    category: "basic" | "spice" | "approach";
    tags: string[];
    requiresContext: boolean;
    reason: string;
    score: number;
    sharedTones: number;
    requirements?: string[];
    variants?: ChordVariantOption[];
}

export type SlashChordType = "none" | "inversion" | "non_chord_bass";

export interface SlashChordAnalysis {
    type: SlashChordType;
    chordSymbol: string;
    upperStructure: string;
    bassSymbol?: string;
    rootPc?: number;
    bassPc?: number;
    chordTones: number[];
    inversionIndex?: 0 | 1 | 2 | 3;
    isSeventhChord: boolean;
}

export type ScaleFamily = "diatonic" | "pentatonic" | "symmetric" | "minor" | "melodic_minor_mode" | "blues" | "dim";

export interface ScaleDefinition {
    id: string;
    name: string;
    family: ScaleFamily;
    isHarmony: boolean;
    intervals: number[];
    degree_labels: string[];
    tags: string[];
    use_over: string[];
    avoid_degrees: number[];
    notes_about_use: string;
}
