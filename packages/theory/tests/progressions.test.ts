import { describe, expect, it } from "vitest";
import {
    filterProgressions,
    transposeProgression,
    suggestNextChords,
    getStartingChords,
    getAllTags,
    CHORD_PROGRESSIONS,
} from "../src/progressions";

describe("chord progressions", () => {
    it("dataset has expected number of progressions", () => {
        expect(CHORD_PROGRESSIONS.length).toBeGreaterThanOrEqual(50);
    });

    it("getAllTags returns unique sorted tags", () => {
        const tags = getAllTags();
        expect(tags.includes("common")).toBe(true);
        expect(tags.includes("jazz")).toBe(true);
        expect(tags.includes("pop")).toBe(true);
        // Should be sorted
        const sorted = [...tags].sort();
        expect(tags).toEqual(sorted);
    });

    describe("filterProgressions", () => {
        it("filters by mode", () => {
            const major = filterProgressions("major");
            const minor = filterProgressions("minor");

            expect(major.every((p) => p.mode === "major")).toBe(true);
            expect(minor.every((p) => p.mode === "minor")).toBe(true);
        });

        it("filters by tags", () => {
            const jazz = filterProgressions("all", ["jazz"]);
            expect(jazz.every((p) => p.tags.includes("jazz"))).toBe(true);
        });

        it("filters by chord type", () => {
            const triads = filterProgressions("all", undefined, "triad");
            const sevenths = filterProgressions("all", undefined, "seventh");

            expect(triads.every((p) => p.type === "triad")).toBe(true);
            expect(sevenths.every((p) => p.type === "seventh")).toBe(true);
        });

        it("returns results sorted by weight (descending)", () => {
            const all = filterProgressions("all");
            for (let i = 1; i < all.length; i++) {
                expect(all[i - 1]!.weight).toBeGreaterThanOrEqual(all[i]!.weight);
            }
        });
    });

    describe("transposeProgression", () => {
        it("transposes I-V-vi-IV to C major correctly", () => {
            const prog = CHORD_PROGRESSIONS.find((p) => p.id === "maj_tri_01")!;
            const transposed = transposeProgression(prog, "C");

            expect(transposed.roman).toEqual(["I", "V", "vi", "IV"]);
            expect(transposed.chords).toEqual(["C", "G", "Am", "F"]);
            expect(transposed.tonic).toBe("C");
        });

        it("transposes to G major correctly", () => {
            const prog = CHORD_PROGRESSIONS.find((p) => p.id === "maj_tri_01")!;
            const transposed = transposeProgression(prog, "G");

            expect(transposed.chords).toEqual(["G", "D", "Em", "C"]);
        });

        it("uses flats for flat keys", () => {
            const prog = CHORD_PROGRESSIONS.find((p) => p.id === "maj_tri_01")!;
            const transposed = transposeProgression(prog, "F");

            expect(transposed.chords).toEqual(["F", "C", "Dm", "Bb"]);
        });

        it("transposes minor progressions correctly", () => {
            const prog = CHORD_PROGRESSIONS.find((p) => p.id === "min_tri_02")!;
            const transposed = transposeProgression(prog, "A");

            // i - iv - V - i in A minor
            expect(transposed.chords[0]).toBe("Am");
            expect(transposed.chords[1]).toBe("Dm");
            expect(transposed.chords[2]).toBe("E");
            expect(transposed.chords[3]).toBe("Am");
        });
    });

    describe("suggestNextChords", () => {
        it("returns suggestions after I", () => {
            const suggestions = suggestNextChords(["I"], "C");

            expect(suggestions.length).toBeGreaterThan(0);
            // Common follows after I include V, IV, vi
            const romanSuggestions = suggestions.map((s) => s.roman);
            expect(romanSuggestions).toContain("V");
        });

        it("returns empty array for empty sequence", () => {
            const suggestions = suggestNextChords([], "C");
            expect(suggestions).toEqual([]);
        });

        it("returns suggestions with transposed chord names", () => {
            const suggestions = suggestNextChords(["I"], "G");
            const vSuggestion = suggestions.find((s) => s.roman === "V");

            expect(vSuggestion?.chord).toBe("D");
        });
    });

    describe("getStartingChords", () => {
        it("returns common starting chords for major", () => {
            const starts = getStartingChords("major", "C");

            expect(starts.length).toBeGreaterThan(0);
            // I should be a common starting chord
            const hasI = starts.some((s) => s.roman === "I");
            expect(hasI).toBe(true);
        });

        it("returns common starting chords for minor", () => {
            const starts = getStartingChords("minor", "A");

            expect(starts.length).toBeGreaterThan(0);
            // i should be a common starting chord
            const hasI = starts.some((s) => s.roman === "i");
            expect(hasI).toBe(true);
        });
    });
});
