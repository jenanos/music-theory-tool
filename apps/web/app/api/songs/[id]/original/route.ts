import { NextResponse } from "next/server";
import { prisma, toOriginalSongResponse } from "@repo/db";

type Params = Promise<{ id: string }>;

// GET /api/songs/[id]/original - Fetch the original version of a song
export async function GET(request: Request, { params }: { params: Params }) {
    try {
        const { id } = await params;

        const song = await prisma.originalSong.findUnique({
            where: { id },
            include: {
                sections: {
                    orderBy: { orderIndex: "asc" },
                },
            },
        });

        if (!song) {
            return NextResponse.json(
                { error: "Original song not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(toOriginalSongResponse(song));
    } catch (error) {
        console.error("Error fetching original song:", error);
        return NextResponse.json(
            { error: "Failed to fetch original song" },
            { status: 500 }
        );
    }
}
