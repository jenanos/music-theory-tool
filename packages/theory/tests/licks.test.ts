import { describe, expect, it } from "vitest";
import {
    STANDARD_TUNING,
    SUPPORTED_LICK_TECHNIQUES,
    lickDataToAlphaTex,
    transposeLickData,
    validateLickData,
    type LickData,
} from "../src/licks";

describe("lick constants", () => {
    it("exports standard tuning and supported techniques", () => {
        expect(STANDARD_TUNING).toEqual(["E4", "B3", "G3", "D3", "A2", "E2"]);
        expect(SUPPORTED_LICK_TECHNIQUES).toContain("slide");
        expect(SUPPORTED_LICK_TECHNIQUES).toContain("ghost");
    });
});

describe("transposeLickData", () => {
    it("shifts fret and toFret by key semitone distance while preserving shape fields", () => {
        const data: LickData = {
            events: [
                { string: 1, fret: 5, duration: 8, technique: "slide", toFret: 7 },
                { bar: true },
                { string: 2, fret: 6, duration: "8t" },
            ],
        };

        const result = transposeLickData(data, "A minor", "C minor");

        expect(result.warnings).toEqual([]);
        expect(result.data.events).toEqual([
            { string: 1, fret: 8, duration: 8, technique: "slide", toFret: 10 },
            { bar: true },
            { string: 2, fret: 9, duration: "8t" },
        ]);
        expect(data.events[0]!.fret).toBe(5);
    });

    it("warns when transposed frets fall outside the fretboard", () => {
        const result = transposeLickData(
            {
                events: [
                    { string: 6, fret: 1, duration: 4 },
                    { string: 1, fret: 23, toFret: 24, duration: 4 },
                ],
            },
            "C",
            "D",
        );

        expect(result.data.events[0]!.fret).toBe(3);
        expect(result.warnings).toEqual([
            "Event 1: fret 25 is above max fret 24",
            "Event 1: toFret 26 is above max fret 24",
        ]);
    });

    it("warns for negative frets after downward transposition", () => {
        const result = transposeLickData({ events: [{ string: 1, fret: 1, duration: 4 }] }, "D", "C");

        expect(result.data.events[0]!.fret).toBe(-1);
        expect(result.warnings).toEqual(["Event 0: fret -1 is below 0"]);
    });
});

describe("validateLickData", () => {
    it("returns lightweight validation warnings", () => {
        const warnings = validateLickData({
            events: [
                { string: 7, fret: -1, duration: 3, technique: "tap" },
                { type: "rest", duration: "8t" },
                { type: "bar" },
            ],
        });

        expect(warnings).toEqual([
            'Event 0: unsupported technique "tap"',
            "Event 0: string must be an integer from 1 to 6",
            "Event 0: fret -1 is below 0",
            "Event 0: duration must be one of 1, 2, 4, 8, 16, 32, 64, 128, 256 or a triplet token like 8t",
        ]);
    });
});

describe("lickDataToAlphaTex", () => {
    it("generates AlphaTex for notes, bars, rests, and triplets", () => {
        const alphaTex = lickDataToAlphaTex(
            {
                events: [
                    { string: 6, fret: 3, duration: 8 },
                    { bar: true },
                    { type: "rest", duration: 4 },
                    { string: 1, fret: 5, duration: "8t" },
                ],
            },
            { title: "Triplet lick", tempo: 120, timeSignature: [4, 4] },
        );

        expect(alphaTex).toBe(
            [
                '\\title "Triplet lick"',
                "\\tempo 120",
                "\\ts 4 4",
                "\\tuning (E4 B3 G3 D3 A2 E2)",
                "3.6.8 | r.4 5.1.8 { tu 3 }",
            ].join("\n"),
        );
    });

    it("emits best-effort AlphaTex technique markers", () => {
        const alphaTex = lickDataToAlphaTex({
            events: [
                { string: 3, fret: 5, toFret: 7, duration: 8, technique: "slide" },
                { string: 2, fret: 5, toFret: 8, duration: 8, technique: "hammer" },
                { string: 2, fret: 8, toFret: 5, duration: 8, technique: "pull" },
                { string: 1, fret: 7, duration: 4, techniques: ["bend", "vibrato"] },
                { string: 1, fret: 7, duration: 4, technique: "tie" },
                { string: 1, fret: 7, duration: 4, technique: "ghost" },
            ],
        });

        expect(alphaTex).toContain("5.3.8{sl} 7.3.8");
        expect(alphaTex).toContain("5.2.8{h} 8.2.8");
        expect(alphaTex).toContain("8.2.8{h} 5.2.8");
        expect(alphaTex).toContain("7.1.4{b (0 4) v}");
        expect(alphaTex).toContain("7.1.4{t}");
        expect(alphaTex).toContain("7.1.4{g}");
    });
});
