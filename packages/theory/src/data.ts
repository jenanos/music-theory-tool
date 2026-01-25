
export const CHORD_QUALITIES = {
    maj7: [0, 4, 7, 11],
    m7: [0, 3, 7, 10],
    "7": [0, 4, 7, 10],
    m7b5: [0, 3, 6, 10],
    dim7: [0, 3, 6, 9],
    "6": [0, 4, 7, 9],
    m6: [0, 3, 7, 9],
    sus4_7: [0, 5, 7, 10],
} as const;

export type ChordQualityKey = keyof typeof CHORD_QUALITIES;

export interface ModeDefinition {
    id: string;
    name: string; // Added human readable name
    degree_labels: string[];
    intervals: number[];
}

export const MODES: Record<string, ModeDefinition> = {
    ionian: {
        id: "ionian",
        name: "Dur (ionisk)",
        degree_labels: ["1", "2", "3", "4", "5", "6", "7"],
        intervals: [0, 2, 4, 5, 7, 9, 11],
    },
    dorian: {
        id: "dorian",
        name: "Dorisk",
        degree_labels: ["1", "2", "b3", "4", "5", "6", "b7"],
        intervals: [0, 2, 3, 5, 7, 9, 10],
    },
    phrygian: {
        id: "phrygian",
        name: "Frygisk",
        degree_labels: ["1", "b2", "b3", "4", "5", "b6", "b7"],
        intervals: [0, 1, 3, 5, 7, 8, 10],
    },
    lydian: {
        id: "lydian",
        name: "Lydisk",
        degree_labels: ["1", "2", "3", "#4", "5", "6", "7"],
        intervals: [0, 2, 4, 6, 7, 9, 11],
    },
    mixolydian: {
        id: "mixolydian",
        name: "Mixolydisk",
        degree_labels: ["1", "2", "3", "4", "5", "6", "b7"],
        intervals: [0, 2, 4, 5, 7, 9, 10],
    },
    aeolian: {
        id: "aeolian",
        name: "Naturlig moll (aeolisk)",
        degree_labels: ["1", "2", "b3", "4", "5", "b6", "b7"],
        intervals: [0, 2, 3, 5, 7, 8, 10],
    },
    locrian: {
        id: "locrian",
        name: "Lokrisk",
        degree_labels: ["1", "b2", "b3", "4", "b5", "b6", "b7"],
        intervals: [0, 1, 3, 5, 6, 8, 10],
    },
    harmonic_minor: {
        id: "harmonic_minor",
        name: "Harmonisk moll",
        degree_labels: ["1", "2", "b3", "4", "5", "b6", "7"],
        intervals: [0, 2, 3, 5, 7, 8, 11],
    },
};

export const MODE_DIATONIC_7THS: Record<string, string[]> = {
    ionian: ["maj7", "m7", "m7", "maj7", "7", "m7", "m7b5"],
    dorian: ["m7", "m7", "maj7", "7", "m7", "m7b5", "maj7"],
    phrygian: ["m7", "maj7", "7", "m7", "m7b5", "maj7", "m7"],
    lydian: ["maj7", "7", "m7", "m7b5", "maj7", "m7", "m7"],
    mixolydian: ["7", "m7", "m7b5", "maj7", "m7", "m7", "maj7"],
    aeolian: ["m7", "m7b5", "maj7", "m7", "m7", "maj7", "7"],
    locrian: ["m7b5", "maj7", "m7", "m7", "maj7", "7", "m7"],
    harmonic_minor: ["m(maj7)", "m7b5", "augMaj7", "m7", "7", "maj7", "dim7"],
};

export const FUNCTION_GROUPS: Record<
    string, // mode id
    { tonic: number[]; predominant: number[]; dominant: number[] }
> = {
    ionian: { tonic: [1, 3, 6], predominant: [2, 4], dominant: [5, 7] },
    aeolian: { tonic: [1, 3, 6], predominant: [2, 4], dominant: [5, 7] }, // Using same as i/III/VI logic usually
    dorian: { tonic: [1, 3, 6], predominant: [2, 4], dominant: [5, 7] },
    mixolydian: { tonic: [1, 6], predominant: [2, 4], dominant: [5, 7, 3] },
    // Fallbacks for others can be defined or defaulted
    phrygian: { tonic: [1, 3], predominant: [2, 4, 6], dominant: [5, 7] }, // Example/Guess, can refine
    lydian: { tonic: [1, 3, 6], predominant: [2, 4], dominant: [5, 7] },
    locrian: { tonic: [1], predominant: [2, 4], dominant: [5, 7] }, // Unstable anyway
    harmonic_minor: { tonic: [1, 3], predominant: [2, 4, 6], dominant: [5, 7] },
};

