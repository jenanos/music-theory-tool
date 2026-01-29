import { NextResponse } from "next/server";
import { db, savedProgressions, eq, desc } from "@repo/db";

// GET /api/progressions - Fetch all saved progressions
export async function GET() {
    try {
        const progressions = await db
            .select()
            .from(savedProgressions)
            .orderBy(desc(savedProgressions.createdAt));

        return NextResponse.json(
            progressions.map((p) => ({
                id: p.id,
                name: p.name,
                tonic: p.tonic,
                mode: p.mode,
                sequence: p.sequence ?? [],
                createdAt: p.createdAt,
            }))
        );
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
        const { name, tonic, mode, sequence } = body;

        if (!name || !tonic || !mode || !sequence) {
            return NextResponse.json(
                { error: "Missing required fields: name, tonic, mode, sequence" },
                { status: 400 }
            );
        }

        const id = crypto.randomUUID();

        await db.insert(savedProgressions).values({
            id,
            name,
            tonic,
            mode,
            sequence,
        });

        return NextResponse.json({ id, success: true }, { status: 201 });
    } catch (error) {
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
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Missing id parameter" },
                { status: 400 }
            );
        }

        await db.delete(savedProgressions).where(eq(savedProgressions.id, id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting progression:", error);
        return NextResponse.json(
            { error: "Failed to delete progression" },
            { status: 500 }
        );
    }
}
