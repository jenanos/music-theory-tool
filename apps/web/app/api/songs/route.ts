import { NextResponse } from "next/server";
import { prisma, songCreateSchema, toSongResponse, type Prisma } from "@repo/db";
import { ZodError } from "zod";
import { auth, type SessionUser } from "../../lib/auth";

// GET /api/songs - Fetch songs visible to the current user
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as SessionUser;
        const isAdmin = user.role === "admin";

        let where: Prisma.SongWhereInput = {};

        if (!isAdmin) {
            // Get user's group IDs
            const memberships = await prisma.groupMember.findMany({
                where: { userId: user.id },
                select: { groupId: true },
            });
            const groupIds = memberships.map((m) => m.groupId);

            where = {
                OR: [
                    { userId: user.id },                  // Own songs
                    { visibility: "shared" },              // Shared with everyone
                    ...(groupIds.length > 0
                        ? [{ visibility: "group" as const, groupId: { in: groupIds } }]
                        : []),
                ],
            };
        }
        // Admin: no filter — sees all songs

        const songs = await prisma.song.findMany({
            where,
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as SessionUser;
        const body = await request.json();
        const parsed = songCreateSchema.parse(body);
        const songId = parsed.id ?? crypto.randomUUID();

        // Validate group membership if creating a group song
        if (parsed.visibility === "group" && parsed.groupId) {
            const membership = await prisma.groupMember.findUnique({
                where: {
                    userId_groupId: { userId: user.id, groupId: parsed.groupId },
                },
            });
            if (!membership && user.role !== "admin") {
                return NextResponse.json(
                    { error: "Not a member of the specified group" },
                    { status: 403 }
                );
            }
        }

        await prisma.$transaction(async (tx) => {
            await tx.song.create({
                data: {
                    id: songId,
                    title: parsed.title,
                    artist: parsed.artist ?? null,
                    key: parsed.key ?? null,
                    notes: parsed.notes ?? null,
                    arrangement: parsed.arrangement ?? [],
                    visibility: parsed.visibility ?? "private",
                    userId: user.id,
                    groupId: parsed.visibility === "group" ? (parsed.groupId ?? null) : null,
                },
            });

            if (parsed.sections.length > 0) {
                await tx.section.createMany({
                    data: parsed.sections.map((section, index) => ({
                        id: `${songId}-${section.id}`,
                        songId,
                        label: section.label,
                        description: section.description ?? null,
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
