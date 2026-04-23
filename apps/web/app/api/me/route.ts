import { NextResponse } from "next/server";
import { auth, getEffectiveEnabledPages, type SessionUser } from "../../lib/auth";

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
            },
            enabledPages,
        });
    } catch (error) {
        console.error("Error fetching /api/me:", error);
        return NextResponse.json(
            { error: "Failed to fetch user info" },
            { status: 500 }
        );
    }
}
