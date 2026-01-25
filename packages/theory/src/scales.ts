
import { ModeId, ScaleDefinition, ScaleFamily } from "./types";
import { noteName, parseNoteName, prefersFlats } from "./utils";

// ============================================================================
// Types & Interfaces
// ============================================================================

// ScaleFamily imported from types

export interface ScaleMatchResult {
    scaleId: string;
    scaleName: string;
    score: number;
    notes: string[]; // Note names (C, D, E...)
    explanation: string[];
    tags: string[];
}

export type StyleProfileId = "pop" | "jazz";

export interface ChordScaleContext {
    tonic?: string;
    mode?: ModeId;
}

// ============================================================================
// Dataset
// ============================================================================

export const SCALES: ScaleDefinition[] = [
    {
        id: "ionian",
        name: "Ionisk (dur)",
        family: "diatonic",
        isHarmony: true,
        intervals: [0, 2, 4, 5, 7, 9, 11],
        degree_labels: ["1", "2", "3", "4", "5", "6", "7"],
        tags: ["major", "diatonic"],
        use_over: ["maj", "maj7", "6", "maj9", "maj13"],
        avoid_degrees: [],
        notes_about_use: "Standard dur-skala."
    },
    {
        id: "dorian",
        name: "Dorisk",
        family: "diatonic",
        isHarmony: true,
        intervals: [0, 2, 3, 5, 7, 9, 10],
        degree_labels: ["1", "2", "b3", "4", "5", "6", "b7"],
        tags: ["minor", "diatonic"],
        use_over: ["m", "m7", "m9", "m11", "m13"],
        avoid_degrees: [],
        notes_about_use: "Vanlig over ii- (m7) i dur."
    },
    {
        id: "phrygian",
        name: "Frygisk",
        family: "diatonic",
        isHarmony: true,
        intervals: [0, 1, 3, 5, 7, 8, 10],
        degree_labels: ["1", "b2", "b3", "4", "5", "b6", "b7"],
        tags: ["minor", "diatonic"],
        use_over: ["m", "m7"],
        avoid_degrees: [],
        notes_about_use: "Karakteristisk b2."
    },
    {
        id: "lydian",
        name: "Lydisk",
        family: "diatonic",
        isHarmony: true,
        intervals: [0, 2, 4, 6, 7, 9, 11],
        degree_labels: ["1", "2", "3", "#4", "5", "6", "7"],
        tags: ["major", "diatonic"],
        use_over: ["maj7", "maj9", "maj13"],
        avoid_degrees: [],
        notes_about_use: "Passer ofte over maj7 med #11."
    },
    {
        id: "mixolydian",
        name: "Mixolydisk",
        family: "diatonic",
        isHarmony: true,
        intervals: [0, 2, 4, 5, 7, 9, 10],
        degree_labels: ["1", "2", "3", "4", "5", "6", "b7"],
        tags: ["dominant", "diatonic"],
        use_over: ["7", "9", "13", "7sus"],
        avoid_degrees: [],
        notes_about_use: "Standard dominant-skala."
    },
    {
        id: "aeolian",
        name: "Aeolisk (naturlig moll)",
        family: "diatonic",
        isHarmony: true,
        intervals: [0, 2, 3, 5, 7, 8, 10],
        degree_labels: ["1", "2", "b3", "4", "5", "b6", "b7"],
        tags: ["minor", "diatonic"],
        use_over: ["m", "m7"],
        avoid_degrees: [],
        notes_about_use: "Standard moll-skala."
    },
    {
        id: "locrian",
        name: "Lokrisk",
        family: "diatonic",
        isHarmony: true,
        intervals: [0, 1, 3, 5, 6, 8, 10],
        degree_labels: ["1", "b2", "b3", "4", "b5", "b6", "b7"],
        tags: ["half-diminished", "diatonic"],
        use_over: ["m7b5"],
        avoid_degrees: [],
        notes_about_use: "Passer over m7b5 (viiø/iiø)."
    },
    {
        id: "harmonic_minor",
        name: "Harmonisk moll",
        family: "minor",
        isHarmony: true,
        intervals: [0, 2, 3, 5, 7, 8, 11],
        degree_labels: ["1", "2", "b3", "4", "5", "b6", "7"],
        tags: ["minor", "functional"],
        use_over: ["m(maj7)", "7(b9)", "dim7"],
        avoid_degrees: [],
        notes_about_use: "Gir V7 og vii°7 i moll (leading tone)."
    },
    {
        id: "melodic_minor",
        name: "Melodisk moll (jazz)",
        family: "minor",
        isHarmony: false,
        intervals: [0, 2, 3, 5, 7, 9, 11],
        degree_labels: ["1", "2", "b3", "4", "5", "6", "7"],
        tags: ["minor", "jazz"],
        use_over: ["m(maj7)", "m6", "m9"],
        avoid_degrees: [],
        notes_about_use: "Jazz minor. Deriverer lydisk dominant og altered m.m."
    },
    {
        id: "major_pentatonic",
        name: "Dur-pentatonisk",
        family: "pentatonic",
        isHarmony: false,
        intervals: [0, 2, 4, 7, 9],
        degree_labels: ["1", "2", "3", "5", "6"],
        tags: ["major"],
        use_over: ["maj", "maj7", "6"],
        avoid_degrees: [],
        notes_about_use: "Trygg i pop/rock."
    },
    {
        id: "minor_pentatonic",
        name: "Moll-pentatonisk",
        family: "pentatonic",
        isHarmony: false,
        intervals: [0, 3, 5, 7, 10],
        degree_labels: ["1", "b3", "4", "5", "b7"],
        tags: ["minor"],
        use_over: ["m", "m7", "7 (blues)"],
        avoid_degrees: [],
        notes_about_use: "Trygg i rock/blues."
    },
    {
        id: "blues",
        name: "Blues-skala",
        family: "pentatonic",
        isHarmony: false,
        intervals: [0, 3, 5, 6, 7, 10],
        degree_labels: ["1", "b3", "4", "b5", "5", "b7"],
        tags: ["blues"],
        use_over: ["7", "m7", "maj (blues)"],
        avoid_degrees: [],
        notes_about_use: "Blues note (b5)."
    },
    {
        id: "whole_tone",
        name: "Heltoneskala",
        family: "symmetric",
        isHarmony: false,
        intervals: [0, 2, 4, 6, 8, 10],
        degree_labels: ["1", "2", "3", "#4/#11", "#5/b13", "b7"],
        tags: ["dominant", "aug"],
        use_over: ["7#5", "9#5"],
        avoid_degrees: [],
        notes_about_use: "Over dominant med #5."
    },
    {
        id: "diminished_hw",
        name: "Diminished (halv-hel)",
        family: "symmetric",
        isHarmony: false,
        intervals: [0, 1, 3, 4, 6, 7, 9, 10],
        degree_labels: ["1", "b9", "#9", "3", "#11", "5", "13", "b7"],
        tags: ["dominant", "jazz"],
        use_over: ["7b9", "13b9"],
        avoid_degrees: [],
        notes_about_use: "Typisk over V7b9."
    },
    {
        id: "diminished_wh",
        name: "Diminished (hel-halv)",
        family: "symmetric",
        isHarmony: false,
        intervals: [0, 2, 3, 5, 6, 8, 9, 11],
        degree_labels: ["1", "2", "b3", "4", "b5", "b6", "6", "7"],
        tags: ["dim", "jazz"],
        use_over: ["dim7"],
        avoid_degrees: [],
        notes_about_use: "Typisk over dim7."
    },
    {
        id: "altered",
        name: "Altered (superlokrisk)",
        family: "melodic_minor_mode",
        isHarmony: false,
        intervals: [0, 1, 3, 4, 6, 8, 10],
        degree_labels: ["1", "b9", "#9", "3", "b5/#11", "#5/b13", "b7"],
        tags: ["dominant", "altered", "jazz"],
        use_over: ["7alt"],
        avoid_degrees: [],
        notes_about_use: "Over V7alt (fra melodisk moll: 7. modus)."
    },
    {
        id: "lydian_dominant",
        name: "Lydisk dominant",
        family: "melodic_minor_mode",
        isHarmony: false,
        intervals: [0, 2, 4, 6, 7, 9, 10],
        degree_labels: ["1", "2", "3", "#11", "5", "13", "b7"],
        tags: ["dominant", "jazz"],
        use_over: ["7#11", "9#11", "13#11"],
        avoid_degrees: [],
        notes_about_use: "Over dominant med #11 (fra melodisk moll: 4. modus)."
    }
];

