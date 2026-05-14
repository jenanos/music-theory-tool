import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import {
  auth,
  getEffectiveEnabledPages,
  type SessionUser,
} from "../../lib/auth";
import { DEFAULT_USER_THEME, isUserTheme } from "../../lib/theme";

// GET /api/me - return the current user's effective enabled pages (union
// across their groups, or all pages for admins).
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user as SessionUser;
    const enabledPages = await getEffectiveEnabledPages(user.id, user.role);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        theme:
          (
            await prisma.user.findUnique({
              where: { id: user.id },
              select: { theme: true },
            })
          )?.theme ?? DEFAULT_USER_THEME,
      },
      enabledPages,
    });
  } catch (error) {
    console.error("Error fetching /api/me:", error);
    return NextResponse.json(
      { error: "Failed to fetch user info" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      theme?: unknown;
    } | null;

    if (!isUserTheme(body?.theme)) {
      return NextResponse.json({ error: "Ugyldig tema." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { theme: body.theme },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        theme: true,
      },
    });

    const enabledPages = await getEffectiveEnabledPages(
      updatedUser.id,
      updatedUser.role as SessionUser["role"],
    );

    return NextResponse.json({
      user: updatedUser,
      enabledPages,
    });
  } catch (error) {
    console.error("Error updating /api/me:", error);
    return NextResponse.json(
      { error: "Failed to update user info" },
      { status: 500 },
    );
  }
}
