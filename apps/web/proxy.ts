import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/login/verify", "/api/auth"];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  if (isPublic) return NextResponse.next();

  // Only check for session cookie presence here (edge-compatible).
  // Full session validation + role checks happen server-side via auth().
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.webp$|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
