export type ModeId = "ionian" | "aeolian" | "dorian";
export type ChordQuality = "major" | "minor" | "diminished" | "augmented";
export type HarmonicFunction = "tonic" | "predominant" | "dominant";

export interface ScaleDefinition {
  id: ModeId;
  name: string;
  intervals: number[];
}

export interface DiatonicChord {
  degree: number;
  roman: string;
  symbol: string;
  quality: ChordQuality;
  function: HarmonicFunction;
  tones: number[];
  toneNames: string[];
  intervalNames: string[];
}

export interface SubstitutionSuggestion {
  targetSymbol: string;
  substituteSymbol: string;
  sharedTones: number;
  reason: string;
}

const SHARP_NOTES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
];

const FLAT_NOTES = [
  "C",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "Gb",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

const NOTE_TO_PC: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

const ROMANS = ["I", "II", "III", "IV", "V", "VI", "VII"] as const;

const FUNCTION_MAP: Record<number, HarmonicFunction> = {
  1: "tonic",
  2: "predominant",
  3: "tonic",
  4: "predominant",
  5: "dominant",
  6: "tonic",
  7: "dominant",
};

const INTERVAL_NAMES: Record<number, string> = {
  0: "1",
  1: "b2",
  2: "2",
  3: "b3",
  4: "3",
  5: "4",
  6: "b5",
  7: "5",
  8: "#5",
  9: "6",
  10: "b7",
  11: "7",
};

export const SCALES: ScaleDefinition[] = [
  {
    id: "ionian",
    name: "Dur (ionisk)",
    intervals: [0, 2, 4, 5, 7, 9, 11],
  },
  {
    id: "aeolian",
    name: "Naturlig moll (aeolisk)",
    intervals: [0, 2, 3, 5, 7, 8, 10],
  },
  {
    id: "dorian",
    name: "Dorisk",
    intervals: [0, 2, 3, 5, 7, 9, 10],
  },
];

export function parseNoteName(note: string): number {
  const normalized = note.trim();
  const pc = NOTE_TO_PC[normalized];
  if (pc === undefined) {
    throw new Error(`Ukjent tone: ${note}`);
  }
  return pc;
}

export function prefersFlats(note: string): boolean {
  return note.includes("b");
}

export function noteName(pc: number, useFlats: boolean): string {
  const nameSet = useFlats ? FLAT_NOTES : SHARP_NOTES;
  return nameSet[((pc % 12) + 12) % 12];
}

export function getScale(tonic: string, mode: ModeId) {
  const scale = SCALES.find((item) => item.id === mode);
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

function triadQuality(third: number, fifth: number): ChordQuality {
  if (third === 4 && fifth === 7) return "major";
  if (third === 3 && fifth === 7) return "minor";
  if (third === 3 && fifth === 6) return "diminished";
  return "augmented";
}

function qualitySuffix(quality: ChordQuality): string {
  switch (quality) {
    case "minor":
      return "m";
    case "diminished":
      return "dim";
    case "augmented":
      return "aug";
    default:
      return "";
  }
}

function romanNumeral(
  degree: number,
  quality: ChordQuality,
  includeSevenths: boolean,
  seventhQuality?: string,
): string {
  const base = ROMANS[degree - 1];
  let numeral = base;
  if (quality === "minor") {
    numeral = base.toLowerCase();
  }
  if (quality === "diminished") {
    numeral = base.toLowerCase() + "°";
  }
  if (quality === "augmented") {
    numeral = base + "+";
  }
  if (includeSevenths) {
    if (quality === "diminished" && seventhQuality === "half-diminished") {
      numeral = base.toLowerCase() + "ø7";
    } else {
      numeral += "7";
    }
  }
  return numeral;
}

function seventhSuffix(quality: ChordQuality, seventhInterval: number): string {
  if (quality === "major" && seventhInterval === 11) return "maj7";
  if (quality === "major" && seventhInterval === 10) return "7";
  if (quality === "minor" && seventhInterval === 10) return "m7";
  if (quality === "diminished" && seventhInterval === 10) return "m7b5";
  return qualitySuffix(quality);
}

function seventhQuality(quality: ChordQuality, seventhInterval: number): string {
  if (quality === "diminished" && seventhInterval === 10) {
    return "half-diminished";
  }
  return "";
}

export function buildDiatonicChords(
  tonic: string,
  mode: ModeId,
  includeSevenths = false,
): DiatonicChord[] {
  const { pcs, noteNames, useFlats } = getScale(tonic, mode);
  return pcs.map((rootPc, index) => {
    const thirdPc = pcs[(index + 2) % 7];
    const fifthPc = pcs[(index + 4) % 7];
    const seventhPc = pcs[(index + 6) % 7];
    const thirdInterval = (thirdPc - rootPc + 12) % 12;
    const fifthInterval = (fifthPc - rootPc + 12) % 12;
    const seventhInterval = (seventhPc - rootPc + 12) % 12;
    const quality = triadQuality(thirdInterval, fifthInterval);
    const symbolRoot = noteName(rootPc, useFlats);
    const symbol = includeSevenths
      ? `${symbolRoot}${seventhSuffix(quality, seventhInterval)}`
      : `${symbolRoot}${qualitySuffix(quality)}`;
    const tones = includeSevenths
      ? [rootPc, thirdPc, fifthPc, seventhPc]
      : [rootPc, thirdPc, fifthPc];
    const toneNames = tones.map((pc) => noteName(pc, useFlats));
    const intervalNames = tones.map((pc) => {
      const interval = (pc - rootPc + 12) % 12;
      return INTERVAL_NAMES[interval] ?? `${interval}`;
    });

    return {
      degree: index + 1,
      roman: romanNumeral(
        index + 1,
        quality,
        includeSevenths,
        seventhQuality(quality, seventhInterval),
      ),
      symbol,
      quality,
      function: FUNCTION_MAP[index + 1],
      tones,
      toneNames,
      intervalNames,
    };
  });
}

export function suggestSubstitutions(
  chords: DiatonicChord[],
  target: DiatonicChord,
): SubstitutionSuggestion[] {
  const targetSet = new Set(target.tones.map((tone) => tone % 12));
  return chords
    .filter((chord) => chord.symbol !== target.symbol)
    .filter((chord) => chord.function === target.function)
    .map((chord) => {
      const shared = chord.tones.filter((tone) => targetSet.has(tone % 12));
      const sharedTones = shared.length;
      const reasons = ["samme funksjon"];
      if (sharedTones > 0) {
        reasons.push(`deler ${sharedTones} tone${sharedTones > 1 ? "r" : ""}`);
      }
      return {
        targetSymbol: target.symbol,
        substituteSymbol: chord.symbol,
        sharedTones,
        reason: reasons.join("; "),
      };
    })
    .sort((a, b) => b.sharedTones - a.sharedTones)
    .slice(0, 3);
}

export const TONIC_OPTIONS = [
  "C",
  "C#",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
];

export const DEFAULT_TONIC = "E";
export const DEFAULT_MODE: ModeId = "aeolian";
