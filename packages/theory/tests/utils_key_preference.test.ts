import { describe, expect, it } from "vitest";
import { prefersFlatsForKey, parseKey } from "../src/utils";

describe("prefersFlatsForKey", () => {
    it("uses explicit flat tonic", () => {
        expect(prefersFlatsForKey("Bb", "ionian")).toBe(true);
    });

    it("uses explicit sharp tonic", () => {
        expect(prefersFlatsForKey("F#", "ionian")).toBe(false);
    });

    it("uses relative major for aeolian", () => {
        expect(prefersFlatsForKey("G", "aeolian")).toBe(true);
    });

    it("uses relative major for dorian", () => {
        expect(prefersFlatsForKey("D", "dorian")).toBe(false);
    });

    it("uses relative major for harmonic minor", () => {
        expect(prefersFlatsForKey("G", "harmonic_minor")).toBe(true);
    });

    it.each([
        { tonic: "A", mode: "aeolian" as const, expected: false }, // relative C major
        { tonic: "C", mode: "dorian" as const, expected: true }, // relative Bb major
        { tonic: "E", mode: "phrygian" as const, expected: false }, // relative C major
        { tonic: "F", mode: "mixolydian" as const, expected: true }, // relative Bb major
    ])("maps $tonic $mode -> prefersFlats=$expected", ({ tonic, mode, expected }) => {
        expect(prefersFlatsForKey(tonic, mode)).toBe(expected);
    });
});

describe("parseKey", () => {
    it("parses tonic + modeId format for all modes", () => {
        expect(parseKey("C ionian")).toEqual({ tonic: "C", mode: "ionian" });
        expect(parseKey("G dorian")).toEqual({ tonic: "G", mode: "dorian" });
        expect(parseKey("E phrygian")).toEqual({ tonic: "E", mode: "phrygian" });
        expect(parseKey("F lydian")).toEqual({ tonic: "F", mode: "lydian" });
        expect(parseKey("A mixolydian")).toEqual({ tonic: "A", mode: "mixolydian" });
        expect(parseKey("D aeolian")).toEqual({ tonic: "D", mode: "aeolian" });
        expect(parseKey("B locrian")).toEqual({ tonic: "B", mode: "locrian" });
        expect(parseKey("A harmonic_minor")).toEqual({ tonic: "A", mode: "harmonic_minor" });
    });

    it("parses traditional key formats", () => {
        expect(parseKey("Fm")).toEqual({ tonic: "F", mode: "aeolian" });
        expect(parseKey("C")).toEqual({ tonic: "C", mode: "ionian" });
        expect(parseKey("G")).toEqual({ tonic: "G", mode: "ionian" });
        expect(parseKey("Em")).toEqual({ tonic: "E", mode: "aeolian" });
    });

    it("parses keys with sharps and flats", () => {
        expect(parseKey("F# dorian")).toEqual({ tonic: "F#", mode: "dorian" });
        expect(parseKey("Eb mixolydian")).toEqual({ tonic: "Eb", mode: "mixolydian" });
        expect(parseKey("Bb ionian")).toEqual({ tonic: "Bb", mode: "ionian" });
    });

    it("returns null for empty input", () => {
        expect(parseKey("")).toBeNull();
        expect(parseKey("   ")).toBeNull();
    });
});
