import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth, type SessionUser } from "../../../lib/auth";

type Params = Promise<{ id: string }>;

// DELETE /api/groups/[id] - Delete a group (admin only)
export async function DELETE(
    request: Request,
    { params }: { params: Params }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as SessionUser;
        if (user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { id } = await params;

        const group = await prisma.group.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        await prisma.group.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting group:", error);
        return NextResponse.json(
            { error: "Failed to delete group" },
            { status: 500 }
        );
    }
}
