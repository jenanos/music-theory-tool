import { NextResponse } from "next/server";
import { db, songs, sections, eq, asc } from "@repo/db";

// GET /api/songs - Fetch all songs with their sections
export async function GET() {
    try {
        // Get all songs
        const allSongs = await db.select().from(songs);

        // Get sections for each song and transform to the expected format
        const songsWithSections = await Promise.all(
            allSongs.map(async (song) => {
                const songSections = await db
                    .select()
                    .from(sections)
                    .where(eq(sections.songId, song.id))
                    .orderBy(asc(sections.orderIndex));

                return {
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    key: song.key,
                    notes: song.notes,
                    arrangement: song.arrangement ?? [],
                    sections: songSections.map((s) => ({
                        id: s.id.replace(`${song.id}-`, ""), // Remove song prefix from section id
                        label: s.label,
                        chordLines: s.chordLines ?? [],
                        degreeLines: s.degreeLines ?? [],
                        notes: s.notes,
                    })),
                };
            })
        );

        return NextResponse.json(songsWithSections);
    } catch (error) {
        console.error("Error fetching songs:", error);
        return NextResponse.json(
            { error: "Failed to fetch songs" },
            { status: 500 }
        );
    }
}

// POST /api/songs - Create a new song
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, title, artist, key, notes, arrangement, sections: newSections } = body;

        // Generate ID if not provided
        const songId = id || crypto.randomUUID();

        // Insert song
        await db.insert(songs).values({
            id: songId,
            title,
            artist,
            key,
            notes,
            arrangement: arrangement ?? [],
        });

        // Insert sections
        if (newSections && Array.isArray(newSections)) {
            for (let i = 0; i < newSections.length; i++) {
                const section = newSections[i];
                await db.insert(sections).values({
                    id: `${songId}-${section.id}`,
                    songId,
                    label: section.label,
                    chordLines: section.chordLines ?? [],
                    degreeLines: section.degreeLines ?? [],
                    notes: section.notes,
                    orderIndex: i,
                });
            }
        }

        return NextResponse.json({ id: songId, success: true }, { status: 201 });
    } catch (error) {
        console.error("Error creating song:", error);
        return NextResponse.json(
            { error: "Failed to create song" },
            { status: 500 }
        );
    }
}
