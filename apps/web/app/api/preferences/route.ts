import { NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { auth } from "../../lib/auth";

const VALID_PAGES = ["chords", "progressions", "charts", "practice"] as const;
type PageId = (typeof VALID_PAGES)[number];

const DEFAULT_ENABLED_PAGES: PageId[] = ["charts", "progressions"];

function isValidPage(page: string): page is PageId {
    return (VALID_PAGES as readonly string[]).includes(page);
}

// GET /api/preferences - Fetch current user's preferences
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const preference = await prisma.userPreference.findUnique({
            where: { userId: session.user.id },
        });

        return NextResponse.json({
            enabledPages: preference?.enabledPages ?? DEFAULT_ENABLED_PAGES,
        });
    } catch (error) {
        console.error("Error fetching preferences:", error);
        return NextResponse.json(
            { error: "Failed to fetch preferences" },
            { status: 500 }
        );
    }
}

// PUT /api/preferences - Update current user's preferences
export async function PUT(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { enabledPages } = body;

        if (!Array.isArray(enabledPages)) {
            return NextResponse.json(
                { error: "enabledPages must be an array" },
                { status: 400 }
            );
        }

        // Validate all page IDs
        const validPages = enabledPages.filter(
            (page: unknown): page is PageId =>
                typeof page === "string" && isValidPage(page)
        );

        // Ensure "charts" is always enabled (it's the base page for all users)
        if (!validPages.includes("charts")) {
            validPages.push("charts");
        }

        const preference = await prisma.userPreference.upsert({
            where: { userId: session.user.id },
            update: { enabledPages: validPages },
            create: {
                userId: session.user.id,
                enabledPages: validPages,
            },
        });

        return NextResponse.json({
            enabledPages: preference.enabledPages,
        });
    } catch (error) {
        console.error("Error updating preferences:", error);
        return NextResponse.json(
            { error: "Failed to update preferences" },
            { status: 500 }
        );
    }
}
