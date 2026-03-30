import { NextResponse } from "next/server";
import { createMagicLink } from "../../../lib/auth";

// POST /api/auth/magic-link - Request a magic link
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "E-post er påkrevd." },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    const token = await createMagicLink(normalizedEmail);

    // Build the verification URL
    const url = new URL(request.url);
    const verifyUrl = `${url.origin}/api/auth/verify?token=${token}`;

    // In production, send email. In development, log to console.
    if (process.env.NODE_ENV === "development") {
      console.log(`\n🔗 Magic link for ${normalizedEmail}:\n${verifyUrl}\n`);
    }

    // TODO: Send email with verifyUrl in production

    return NextResponse.json({
      success: true,
      message: "Hvis e-postadressen er registrert, vil du motta en innloggingslenke.",
      // Only include link in development for easy testing
      ...(process.env.NODE_ENV === "development" ? { verifyUrl } : {}),
    });
  } catch (error) {
    console.error("Magic link error:", error);
    // Generic success message to not leak user info
    return NextResponse.json({
      success: true,
      message: "Hvis e-postadressen er registrert, vil du motta en innloggingslenke.",
    });
  }
}
