import { NextResponse } from "next/server";
import { prisma, toOriginalSongResponse } from "@repo/db";
import { auth, type SessionUser } from "../../../../lib/auth";

type Params = Promise<{ id: string }>;

/**
 * The original version follows the access rules of the current song with the
 * same id: admins, the owner, group members (for group songs) and everyone
 * (for shared songs) may read it.
 */
async function canReadSong(user: SessionUser, songId: string): Promise<boolean> {
    if (user.role === "admin") return true;

    const song = await prisma.song.findUnique({
        where: { id: songId },
        select: { userId: true, visibility: true, groupId: true },
    });
    if (!song) return false;

    if (song.userId === user.id) return true;
    if (song.visibility === "shared") return true;

    if (song.visibility === "group" && song.groupId) {
        const membership = await prisma.groupMember.findUnique({
            where: { userId_groupId: { userId: user.id, groupId: song.groupId } },
        });
        if (membership) return true;
    }

    return false;
}

// GET /api/songs/[id]/original - Fetch the original version of a song
export async function GET(request: Request, { params }: { params: Params }) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const user = session.user as SessionUser;

        if (!(await canReadSong(user, id))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

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
