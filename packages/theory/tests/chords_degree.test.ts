import { describe, it, expect } from "vitest";
import { getChordDegree, getNextChordSuggestionsFromSequence } from "../src/chords";

describe("chromatic chord degree analysis", () => {
    it.each([
        { chord: "Ab", key: "Gm", expected: "bII" },
        { chord: "Abmaj7", key: "Gm", expected: "bIImaj7" },
        { chord: "Gm7", key: "Gm", expected: "i7" },
        { chord: "G#", key: "Gm", expected: "#I" },
        { chord: "Bbmaj7", key: "Gm", expected: "IIImaj7" },
        { chord: "A#maj7", key: "Gm", expected: "#IImaj7" },
        { chord: "F#m7b5", key: "Em", expected: "iiø7" },
        { chord: "F#dim7", key: "Em", expected: "ii°7" },
        { chord: "Ab/C", key: "Gm", expected: "bII" },
    ])("analyzes $chord in $key as $expected", ({ chord, key, expected }) => {
        expect(getChordDegree(chord, key)).toBe(expected);
    });

    it("returns null when root parsing fails", () => {
        expect(getChordDegree("H7", "C")).toBeNull();
    });
});

describe("sequence-based chord suggestions", () => {
    it("includes common C major continuations among top results", () => {
        const suggestions = getNextChordSuggestionsFromSequence(["C"], "C Major");
        const topChords = suggestions.slice(0, 8).map((s) => s.chord);

        expect(topChords).toContain("Fmaj7");
        expect(topChords.some((c) => c.startsWith("G"))).toBe(true);
        expect(topChords).toContain("Am7");
    });

    it("includes common C major continuations in triad profile", () => {
        const suggestions = getNextChordSuggestionsFromSequence(["C"], "C Major", { profile: "triad" });
        const topChords = suggestions.slice(0, 8).map((s) => s.chord);

        expect(topChords).toContain("F");
        expect(topChords).toContain("Am");
        expect(topChords.some((c) => c === "G")).toBe(true);
    });

    it("returns start suggestions when sequence is empty", () => {
        const suggestions = getNextChordSuggestionsFromSequence([], "Gm");
        expect(suggestions.length).toBeGreaterThan(0);
    });

    it("avoids sharp enharmonics in G minor start suggestions", () => {
        const suggestions = getNextChordSuggestionsFromSequence([], "Gm");
        const chords = suggestions.map((s) => s.chord);
        const sharpSpelling = chords.some((chord) => chord.startsWith("A#") || chord.startsWith("D#") || chord.startsWith("G#"));

        expect(sharpSpelling).toBe(false);
    });

    it("changes output with sequence context", () => {
        const afterC = getNextChordSuggestionsFromSequence(["C"], "C Major").slice(0, 5);
        const afterAm = getNextChordSuggestionsFromSequence(["Am"], "C Major").slice(0, 5);

        expect(afterC).not.toEqual(afterAm);
    });

    it("is deterministic for same input", () => {
        const first = getNextChordSuggestionsFromSequence(["C"], "C Major", { useSpice: true, profile: "seventh" });
        const second = getNextChordSuggestionsFromSequence(["C"], "C Major", { useSpice: true, profile: "seventh" });
        expect(second).toEqual(first);
    });

    it("seventh profile keeps seventh-style symbols", () => {
        const suggestions = getNextChordSuggestionsFromSequence(["Gm7"], "Gm", { profile: "seventh", useSpice: true });
        expect(suggestions.some((s) => s.chord.endsWith("7"))).toBe(true);
    });

    it("triad profile avoids seventh extensions", () => {
        const suggestions = getNextChordSuggestionsFromSequence(["C"], "C Major", { profile: "triad", useSpice: true });
        const hasSeventhChord = suggestions.some((s) => /maj7|m7|[^0-9]7/.test(s.chord));
        expect(hasSeventhChord).toBe(false);
    });

    it("jazz profile includes variants", () => {
        const suggestions = getNextChordSuggestionsFromSequence(["Gm7"], "Gm", { profile: "jazz", useSpice: true });
        expect(suggestions.some((s) => (s.variants?.length ?? 0) > 0)).toBe(true);
    });

    it("triad profile keeps minor quality for i6 suggestions", () => {
        const suggestions = getNextChordSuggestionsFromSequence(["E7"], "A Minor", { profile: "triad", useSpice: true });
        const i6 = suggestions.find((s) => s.roman === "i6");
        expect(i6).toBeDefined();
        expect(i6?.chord).toBe("Am");
    });
});
