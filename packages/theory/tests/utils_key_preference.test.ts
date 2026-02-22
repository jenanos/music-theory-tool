import { describe, expect, it } from "vitest";
import { prefersFlatsForKey } from "../src/utils";

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
