
import { describe, it, expect } from 'vitest';
import { getScale } from '../src/index';

describe('getScale Robustness', () => {
    it('should return scale notes for Blues scale (non-harmony) without crashing', () => {
        // "blues" is not in MODES, and isHarmony = false
        // This triggered a crash before the fix.
        const result = getScale("E", "blues" as any);

        expect(result).toBeDefined();
        expect(result.scale.id).toBe("blues");
        expect(result.scale.isHarmony).toBe(false);
        // E G A Bb B D
        // Intervals: 0, 3, 5, 6, 7, 10
        // E(0) + 3 = G
        // E(0) + 5 = A
        // E(0) + 6 = Bb (A#)
        expect(result.noteNames).toContain("E");
        expect(result.noteNames).toContain("G");
        expect(result.pcs).toHaveLength(6);
    });

    it('should still work for standard harmonic modes', () => {
        const result = getScale("C", "ionian");
        expect(result.scale.isHarmony).toBe(true);
        expect(result.noteNames).toEqual(["C", "D", "E", "F", "G", "A", "B"]);
    });
});
