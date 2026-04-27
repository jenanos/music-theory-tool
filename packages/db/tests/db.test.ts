import { describe, expect, it } from "vitest";
import {
  progressionCreateSchema,
  lickCreateSchema,
  lickUpdateSchema,
  songCreateSchema,
  toLickResponse,
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

  it("validates lick create payloads with defaults", () => {
    const parsed = lickCreateSchema.parse({
      title: "Minor pentatonic idea",
      data: {
        version: 1,
        events: [
          {
            bar: 1,
            beat: 1,
            duration: "8n",
            string: 2,
            fret: 8,
          },
        ],
      },
    });

    expect(parsed.visibility).toBe("private");
    expect(parsed.data.meter).toBe("4/4");
    expect(parsed.data.feel).toBe("straight");
    expect(parsed.data.events[0]?.ghost).toBe(false);
  });

  it("validates lick updates with visibility", () => {
    const parsed = lickUpdateSchema.parse({
      visibility: "group",
      groupId: "group-1",
      data: {
        version: 1,
        meter: "12/8",
        feel: "triplets",
        events: [],
      },
    });

    expect(parsed.visibility).toBe("group");
    expect(parsed.groupId).toBe("group-1");
    expect(parsed.data?.feel).toBe("triplets");
  });

  it("maps stored lick rows to API shape", () => {
    const createdAt = new Date("2026-04-26T10:00:00.000Z");
    const updatedAt = new Date("2026-04-26T11:00:00.000Z");
    const response = toLickResponse({
      id: "lick-1",
      title: "Blues bend",
      key: "A",
      description: null,
      tags: ["blues"],
      tuning: "EADGBE",
      data: {
        version: 1,
        meter: "4/4",
        feel: "swing",
        events: [],
      },
      visibility: "shared",
      userId: "user-1",
      groupId: null,
      createdAt,
      updatedAt,
    });

    expect(response.title).toBe("Blues bend");
    expect(response.tags).toEqual(["blues"]);
    expect(response.createdAt).toBe(createdAt.toISOString());
    expect(response.updatedAt).toBe(updatedAt.toISOString());
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
    expect(() => visibilitySchema.parse("invalid")).toThrow();
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
