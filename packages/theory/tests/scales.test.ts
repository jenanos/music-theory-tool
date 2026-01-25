
import { describe, it, expect } from 'vitest';
import { matchScales, parseChord, getScaleNotes } from '../src/scales';
import { NOTE_TO_PC } from '../src/utils';

describe('Scale Library', () => {
    it('should retrieve correct scale notes for C Ionian', () => {
        const cPc = NOTE_TO_PC['C'];
        const notes = getScaleNotes(cPc, 'ionian');
        // C D E F G A B
        expect(notes).toEqual([0, 2, 4, 5, 7, 9, 11]);
    });

    it('should retrieve correct scale notes for A Aeolian', () => {
        const aPc = NOTE_TO_PC['A'];
        const notes = getScaleNotes(aPc, 'aeolian');
        // A B C D E F G => Same pitch classes as C Ionian: 0 2 4 5 7 9 11
        expect(notes.sort((a, b) => a - b)).toEqual([0, 2, 4, 5, 7, 9, 11]);
    });
});

describe('Chord Parser', () => {
    it('should parse Cmaj7', () => {
        const res = parseChord("Cmaj7");
        expect(res.rootPc).toBe(0);
        expect(res.quality).toBe("maj7");
        // C E G B
        expect(res.tones).toEqual([0, 4, 7, 11]);
    });

    it('should parse D7', () => {
        const res = parseChord("D7");
        expect(res.rootPc).toBe(2);
        expect(res.quality).toBe("7");
        // D F# A C -> 2, 6, 9, 0
        expect(res.tones.sort((a, b) => a - b)).toEqual([0, 2, 6, 9]);
    });

    it('should parse Fm7', () => {
        const res = parseChord("Fm7");
        expect(res.rootPc).toBe(5);
        expect(res.quality).toBe("m7");
        // F Ab C Eb -> 5, 8, 0, 3
        expect(res.tones.sort((a, b) => a - b)).toEqual([0, 3, 5, 8]);
    });

    it('should parse complicated jazz chords', () => {
        const res = parseChord("G7b9");
        expect(res.rootPc).toBe(7);
        // G B D F Ab = 7 11 2 5 8
        expect(res.tones).toContain(8); // Ab
    });
});

describe('Chord Scale Matching', () => {
    it('Emaj7 -> Ionisk/Lydisk priority in generic context', () => {
        const matches = matchScales("Emaj7", {}, "jazz");
        const top = matches[0];
        // Expect Ionian or Lydian on top
        expect(["ionian", "lydian"]).toContain(top.scaleId);
        expect(top.score).toBeGreaterThan(0);
    });

    it('B7 -> Mixolydian suggestions', () => {
        const matches = matchScales("B7", {}, "jazz");
        const scaleIds = matches.map(m => m.scaleId);
        expect(scaleIds).toContain("mixolydian");
        // altered is not strictly matched against B7 (contains natural 5)
        // expect(scaleIds).toContain("altered");
        expect(scaleIds).toContain("diminished_hw");
    });

    it('F#m7 in E Major -> Dorian priority', () => {
        // ii chord in E major is F#m7. Dorian covers it perfectly diatonic.
        const matches = matchScales("F#m7", { tonic: "E", mode: "ionian" }, "jazz");
        const top = matches[0];
        expect(top.scaleId).toBe("dorian");
        expect(top.explanation).toContain("Diatonisk i tonearten");
    });

    it('F#m7 in A Major -> Aeolian priority', () => {
        // vi chord in A major is F#m7. Aeolian covers it perfectly.
        const matches = matchScales("F#m7", { tonic: "A", mode: "ionian" }, "jazz");
        const top = matches[0];

        // Both Dorian and Aeolian fit F#m7 tones.
        // But Aeolian is diatonic to A Major (A B C# D E F# G#)
        // F# Aeolian: F# G# A B C# D E -> All in A Major
        // F# Dorian: F# G# A B C# D# E -> D# is not in A Major (D is)

        expect(top.scaleId).toBe("aeolian");
        expect(top.explanation).toContain("Diatonisk i tonearten");
    });

    it('Style filtering - Pop', () => {
        const matches = matchScales("C7", {}, "pop");
        const scaleIds = matches.map(m => m.scaleId);
        // Should discourage altered/symmetric
        // altered has tag 'altered', pop discourages 'altered'
        // So altered should be lower score or penalized

        const mixo = matches.find(m => m.scaleId === "mixolydian");
        const alt = matches.find(m => m.scaleId === "altered");

        expect(mixo).toBeDefined();
        // If alt exists, it should have lower score
        if (alt) {
            expect(mixo!.score).toBeGreaterThan(alt.score);
        }
    });
});
