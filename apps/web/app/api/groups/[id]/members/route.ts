import { NextResponse } from "next/server";
import { prisma, groupMemberAddSchema } from "@repo/db";
import { ZodError } from "zod";
import { auth, type SessionUser } from "../../../../lib/auth";

type Params = Promise<{ id: string }>;

// POST /api/groups/[id]/members - Invite a user to a group (admin only).
// If no user with the given email exists yet, a new user row is created so
// the invited person can sign in via magic link / OTP. This is the invite
// flow: being added as a group member is what grants the right to log in.
export async function POST(
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

        const { id: groupId } = await params;

        const group = await prisma.group.findUnique({
            where: { id: groupId },
            select: { id: true },
        });

        if (!group) {
            return NextResponse.json({ error: "Group not found" }, { status: 404 });
        }

        const body = await request.json();
        const parsed = groupMemberAddSchema.parse(body);

        // Upsert: create a User row if this email hasn't been invited before.
        const invitedUser = await prisma.user.upsert({
            where: { email: parsed.email },
            update: {},
            create: { email: parsed.email },
            select: { id: true },
        });

        const existing = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: { userId: invitedUser.id, groupId },
            },
        });

        if (existing) {
            return NextResponse.json(
                { error: "User is already a member of this group" },
                { status: 409 }
            );
        }

        const member = await prisma.groupMember.create({
            data: {
                userId: invitedUser.id,
                groupId,
                role: parsed.role,
            },
        });

        return NextResponse.json(
            { id: member.id, success: true },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid request body", issues: error.issues },
                { status: 400 }
            );
        }
        console.error("Error adding group member:", error);
        return NextResponse.json(
            { error: "Failed to add member" },
            { status: 500 }
        );
    }
}

// DELETE /api/groups/[id]/members?userId=xxx - Remove a member from a group
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

        const { id: groupId } = await params;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId")?.trim();

        if (!userId) {
            return NextResponse.json(
                { error: "Missing userId parameter" },
                { status: 400 }
            );
        }

        await prisma.groupMember.deleteMany({
            where: { userId, groupId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing group member:", error);
        return NextResponse.json(
            { error: "Failed to remove member" },
            { status: 500 }
        );
    }
}
