
import { describe, it, expect } from 'vitest';
import { getChordDegree } from '../src/chords';
import { buildDiatonicChords } from '../src/index';

describe('Reproduction of Bb - i issue', () => {
    it('should analyze Bb in Fm as iv', () => {
        const degree = getChordDegree("Bb", "Fm");
        console.log("Input: Bb, Key: Fm -> Result:", degree);

        const chords = buildDiatonicChords("F", "aeolian", false);
        console.log("Diatonic chords for Fm:");
        chords.forEach(c => console.log(`${c.symbol} -> ${c.roman}`));

        expect(degree).toBe("IV");
    });

    it('should analyze C in Fm as V (borrowed/harmonic)', () => {
        const degree = getChordDegree("C", "Fm");
        expect(degree).toBe("V");
    });

    it('should analyze F in Fm as I (Picardy)', () => {
        const degree = getChordDegree("F", "Fm");
        expect(degree).toBe("I");
    });
});
