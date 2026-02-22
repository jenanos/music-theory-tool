
import { getScale } from "./index";
import {
    getStartingChords,
    normalizeRomanForTransition,
    suggestNextChords,
    type NextChordSuggestion,
} from "./progressions";
import {
    DEFAULT_CHORD_RICHNESS_PROFILE,
    generateChordVariants,
    getChordCorePitchClasses,
    inferProfileFromSequence,
    normalizeChordSymbol,
    parseChordSymbol,
    toProfileBaseChordSymbol,
} from "./chord_richness";
import { parseKey } from "./utils";
import type { ChordRichnessProfile, ChordVariantOption, SlashChordAnalysis } from "./types";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const;
const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

export interface SequenceSuggestion {
    roman: string;
    chord: string;
    variants?: string[];
    variantOptions?: ChordVariantOption[];
    profile: ChordRichnessProfile;
    frequency: number;
    isDiatonic: boolean;
    secondaryLabel?: string;
}

function parseChordRoot(chordSymbol: string): { root: string; letter: string; rootPc: number } | null {
    const parsed = parseChordSymbol(chordSymbol);
    if (!parsed) return null;
    return { root: parsed.root, letter: parsed.letter, rootPc: parsed.rootPc };
}

function detectChordQuality(chordSymbol: string): "major" | "minor" | "diminished" | "half-diminished" {
    const parsed = parseChordSymbol(chordSymbol);
    if (!parsed) return "major";

    if (parsed.baseQuality === "minor") return "minor";
    if (parsed.baseQuality === "diminished") return "diminished";
    if (parsed.baseQuality === "half-diminished") return "half-diminished";
    return "major";
}

function detectExtension(chordSymbol: string): "maj7" | "7" | "none" {
    const parsed = parseChordSymbol(chordSymbol);
    if (!parsed) return "none";
    if (parsed.seventhType === "maj7") return "maj7";
    if (parsed.seventhType === "7" || parsed.seventhType === "ø7" || parsed.seventhType === "°7") return "7";
    return "none";
}

function detectChordTones(chordSymbol: string): { tones: number[]; isSeventhChord: boolean } | null {
    const parsed = parseChordSymbol(chordSymbol);
    if (!parsed) return null;

    return {
        tones: getChordCorePitchClasses(parsed),
        isSeventhChord: parsed.seventhType !== "none",
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
    const normalized = normalizeChordSymbol(chordSymbol);
    const slashIndex = normalized.indexOf("/");
    const upperStructure = slashIndex >= 0 ? normalized.slice(0, slashIndex).trim() : normalized;
    const bassPart = slashIndex >= 0 ? normalized.slice(slashIndex + 1).trim() : undefined;

    const toneInfo = detectChordTones(upperStructure);
    const rootInfo = parseChordRoot(upperStructure);
    if (!toneInfo || !rootInfo) {
        return {
            type: "none",
            chordSymbol: normalized,
            upperStructure,
            bassSymbol: bassPart,
            chordTones: [],
            isSeventhChord: false,
        };
    }

    if (!bassPart) {
        return {
            type: "none",
            chordSymbol: normalized,
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
            chordSymbol: normalized,
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
            chordSymbol: normalized,
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
        chordSymbol: normalized,
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
        { profile: DEFAULT_CHORD_RICHNESS_PROFILE }
    );
    return result.map((s) => s.chord);
}

export function getNextChordSuggestionsFromSequence(
    sequence: string[],
    key: string,
    options: { useSpice?: boolean; profile?: ChordRichnessProfile } = {}
): SequenceSuggestion[] {
    const parsed = parseKey(key);
    if (!parsed) return [];

    const { tonic, mode } = parsed;
    const profile = options.profile ?? inferProfileFromSequence(sequence, DEFAULT_CHORD_RICHNESS_PROFILE);
    const useSpice = options.useSpice ?? false;

    const romanSequence = sequence
        .map((symbol) => getChordDegree(symbol, key))
        .filter((roman): roman is string => Boolean(roman))
        .map((roman) => normalizeRomanForTransition(roman));

    const source: NextChordSuggestion[] = romanSequence.length > 0
        ? suggestNextChords(romanSequence, tonic, mode, { useSpice })
        : getStartingChords(mode, tonic, { useSpice });

    return source.map((suggestion) => {
        const baseRoman = normalizeRomanForTransition(suggestion.roman);
        const baseChord = toProfileBaseChordSymbol(suggestion.chord, profile, { roman: baseRoman });
        const variantOptions = generateChordVariants({
            baseSymbol: baseChord,
            profile,
            roman: baseRoman,
            useSpice,
            maxVariants: 6,
        });
        const variants = variantOptions.map((variant) => variant.symbol);

        return {
            roman: baseRoman,
            chord: baseChord,
            variants: variants.length > 0 ? variants : undefined,
            variantOptions: variantOptions.length > 0 ? variantOptions : undefined,
            profile,
            frequency: suggestion.frequency,
            isDiatonic: suggestion.isDiatonic,
            secondaryLabel: suggestion.secondaryLabel,
        };
    });
}