export const CHORD_SCALE_RULES = {
    must_contain_chord_tones: true,
    quality_hints: {
        "maj7": { preferred: ["ionian", "lydian"], allowed: ["major_pentatonic"] },
        "m7": { preferred: ["dorian", "aeolian"], allowed: ["minor_pentatonic", "blues"] },
        "7": { preferred: ["mixolydian"], allowed: ["blues", "diminished_hw", "lydian_dominant", "altered", "whole_tone"] },
        "m7b5": { preferred: ["locrian"], allowed: ["locrian"] },
        "dim7": { preferred: ["diminished_wh"], allowed: ["diminished_wh"] }
    },
    scoring_weights: {
        contains_all_chord_tones: 10,
        missing_chord_tone: -100,
        shared_tones_count: 1,
        context_same_key_bonus: 3,
        diatonic_in_mode_bonus: 4,
        preferred_scale_bonus: 5,
        avoid_note_penalty: -2,
        advanced_style_penalty_in_pop_mode: -3
    },
    style_profiles: {
        pop: {
            allow_families: ["diatonic", "pentatonic"],
            discourage_tags: ["jazz", "altered", "symmetric"]
        },
        jazz: {
            allow_families: ["diatonic", "pentatonic", "symmetric", "minor", "melodic_minor_mode"],
            discourage_tags: [] as string[]
        }
    }
};

