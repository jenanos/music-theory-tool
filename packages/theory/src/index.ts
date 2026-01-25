export * from "./progressions";
export * from "./substitutions";
export * from "./data";
export * from "./utils";
export * from "./types";

import {
  MODES,
  MODE_DIATONIC_7THS,
  FUNCTION_GROUPS
} from "./data";
import {
  noteName,
  parseNoteName,
  prefersFlats
} from "./utils";
import {
  DiatonicChord,
  ModeId,
  HarmonicFunction,
  ScaleDefinition
} from "./types";

// Re-export common constants for convenience
export const TONIC_OPTIONS = [
  "C", "C#", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"
];

export const DEFAULT_TONIC = "E";
export const DEFAULT_MODE: ModeId = "aeolian";

// Generate SCALES array for UI from MODES data
export const SCALES: ScaleDefinition[] = Object.values(MODES).map((m) => ({
  id: m.id as ModeId,
  name: m.name,
  intervals: m.intervals,
}));

const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

const INTERVAL_NAMES: Record<number, string> = {
  0: "1", 1: "b2", 2: "2", 3: "b3", 4: "3", 5: "4", 6: "b5",
  7: "5", 8: "#5", 9: "6", 10: "b7", 11: "7",
};

export function getScale(tonic: string, mode: ModeId) {
  const scale = MODES[mode];
  if (!scale) {
    throw new Error(`Ukjent modus: ${mode}`);
  }
  const tonicPc = parseNoteName(tonic);
  const useFlats = prefersFlats(tonic);
  const pcs = scale.intervals.map((interval) => (tonicPc + interval) % 12);
  const noteNames = pcs.map((pc) => noteName(pc, useFlats));
  return {
    scale,
    tonic,
    tonicPc,
    pcs,
    noteNames,
    useFlats,
  };
}

export function buildDiatonicChords(
  tonic: string,
  mode: ModeId,
  includeSevenths = false,
): DiatonicChord[] {
  const { pcs, useFlats } = getScale(tonic, mode);

  // Get predefined qualities for this mode
  const qualities = includeSevenths
    ? MODE_DIATONIC_7THS[mode]
    : MODE_DIATONIC_7THS[mode]?.map(q => {
      // Stripping 7th part for triads - simplistic heuristic
      if (q.startsWith("maj7")) return "maj";
      if (q === "m7") return "m";
      if (q === "7") return "maj"; // Dominant triad is major
      if (q === "m7b5") return "dim";
      if (q === "dim7") return "dim";
      if (q === "m(maj7)") return "m";
      if (q === "augMaj7") return "aug";
      return q; // fallback
    });

  const getRoman = (degree: number, quality: string) => {
    const base = ROMANS[degree - 1];
    if (!base) return "?";

    let r: string = base;

    // Major/Minor casing
    const isMinor = quality.startsWith("m") && !quality.startsWith("maj");
    const isDim = quality.startsWith("dim") || quality.includes("dim");
    const isAug = quality.startsWith("aug");

    if (isMinor || isDim) {
      r = base.toLowerCase();
    }

    // Qualities symbols
    if (isDim) {
      if (quality === "dim7") r += "°7"; // Diminished 7th
      else if (quality === "m7b5") r += "ø7"; // Half-diminished
      else r += "°"; // Triad
    } else if (isAug) {
      r += "+";
    }

    // Sevenths (if not handled by dim7/m7b5 above)
    if (includeSevenths) {
      if (!isDim) { // Don't add 7 to ° or ø7 again
        if (quality.includes("7") || quality.includes("maj7")) {
          r += "7";
          // Note: Standard roman numerals often just use V7, I7 (for maj7 implies by case usually or Imaj7)
          // For clarity in this app, we might want to follow a specific convention.
          // Let's stick effectively to what was requested: "ii7" etc.
          // If it is Major 7th, usually 'I' implies major triad, 'Imaj7' or 'I7' (dominant) or 'I^7'? 
          // Jazz standard: Imaj7. Classical: I7 usually means V7 structure on I? 
          // Let's use simplified popular notation.
          if (quality.includes("maj7")) r = r === base ? r + "maj7" : r + "M7";
        }
      }
    }

    // Simplification for the specific output requested "ii7"
    if (quality === "m7") return base.toLowerCase() + "7";
    if (quality === "maj7") return base + "maj7";
    if (quality === "7") return base + "7";
    if (quality === "m7b5") return base.toLowerCase() + "ø7";

    return r;
  };

  return pcs.map((rootPc, index) => {
    let quality = qualities ? qualities[index] : "maj";
    if (!quality) quality = "maj";

    // Determine function
    const degree = index + 1;
    const fnGroups = FUNCTION_GROUPS[mode] || FUNCTION_GROUPS.ionian;
    let func: HarmonicFunction = "variable";

    // Check dominant first (prioritize)
    if (fnGroups?.dominant.includes(degree)) func = "dominant";
    else if (fnGroups?.tonic.includes(degree)) func = "tonic";
    else if (fnGroups?.predominant.includes(degree)) func = "predominant";

    const rootNote = noteName(rootPc, useFlats);
    let symbol = rootNote;

    // Suffix map
    if (quality === "maj") symbol += "";
    else if (quality === "m") symbol += "m";
    else if (quality === "dim") symbol += "dim";
    else if (quality === "aug") symbol += "aug";
    else symbol += quality; // e.g. maj7, m7, 7, m7b5

    const scaleTones = [
      pcs[index],
      pcs[(index + 2) % 7],
      pcs[(index + 4) % 7],
    ];
    if (includeSevenths) {
      scaleTones.push(pcs[(index + 6) % 7]);
    }

    // Safe access
    const tones = scaleTones.filter((t): t is number => t !== undefined);

    const toneNames = tones.map(p => noteName(p, useFlats));
    const intervalNames = tones.map(p => {
      const i = (p - rootPc + 12) % 12;
      return INTERVAL_NAMES[i] || "?";
    });

    return {
      degree,
      roman: getRoman(degree, quality),
      symbol,
      quality, // string
      function: func,
      tones,
      toneNames,
      intervalNames,
    };
  });
}
