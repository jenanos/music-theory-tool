import { NextResponse } from "next/server";
import { prisma, groupUpdateSchema } from "@repo/db";
import { ZodError } from "zod";
import { auth, type SessionUser } from "../../../lib/auth";

type Params = Promise<{ id: string }>;

// PATCH /api/groups/[id] - Update group name and/or enabled pages (admin only)
export async function PATCH(
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

        const body = await request.json();
        const parsed = groupUpdateSchema.parse(body);

        const updated = await prisma.group.update({
            where: { id },
            data: {
                ...(parsed.name !== undefined ? { name: parsed.name } : {}),
                ...(parsed.enabledPages !== undefined
                    ? { enabledPages: parsed.enabledPages }
                    : {}),
            },
        });

        return NextResponse.json({
            id: updated.id,
            name: updated.name,
            enabledPages: updated.enabledPages,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid request body", issues: error.issues },
                { status: 400 }
            );
        }
        console.error("Error updating group:", error);
        return NextResponse.json(
            { error: "Failed to update group" },
            { status: 500 }
        );
    }
}

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
