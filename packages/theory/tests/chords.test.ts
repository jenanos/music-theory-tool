
import { describe, it, expect } from "vitest";
import { getChordDegree, getChordSuggestions } from "../src/chords";

describe("getChordDegree", () => {
    it("should identify I chord in C Major", () => {
        expect(getChordDegree("C", "C Major")).toBe("I");
    });

    it("should identify V chord in C Major", () => {
        expect(getChordDegree("G", "C Major")).toBe("V");
    });

    it("should identify vi chord in C Major", () => {
        expect(getChordDegree("Am", "C Major")).toBe("vi");
    });

    it("should identify i chord in A Minor", () => {
        expect(getChordDegree("Am", "A Minor")).toBe("i");
    });

    it("should identify VII chord in A Minor", () => {
        expect(getChordDegree("G", "A Minor")).toBe("VII");
    });

    it("should handle chord extensions (Cmaj7 -> I)", () => {
        expect(getChordDegree("Cmaj7", "C Major")).toBe("Imaj7");
    });

    it("should handle slash chords (C/E -> I)", () => {
        expect(getChordDegree("C/E", "C Major")).toBe("I");
    });

    it("should return null for unknown key", () => {
        expect(getChordDegree("C", "")).toBeNull();
    });
});

describe("getChordSuggestions", () => {
    it("should return suggestions for C Major", () => {
        const suggestions = getChordSuggestions("C", "C Major");
        expect(suggestions.length).toBeGreaterThan(0);
        expect(suggestions).toContain("Cmaj7");
        expect(suggestions).toContain("G7");
        expect(suggestions).toContain("Am7");
    });

    it("should return suggestions for A Minor", () => {
        const suggestions = getChordSuggestions("Am", "A Minor");
        expect(suggestions.length).toBeGreaterThan(0);
        // Expecting 7ths because getChordSuggestions calls buildDiatonicChords(..., true)
        expect(suggestions).toContain("Am7");
        expect(suggestions).toContain("G7"); // VII in natural minor
    });
});
