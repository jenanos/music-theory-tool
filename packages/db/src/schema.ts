import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// ============================================================================
// Songs Table
// ============================================================================

export const songs = sqliteTable("songs", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    artist: text("artist"),
    key: text("key"),
    notes: text("notes"),
    arrangement: text("arrangement", { mode: "json" }).$type<string[]>(),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
});

// ============================================================================
// Sections Table
// ============================================================================

export const sections = sqliteTable("sections", {
    id: text("id").primaryKey(),
    songId: text("song_id")
        .notNull()
        .references(() => songs.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    chordLines: text("chord_lines", { mode: "json" }).$type<string[]>(),
    degreeLines: text("degree_lines", { mode: "json" }).$type<string[]>(),
    notes: text("notes"),
    orderIndex: integer("order_index").notNull(),
});

// ============================================================================
// Original Songs Table (immutable snapshot for version history)
// ============================================================================

export const originalSongs = sqliteTable("original_songs", {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    artist: text("artist"),
    key: text("key"),
    notes: text("notes"),
    arrangement: text("arrangement", { mode: "json" }).$type<string[]>(),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
});

// ============================================================================
// Original Sections Table (immutable snapshot for version history)
// ============================================================================

export const originalSections = sqliteTable("original_sections", {
    id: text("id").primaryKey(),
    songId: text("song_id")
        .notNull()
        .references(() => originalSongs.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    chordLines: text("chord_lines", { mode: "json" }).$type<string[]>(),
    degreeLines: text("degree_lines", { mode: "json" }).$type<string[]>(),
    notes: text("notes"),
    orderIndex: integer("order_index").notNull(),
});

// ============================================================================
// Saved Progressions Table
// ============================================================================

export const savedProgressions = sqliteTable("saved_progressions", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    tonic: text("tonic").notNull(),
    mode: text("mode").notNull(),
    sequence: text("sequence", { mode: "json" }).$type<string[]>(),
    createdAt: integer("created_at", { mode: "timestamp" })
        .notNull()
        .$defaultFn(() => new Date()),
});

// ============================================================================
// Types
// ============================================================================

export type Song = typeof songs.$inferSelect;
export type NewSong = typeof songs.$inferInsert;

export type Section = typeof sections.$inferSelect;
export type NewSection = typeof sections.$inferInsert;

export type OriginalSong = typeof originalSongs.$inferSelect;
export type NewOriginalSong = typeof originalSongs.$inferInsert;

export type OriginalSection = typeof originalSections.$inferSelect;
export type NewOriginalSection = typeof originalSections.$inferInsert;

export type SavedProgression = typeof savedProgressions.$inferSelect;
export type NewSavedProgression = typeof savedProgressions.$inferInsert;
