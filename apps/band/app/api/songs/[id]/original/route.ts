import { NextResponse } from "next/server";
import { db, originalSongs, originalSections, eq, asc } from "@repo/db";

type Params = Promise<{ id: string }>;

// GET /api/songs/[id]/original - Fetch the original version of a song
export async function GET(request: Request, { params }: { params: Params }) {
    try {
        const { id } = await params;

        const [song] = await db
            .select()
            .from(originalSongs)
            .where(eq(originalSongs.id, id));

        if (!song) {
            return NextResponse.json(
                { error: "Original song not found" },
                { status: 404 }
            );
        }

        const songSections = await db
            .select()
            .from(originalSections)
            .where(eq(originalSections.songId, id))
            .orderBy(asc(originalSections.orderIndex));

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
        console.error("Error fetching original song:", error);
        return NextResponse.json(
            { error: "Failed to fetch original song" },
            { status: 500 }
        );
    }
}
