import { NextResponse } from "next/server";
import {
  lickUpdateSchema,
  prisma,
  toLickResponse,
  type Lick,
  type Prisma,
} from "@repo/db";
import { ZodError } from "zod";
import { auth, type SessionUser } from "../../../lib/auth";

type Params = Promise<{ id: string }>;

async function canAccessLick(
  user: SessionUser,
  lickId: string,
  requireWrite: boolean,
): Promise<{ allowed: boolean; lick: Lick | null }> {
  const lick = await prisma.lick.findUnique({
    where: { id: lickId },
  });
  if (!lick) return { allowed: false, lick: null };

  if (user.role === "admin") return { allowed: true, lick };
  if (lick.userId === user.id) return { allowed: true, lick };

  if (lick.visibility === "shared" && !requireWrite) {
    return { allowed: true, lick };
  }

  if (lick.visibility === "group" && lick.groupId) {
    const membership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: user.id, groupId: lick.groupId } },
    });
    if (membership) return { allowed: true, lick };
  }

  return { allowed: false, lick };
}

async function canUseGroup(
  user: SessionUser,
  groupId: string,
): Promise<boolean> {
  if (user.role === "admin") return true;

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: user.id, groupId } },
  });

  return Boolean(membership);
}

// GET /api/licks/[id] - Fetch a single lick
export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = session.user as SessionUser;
    const { allowed, lick } = await canAccessLick(user, id, false);

    if (!lick) {
      return NextResponse.json({ error: "Lick not found" }, { status: 404 });
    }
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(toLickResponse(lick));
  } catch (error) {
    console.error("Error fetching lick:", error);
    return NextResponse.json(
      { error: "Failed to fetch lick" },
      { status: 500 },
    );
  }
}

// PUT /api/licks/[id] - Update a lick
export async function PUT(request: Request, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = session.user as SessionUser;
    const { allowed, lick: existingLick } = await canAccessLick(user, id, true);

    if (!existingLick) {
      return NextResponse.json({ error: "Lick not found" }, { status: 404 });
    }
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = lickUpdateSchema.parse(body);
    const nextVisibility = parsed.visibility ?? existingLick.visibility;
    const nextGroupId =
      parsed.groupId !== undefined ? parsed.groupId : existingLick.groupId;

    if (nextVisibility === "group" && nextGroupId) {
      const allowedGroup = await canUseGroup(user, nextGroupId);
      if (!allowedGroup) {
        return NextResponse.json(
          { error: "Not a member of the specified group" },
          { status: 403 },
        );
      }
    }

    const updateData: Prisma.LickUpdateInput = {};

    if (parsed.title !== undefined) updateData.title = parsed.title;
    if (parsed.key !== undefined) updateData.key = parsed.key;
    if (parsed.description !== undefined)
      updateData.description = parsed.description;
    if (parsed.tags !== undefined) updateData.tags = parsed.tags;
    if (parsed.tuning !== undefined) updateData.tuning = parsed.tuning;
    if (parsed.data !== undefined) updateData.data = parsed.data;
    if (parsed.visibility !== undefined)
      updateData.visibility = parsed.visibility;
    if (parsed.groupId !== undefined) {
      if (parsed.groupId) {
        updateData.group = { connect: { id: parsed.groupId } };
      } else {
        updateData.group = { disconnect: true };
      }
    }

    if (
      parsed.visibility !== undefined &&
      parsed.visibility !== "group" &&
      parsed.groupId === undefined
    ) {
      updateData.group = { disconnect: true };
    }

    const lick = await prisma.lick.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(toLickResponse(lick));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("Error updating lick:", error);
    return NextResponse.json(
      { error: "Failed to update lick" },
      { status: 500 },
    );
  }
}

// DELETE /api/licks/[id] - Delete a lick
export async function DELETE(request: Request, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const user = session.user as SessionUser;

    const lick = await prisma.lick.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!lick) {
      return NextResponse.json({ error: "Lick not found" }, { status: 404 });
    }

    const isOwner = lick.userId === user.id;
    const isAdmin = user.role === "admin";
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.lick.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lick:", error);
    return NextResponse.json(
      { error: "Failed to delete lick" },
      { status: 500 },
    );
  }
}
