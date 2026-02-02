import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "../src/schema";
import { songs, sections, savedProgressions } from "../src/schema";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync, unlinkSync } from "fs";

// Test database setup - use a separate test database
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testDbPath = join(__dirname, "..", "data", "test.db");

// Clean up test database before tests
function cleanupTestDb() {
    if (existsSync(testDbPath)) {
        unlinkSync(testDbPath);
    }
}

describe("Database Schema and Operations", () => {
    let testClient: ReturnType<typeof createClient>;
    let testDb: ReturnType<typeof drizzle>;

    beforeAll(async () => {
        cleanupTestDb();

        testClient = createClient({
            url: `file:${testDbPath}`,
        });
        testDb = drizzle(testClient, { schema });

        // Create tables using raw SQL (matching the schema)
        await testClient.execute(`
            CREATE TABLE IF NOT EXISTS songs (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                artist TEXT,
                key TEXT,
                notes TEXT,
                arrangement TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )
        `);

        await testClient.execute(`
            CREATE TABLE IF NOT EXISTS sections (
                id TEXT PRIMARY KEY,
                song_id TEXT NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
                label TEXT NOT NULL,
                chord_lines TEXT,
                degree_lines TEXT,
                notes TEXT,
                order_index INTEGER NOT NULL
            )
        `);

        await testClient.execute(`
            CREATE TABLE IF NOT EXISTS saved_progressions (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                tonic TEXT NOT NULL,
                mode TEXT NOT NULL,
                sequence TEXT,
                created_at INTEGER NOT NULL
            )
        `);
    });

    afterAll(async () => {
        await testClient.close();
        cleanupTestDb();
    });

    describe("Songs Table", () => {
        it("should insert and retrieve a song", async () => {
            const testSong = {
                id: "test-song-1",
                title: "Test Song",
                artist: "Test Artist",
                key: "C",
                notes: "Test notes",
                arrangement: ["verse", "chorus"],
            };

            await testDb.insert(songs).values(testSong);

            const [retrieved] = await testDb
                .select()
                .from(songs)
                .where(eq(songs.id, "test-song-1"));

            expect(retrieved).toBeDefined();
            expect(retrieved.title).toBe("Test Song");
            expect(retrieved.artist).toBe("Test Artist");
            expect(retrieved.key).toBe("C");
            expect(retrieved.arrangement).toEqual(["verse", "chorus"]);
        });

        it("should update a song", async () => {
            await testDb
                .update(songs)
                .set({ title: "Updated Title" })
                .where(eq(songs.id, "test-song-1"));

            const [updated] = await testDb
                .select()
                .from(songs)
                .where(eq(songs.id, "test-song-1"));

            expect(updated.title).toBe("Updated Title");
        });

        it("should handle null optional fields", async () => {
            const minimalSong = {
                id: "test-song-minimal",
                title: "Minimal Song",
            };

            await testDb.insert(songs).values(minimalSong);

            const [retrieved] = await testDb
                .select()
                .from(songs)
                .where(eq(songs.id, "test-song-minimal"));

            expect(retrieved.artist).toBeNull();
            expect(retrieved.key).toBeNull();
            expect(retrieved.notes).toBeNull();
        });
    });

    describe("Sections Table", () => {
        it("should insert and retrieve sections for a song", async () => {
            const testSection = {
                id: "test-song-1-verse",
                songId: "test-song-1",
                label: "Verse 1",
                chordLines: ["C", "G", "Am", "F"],
                degreeLines: ["I", "V", "vi", "IV"],
                notes: "Main verse",
                orderIndex: 0,
            };

            await testDb.insert(sections).values(testSection);

            const [retrieved] = await testDb
                .select()
                .from(sections)
                .where(eq(sections.id, "test-song-1-verse"));

            expect(retrieved).toBeDefined();
            expect(retrieved.label).toBe("Verse 1");
            expect(retrieved.chordLines).toEqual(["C", "G", "Am", "F"]);
            expect(retrieved.degreeLines).toEqual(["I", "V", "vi", "IV"]);
        });

        it("should retrieve sections by song ID", async () => {
            // Add another section
            await testDb.insert(sections).values({
                id: "test-song-1-chorus",
                songId: "test-song-1",
                label: "Chorus",
                chordLines: ["F", "G", "C"],
                orderIndex: 1,
            });

            const songSections = await testDb
                .select()
                .from(sections)
                .where(eq(sections.songId, "test-song-1"));

            expect(songSections.length).toBe(2);
        });
    });

    describe("Saved Progressions Table", () => {
        it("should insert and retrieve a progression", async () => {
            const testProgression = {
                id: "test-prog-1",
                name: "Pop Progression",
                tonic: "C",
                mode: "ionian",
                sequence: ["I", "V", "vi", "IV"],
            };

            await testDb.insert(savedProgressions).values(testProgression);

            const [retrieved] = await testDb
                .select()
                .from(savedProgressions)
                .where(eq(savedProgressions.id, "test-prog-1"));

            expect(retrieved).toBeDefined();
            expect(retrieved.name).toBe("Pop Progression");
            expect(retrieved.tonic).toBe("C");
            expect(retrieved.mode).toBe("ionian");
            expect(retrieved.sequence).toEqual(["I", "V", "vi", "IV"]);
        });

        it("should delete a progression", async () => {
            await testDb
                .delete(savedProgressions)
                .where(eq(savedProgressions.id, "test-prog-1"));

            const remaining = await testDb
                .select()
                .from(savedProgressions)
                .where(eq(savedProgressions.id, "test-prog-1"));

            expect(remaining.length).toBe(0);
        });
    });

    describe("Cascade Delete", () => {
        it("should delete sections when song is deleted", async () => {
            // Verify sections exist before delete
            const sectionsBeforeDelete = await testDb
                .select()
                .from(sections)
                .where(eq(sections.songId, "test-song-1"));
            expect(sectionsBeforeDelete.length).toBeGreaterThan(0);

            // Enable foreign keys and delete song
            await testClient.execute("PRAGMA foreign_keys = ON");
            await testDb.delete(songs).where(eq(songs.id, "test-song-1"));

            // Sections should be deleted via cascade
            const sectionsAfterDelete = await testDb
                .select()
                .from(sections)
                .where(eq(sections.songId, "test-song-1"));

            expect(sectionsAfterDelete.length).toBe(0);
        });
    });
});
