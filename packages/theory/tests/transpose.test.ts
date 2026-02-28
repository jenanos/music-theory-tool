import { describe, it, expect } from "vitest";
import { transposeChord, transposeChordLine, transposeSongSections } from "../src/transpose";

describe("transposeChord", () => {
    it("transposes a simple major chord up 2 semitones", () => {
        expect(transposeChord("C", 2, false)).toBe("D");
    });

    it("transposes Fm up 2 semitones (sharp context)", () => {
        expect(transposeChord("Fm", 2, false)).toBe("Gm");
    });

    it("transposes with flats preference", () => {
        expect(transposeChord("C", 1, true)).toBe("D♭");
    });

    it("transposes with sharps preference", () => {
        expect(transposeChord("C", 1, false)).toBe("C♯");
    });

    it("transposes a seventh chord preserving quality", () => {
        expect(transposeChord("Cmaj7", 2, false)).toBe("Dmaj7");
    });

    it("transposes a minor seventh chord", () => {
        expect(transposeChord("Am7", 3, true)).toBe("Cm7");
    });

    it("transposes a slash chord – both root and bass", () => {
        expect(transposeChord("G/B", 2, false)).toBe("A/C♯");
    });

    it("transposes a Unicode flat chord", () => {
        expect(transposeChord("B♭", 2, true)).toBe("C");
    });

    it("transposes a Unicode sharp chord", () => {
        expect(transposeChord("F♯m", 2, false)).toBe("G♯m");
    });

    it("returns chord unchanged when semitones is 0", () => {
        expect(transposeChord("Am", 0, true)).toBe("Am");
    });

    it("returns chord unchanged when semitones is 12", () => {
        expect(transposeChord("Am", 12, true)).toBe("Am");
    });

    it("returns unparseable tokens unchanged", () => {
        expect(transposeChord("xyz", 2, true)).toBe("xyz");
    });

    it("handles empty string", () => {
        expect(transposeChord("", 2, true)).toBe("");
    });

    it("handles diminished chord", () => {
        expect(transposeChord("Bdim", 1, true)).toBe("Cdim");
    });

    it("transposes complex slash chord with Unicode", () => {
        expect(transposeChord("B/D♯", 1, true)).toBe("C/E");
    });
});

describe("transposeChordLine", () => {
    it("transposes all chords in a line while preserving separators", () => {
        expect(transposeChordLine("Fm - B♭", 2, false)).toBe("Gm - C");
    });

    it("transposes a complex line", () => {
        expect(transposeChordLine("C7 - Gm", 2, false)).toBe("D7 - Am");
    });

    it("preserves separators exactly", () => {
        expect(transposeChordLine("Em - Em - Em - Em", 1, true)).toBe("Fm - Fm - Fm - Fm");
    });

    it("transposes line with slash chords", () => {
        expect(transposeChordLine("Cmaj7 - G/B - B/D♯ - Em", 5, true)).toBe("Fmaj7 - C/E - E/A♭ - Am");
    });
});

describe("transposeSongSections", () => {
    it("transposes all sections from F aeolian to G aeolian", () => {
        const sections = [
            {
                id: "intro",
                label: "Intro",
                chordLines: ["B♭ - Fm"],
                degreeLines: ["IV - i"],
            },
            {
                id: "verse",
                label: "Vers",
                chordLines: ["Fm - B♭", "B♭"],
                degreeLines: ["i - IV", "IV"],
            },
        ];

        const result = transposeSongSections(sections, "F aeolian", "G", "aeolian");

        expect(result[0]!.chordLines).toEqual(["C - Gm"]);
        expect(result[1]!.chordLines).toEqual(["Gm - C", "C"]);
        // Degree lines should stay the same
        expect(result[0]!.degreeLines).toEqual(["IV - i"]);
        expect(result[1]!.degreeLines).toEqual(["i - IV", "IV"]);
    });

    it("returns sections unchanged when old key is invalid", () => {
        const sections = [{ chordLines: ["Am - G"], degreeLines: [] }];
        const result = transposeSongSections(sections, "", "C", "ionian");
        expect(result).toBe(sections);
    });

    it("returns sections unchanged when tonic doesn't change", () => {
        const sections = [{ chordLines: ["Am - G"], degreeLines: [] }];
        const result = transposeSongSections(sections, "C ionian", "C", "aeolian");
        expect(result).toBe(sections);
    });

    it("preserves extra section properties", () => {
        const sections = [
            { id: "s1", label: "Test", chordLines: ["C"], degreeLines: ["I"], notes: "keep this" },
        ];
        const result = transposeSongSections(sections, "C ionian", "D", "ionian");
        expect(result[0]!.id).toBe("s1");
        expect(result[0]!.label).toBe("Test");
        expect(result[0]!.notes).toBe("keep this");
        expect(result[0]!.chordLines).toEqual(["D"]);
    });
});