export const MODAL_SIGNATURES: Record<string, string[]> = {
    ionian: ["IV", "V"],
    dorian: ["IV", "ii"], // Major IV characteristic
    phrygian: ["II", "vii"], // Major II (Neapolitan function relative to minor)
    lydian: ["II", "vii"], // Major II characteristic
    mixolydian: ["VII", "v"], // Major VII (Backdoor/Flat 7 relative to major), minor v
    aeolian: ["VI", "VII", "v"], // Natural minor flow
    locrian: ["II", "i°"], // Major II
    harmonic_minor: ["V", "VI"], // Dominant V, Major VI
};

export interface SubstitutionRule {
    id: string;
    category: "basic" | "functional" | "jazz" | "modal_interchange" | "chromatic";
    name: string;
    when: {
        scope?: string; // "diatonic"
        min_shared_tones?: number;
        target_degree_not_in?: number[];
        quality_in?: string[];
        function_is?: string; // "dominant"
        resolves_to_degree?: number;
        mode_is?: string;
        degree_is?: number;
        has_next_chord?: boolean;
    };
    generate: {
        op: string;
        borrow_degree?: number;
        borrow_quality?: string;
    };
    explain_template: string;
}

export const SUBSTITUTION_RULES: SubstitutionRule[] = [
    {
        id: "diatonic_same_function_common_tone",
        category: "basic",
        name: "Diatonisk: samme funksjon",
        when: { scope: "diatonic", min_shared_tones: 2 }, // Adjusted to 2 to be more permissive if 3 is too strict for triads
        generate: { op: "swap_degree_within_same_function_group" },
        explain_template: "Samme funksjon; deler {shared} toner.",
    },
    {
        id: "secondary_dominant_to_degree",
        category: "functional",
        name: "Sekundær dominant",
        when: { target_degree_not_in: [1] },
        generate: { op: "make_V7_of_target_degree" },
        explain_template: "V/{targetRoman} som leder til {targetChord}.",
    },
    {
        id: "secondary_leadingtone_dim_to_degree",
        category: "functional",
        name: "Sekundær ledetone (vii°/x)",
        when: { target_degree_not_in: [1] },
        generate: { op: "make_vii_dim7_of_target_degree" },
        explain_template: "vii°7/{targetRoman} som leder til {targetChord}.",
    },
    {
        id: "tritone_sub_for_dominant7",
        category: "jazz",
        name: "Tritonus-sub for dominant",
        when: { quality_in: ["7"], function_is: "dominant" },
        generate: { op: "tritone_substitute_dominant7" },
        explain_template: "Tritonus-sub: deler tritonusintervall, kromatisk bass.",
    },
    {
        id: "backdoor_bVII7_to_I",
        category: "jazz",
        name: "Backdoor dominant",
        when: { function_is: "dominant" },
        generate: { op: "make_bVII7_to_I" },
        explain_template: "bVII7 → I (backdoor resolution).",
    },
    {
        id: "borrowed_iv_in_major",
        category: "modal_interchange",
        name: "Lånt iv i dur",
        when: { mode_is: "ionian", degree_is: 4 },
        generate: {
            op: "borrow_from_parallel_aeolian",
            borrow_degree: 4,
            borrow_quality: "m7",
        },
        explain_template: "Lånt fra parallell moll (iv).",
    },
    {
        id: "borrowed_bVI_in_major",
        category: "modal_interchange",
        name: "Lånt bVI i dur",
        when: { mode_is: "ionian" },
        generate: {
            op: "borrow_from_parallel_aeolian",
            borrow_degree: 6,
            borrow_quality: "maj7",
        },
        explain_template: "Lånt fra parallell moll (bVI).",
    },
    {
        id: "borrowed_V7_in_minor",
        category: "functional",
        name: "V7 i moll",
        when: { mode_is: "aeolian", degree_is: 5 },
        generate: {
            op: "replace_with_V7_harmonic_minor"
        },
        explain_template: "V7 fra harmonisk moll (sterkere oppløsning)."
    },
    {
        id: "diminished_approach_up_semitone",
        category: "chromatic",
        name: "Dim approach-akkord",
        when: { has_next_chord: true },
        generate: { op: "dim7_approach_to_next_root" },
        explain_template: "°7 som leder inn i neste akkord (kromatisk approach).",
    },
];

export const SCORING_WEIGHTS = {
    shared_tones: 2.0,
    voice_leading_semitones: -1.0,
    diatonic_bonus: 1.0,
    borrowed_penalty: -0.5,
};
