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
        expect(basic.some((symbol) => ["Cmaj7", "Cmaj9", "Cmaj7/E"].includes(symbol))).toBe(true);

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
        expect(symbols).toContain("Bdim7");
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

    test("triad profile avoids random seventh mixing", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 1),
            allChords: chords,
            sourceSymbol: "C",
            profile: "triad",
            includeSpice: true,
        });

        const hasSeventhSymbols = suggestions.some((entry) => /maj7|m7|[^0-9]7/.test(entry.substituteSymbol));
        expect(hasSeventhSymbols).toBe(false);
    });

    test("jazz profile exposes richer variants on tritone substitutions", () => {
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
            profile: "jazz",
        });

        const tritone = suggestions.find((entry) => entry.substituteSymbol === "Db7");
        expect(tritone).toBeDefined();
        const variantSymbols = tritone?.variants?.map((variant) => variant.symbol) ?? [];
        expect(variantSymbols).toContain("Db9");
        expect(variantSymbols).toContain("Db13");
    });

    test("minor dominant suggestions include altered options when spice is enabled", () => {
        const tonic = "G";
        const mode: ModeId = "aeolian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 5),
            allChords: chords,
            sourceSymbol: "Dm7",
            includeSpice: true,
            profile: "jazz",
        });

        const dominant = suggestions.find((entry) => entry.substituteSymbol === "D7");
        expect(dominant).toBeDefined();
        const dominantVariants = dominant?.variants?.map((variant) => variant.symbol) ?? [];
        expect(dominantVariants).toContain("D7(b9)");
        expect(dominantVariants).toContain("D7(#9)");
    });

    test("never suggests the source chord as its own substitution", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const dominantSuggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 5),
            allChords: chords,
            nextChord: getChord(chords, 1),
            sourceSymbol: "G7",
            includeSpice: true,
            includeApproach: true,
        });

        expect(
            dominantSuggestions.some((suggestion) => suggestion.substituteSymbol === "G7"),
        ).toBe(false);

        const tonicSuggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 1),
            allChords: chords,
            sourceSymbol: "Cmaj7",
            includeSpice: true,
        });

        expect(
            tonicSuggestions.some((suggestion) => suggestion.substituteSymbol === "Cmaj7"),
        ).toBe(false);
    });

    test("dominant spice on vii chord derives from the functional dominant", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 7),
            allChords: chords,
            sourceSymbol: "Bm7b5",
            includeSpice: true,
        });

        const symbols = suggestions.map((suggestion) => suggestion.substituteSymbol);
        // Tritone sub of the key's dominant (G7) is Db7 — never F7.
        expect(symbols).toContain("Db7");
        expect(symbols).not.toContain("F7");
        // Leading-tone dim of C is Bdim — never D#dim/Ebdim.
        expect(symbols).toContain("Bdim7");
        expect(symbols).not.toContain("D#dim7");
        expect(symbols).not.toContain("Ebdim7");
    });

    test("raised leading tone is spelled sharp in flat minor keys", () => {
        const tonic = "G";
        const mode: ModeId = "aeolian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 5),
            allChords: chords,
            sourceSymbol: "Dm7",
            includeSpice: true,
        });

        const symbols = suggestions.map((suggestion) => suggestion.substituteSymbol);
        expect(symbols).toContain("F#dim7");
        expect(symbols.some((symbol) => symbol.startsWith("Gbdim"))).toBe(false);
    });

    test("inversion suggestion keeps the chord quality", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const suggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 2),
            allChords: chords,
            sourceSymbol: "Dm7",
            includeSpice: true,
        });

        const symbols = suggestions.map((suggestion) => suggestion.substituteSymbol);
        expect(symbols).toContain("Dm7/F");
        expect(symbols).not.toContain("Dmaj7/F");
        expect(symbols).not.toContain("D/F");
    });

    test("richer voicings survive the richness profile instead of collapsing", () => {
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

        const basic = symbolsOfCategory(suggestions, "basic");
        expect(basic).toContain("G9");
        expect(basic).toContain("G13");
    });

    test("does not suggest a downgraded version of an already-rich source chord", () => {
        const tonic = "C";
        const mode: ModeId = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        const dominantSuggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 5),
            allChords: chords,
            sourceSymbol: "G9",
            includeSpice: true,
        });

        expect(
            dominantSuggestions.some((suggestion) => suggestion.substituteSymbol === "G7"),
        ).toBe(false);

        const triadSuggestions = suggestSubstitutions({
            tonic,
            mode,
            chord: getChord(chords, 1),
            allChords: chords,
            sourceSymbol: "Cadd9",
            profile: "triad",
            includeSpice: true,
        });

        expect(
            triadSuggestions.some((suggestion) => suggestion.substituteSymbol === "C"),
        ).toBe(false);
    });

    test("reasons are human-readable Norwegian sentences", () => {
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

        expect(suggestions.length).toBeGreaterThan(0);
        for (const suggestion of suggestions) {
            expect(suggestion.reason.endsWith(".")).toBe(true);
        }

        const commonTone = suggestions.find((suggestion) => suggestion.tags.includes("common tones"));
        expect(commonTone?.reason.toLowerCase()).toContain("deler akkordtoner");
    });
});
