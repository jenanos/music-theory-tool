import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLink } from "../../../lib/auth";

// GET /api/auth/verify?token=xxx - Verify magic link and create session
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  try {
    await verifyMagicLink(token);
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url),
    );
  }
}
