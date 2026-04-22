import { NextResponse } from "next/server";
import { prisma, groupCreateSchema } from "@repo/db";
import { ZodError } from "zod";
import { auth, type SessionUser } from "../../lib/auth";

// GET /api/groups - Fetch groups the current user belongs to (admin sees all)
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as SessionUser;
        const isAdmin = user.role === "admin";

        const groups = isAdmin
            ? await prisma.group.findMany({
                  include: {
                      members: {
                          include: { user: { select: { id: true, name: true, email: true } } },
                      },
                      _count: { select: { songs: true } },
                  },
                  orderBy: { name: "asc" },
              })
            : await prisma.group.findMany({
                  where: {
                      members: { some: { userId: user.id } },
                  },
                  include: {
                      members: {
                          include: { user: { select: { id: true, name: true, email: true } } },
                      },
                      _count: { select: { songs: true } },
                  },
                  orderBy: { name: "asc" },
              });

        return NextResponse.json(
            groups.map((g) => ({
                id: g.id,
                name: g.name,
                enabledPages: g.enabledPages,
                members: g.members.map((m) => ({
                    id: m.id,
                    userId: m.userId,
                    role: m.role,
                    name: m.user.name,
                    email: m.user.email,
                })),
                songCount: g._count.songs,
            }))
        );
    } catch (error) {
        console.error("Error fetching groups:", error);
        return NextResponse.json(
            { error: "Failed to fetch groups" },
            { status: 500 }
        );
    }
}

// POST /api/groups - Create a new group (admin only)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = session.user as SessionUser;
        if (user.role !== "admin") {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const parsed = groupCreateSchema.parse(body);

        const group = await prisma.group.create({
            data: {
                name: parsed.name,
                enabledPages: parsed.enabledPages,
                members: {
                    create: {
                        userId: user.id,
                        role: "admin",
                    },
                },
            },
        });

        return NextResponse.json({ id: group.id, success: true }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid request body", issues: error.issues },
                { status: 400 }
            );
        }
        console.error("Error creating group:", error);
        return NextResponse.json(
            { error: "Failed to create group" },
            { status: 500 }
        );
    }
}
