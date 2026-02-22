import { describe, it, expect } from "vitest";
import { analyzeSlashChord, getChordDegree, getNextChordSuggestionsFromSequence } from "../src/chords";

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
        { chord: "Ab/C", key: "Gm", expected: "bII6" },
        { chord: "G/B", key: "C", expected: "V6" },
        { chord: "G7/B", key: "C", expected: "V65" },
        { chord: "C/D", key: "C", expected: "I" },
    ])("analyzes $chord in $key as $expected", ({ chord, key, expected }) => {
        expect(getChordDegree(chord, key)).toBe(expected);
    });

    it("returns null when root parsing fails", () => {
        expect(getChordDegree("H7", "C")).toBeNull();
    });

    it("classifies C/D as non-chord-bass slash chord", () => {
        const slash = analyzeSlashChord("C/D");
        expect(slash.type).toBe("non_chord_bass");
    });
});

describe("sequence-based chord suggestions", () => {
    it("includes common C major continuations among top results", () => {
        const suggestions = getNextChordSuggestionsFromSequence(["C"], "C Major", { profile: "seventh" });
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
        const afterC = getNextChordSuggestionsFromSequence(["C"], "C Major", { profile: "triad" }).slice(0, 5);
        const afterAm = getNextChordSuggestionsFromSequence(["Am"], "C Major", { profile: "triad" }).slice(0, 5);

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
        const tonic = suggestions.find((s) => s.roman === "i");
        expect(tonic).toBeDefined();
        expect(tonic?.chord).toBe("Am");
    });

    it("uses the same base transition logic for G, G7, G9 and G13 in C major", () => {
        const fromTriad = getNextChordSuggestionsFromSequence(["G"], "C Major", { profile: "triad" }).map((s) => s.roman);
        const from7 = getNextChordSuggestionsFromSequence(["G7"], "C Major", { profile: "triad" }).map((s) => s.roman);
        const from9 = getNextChordSuggestionsFromSequence(["G9"], "C Major", { profile: "triad" }).map((s) => s.roman);
        const from13 = getNextChordSuggestionsFromSequence(["G13"], "C Major", { profile: "triad" }).map((s) => s.roman);

        expect(from7).toEqual(fromTriad);
        expect(from9).toEqual(fromTriad);
        expect(from13).toEqual(fromTriad);
    });

    it("jazz profile exposes dominant variants after tonic in C major", () => {
        const suggestions = getNextChordSuggestionsFromSequence(["C"], "C Major", { profile: "jazz", useSpice: true });
        const dominant = suggestions.find((s) => s.roman === "V");

        expect(dominant?.chord).toBe("G7");
        expect(dominant?.variants).toContain("G9");
        expect(dominant?.variants).toContain("G13");
    });

    it("handles extended slash chords as inversion when bass is a chord tone", () => {
        const slash = analyzeSlashChord("G7(b9)/B");
        expect(slash.type).toBe("inversion");
        expect(getChordDegree("G7(b9)/B", "C")).toBe("V65");
    });
});
