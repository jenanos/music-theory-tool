import { describe, expect, it } from "vitest";
import {
    progressionCreateSchema,
    songCreateSchema,
    toSongResponse,
} from "../src";

describe("db validation and mapping", () => {
    it("validates song payloads", () => {
        const parsed = songCreateSchema.parse({
            title: "Test Song",
            sections: [{ id: "verse", label: "Verse" }],
        });

        expect(parsed.title).toBe("Test Song");
        expect(parsed.sections[0]?.id).toBe("verse");
    });

    it("validates progression payloads", () => {
        const parsed = progressionCreateSchema.parse({
            name: "ii-V-I",
            tonic: "C",
            mode: "ionian",
            sequence: ["ii", "V", "I"],
        });

        expect(parsed.sequence).toEqual(["ii", "V", "I"]);
    });

    it("maps stored song rows to API shape", () => {
        const response = toSongResponse({
            id: "song-1",
            title: "Song",
            artist: "Artist",
            key: "C",
            notes: null,
            arrangement: ["verse"],
            createdAt: new Date(),
            updatedAt: new Date(),
            sections: [
                {
                    id: "song-1-verse",
                    songId: "song-1",
                    label: "Verse",
                    chordLines: ["C - F"],
                    degreeLines: ["I - IV"],
                    notes: null,
                    orderIndex: 0,
                },
            ],
        });

        expect(response.sections[0]?.id).toBe("verse");
    });
});
