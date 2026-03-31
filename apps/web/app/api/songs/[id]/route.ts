import { NextResponse } from "next/server";
import { prisma, songUpdateSchema, toSongResponse, type Prisma } from "@repo/db";
import { ZodError } from "zod";
import { auth, type SessionUser } from "../../../lib/auth";

type Params = Promise<{ id: string }>;

/** Check if the current user can access/modify the given song */
async function canAccessSong(
    user: SessionUser,
    songId: string,
    requireWrite: boolean
): Promise<{ allowed: boolean; song: Prisma.SongGetPayload<{ include: { sections: true } }> | null }> {
    const song = await prisma.song.findUnique({
        where: { id: songId },
        include: { sections: { orderBy: { orderIndex: "asc" } } },
    });
    if (!song) return { allowed: false, song: null };

    // Admin can always access
    if (user.role === "admin") return { allowed: true, song };

    // Owner can always access
    if (song.userId === user.id) return { allowed: true, song };

    // Shared songs: readable by everyone
    if (song.visibility === "shared" && !requireWrite) {
        return { allowed: true, song };
    }

    // Group songs: readable by group members, writable by group members
    if (song.visibility === "group" && song.groupId) {
        const membership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: user.id, groupId: song.groupId } },
        });
        if (membership) return { allowed: true, song };
    }

    return { allowed: false, song };
}

// GET /api/songs/[id] - Fetch a single song
export async function GET(request: Request, { params }: { params: Params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const user = session.user as SessionUser;
        const { allowed, song } = await canAccessSong(user, id, false);

        if (!song) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }
        if (!allowed) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const user = session.user as SessionUser;
        const { allowed, song: existingSong } = await canAccessSong(user, id, true);

        if (!existingSong) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }
        if (!allowed) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = songUpdateSchema.parse(body);

        const hasSongFieldUpdate =
            parsed.title !== undefined ||
            parsed.artist !== undefined ||
            parsed.key !== undefined ||
            parsed.notes !== undefined ||
            parsed.arrangement !== undefined ||
            parsed.visibility !== undefined ||
            parsed.groupId !== undefined;

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
                if (parsed.visibility !== undefined) {
                    updateData.visibility = parsed.visibility;
                }
                if (parsed.groupId !== undefined) {
                    updateData.group = parsed.groupId
                        ? { connect: { id: parsed.groupId } }
                        : { disconnect: true };
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
                            description: section.description ?? null,
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
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const user = session.user as SessionUser;

        const song = await prisma.song.findUnique({
            where: { id },
            select: { id: true, userId: true, visibility: true, groupId: true },
        });

        if (!song) {
            return NextResponse.json({ error: "Song not found" }, { status: 404 });
        }

        // Only admin or owner can delete
        const isOwner = song.userId === user.id;
        const isAdmin = user.role === "admin";
        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

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
