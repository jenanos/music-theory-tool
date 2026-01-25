/**
 * Chord Progression Dataset and Utilities
 * 
 * This module provides a curated dataset of common and interesting chord progressions,
 * along with functions for filtering, transposing, and suggesting next chords.
 */

import { getScale, noteName, prefersFlats, type ModeId } from "./index";

// ============================================================================
// Types
// ============================================================================

export interface ChordProgression {
    id: string;
    name: string;
    mode: ModeId;
    type: "triad" | "seventh";
    weight: number; // 1-10, higher = more common/popular
    tags: string[];
    roman: string[];
    description?: string;
}

export interface TransposedProgression extends ChordProgression {
    chords: string[]; // Actual chord symbols in the selected key
    tonic: string;
}

export interface NextChordSuggestion {
    roman: string;
    chord: string;
    frequency: number; // How often this follows in the dataset
    fromProgressions: string[]; // IDs of progressions that contain this transition
}

// ============================================================================
// Dataset
// ============================================================================

export const CHORD_PROGRESSIONS: ChordProgression[] = [
    // ==================== NEW: Modal Progressions (User Requested) ====================
    {
        id: "modal_dorian_vamp",
        name: "Dorian Vamp",
        mode: "dorian",
        type: "seventh",
        weight: 9,
        tags: ["jazz", "funky", "loop", "modal"],
        roman: ["i7", "IV7"],
        description: "Klassisk Dorian-lyd kjent fra 'Oye Como Va' eller 'So What'."
    },
    {
        id: "modal_lydian_lift",
        name: "The Lydian Lift",
        mode: "lydian",
        type: "seventh",
        weight: 8,
        tags: ["dreamy", "cinematic", "bright", "modal"],
        roman: ["I", "II", "Imaj7"], // Simplified II/I to II for now
        description: "Gir en svevende, drømmende følelse."
    },
    {
        id: "modal_mixolydian_rock",
        name: "Mixolydian Rock-n-Roll",
        mode: "mixolydian",
        type: "triad",
        weight: 9,
        tags: ["rock", "blues", "common", "modal"],
        roman: ["I", "bVII", "IV"],
        description: "Grunnsteinen i mye klassisk rock og blues."
    },
    {
        id: "modal_phrygian_darkness",
        name: "Phrygian Darkness",
        mode: "phrygian",
        type: "triad",
        weight: 8,
        tags: ["dark", "dramatic", "flamenco", "modal"],
        roman: ["i", "bII"],
        description: "En spansk-klingende, mørk progresjon."
    },
    {
        id: "modal_aeolian_ballad",
        name: "Aeolian Ballad",
        mode: "aeolian",
        type: "triad",
        weight: 9,
        tags: ["pop", "melancholic", "emotional", "modal"],
        roman: ["i", "VI", "III", "VII"],
        description: "Også kjent som den klassiske pop-minor progresjonen."
    },
    {
        id: "modal_locrian_tension",
        name: "Locrian Tension",
        mode: "locrian",
        type: "seventh",
        weight: 6,
        tags: ["experimental", "tension", "modal"],
        roman: ["iø7", "bIImaj7"],
        description: "Veldig dissonant og spenningsfylt."
    },
    {
        id: "modal_ionian_jazz",
        name: "Jazz ii-V-I (Ionian)",
        mode: "ionian",
        type: "seventh",
        weight: 10,
        tags: ["jazz", "cadence", "classical"],
        roman: ["ii7", "V7", "Imaj7"],
        description: "Den mest brukte progresjonen i jazz."
    },


    // ==================== Major Triads - Common ====================
    {
        id: "maj_tri_01",
        name: "Axis of Awesome",
        mode: "ionian",
        type: "triad",
        weight: 10,
        tags: ["common", "pop", "loop"],
        roman: ["I", "V", "vi", "IV"],
    },
    {
        id: "maj_tri_02",
        name: "Sensitive Female Chord Progression",
        mode: "ionian",
        type: "triad",
        weight: 10,
        tags: ["common", "pop", "loop"],
        roman: ["vi", "IV", "I", "V"],
    },
    {
        id: "maj_tri_03",
        name: "Classic Pop Ballad",
        mode: "ionian",
        type: "triad",
        weight: 9,
        tags: ["common", "pop", "ballad"],
        roman: ["I", "vi", "IV", "V"],
    },
    {
        id: "maj_tri_04",
        name: "12-Bar Blues (kort)",
        mode: "ionian",
        type: "triad",
        weight: 9,
        tags: ["common", "rock", "blues"],
        roman: ["I", "IV", "V", "I"],
    },
    {
        id: "maj_tri_05",
        name: "Three Chord Rock",
        mode: "ionian",
        type: "triad",
        weight: 9,
        tags: ["common", "rock"],
        roman: ["I", "IV", "V"],
    },
    {
        id: "maj_tri_06",
        name: "50s Doo-Wop",
        mode: "ionian",
        type: "triad",
        weight: 8,
        tags: ["common", "50s", "vintage"],
        roman: ["I", "vi", "ii", "V"],
    },
    {
        id: "maj_tri_07",
        name: "Simple ii-V-I",
        mode: "ionian",
        type: "triad",
        weight: 8,
        tags: ["common", "pop", "cadence"],
        roman: ["I", "ii", "V", "I"],
    },
    {
        id: "maj_tri_08",
        name: "Pop Anthemic",
        mode: "ionian",
        type: "triad",
        weight: 8,
        tags: ["common", "pop", "anthemic"],
        roman: ["I", "iii", "IV", "V"],
    },
    {
        id: "maj_tri_09",
        name: "Emotional Rise",
        mode: "ionian",
        type: "triad",
        weight: 8,
        tags: ["common", "pop"],
        roman: ["I", "vi", "iii", "IV"],
    },
    {
        id: "maj_tri_10",
        name: "Driving Pop",
        mode: "ionian",
        type: "triad",
        weight: 7,
        tags: ["common", "pop"],
        roman: ["I", "V", "IV", "V"],
    },
    {
        id: "maj_tri_11",
        name: "Folk Standard",
        mode: "ionian",
        type: "triad",
        weight: 7,
        tags: ["common", "folk"],
        roman: ["I", "IV", "I", "V"],
    },
    {
        id: "maj_tri_12",
        name: "Mixolydian Rock",
        mode: "ionian", // Usually described in major, but uses bVII
        type: "triad",
        weight: 7,
        tags: ["common", "rock", "mixolydian"],
        roman: ["I", "bVII", "IV", "I"],
    },
    {
        id: "maj_tri_13",
        name: "Sweet Child Riff",
        mode: "ionian",
        type: "triad",
        weight: 7,
        tags: ["common", "rock", "mixolydian"],
        roman: ["I", "bVII", "IV"],
    },
    {
        id: "maj_tri_14",
        name: "Deceptive Resolution",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["common", "pop", "deceptive"],
        roman: ["I", "V", "vi"],
    },
    {
        id: "maj_tri_15",
        name: "ii-V-I Kadens",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["common", "cadence", "jazz"],
        roman: ["ii", "V", "I"],
    },
    {
        id: "maj_tri_16",
        name: "Autentisk Kadens",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["common", "cadence", "classical"],
        roman: ["IV", "V", "I"],
    },

    // ==================== Major - Modal Interchange & Color ====================
    {
        id: "maj_adv_01",
        name: "Minor Plagal",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["modal_interchange", "color", "emotional"],
        roman: ["I", "iv", "IV", "I"],
    },
    {
        id: "maj_adv_02",
        name: "Borrowed iv-bVII",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["modal_interchange", "color"],
        roman: ["I", "iv", "bVII", "I"],
    },
    {
        id: "maj_adv_03",
        name: "Epic Borrowed (Mario Kadens)",
        mode: "ionian",
        type: "triad",
        weight: 6,
        tags: ["modal_interchange", "color", "epic"],
        roman: ["I", "bVI", "bVII", "I"],
    },
    {
        id: "maj_adv_04",
        name: "Chromatic Median",
        mode: "ionian",
        type: "triad",
        weight: 5,
        tags: ["modal_interchange", "color"],
        roman: ["I", "bIII", "IV", "I"],
    },
    {
        id: "maj_adv_05",
        name: "Dramatic Borrowed",
        mode: "ionian",
        type: "triad",
        weight: 5,
        tags: ["modal_interchange", "color", "dramatic"],
        roman: ["I", "bVI", "IV", "V"],
    },
    {
        id: "maj_adv_06",
        name: "Passing Diminished",
        mode: "ionian",
        type: "triad",
        weight: 5,
        tags: ["chromatic", "passing"],
        roman: ["I", "#iv°", "V", "I"],
    },
    {
        id: "maj_adv_07",
        name: "Chromatic Approach to ii",
        mode: "ionian",
        type: "triad",
        weight: 5,
        tags: ["chromatic", "passing"],
        roman: ["I", "#i°", "ii", "V"],
    },
    {
        id: "maj_adv_08",
        name: "Kvintsirkel",
        mode: "ionian",
        type: "triad",
        weight: 5,
        tags: ["sequence", "circle_of_fifths", "classical"],
        roman: ["I", "IV", "vii°", "iii", "vi", "ii", "V", "I"],
    },

    // ==================== Major - Secondary Dominants ====================
    {
        id: "maj_sec_01",
        name: "V/V til V",
        mode: "ionian",
        type: "seventh",
        weight: 7,
        tags: ["secondary_dominant", "common"],
        roman: ["I", "V7/V", "V", "I"],
    },
    {
        id: "maj_sec_02",
        name: "V/vi til vi",
        mode: "ionian",
        type: "seventh",
        weight: 7,
        tags: ["secondary_dominant", "common"],
        roman: ["I", "V7/vi", "vi", "IV"],
    },
    {
        id: "maj_sec_03",
        name: "V/ii i Kadens",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["secondary_dominant"],
        roman: ["I", "V7/ii", "ii", "V", "I"],
    },
    {
        id: "maj_sec_04",
        name: "V/IV til IV",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["secondary_dominant"],
        roman: ["I", "V7/IV", "IV", "V", "I"],
    },
    {
        id: "maj_sec_05",
        name: "Turnaround med Sekundærdominanter",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["secondary_dominant", "turnaround"],
        roman: ["I", "III7", "vi", "II7", "V7", "I"],
    },

    // ==================== Major - Jazz ====================
    {
        id: "maj_jazz_01",
        name: "Jazz Standard Turnaround",
        mode: "ionian",
        type: "seventh",
        weight: 9,
        tags: ["jazz", "common", "turnaround"],
        roman: ["Imaj7", "vi7", "ii7", "V7"],
    },
    {
        id: "maj_jazz_02",
        name: "ii-V-I (Jazz)",
        mode: "ionian",
        type: "seventh",
        weight: 9,
        tags: ["jazz", "common", "cadence"],
        roman: ["ii7", "V7", "Imaj7"],
    },
    {
        id: "maj_jazz_03",
        name: "Turnaround med VI7",
        mode: "ionian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "turnaround"],
        roman: ["Imaj7", "VI7", "ii7", "V7"],
    },
    {
        id: "maj_jazz_04",
        name: "Rhythm Changes (A-del)",
        mode: "ionian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "rhythm_changes"],
        roman: ["iii7", "VI7", "ii7", "V7", "Imaj7"],
    },
    {
        id: "maj_jazz_05",
        name: "Passing Diminished (Jazz)",
        mode: "ionian",
        type: "seventh",
        weight: 7,
        tags: ["jazz", "chromatic", "passing"],
        roman: ["Imaj7", "#i°7", "ii7", "V7", "Imaj7"],
    },
    {
        id: "maj_jazz_06",
        name: "Backdoor ii-V",
        mode: "ionian",
        type: "seventh",
        weight: 7,
        tags: ["jazz", "backdoor"],
        roman: ["Imaj7", "iv7", "bVII7", "Imaj7"],
    },
    {
        id: "maj_jazz_07",
        name: "Tritone Substitution (ii-bII-I)",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["jazz", "tritone_sub"],
        roman: ["ii7", "bII7", "Imaj7"],
    },
    {
        id: "maj_jazz_08",
        name: "Direct Tritone Sub",
        mode: "ionian",
        type: "seventh",
        weight: 6,
        tags: ["jazz", "tritone_sub"],
        roman: ["Imaj7", "bII7", "Imaj7"],
    },

    // ==================== Minor Triads - Common ====================
    {
        id: "min_tri_01",
        name: "Andalusian Moll",
        mode: "aeolian",
        type: "triad",
        weight: 10,
        tags: ["common", "aeolian", "loop"],
        roman: ["i", "bVII", "bVI", "V"],
    },
    {
        id: "min_tri_02",
        name: "Moll med Dur-V",
        mode: "aeolian",
        type: "triad",
        weight: 9,
        tags: ["common", "minor", "cadence"],
        roman: ["i", "iv", "V", "i"],
    },
    {
        id: "min_tri_03",
        name: "Natural Minor Loop",
        mode: "aeolian",
        type: "triad",
        weight: 8,
        tags: ["common", "natural_minor"],
        roman: ["i", "bVI", "bIII", "bVII"],
    },
    {
        id: "min_tri_04",
        name: "Fallende Linje",
        mode: "aeolian",
        type: "triad",
        weight: 8,
        tags: ["common", "minor", "color"],
        roman: ["i", "bVII", "bVI", "V"],
    },
    {
        id: "min_tri_05",
        name: "Pop Moll",
        mode: "aeolian",
        type: "triad",
        weight: 7,
        tags: ["common", "minor", "pop"],
        roman: ["i", "iv", "bVII", "bIII"],
    },
    {
        id: "min_tri_06",
        name: "Dramatisk Moll",
        mode: "aeolian",
        type: "triad",
        weight: 7,
        tags: ["common", "minor", "dramatic"],
        roman: ["i", "bVI", "iv", "V"],
    },
    {
        id: "min_tri_07",
        name: "Enkel Moll-kadens",
        mode: "aeolian",
        type: "triad",
        weight: 7,
        tags: ["common", "minor"],
        roman: ["i", "bVI", "V", "i"],
    },
    {
        id: "min_tri_08",
        name: "iv-V-i Kadens",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["common", "minor", "cadence"],
        roman: ["iv", "V", "i"],
    },
    {
        id: "min_tri_09",
        name: "Melankolsk Moll",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["common", "minor", "melancholic"],
        roman: ["i", "v", "iv", "i"],
    },
    {
        id: "min_tri_10",
        name: "Moll Fargerik",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["minor", "color"],
        roman: ["i", "bIII", "bVII", "iv"],
    },

    // ==================== Minor - Advanced ====================
    {
        id: "min_adv_01",
        name: "Napolitansk Sekst",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["neapolitan", "color", "classical"],
        roman: ["i", "bII", "V", "i"],
    },
    {
        id: "min_adv_02",
        name: "Kromatisk Passing (Moll)",
        mode: "aeolian",
        type: "triad",
        weight: 6,
        tags: ["chromatic", "passing"],
        roman: ["i", "#iv°", "V", "i"],
    },
    {
        id: "min_adv_03",
        name: "Moll Kvintsirkel",
        mode: "aeolian",
        type: "triad",
        weight: 5,
        tags: ["sequence", "circle_of_fifths"],
        roman: ["i", "iv", "bVII", "bIII", "bVI", "ii°", "V", "i"],
    },
    {
        id: "min_adv_04",
        name: "Picardy-ters Avslutning",
        mode: "aeolian",
        type: "triad",
        weight: 5,
        tags: ["picardy", "ending", "classical"],
        roman: ["i", "iv", "V", "I"],
    },

    // ==================== Minor - Jazz ====================
    {
        id: "min_jazz_01",
        name: "Minor ii-V-i (Jazz)",
        mode: "aeolian",
        type: "seventh",
        weight: 9,
        tags: ["jazz", "common", "cadence"],
        roman: ["iiø7", "V7", "i6"],
    },
    {
        id: "min_jazz_02",
        name: "Minor Turnaround",
        mode: "aeolian",
        type: "seventh",
        weight: 8,
        tags: ["jazz", "turnaround"],
        roman: ["i6", "VI7", "iiø7", "V7"],
    },
    {
        id: "min_jazz_03",
        name: "Minor Backdoor",
        mode: "aeolian",
        type: "seventh",
        weight: 7,
        tags: ["jazz", "backdoor"],
        roman: ["i7", "iv7", "bVII7", "i7"],
    },
    {
        id: "min_jazz_04",
        name: "Minor Tritone Sub",
        mode: "aeolian",
        type: "seventh",
        weight: 6,
        tags: ["jazz", "tritone_sub"],
        roman: ["iiø7", "bII7", "i6"],
    },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get all unique tags from the dataset
 */
export function getAllTags(): string[] {
    const tagsSet = new Set<string>();
    for (const prog of CHORD_PROGRESSIONS) {
        for (const tag of prog.tags) {
            tagsSet.add(tag);
        }
    }
    return [...tagsSet].sort();
}

/**
 * Filter progressions by mode and optional tags
 */
export function filterProgressions(
    mode: ModeId | "all",
    tags?: string[],
    type?: "triad" | "seventh" | "all"
): ChordProgression[] {
    return CHORD_PROGRESSIONS.filter((prog) => {
        if (mode !== "all" && prog.mode !== mode) return false;
        if (type && type !== "all" && prog.type !== type) return false;
        if (tags && tags.length > 0) {
            if (!tags.some((tag) => prog.tags.includes(tag))) return false;
        }
        return true;
    }).sort((a, b) => b.weight - a.weight);
}

/**
 * Parse a roman numeral and return info about it
 */
function parseRomanNumeral(roman: string): {
    degree: number;
    quality: string;
    accidental: string;
    extension: string;
} {
    const match = roman.match(
        /^([b#]?)([iIvV]+|[iI]{1,3}|[vV]{1,3})([°øø+]?)(maj7|7|6)?$/
    );

    if (!match) {
        // Handle special cases like secondary dominants
        if (roman.includes("/")) {
            return { degree: 0, quality: "special", accidental: "", extension: "" };
        }
        return { degree: 0, quality: "unknown", accidental: "", extension: "" };
    }

    const [, accidental = "", numeral, qualityMark = "", extension = ""] = match;

    if (!numeral) {
        return { degree: 0, quality: "unknown", accidental: "", extension: "" };
    }

    const upperNumeral = numeral.toUpperCase();
    const degreeMap: Record<string, number> = {
        I: 1,
        II: 2,
        III: 3,
        IV: 4,
        V: 5,
        VI: 6,
        VII: 7,
    };

    const degree = degreeMap[upperNumeral] ?? 0;
    const isMinor = numeral === numeral.toLowerCase();

    let quality = isMinor ? "minor" : "major";
    if (qualityMark === "°") quality = "diminished";
    if (qualityMark === "ø") quality = "half-diminished";
    if (qualityMark === "+") quality = "augmented";

    return { degree, quality, accidental, extension };

}

/**
 * Convert a roman numeral to an actual chord symbol in a given key
 */
export function romanToChord(
    roman: string,
    tonic: string,
    mode: ModeId
): string {
    const useFlats = prefersFlats(tonic);

    // Handle secondary dominants
    if (roman.includes("/")) {
        // For now, simplify secondary dominants
        const parts = roman.split("/");
        const targetRoman = parts[1];
        const targetParsed = parseRomanNumeral(targetRoman ?? "");

        // Get the scale to find the target note
        const scale = getScale(tonic, mode);
        let targetDegree = targetParsed.degree - 1;
        if (targetDegree < 0) targetDegree = 0;

        const targetNote = scale.noteNames[targetDegree % 7] ?? tonic;
        // V7 of target = a major 7th chord a fifth above target
        const targetPc = scale.pcs[targetDegree % 7] ?? 0;
        const dominantPc = (targetPc + 7) % 12; // Fifth above
        const dominantNote = noteName(dominantPc, useFlats);

        return `${dominantNote}7`;
    }

    const { degree, quality, accidental, extension } = parseRomanNumeral(roman);

    if (degree === 0 || quality === "unknown" || quality === "special") {
        return roman; // Return as-is if we can't parse it
    }

    // Get scale degrees
    const scale = getScale(tonic, mode);
    const scaleDegreeIndex = degree - 1;
    let rootPc = scale.pcs[scaleDegreeIndex % 7] ?? 0;

    // Apply accidental
    if (accidental === "b") {
        rootPc = (rootPc - 1 + 12) % 12;
    } else if (accidental === "#") {
        rootPc = (rootPc + 1) % 12;
    }

    const rootNote = noteName(rootPc, useFlats);

    // Build suffix
    let suffix = "";
    switch (quality) {
        case "minor":
            suffix = extension ? (extension === "7" ? "m7" : extension === "6" ? "m6" : "m" + extension) : "m";
            break;
        case "diminished":
            suffix = extension ? "dim7" : "dim";
            break;
        case "half-diminished":
            suffix = "m7b5";
            break;
        case "augmented":
            suffix = extension ? "aug7" : "aug";
            break;
        case "major":
        default:
            suffix = extension ?? "";
            break;
    }

    return rootNote + suffix;
}

/**
 * Transpose a progression to a specific key
 */
export function transposeProgression(
    progression: ChordProgression,
    tonic: string,
    mode: ModeId = "ionian" // Fallback but basically unused if overrideMode is handled
): TransposedProgression {
    // Use the mode from the progression itself as the source mode for roman numeral interpretation!
    // But wait, if I am in C Major (Ionian), and I view a Dorian progression (i7 - IV7), 
    // Do I show chords for C Dorian? Yes, "Start with: ... dynamic ... correct diatonic chords for the selected mode"
    // The PROGESSION has a native mode. 
    // The USER selects a Mode in the UI. 
    // If the User selects "Dorian", we show Dorian progressions.
    // So we should transpose using the mode of the progression (which matches the selected mode).

    const actualMode = progression.mode;

    const chords = progression.roman.map((roman) =>
        romanToChord(roman, tonic, actualMode)
    );

    return {
        ...progression,
        chords,
        tonic,
    };
}

/**
 * Build a transition map from the dataset
 * Maps "chord1 -> chord2" to count of occurrences
 */
function buildTransitionMap(): Map<string, Map<string, { count: number; progressionIds: string[] }>> {
    const transitions = new Map<string, Map<string, { count: number; progressionIds: string[] }>>();

    for (const prog of CHORD_PROGRESSIONS) {
        for (let i = 0; i < prog.roman.length - 1; i++) {
            const from = prog.roman[i]!;
            const to = prog.roman[i + 1]!;

            if (!transitions.has(from)) {
                transitions.set(from, new Map());
            }

            const fromMap = transitions.get(from)!;
            if (!fromMap.has(to)) {
                fromMap.set(to, { count: 0, progressionIds: [] });
            }

            const entry = fromMap.get(to)!;
            entry.count += prog.weight; // Weight by popularity
            entry.progressionIds.push(prog.id);
        }
    }

    return transitions;
}

const transitionMap = buildTransitionMap();

/**
 * Suggest next chords based on a partial sequence
 */
export function suggestNextChords(
    partialSequence: string[],
    tonic: string,
    mode: ModeId = "ionian"
): NextChordSuggestion[] {
    if (partialSequence.length === 0) {
        return [];
    }

    // Get the last chord in the sequence
    const lastChord = partialSequence[partialSequence.length - 1]!;

    // Look up transitions from this chord
    const fromMap = transitionMap.get(lastChord);
    if (!fromMap) {
        return [];
    }

    // Convert to array and sort by frequency
    const suggestions: NextChordSuggestion[] = [];

    // Determine actual mode for transposition - use the passed mode from UI
    // So if I am in C Dorian, and I have "i7", what comes next? 
    // The map uses Roman Numerals. 
    // Currently, transitionMap mixes all modes! 
    // "i" in Dorian might go to "IV7". "i" in Aeolian might go to "bVI".
    // Does "i" = "i" across modes? Yes. 
    // But "IV7" is distinct to Dorian. "iv" is distinct to Aeolian.
    // So mixing them is fine, it just suggests what follows that roman numeral symbol.

    const actualMode: ModeId = mode;

    for (const [roman, data] of fromMap) {
        suggestions.push({
            roman,
            chord: romanToChord(roman, tonic, actualMode),
            frequency: data.count,
            fromProgressions: data.progressionIds,
        });
    }

    // Sort by frequency
    return suggestions.sort((a, b) => b.frequency - a.frequency);
}
