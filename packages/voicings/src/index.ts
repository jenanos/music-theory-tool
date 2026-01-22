export type Voicing = {
  name: string;
  frets: (number | "x")[];
};

export type VoicingDictionary = Record<string, Voicing[]>;

const VOICINGS: VoicingDictionary = {
  Em: [
    { name: "Åpent Em", frets: [0, 2, 2, 0, 0, 0] },
    { name: "Barré 7. bånd", frets: [7, 9, 9, 7, 8, 7] },
  ],
  "F#dim": [{ name: "Triade", frets: ["x", "x", 4, 2, 1, "x"] }],
  G: [
    { name: "Åpent G", frets: [3, 2, 0, 0, 0, 3] },
    { name: "Barré 3. bånd", frets: [3, 5, 5, 4, 3, 3] },
  ],
  Am: [
    { name: "Åpent Am", frets: ["x", 0, 2, 2, 1, 0] },
    { name: "Barré 5. bånd", frets: [5, 7, 7, 5, 5, 5] },
  ],
  Bm: [
    { name: "Barré 2. bånd", frets: [2, 2, 4, 4, 3, 2] },
    { name: "Triade 7. bånd", frets: ["x", 9, 7, 7, 7, "x"] },
  ],
  C: [
    { name: "Åpent C", frets: ["x", 3, 2, 0, 1, 0] },
    { name: "Barré 8. bånd", frets: [8, 10, 10, 9, 8, 8] },
  ],
  D: [
    { name: "Åpent D", frets: ["x", "x", 0, 2, 3, 2] },
    { name: "Barré 5. bånd", frets: [5, 5, 7, 7, 7, 5] },
  ],
  A: [
    { name: "Åpent A", frets: ["x", 0, 2, 2, 2, 0] },
    { name: "Barré 5. bånd", frets: [5, 7, 7, 6, 5, 5] },
  ],
  Em7: [{ name: "Åpent Em7", frets: [0, 2, 0, 0, 0, 0] }],
  Am7: [{ name: "Åpent Am7", frets: ["x", 0, 2, 0, 1, 0] }],
  Bm7: [{ name: "Barré 2. bånd", frets: [2, 2, 4, 2, 3, 2] }],
  Cmaj7: [{ name: "Åpent Cmaj7", frets: ["x", 3, 2, 0, 0, 0] }],
  D7: [{ name: "Åpent D7", frets: ["x", "x", 0, 2, 1, 2] }],
  Gmaj7: [{ name: "Åpent Gmaj7", frets: [3, 2, 0, 0, 0, 2] }],
  "F#m7b5": [{ name: "Kompakt", frets: [2, "x", 2, 2, 1, "x"] }],
};

export function getVoicingsForChord(symbol: string): Voicing[] {
  return VOICINGS[symbol] ?? [];
}

export function getVoicingDictionary(): VoicingDictionary {
  return VOICINGS;
}
