import { describe, expect, it } from "vitest";
import { buildDiatonicChords, prefersFlats } from "../src/index";

describe("diatonic chord generation", () => {
  it("generates correct chords for E aeolian", () => {
    const chords = buildDiatonicChords("E", "aeolian");
    const symbols = chords.map((chord) => chord.symbol);
    expect(symbols).toEqual(["Em", "F#dim", "G", "Am", "Bm", "C", "D"]);
  });

  it("generates correct chords for A dorian", () => {
    const chords = buildDiatonicChords("A", "dorian");
    const symbols = chords.map((chord) => chord.symbol);
    expect(symbols).toEqual(["Am", "Bm", "C", "D", "Em", "F#dim", "G"]);
  });

  it("uses flats for flat key tonics", () => {
    const chords = buildDiatonicChords("F", "ionian");
    const symbols = chords.map((chord) => chord.symbol);
    expect(symbols).toEqual(["F", "Gm", "Am", "Bb", "C", "Dm", "Edim"]);
    expect(prefersFlats("F")).toBe(true);
  });

  it("maps harmonic minor seventh qualities without dropping altered functions", () => {
    const chords = buildDiatonicChords("A", "harmonic_minor", true);

    expect(chords.map((chord) => chord.symbol)).toEqual([
      "Am(maj7)",
      "Bm7b5",
      "CaugMaj7",
      "Dm7",
      "E7",
      "Fmaj7",
      "G#dim7",
    ]);

    expect(chords[2]).toMatchObject({
      degree: 3,
      quality: "augMaj7",
      function: "tonic",
    });
    expect(chords[4]).toMatchObject({
      degree: 5,
      roman: "V7",
      function: "dominant",
    });
    expect(chords[6]).toMatchObject({
      degree: 7,
      roman: "vii°7",
      function: "dominant",
    });
  });

  it("reduces harmonic minor seventh qualities to consistent triads", () => {
    const chords = buildDiatonicChords("A", "harmonic_minor");

    expect(chords.map((chord) => chord.symbol)).toEqual([
      "Am",
      "Bdim",
      "Caug",
      "Dm",
      "E",
      "F",
      "G#dim",
    ]);
    expect(chords[0]?.roman).toBe("i");
    expect(chords[2]?.roman).toBe("III+");
    expect(chords[6]?.roman).toBe("vii°");
  });
});
