import { NextResponse } from "next/server";
import {
  lickCreateSchema,
  prisma,
  toLickResponse,
  type Prisma,
} from "@repo/db";
import { ZodError } from "zod";
import { auth, type SessionUser } from "../../lib/auth";

// GET /api/licks - Fetch licks visible to the current user
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const isAdmin = user.role === "admin";

    let where: Prisma.LickWhereInput = {};

    if (!isAdmin) {
      const memberships = await prisma.groupMember.findMany({
        where: { userId: user.id },
        select: { groupId: true },
      });
      const groupIds = memberships.map((m) => m.groupId);

      where = {
        OR: [
          { userId: user.id },
          { visibility: "shared" },
          ...(groupIds.length > 0
            ? [{ visibility: "group" as const, groupId: { in: groupIds } }]
            : []),
        ],
      };
    }

    const licks = await prisma.lick.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(licks.map(toLickResponse));
  } catch (error) {
    console.error("Error fetching licks:", error);
    return NextResponse.json(
      { error: "Failed to fetch licks" },
      { status: 500 },
    );
  }
}

// POST /api/licks - Create a new lick
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const body = await request.json();
    const parsed = lickCreateSchema.parse(body);

    if (parsed.visibility === "group" && parsed.groupId) {
      const membership = await prisma.groupMember.findUnique({
        where: {
          userId_groupId: { userId: user.id, groupId: parsed.groupId },
        },
      });
      if (!membership && user.role !== "admin") {
        return NextResponse.json(
          { error: "Not a member of the specified group" },
          { status: 403 },
        );
      }
    }

    const lick = await prisma.lick.create({
      data: {
        title: parsed.title,
        key: parsed.key ?? null,
        description: parsed.description ?? null,
        tags: parsed.tags,
        tuning: parsed.tuning ?? null,
        data: parsed.data,
        visibility: parsed.visibility,
        userId: user.id,
        groupId:
          parsed.visibility === "group" ? (parsed.groupId ?? null) : null,
      },
    });

    return NextResponse.json(toLickResponse(lick), { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("Error creating lick:", error);
    return NextResponse.json(
      { error: "Failed to create lick" },
      { status: 500 },
    );
  }
}
