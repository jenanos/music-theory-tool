import { NextResponse } from "next/server";
import { prisma, progressionCreateSchema } from "@repo/db";
import { ZodError } from "zod";

// GET /api/progressions - Fetch all saved progressions
export async function GET() {
    try {
        const progressions = await prisma.savedProgression.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(progressions);
    } catch (error) {
        console.error("Error fetching progressions:", error);
        return NextResponse.json(
            { error: "Failed to fetch progressions" },
            { status: 500 }
        );
    }
}

// POST /api/progressions - Save a new progression
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const parsed = progressionCreateSchema.parse(body);

        const id = crypto.randomUUID();

        await prisma.savedProgression.create({
            data: {
                id,
                name: parsed.name,
                tonic: parsed.tonic,
                mode: parsed.mode,
                sequence: parsed.sequence,
            },
        });

        return NextResponse.json({ id, success: true }, { status: 201 });
    } catch (error) {
        if (error instanceof ZodError) {
            return NextResponse.json(
                { error: "Invalid request body", issues: error.issues },
                { status: 400 }
            );
        }
        console.error("Error saving progression:", error);
        return NextResponse.json(
            { error: "Failed to save progression" },
            { status: 500 }
        );
    }
}

// DELETE /api/progressions - Delete a progression (by id in query param)
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id")?.trim();

        if (!id) {
            return NextResponse.json(
                { error: "Missing id parameter" },
                { status: 400 }
            );
        }

        await prisma.savedProgression.deleteMany({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting progression:", error);
        return NextResponse.json(
            { error: "Failed to delete progression" },
            { status: 500 }
        );
    }
}
