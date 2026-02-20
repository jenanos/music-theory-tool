import { NextResponse } from "next/server";
import { prisma, songUpdateSchema, toSongResponse, type Prisma } from "@repo/db";
import { ZodError } from "zod";

type Params = Promise<{ id: string }>;

// GET /api/songs/[id] - Fetch a single song
export async function GET(request: Request, { params }: { params: Params }) {
    try {
        const { id } = await params;

        const song = await prisma.song.findUnique({
            where: { id },
            include: {
                sections: {
                    orderBy: { orderIndex: "asc" },
                },
            },
        });

        if (!song) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }

        return NextResponse.json(toSongResponse(song));
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
        const parsed = songUpdateSchema.parse(body);

        // Check if song exists
        const existingSong = await prisma.song.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existingSong) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }

        const hasSongFieldUpdate =
            parsed.title !== undefined ||
            parsed.artist !== undefined ||
            parsed.key !== undefined ||
            parsed.notes !== undefined ||
            parsed.arrangement !== undefined;

        await prisma.$transaction(async (tx) => {
            if (hasSongFieldUpdate) {
                const updateData: Prisma.SongUpdateInput = {};

                if (parsed.title !== undefined) updateData.title = parsed.title;
                if (parsed.artist !== undefined) updateData.artist = parsed.artist;
                if (parsed.key !== undefined) updateData.key = parsed.key;
                if (parsed.notes !== undefined) updateData.notes = parsed.notes;
                if (parsed.arrangement !== undefined) {
                    updateData.arrangement = parsed.arrangement;
                }

                await tx.song.update({
                    where: { id },
                    data: updateData,
                });
            }

            if (parsed.sections !== undefined) {
                await tx.section.deleteMany({ where: { songId: id } });

                if (parsed.sections.length > 0) {
                    await tx.section.createMany({
                        data: parsed.sections.map((section, index) => ({
                            id: `${id}-${section.id}`,
                            songId: id,
                            label: section.label,
                            chordLines: section.chordLines ?? [],
                            degreeLines: section.degreeLines ?? [],
                            notes: section.notes ?? null,
                            orderIndex: index,
                        })),
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid request body", issues: error.issues },
                { status: 400 }
            );
        }
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
        const existingSong = await prisma.song.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!existingSong) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }

        // Delete song (sections are deleted automatically due to cascade)
        await prisma.song.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting song:", error);
        return NextResponse.json(
            { error: "Failed to delete song" },
            { status: 500 }
        );
    }
}
