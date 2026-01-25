
import { describe, expect, test } from "vitest";
import {
    buildDiatonicChords,
    suggestSubstitutions,
    DiatonicChord,
    ModeId
} from "../src";

function getChord(chords: DiatonicChord[], degree: number) {
    return chords.find(c => c.degree === degree)!;
}

describe("Substitution Engine Rules", () => {

    describe("E Ionian (Major)", () => {
        const tonic = "E";
        const mode = "ionian";
        const chords = buildDiatonicChords(tonic, mode, true);

        // 1. Emaj7 (I) -> G#m7 (iii), C#m7 (vi)
        test("I (Emaj7) substitutions", () => {
            const chord = getChord(chords, 1); // Emaj7
            const suggestions = suggestSubstitutions({
                tonic, mode, chord, allChords: chords
            });

            expect(suggestions.some(s => s.substituteSymbol === "G#m7")).toBe(true);
            expect(suggestions.some(s => s.substituteSymbol === "C#m7")).toBe(true);

            // Log for manual verification
            console.log("Emaj7 Subs:", suggestions.map(s => `${s.substituteSymbol} (${s.category})`));
        });

        // 2. B7 (V) -> D#m7b5 (viiø), F7 (tritone), D7 (backdoor)
        test("V (B7) substitutions", () => {
            const chord = getChord(chords, 5); // B7
            const suggestions = suggestSubstitutions({
                tonic, mode, chord, allChords: chords
            });

            const symbols = suggestions.map(s => s.substituteSymbol);
            expect(symbols).toContain("D#m7b5"); // Diatonic dominant function
            expect(symbols).toContain("F7");      // Tritone sub
            expect(symbols).toContain("D7");      // Backdoor (bVII7)

            console.log("B7 Subs:", suggestions.map(s => `${s.substituteSymbol} (${s.category})`));
        });

        // 3. Amaj7 (IV) -> Am7 (borrowed iv)
        test("IV (Amaj7) substitutions", () => {
            const chord = getChord(chords, 4); // Amaj7
            const suggestions = suggestSubstitutions({
                tonic, mode, chord, allChords: chords
            });

            expect(suggestions.some(s => s.substituteSymbol === "Am7")).toBe(true);
            console.log("Amaj7 Subs:", suggestions.map(s => `${s.substituteSymbol} (${s.category})`));
        });
    });

    describe("A Aeolian (Minor)", () => {
        const tonic = "A";
        const mode = "aeolian";
        const chords = buildDiatonicChords(tonic, mode, true);

        // 4. Em7 (v) -> E7 (V7 from harmonic minor)
        test("v (Em7) substitutions", () => {
            const chord = getChord(chords, 5); // Em7
            const suggestions = suggestSubstitutions({
                tonic, mode, chord, allChords: chords
            });

            expect(suggestions.some(s => s.substituteSymbol === "E7")).toBe(true);
            console.log("Em7 Subs:", suggestions.map(s => `${s.substituteSymbol} (${s.category})`));
        });

        // Additional checks from user requirements
        // "Dim approach chord: °7 som leder inn i målakkord"
        // Let's emulate a i -> iv progression. Current is i (Am7). Next is iv (Dm7).
        // Suggest vii°/iv? (C#dim7 -> Dm)
        test("Dim approach to next chord (Am7 -> Dm7)", () => {
            const chord = getChord(chords, 1); // Am7
            const nextChord = getChord(chords, 4); // Dm7

            const suggestions = suggestSubstitutions({
                tonic, mode, chord, allChords: chords, nextChord
            });

            // Target Dm7 (D). C#dim7 is approach.
            // C# dim7 = C# E G Bb.
            const hasDimApproach = suggestions.some(s => s.substituteSymbol.includes("C#dim7"));
            expect(hasDimApproach).toBe(true);

            console.log("Am7 -> Dm7 Subs:", suggestions.map(s => `${s.substituteSymbol} (${s.category})`));
        });
    });

});
