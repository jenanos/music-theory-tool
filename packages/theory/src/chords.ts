
import { getScale } from "./index";
import {
    getStartingChords,
    suggestNextChords,
    type NextChordSuggestion,
} from "./progressions";
import { parseKey, parseNoteName } from "./utils";
import type { SlashChordAnalysis } from "./types";

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

function detectChordQualityFromBody(body: string): "major" | "minor" | "diminished" | "half-diminished" {
    const lower = body.toLowerCase();

    if (lower.includes("m7b5") || lower.includes("ø")) {
        return "half-diminished";
    }
    if (lower.includes("dim") || lower.includes("°")) {
        return "diminished";
    }
    if (lower.startsWith("m") && !lower.startsWith("maj")) {
        return "minor";
    }

    return "major";
}

function detectChordQuality(chordSymbol: string): "major" | "minor" | "diminished" | "half-diminished" {
    const cleaned = chordSymbol.trim().split("/")[0] ?? chordSymbol;
    const body = cleaned.replace(/^([A-Ga-g][b#]?)/, "");
    return detectChordQualityFromBody(body);
}

function detectExtension(chordSymbol: string): "maj7" | "7" | "none" {
    const cleaned = chordSymbol.trim().split("/")[0] ?? chordSymbol;
    const body = cleaned.replace(/^([A-Ga-g][b#]?)/, "");
    const lower = body.toLowerCase();
    if (lower.includes("maj7")) return "maj7";
    if (
        lower.includes("°7")
        || lower.includes("m7")
        || lower.includes("7")
        || lower.includes("9")
        || lower.includes("11")
        || lower.includes("13")
    ) {
        return "7";
    }
    return "none";
}

function detectChordTones(chordSymbol: string): { tones: number[]; isSeventhChord: boolean } | null {
    const cleaned = chordSymbol.trim().split("/")[0] ?? chordSymbol;
    const rootInfo = parseChordRoot(cleaned);
    if (!rootInfo) return null;

    const body = cleaned.replace(/^([A-Ga-g][b#]?)/, "");
    const lower = body.toLowerCase();
    const quality = detectChordQualityFromBody(body);

    let intervals = [0, 4, 7];
    let isSeventhChord = false;

    if (quality === "half-diminished") {
        intervals = [0, 3, 6, 10];
        isSeventhChord = true;
    } else if (quality === "diminished") {
        if (lower.includes("dim7") || lower.includes("°7")) {
            intervals = [0, 3, 6, 9];
            isSeventhChord = true;
        } else {
            intervals = [0, 3, 6];
        }
    } else if (quality === "minor") {
        intervals = [0, 3, 7];
        if (detectExtension(cleaned) !== "none") {
            intervals = [0, 3, 7, 10];
            isSeventhChord = true;
        }
    } else {
        if (lower.includes("maj7")) {
            intervals = [0, 4, 7, 11];
            isSeventhChord = true;
        } else if (detectExtension(cleaned) === "7") {
            intervals = [0, 4, 7, 10];
            isSeventhChord = true;
        }
    }

    return {
        tones: intervals.map((interval) => (rootInfo.rootPc + interval) % 12),
        isSeventhChord,
    };
}

function getInversionFigure(index: number, isSeventhChord: boolean): string {
    if (isSeventhChord) {
        const sevenths = ["7", "65", "43", "42"] as const;
        return sevenths[index] ?? "";
    }

    const triads = ["", "6", "64"] as const;
    return triads[index] ?? "";
}

export function analyzeSlashChord(chordSymbol: string): SlashChordAnalysis {
    const trimmed = chordSymbol.trim();
    const slashIndex = trimmed.indexOf("/");
    const upperStructure = slashIndex >= 0 ? trimmed.slice(0, slashIndex).trim() : trimmed;
    const bassPart = slashIndex >= 0 ? trimmed.slice(slashIndex + 1).trim() : undefined;

    const toneInfo = detectChordTones(upperStructure);
    const rootInfo = parseChordRoot(upperStructure);
    if (!toneInfo || !rootInfo) {
        return {
            type: "none",
            chordSymbol: trimmed,
            upperStructure,
            bassSymbol: bassPart,
            chordTones: [],
            isSeventhChord: false,
        };
    }

    if (!bassPart) {
        return {
            type: "none",
            chordSymbol: trimmed,
            upperStructure,
            rootPc: rootInfo.rootPc,
            chordTones: toneInfo.tones,
            isSeventhChord: toneInfo.isSeventhChord,
        };
    }

    const bassInfo = parseChordRoot(bassPart);
    if (!bassInfo) {
        return {
            type: "none",
            chordSymbol: trimmed,
            upperStructure,
            rootPc: rootInfo.rootPc,
            chordTones: toneInfo.tones,
            isSeventhChord: toneInfo.isSeventhChord,
        };
    }

    const inversionIndex = toneInfo.tones.findIndex((tone) => tone === bassInfo.rootPc);
    if (inversionIndex >= 0 && inversionIndex <= (toneInfo.isSeventhChord ? 3 : 2)) {
        return {
            type: "inversion",
            chordSymbol: trimmed,
            upperStructure,
            bassSymbol: bassInfo.root,
            rootPc: rootInfo.rootPc,
            bassPc: bassInfo.rootPc,
            chordTones: toneInfo.tones,
            inversionIndex: inversionIndex as 0 | 1 | 2 | 3,
            isSeventhChord: toneInfo.isSeventhChord,
        };
    }

    return {
        type: "non_chord_bass",
        chordSymbol: trimmed,
        upperStructure,
        bassSymbol: bassInfo.root,
        rootPc: rootInfo.rootPc,
        bassPc: bassInfo.rootPc,
        chordTones: toneInfo.tones,
        isSeventhChord: toneInfo.isSeventhChord,
    };
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
    const slashAnalysis = analyzeSlashChord(chordSymbol);
    const rootInfo = parseChordRoot(slashAnalysis.upperStructure);
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

    const quality = detectChordQuality(slashAnalysis.upperStructure);
    const extension = detectExtension(slashAnalysis.upperStructure);

    let romanBase = ROMANS[degreeIndex]!;
    if (quality === "minor" || quality === "diminished" || quality === "half-diminished") {
        romanBase = romanBase.toLowerCase() as (typeof ROMANS)[number];
    }

    const qualityMark = quality === "diminished"
        ? "°"
        : quality === "half-diminished"
            ? "ø"
            : "";

    if (slashAnalysis.type === "inversion" && slashAnalysis.inversionIndex !== undefined) {
        const inversionFigure = getInversionFigure(
            slashAnalysis.inversionIndex,
            slashAnalysis.isSeventhChord
        );

        return `${accidental}${romanBase}${qualityMark}${inversionFigure}`;
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
