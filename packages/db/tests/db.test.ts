import { describe, expect, it } from "vitest";
import {
    progressionCreateSchema,
    songCreateSchema,
    toSongResponse,
    visibilitySchema,
    groupCreateSchema,
    groupMemberAddSchema,
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
            visibility: "private",
            userId: "user-1",
            groupId: null,
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
        expect(response.visibility).toBe("private");
        expect(response.userId).toBe("user-1");
        expect(response.groupId).toBeNull();
    });

    it("validates song create with visibility", () => {
        const parsed = songCreateSchema.parse({
            title: "Band Song",
            visibility: "group",
            groupId: "group-1",
        });

        expect(parsed.visibility).toBe("group");
        expect(parsed.groupId).toBe("group-1");
    });

    it("defaults song visibility to private", () => {
        const parsed = songCreateSchema.parse({
            title: "My Song",
        });

        expect(parsed.visibility).toBe("private");
    });

    it("rejects invalid visibility values", () => {
        expect(() =>
            visibilitySchema.parse("invalid")
        ).toThrow();
    });

    it("validates group create schema", () => {
        const parsed = groupCreateSchema.parse({ name: "My Band" });
        expect(parsed.name).toBe("My Band");
    });

    it("validates group member add schema", () => {
        const parsed = groupMemberAddSchema.parse({
            email: "member@example.com",
            role: "member",
        });
        expect(parsed.email).toBe("member@example.com");
        expect(parsed.role).toBe("member");
    });

    it("defaults group member role to member", () => {
        const parsed = groupMemberAddSchema.parse({
            email: "member@example.com",
        });
        expect(parsed.role).toBe("member");
    });
});
