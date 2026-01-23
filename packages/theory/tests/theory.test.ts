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
});
