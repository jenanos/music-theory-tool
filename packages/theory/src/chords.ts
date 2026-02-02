
import { buildDiatonicChords, getScale, type ModeId, type DiatonicChord } from "./index.js";
import { CHORD_PROGRESSIONS } from "./progressions.js";
import { parseNoteName } from "./utils.js";

/**
 * Calculates the Roman numeral degree of a chord in a given key.
 * 
 * @param chordSymbol The chord symbol (e.g., "Am", "G7", "C/E")
 * @param key The key string (e.g., "C Major", "A Minor")
 * @returns The Roman numeral degree (e.g., "vi", "V", "I") or null if not found/parseable
 */
export function getChordDegree(chordSymbol: string, key: string): string | null {
    if (!key || !chordSymbol) return null;

    // Parse key
    const parts = key.trim().split(/\s+/);
    if (parts.length === 0) return null;

    let tonic: string | undefined = parts[0];
    if (!tonic) return null;

    let mode: ModeId = "ionian";

    if (tonic.endsWith("m") && !tonic.includes("maj") && !tonic.includes("dim")) {
        tonic = tonic.substring(0, tonic.length - 1);
        mode = "aeolian";
    }

    if (parts.length > 1) {
        const modeInput = parts[1]!.toLowerCase();
        if (modeInput.includes("dur") || modeInput === "major") mode = "ionian";
        else if (modeInput.includes("moll") || modeInput === "minor") mode = "aeolian";
        else if (modeInput.includes("dorisk") || modeInput === "dorian") mode = "dorian";
        else if (modeInput.includes("frygisk") || modeInput === "phrygian") mode = "phrygian";
        else if (modeInput.includes("lydisk") || modeInput === "lydian") mode = "lydian";
        else if (modeInput.includes("mikso") || modeInput === "mixolydian") mode = "mixolydian";
        else if (modeInput.includes("eolisk") || modeInput === "aeolian") mode = "aeolian";
        else if (modeInput.includes("lokrisk") || modeInput === "locrian") mode = "locrian";
    }

    // Heuristics for degree matching:
    // 1. Try exact match in Diatonic 7ths (most precise)
    const diatonic7 = buildDiatonicChords(tonic, mode, true);
    const exact7 = diatonic7.find((c: DiatonicChord | undefined) => c && c.symbol === chordSymbol);
    if (exact7) return exact7.roman;

    // 2. Try exact match in Diatonic Triads (simple "I", "vi" etc)
    const diatonic3 = buildDiatonicChords(tonic, mode, false);
    const exact3 = diatonic3.find((c: DiatonicChord | undefined) => c && c.symbol === chordSymbol);
    if (exact3) return exact3.roman;

    // 3. Fallback: match by Root
    // Extract root from chordSymbol (e.g. C from C/E, C from Cmaj7)
    const rootMatch = chordSymbol.match(/^([A-G][b#]?)/);
    if (!rootMatch) return null;
    const rootNote = rootMatch[1];

    // Decide which set to target based on input complexity
    const is7th = chordSymbol.includes("7");
    const targetSet = is7th ? diatonic7 : diatonic3;

    // Find chord in target set with same root
    const match = targetSet.find((dc: DiatonicChord | undefined) => {
        if (!dc) return false;
        const dcRootMatch = dc.symbol.match(/^([A-G][b#]?)/);
        return dcRootMatch && dcRootMatch[1] === rootNote;
    });

    if (match) return match.roman;

    return null;
}

/**
 * Suggests chords that might follow the current chord based on the key/mode.
 * 
 * @param currentChord The current chord symbol (e.g. "C")
 * @param key The key of the song (e.g. "C Major")
 * @returns Array of suggested chord symbols
 */
export function getChordSuggestions(currentChord: string, key: string): string[] {
    if (!key) return [];

    // Parse key to get mode
    const parts = key.trim().split(/\s+/);

    const tonicPart = parts[0];
    if (!tonicPart) return [];
    let tonic = tonicPart;

    let mode: ModeId = "ionian";

    if (parts.length > 1) {
        const modeInput = parts[1]!.toLowerCase();
        if (['moll', 'minor', 'aeolian'].some(k => modeInput.includes(k))) mode = 'aeolian';
        else if (['dorisk', 'dorian'].some(k => modeInput.includes(k))) mode = 'dorian';
        else if (['frygisk', 'phrygian'].some(k => modeInput.includes(k))) mode = 'phrygian';
        else if (['lydisk', 'lydian'].some(k => modeInput.includes(k))) mode = 'lydian';
        else if (['mikso', 'mixolydian'].some(k => modeInput.includes(k))) mode = 'mixolydian';
        else if (['lokrisk', 'locrian'].some(k => modeInput.includes(k))) mode = 'locrian';
    } else if (parts[0] && parts[0].endsWith("m")) {
        mode = 'aeolian';
        if (tonic.endsWith("m") && !tonic.includes("maj")) {
            tonic = tonic.substring(0, tonic.length - 1);
        }
    } else {
        if (tonic.endsWith("m") && !tonic.includes("maj")) {
            tonic = tonic.substring(0, tonic.length - 1);
            mode = 'aeolian'; // Infer minor from tonic notation matching
        }
    }

    // Filter progressions by the current mode
    // const relevantProgressions = CHORD_PROGRESSIONS.filter(p => p.mode === mode);

    // This is a placeholder for more advanced Markov-chain like suggestions.
    // For now, we just return the most common diatonic chords in this mode
    // because "context-aware" suggestion requires knowing the *previous* chords.

    // We return 7th chords by default as they are richer, but user can edit down
    const diatonicChords = buildDiatonicChords(tonic, mode, true);

    return diatonicChords.map((c: DiatonicChord): string => c.symbol);
}
