import { describe, expect, it } from "vitest";
import {
    DEFAULT_CHORD_RICHNESS_PROFILE,
    generateChordVariants,
    inferProfileFromSequence,
    parseChordSymbol,
    toProfileBaseChordSymbol,
} from "../src";

describe("chord richness parsing", () => {
    it("parses altered dominant slash chords", () => {
        const parsed = parseChordSymbol("G7(b9)/B");
        expect(parsed).toBeTruthy();
        expect(parsed?.root).toBe("G");
        expect(parsed?.slashBass).toBe("B");
        expect(parsed?.seventhType).toBe("7");
        expect(parsed?.extensions).toContain("b9");
    });

    it("normalizes unicode accidentals", () => {
        const parsed = parseChordSymbol("B♭maj7");
        expect(parsed?.root).toBe("Bb");
        expect(parsed?.seventhType).toBe("maj7");
    });
});

describe("profile inference and conversion", () => {
    it("infers triad profile from triad-led sequence", () => {
        expect(inferProfileFromSequence(["C", "Am", "F"])).toBe("triad");
    });

    it("infers seventh profile from extended-led sequence", () => {
        expect(inferProfileFromSequence(["Cmaj7", "Am7"])).toBe("seventh");
        expect(inferProfileFromSequence(["G9"])).toBe("seventh");
    });

    it("uses fallback profile when sequence is empty", () => {
        expect(inferProfileFromSequence([], DEFAULT_CHORD_RICHNESS_PROFILE)).toBe("seventh");
    });

    it.each([
        { symbol: "G13/B", profile: "triad" as const, roman: "V", expected: "G/B" },
        { symbol: "G/B", profile: "seventh" as const, roman: "V6", expected: "G7/B" },
        { symbol: "F", profile: "seventh" as const, roman: "IV", expected: "Fmaj7" },
        { symbol: "Bdim", profile: "seventh" as const, roman: "vii°", expected: "Bdim7" },
        { symbol: "Bm7b5", profile: "triad" as const, roman: "viiø7", expected: "Bdim" },
    ])("maps $symbol -> $expected in $profile profile", ({ symbol, profile, roman, expected }) => {
        expect(toProfileBaseChordSymbol(symbol, profile, { roman })).toBe(expected);
    });
});

describe("variant generation", () => {
    it("builds major-seventh family variants", () => {
        const variants = generateChordVariants({
            baseSymbol: "Cmaj7",
            profile: "jazz",
            roman: "I",
            useSpice: true,
        }).map((entry) => entry.symbol);

        expect(variants).toContain("Cmaj9");
        expect(variants).toContain("Cmaj7(#11)");
        expect(variants.some((symbol) => symbol.includes("maj11"))).toBe(false);
    });

    it("builds minor-seventh family variants", () => {
        const seventh = generateChordVariants({
            baseSymbol: "Am7",
            profile: "seventh",
            roman: "vi",
        }).map((entry) => entry.symbol);
        const jazz = generateChordVariants({
            baseSymbol: "Am7",
            profile: "jazz",
            roman: "vi",
        }).map((entry) => entry.symbol);

        expect(seventh).toContain("Am9");
        expect(jazz).toContain("Am11");
    });

    it("builds dominant variants and applies avoid-rule for 11", () => {
        const variants = generateChordVariants({
            baseSymbol: "G7",
            profile: "seventh",
            roman: "V",
            useSpice: true,
        }).map((entry) => entry.symbol);

        expect(variants).toContain("G9");
        expect(variants).toContain("G13");
        expect(variants).toContain("G9sus");
        expect(variants).not.toContain("G11");
    });

    it("adds dominant alterations in jazz spice mode", () => {
        const variants = generateChordVariants({
            baseSymbol: "D7",
            profile: "jazz",
            roman: "V",
            useSpice: true,
        }).map((entry) => entry.symbol);

        expect(variants).toContain("D7(b9)");
        expect(variants).toContain("D7(#9)");
        expect(variants).toContain("D7(#11)");
        expect(variants).toContain("D7(b13)");
    });

    it("builds mild triad-color variants in triad profile", () => {
        const variants = generateChordVariants({
            baseSymbol: "F",
            profile: "triad",
            roman: "IV",
        }).map((entry) => entry.symbol);

        expect(variants).toContain("Fadd9");
        expect(variants).toContain("F6");
        expect(variants).toContain("Fsus2");
        expect(variants).toContain("Fsus4");
    });

    it("preserves slash bass when generating variants", () => {
        const variants = generateChordVariants({
            baseSymbol: "G7/B",
            profile: "jazz",
            roman: "V",
            useSpice: true,
        }).map((entry) => entry.symbol);

        expect(variants).toContain("G9/B");
        expect(variants).toContain("G13/B");
    });

    it("is deterministic for identical inputs", () => {
        const first = generateChordVariants({
            baseSymbol: "G7",
            profile: "jazz",
            roman: "V",
            useSpice: true,
        });
        const second = generateChordVariants({
            baseSymbol: "G7",
            profile: "jazz",
            roman: "V",
            useSpice: true,
        });

        expect(second).toEqual(first);
    });
});
