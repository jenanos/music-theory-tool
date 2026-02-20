import { describe, expect, it } from "vitest";
import { progressionCreateSchema, songUpdateSchema } from "@repo/db";

describe("API payload validation", () => {
    it("accepts valid progression payloads", () => {
        const parsed = progressionCreateSchema.parse({
            name: "Test progression",
            tonic: "A",
            mode: "minor",
            sequence: ["i", "bVII", "bVI", "V"],
        });

        expect(parsed.tonic).toBe("A");
    });

    it("accepts section updates", () => {
        const parsed = songUpdateSchema.parse({
            sections: [
                {
                    id: "chorus",
                    label: "Chorus",
                    chordLines: ["Am - F - C - G"],
                },
            ],
        });

        expect(parsed.sections?.[0]?.id).toBe("chorus");
    });
});
