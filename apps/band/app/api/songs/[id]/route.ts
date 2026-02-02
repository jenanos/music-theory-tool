import { NextResponse } from "next/server";
import { db, songs, sections, eq, asc } from "@repo/db";

type Params = Promise<{ id: string }>;

// GET /api/songs/[id] - Fetch a single song
export async function GET(request: Request, { params }: { params: Params }) {
    try {
        const { id } = await params;

        const [song] = await db.select().from(songs).where(eq(songs.id, id));

        if (!song) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }

        const songSections = await db
            .select()
            .from(sections)
            .where(eq(sections.songId, id))
            .orderBy(asc(sections.orderIndex));

        return NextResponse.json({
            id: song.id,
            title: song.title,
            artist: song.artist,
            key: song.key,
            notes: song.notes,
            arrangement: song.arrangement ?? [],
            sections: songSections.map((s) => ({
                id: s.id.replace(`${song.id}-`, ""),
                label: s.label,
                chordLines: s.chordLines ?? [],
                degreeLines: s.degreeLines ?? [],
                notes: s.notes,
            })),
        });
    } catch (error) {
        console.error("Error fetching song:", error);
        return NextResponse.json(
            { error: "Failed to fetch song" },
            { status: 500 }
        );
    }
}

// PUT /api/songs/[id] - Update a song
export async function PUT(request: Request, { params }: { params: Params }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            title,
            artist,
            key,
            notes,
            arrangement,
            sections: updatedSections,
        } = body;

        // Check if song exists
        const [existingSong] = await db
            .select()
            .from(songs)
            .where(eq(songs.id, id));

        if (!existingSong) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }

        // Update song
        await db
            .update(songs)
            .set({
                title: title ?? existingSong.title,
                artist: artist ?? existingSong.artist,
                key: key ?? existingSong.key,
                notes: notes ?? existingSong.notes,
                arrangement: arrangement ?? existingSong.arrangement,
                updatedAt: new Date(),
            })
            .where(eq(songs.id, id));

        // Update sections if provided
        if (updatedSections && Array.isArray(updatedSections)) {
            // Delete existing sections
            await db.delete(sections).where(eq(sections.songId, id));

            // Insert updated sections
            for (let i = 0; i < updatedSections.length; i++) {
                const section = updatedSections[i];
                await db.insert(sections).values({
                    id: `${id}-${section.id}`,
                    songId: id,
                    label: section.label,
                    chordLines: section.chordLines ?? [],
                    degreeLines: section.degreeLines ?? [],
                    notes: section.notes,
                    orderIndex: i,
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating song:", error);
        return NextResponse.json(
            { error: "Failed to update song" },
            { status: 500 }
        );
    }
}

// DELETE /api/songs/[id] - Delete a song
export async function DELETE(
    request: Request,
    { params }: { params: Params }
) {
    try {
        const { id } = await params;

        // Check if song exists
        const [existingSong] = await db
            .select()
            .from(songs)
            .where(eq(songs.id, id));

        if (!existingSong) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }

        // Delete song (sections are deleted automatically due to cascade)
        await db.delete(songs).where(eq(songs.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting song:", error);
        return NextResponse.json(
            { error: "Failed to delete song" },
            { status: 500 }
        );
    }
}
