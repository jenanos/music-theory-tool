import { describe, expect, it } from "vitest";
import { buildDiatonicChords } from "../src/index";

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
});