// ============================================================================
// Logic
// ============================================================================

/**
 * Parses a chord symbol to find chord tones.
 * NOTE: This is a simplified parser built for this task.
 */
export function parseChord(chordSymbol: string): { rootPc: number, tones: number[], quality: string } {
    const rootMatch = chordSymbol.match(/^([A-G][b#]?)(.*)$/);
    if (!rootMatch) throw new Error(`Invalid chord symbol: ${chordSymbol}`);

    const rootStr = rootMatch[1]!;
    const qualityStr = rootMatch[2]!;
    const rootPc = parseNoteName(rootStr);

    // Identify extensions to find base quality for intervals
    // Very simplified for now, expanding as per needs
    let baseIntervals = [0, 4, 7]; // Default Major
    let quality = "maj";

    if (qualityStr === "m" || qualityStr.startsWith("m ") || qualityStr === "min") {
        baseIntervals = [0, 3, 7];
        quality = "m";
    } else if (qualityStr.startsWith("m7")) {
        baseIntervals = [0, 3, 7, 10];
        quality = "m7";
    } else if (qualityStr.startsWith("maj7") || qualityStr.startsWith("M7")) {
        baseIntervals = [0, 4, 7, 11];
        quality = "maj7";
    } else if (qualityStr.startsWith("7")) {
        baseIntervals = [0, 4, 7, 10];
        quality = "7";
    } else if (qualityStr.startsWith("m7b5") || qualityStr.includes("ø")) {
        baseIntervals = [0, 3, 6, 10];
        quality = "m7b5";
    } else if (qualityStr.startsWith("dim7") || qualityStr.includes("°7")) {
        baseIntervals = [0, 3, 6, 9];
        quality = "dim7";
    } else if (qualityStr.startsWith("dim") || qualityStr.includes("°")) {
        baseIntervals = [0, 3, 6];
        quality = "dim";
    } else if (qualityStr.startsWith("aug") || qualityStr.includes("+")) {
        baseIntervals = [0, 4, 8];
        quality = "aug";
    }

    // Handle explicit alterations if present in the string (simplified)
    // E.g. 7b9 -> add interval 1
    // This parser is not exhaustive but sufficient for the requirements.
    if (qualityStr.includes("b9")) { if (!baseIntervals.includes(1)) baseIntervals.push(1); }
    if (qualityStr.includes("#9")) { if (!baseIntervals.includes(3)) baseIntervals.push(3); } // #9 is same pc as m3
    if (qualityStr.includes("#11")) { if (!baseIntervals.includes(6)) baseIntervals.push(6); }
    if (qualityStr.includes("b13")) { if (!baseIntervals.includes(8)) baseIntervals.push(8); }

    const tones = baseIntervals.map(i => (rootPc + i) % 12);
    return { rootPc, tones, quality };
}

/**
 * Returns the pitch classes for a given scale starting at a tonic.
 */
export function getScaleNotes(tonicPc: number, scaleId: string): number[] {
    const scale = SCALES.find(s => s.id === scaleId);
    if (!scale) return [];
    return scale.intervals.map(i => (tonicPc + i) % 12);
}

/**
 * Matches candidate scales for a given chord.
 */
export function matchScales(
    chordSymbol: string,
    context: ChordScaleContext = {},
    style: StyleProfileId = "jazz"
): ScaleMatchResult[] {
    const { rootPc, tones: chordTones, quality } = parseChord(chordSymbol);
    const useFlats = prefersFlats(noteName(rootPc, false)); // Basic guess

    const results: ScaleMatchResult[] = [];
    const profile = CHORD_SCALE_RULES.style_profiles[style];

    // Candidate generation:
    // For each available scale type, transpose it to the chord root
    // AND potential other roots if needed (e.g. modes).
    // For this implementation: we try all scales rooted at the chord root.
    // (Advanced: slash chords or polyichords might differ, but Requirement says "Chord -> Scale")

    for (const scaleDef of SCALES) {
        // Filter by style family
        if (!profile.allow_families.includes(scaleDef.family) && style === "pop") {
            // In strict pop, maybe skip. But let's score instead.
        }

        const scalePcs = scaleDef.intervals.map(i => (rootPc + i) % 12);

        // 1. Check constraints
        const chordTonesInScale = chordTones.every(ct => scalePcs.includes(ct % 12));
        if (CHORD_SCALE_RULES.must_contain_chord_tones && !chordTonesInScale) {
            continue; // Skip if missing chord tones
        }

        // 2. Score
        let score = 0;
        const explanation: string[] = [];

        if (chordTonesInScale) {
            score += CHORD_SCALE_RULES.scoring_weights.contains_all_chord_tones;
            explanation.push("Inneholder alle akkordtoner");
        } else {
            score += CHORD_SCALE_RULES.scoring_weights.missing_chord_tone;
        }

        // Quality hints
        const qRules = CHORD_SCALE_RULES.quality_hints[quality as keyof typeof CHORD_SCALE_RULES.quality_hints];
        if (qRules) {
            if (qRules.preferred.includes(scaleDef.id)) {
                score += CHORD_SCALE_RULES.scoring_weights.preferred_scale_bonus;
                explanation.push("Anbefalt for akkordtypen");
            }
        }

        // Context Bonus
        if (context.tonic && context.mode) {
            // If the scale IS the context mode (relative to context tonic)?
            // Checking if this scale's tones are diatonic to the global key/mode
            const contextTonicPc = parseNoteName(context.tonic);
            const contextScaleDef = SCALES.find(s => s.id === context.mode);
            if (contextScaleDef) {
                const contextPcs = contextScaleDef.intervals.map(i => (contextTonicPc + i) % 12);

                // How many notes of our candidate scale are in the context scale?
                const intersection = scalePcs.filter(p => contextPcs.includes(p));
                const fraction = intersection.length / scalePcs.length;

                if (fraction === 1) {
                    score += CHORD_SCALE_RULES.scoring_weights.context_same_key_bonus;
                    explanation.push("Diatonisk i tonearten");
                }
            }
        }

        // Style filtering / Penalties
        const hasDiscouragedTag = scaleDef.tags.some(t => profile.discourage_tags.includes(t));
        if (hasDiscouragedTag && style === "pop") {
            score += CHORD_SCALE_RULES.scoring_weights.advanced_style_penalty_in_pop_mode;
            explanation.push("Mindre vanlig i pop");
        }

        results.push({
            scaleId: scaleDef.id,
            scaleName: scaleDef.name,
            score,
            notes: scalePcs.map(p => noteName(p, useFlats)),
            explanation,
            tags: scaleDef.tags
        });
    }

    return results.sort((a, b) => b.score - a.score);
}
