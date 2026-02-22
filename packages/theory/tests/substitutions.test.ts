import { describe, expect, test } from "vitest";
import {
    buildDiatonicChords,
    suggestSubstitutions,
    type DiatonicChord,
    type ModeId,
} from "../src";

function getChord(chords: DiatonicChord[], degree: number): DiatonicChord {
    const match = chords.find((chord) => chord.degree === degree);
    if (!match) throw new Error(`Missing diatonic degree ${degree}`);
    return match;
}

function symbolsOfCategory(
    suggestions: ReturnType<typeof suggestSubstitutions>,
    category: "basic" | "spice" | "approach",
): string[] {
    return suggestions
        .filter((suggestion) => suggestion.category === category)
        .map((suggestion) => suggestion.substituteSymbol);
}

describe("substitution engine", () => {
    test("is deterministic for identical input", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const context = {
            tonic,
            mode,
            chord: getChord(chords, 1),
            allChords: chords,
            sourceSymbol: "C",
            includeSpice: true,
            preserveBass: true,
        } as const;

        const first = suggestSubstitutions(context);
        const second = suggestSubstitutions(context);

        expect(second).toEqual(first);
    });

    test("C major tonic gets useful basic + spice substitutions", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 1),
            allChords: chords,
            sourceSymbol: "C",
            includeSpice: true,
        });

        const basic = symbolsOfCategory(suggestions, "basic");
        const spice = symbolsOfCategory(suggestions, "spice");

        expect(basic.some((symbol) => symbol.startsWith("Am"))).toBe(true);
        expect(basic.some((symbol) => symbol.startsWith("Em"))).toBe(true);
        expect(basic.some((symbol) => ["Cmaj7", "C6", "C/E"].includes(symbol))).toBe(true);

        expect(spice.some((symbol) => ["Fm", "Fm7", "Bb", "Ab"].includes(symbol))).toBe(true);
    });

    test("dominant substitutions include Bdim and Db7 in C major", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 5),
            allChords: chords,
            sourceSymbol: "G7",
            includeSpice: true,
        });

        const symbols = suggestions.map((suggestion) => suggestion.substituteSymbol);
        expect(symbols).toContain("Bdim");
        expect(symbols).toContain("Db7");
    });

    test("approach suggestions include V/vi before Am in C major", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 1),
            allChords: chords,
            nextChord: getChord(chords, 6),
            sourceSymbol: "C",
            includeApproach: true,
        });

        const approachE7 = suggestions.find(
            (suggestion) => suggestion.category === "approach" && suggestion.substituteSymbol === "E7",
        );

        expect(approachE7).toBeDefined();
        expect(approachE7?.requiresContext).toBe(true);
    });

    test("targeting tonic allows backdoor bVII7 as approach", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 2),
            allChords: chords,
            nextChord: getChord(chords, 1),
            sourceSymbol: "Dm7",
            includeApproach: true,
        });

        expect(
            suggestions.some(
                (suggestion) => suggestion.category === "approach" && suggestion.substituteSymbol === "Bb7",
            ),
        ).toBe(true);
    });

    test("preserveBass prioritizes inversion-friendly substitutions", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 5),
            allChords: chords,
            sourceSymbol: "G/B",
            preserveBass: true,
            includeSpice: true,
        });

        const symbols = suggestions.map((suggestion) => suggestion.substituteSymbol);
        expect(symbols).toContain("Em7/B");
        expect(symbols).toContain("G7/B");
    });

    test("G minor suggestions respect flat enharmonics", () => {
        const tonic = "G";
        const mode: ModeId = "aeolian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 1),
            allChords: chords,
            sourceSymbol: "Gm",
            includeSpice: true,
        });

        const hasSharpEnharmonics = suggestions.some(
            (suggestion) => suggestion.substituteSymbol.startsWith("A#") || suggestion.substituteSymbol.startsWith("D#"),
        );

        expect(hasSharpEnharmonics).toBe(false);
    });
});
