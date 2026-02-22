
import { getScale } from "./index";
import {
    getStartingChords,
    suggestNextChords,
    type NextChordSuggestion,
} from "./progressions";
import { parseKey, parseNoteName } from "./utils";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

type SuggestionProfile = "triad" | "seventh" | "jazz";

export interface SequenceSuggestion {
    roman: string;
    chord: string;
    variants?: string[];
    frequency: number;
    isDiatonic: boolean;
    secondaryLabel?: string;
}

function parseChordRoot(chordSymbol: string): { root: string; letter: string; rootPc: number } | null {
    const rootMatch = chordSymbol.trim().match(/^([A-Ga-g])([b#]?)/);
    if (!rootMatch) return null;

    const letter = rootMatch[1]!.toUpperCase();
    const accidental = rootMatch[2] ?? "";
    const root = `${letter}${accidental}`;

    try {
        return { root, letter, rootPc: parseNoteName(root) };
    } catch {
        return null;
    }
}

function detectChordQuality(chordSymbol: string): "major" | "minor" | "diminished" | "half-diminished" {
    const cleaned = chordSymbol.trim().split("/")[0] ?? chordSymbol;
    const body = cleaned.replace(/^([A-Ga-g][b#]?)/, "");
    const lower = body.toLowerCase();

    if (lower.includes("m7b5") || lower.includes("ø")) {
        return "half-diminished";
    }
    if (lower.includes("dim") || lower.includes("°")) {
        return "diminished";
    }
    if (lower.includes("maj")) {
        return "major";
    }
    if (lower.startsWith("m") && !lower.startsWith("maj")) {
        return "minor";
    }

    return "major";
}

function detectExtension(chordSymbol: string): "maj7" | "7" | "none" {
    const cleaned = chordSymbol.trim().split("/")[0] ?? chordSymbol;
    const body = cleaned.replace(/^([A-Ga-g][b#]?)/, "");
    const lower = body.toLowerCase();
    if (lower.includes("maj7")) return "maj7";
    if (lower.includes("7") || lower.includes("9") || lower.includes("11") || lower.includes("13")) return "7";
    return "none";
}

function accidentalFromPcDifference(diff: number): string | null {
    const normalized = ((diff % 12) + 12) % 12;
    if (normalized === 0) return "";
    if (normalized === 1) return "#";
    if (normalized === 2) return "##";
    if (normalized === 11) return "b";
    if (normalized === 10) return "bb";
    return null;
}

function toProfileChord(chord: string, profile: SuggestionProfile): string {
    if (profile === "jazz") return chord;
    const rootMatch = chord.match(/^([A-G][b#]?)/);
    if (!rootMatch) return chord;
    const root = rootMatch[1]!;
    const body = chord.slice(root.length);
    const lowerBody = body.toLowerCase();

    if (profile === "triad") {
        if (lowerBody.includes("m7b5")) return `${root}dim`;
        if (lowerBody.includes("dim7")) return `${root}dim`;
        if (lowerBody.includes("maj7")) return root;
        if (lowerBody.startsWith("m") && !lowerBody.startsWith("maj")) return `${root}m`;
        if (/(^|[^a-z])7(?![0-9])/i.test(body) || lowerBody.endsWith("7")) return root;
        return chord.replace(/(maj|m)?(6|7|9|11|13).*$/i, "").trim() || chord;
    }

    if (lowerBody.includes("m7b5")) return `${root}m7b5`;
    if (lowerBody.includes("dim")) return `${root}dim7`;
    if (lowerBody.includes("maj7")) return `${root}maj7`;
    if (lowerBody.startsWith("m") && !lowerBody.startsWith("maj")) return `${root}m7`;
    if (/(^|[^a-z])7(?![0-9])/i.test(body) || lowerBody.endsWith("7")) return `${root}7`;
    return `${root}maj7`;
}

function buildJazzVariants(chord: string, useSpice: boolean): string[] {
    const rootMatch = chord.match(/^([A-G][b#]?)/);
    if (!rootMatch) return [];
    const root = rootMatch[1]!;
    const lower = chord.toLowerCase();

    if (lower.includes("maj7")) {
        return [`${root}maj9`];
    }
    if (lower.includes("m7") && !lower.includes("m7b5")) {
        return [`${root}m9`, `${root}m11`];
    }
    if (lower.includes("7")) {
        const variants = [`${root}9`, `${root}13`];
        if (useSpice) {
            variants.push(`${root}7b9`, `${root}7#9`);
        }
        return variants;
    }

    return [];
}

/**
 * Calculates the Roman numeral degree of a chord in a given key.
 * 
 * @param chordSymbol The chord symbol (e.g., "Am", "G7", "C/E")
 * @param key The key string (e.g., "C Major", "A Minor")
 * @returns The Roman numeral degree (e.g., "vi", "V", "I") or null if not found/parseable
 */
export function getChordDegree(chordSymbol: string, key: string): string | null {
    if (!key || !chordSymbol) return null;
    const parsedKey = parseKey(key);
    if (!parsedKey) return null;

    const { tonic, mode } = parsedKey;
    const slashRoot = chordSymbol.split("/")[0]?.trim() ?? chordSymbol;
    const rootInfo = parseChordRoot(slashRoot);
    if (!rootInfo) return null;

    const tonicLetter = tonic[0]?.toUpperCase();
    if (!tonicLetter || !LETTERS.includes(tonicLetter as (typeof LETTERS)[number])) return null;

    const scale = getScale(tonic, mode);

    const tonicLetterIndex = LETTERS.indexOf(tonicLetter as (typeof LETTERS)[number]);
    const chordLetterIndex = LETTERS.indexOf(rootInfo.letter as (typeof LETTERS)[number]);
    if (tonicLetterIndex < 0 || chordLetterIndex < 0) return null;

    const degreeIndex = (chordLetterIndex - tonicLetterIndex + 7) % 7;
    const degreePc = scale.pcs[degreeIndex];
    if (degreePc === undefined) return null;

    const accidental = accidentalFromPcDifference(rootInfo.rootPc - degreePc);
    if (accidental === null) return null;

    const quality = detectChordQuality(chordSymbol);
    const extension = detectExtension(chordSymbol);

    let romanBase = ROMANS[degreeIndex]!;
    if (quality === "minor" || quality === "diminished" || quality === "half-diminished") {
        romanBase = romanBase.toLowerCase() as (typeof ROMANS)[number];
    }

    let suffix = "";
    if (quality === "diminished") {
        suffix = extension === "7" ? "°7" : "°";
    } else if (quality === "half-diminished") {
        suffix = "ø7";
    } else if (extension === "maj7") {
        suffix = "maj7";
    } else if (extension === "7") {
        suffix = "7";
    }

    return `${accidental}${romanBase}${suffix}`;
}

/**
 * Suggests chords that might follow the current chord based on the key/mode.
 * 
 * @param currentChord The current chord symbol (e.g. "C")
 * @param key The key of the song (e.g. "C Major")
 * @returns Array of suggested chord symbols
 */
export function getChordSuggestions(currentChord: string, key: string): string[] {
    const result = getNextChordSuggestionsFromSequence(
        currentChord ? [currentChord] : [],
        key,
        { profile: "seventh" }
    );
    return result.map((s) => s.chord);
}

export function getNextChordSuggestionsFromSequence(
    sequence: string[],
    key: string,
    options: { useSpice?: boolean; profile?: SuggestionProfile } = {}
): SequenceSuggestion[] {
    const parsed = parseKey(key);
    if (!parsed) return [];

    const { tonic, mode } = parsed;
    const profile = options.profile ?? "seventh";
    const useSpice = options.useSpice ?? false;

    const romanSequence = sequence
        .map((symbol) => getChordDegree(symbol, key))
        .filter((roman): roman is string => Boolean(roman));

    const source: NextChordSuggestion[] = romanSequence.length > 0
        ? suggestNextChords(romanSequence, tonic, mode, { useSpice })
        : getStartingChords(mode, tonic, { useSpice });

    return source.map((suggestion) => {
        const baseChord = toProfileChord(suggestion.chord, profile);
        const variants = profile === "jazz"
            ? buildJazzVariants(baseChord, useSpice)
            : [];

        return {
            roman: suggestion.roman,
            chord: baseChord,
            variants: variants.length > 0 ? variants : undefined,
            frequency: suggestion.frequency,
            isDiatonic: suggestion.isDiatonic,
            secondaryLabel: suggestion.secondaryLabel,
        };
    });
}
