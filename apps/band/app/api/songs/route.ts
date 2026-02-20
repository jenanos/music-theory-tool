import { NextResponse } from "next/server";
import { prisma, songCreateSchema, toSongResponse } from "@repo/db";
import { ZodError } from "zod";

// GET /api/songs - Fetch all songs with their sections
export async function GET() {
    try {
        const songs = await prisma.song.findMany({
            include: {
                sections: {
                    orderBy: { orderIndex: "asc" },
                },
            },
        });

        return NextResponse.json(songs.map(toSongResponse));
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
        const parsed = songCreateSchema.parse(body);
        const songId = parsed.id ?? crypto.randomUUID();

        await prisma.$transaction(async (tx) => {
            await tx.song.create({
                data: {
                    id: songId,
                    title: parsed.title,
                    artist: parsed.artist ?? null,
                    key: parsed.key ?? null,
                    notes: parsed.notes ?? null,
                    arrangement: parsed.arrangement ?? [],
                },
            });

            if (parsed.sections.length > 0) {
                await tx.section.createMany({
                    data: parsed.sections.map((section, index) => ({
                        id: `${songId}-${section.id}`,
                        songId,
                        label: section.label,
                        chordLines: section.chordLines ?? [],
                        degreeLines: section.degreeLines ?? [],
                        notes: section.notes ?? null,
                        orderIndex: index,
                    })),
                });
            }
        });

        return NextResponse.json({ id: songId, success: true }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid request body", issues: error.issues },
                { status: 400 }
            );
        }
        console.error("Error creating song:", error);
        return NextResponse.json(
            { error: "Failed to create song" },
            { status: 500 }
        );
    }
}
