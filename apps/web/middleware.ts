import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session_token";

// Routes that require authentication (any logged-in user)
const PROTECTED_ROUTES = ["/", "/charts", "/progressions", "/practice"];

// Routes that require admin role
const ADMIN_ROUTES = ["/", "/progressions", "/practice"];

// Public routes (no auth required)
const PUBLIC_ROUTES = ["/login", "/api/auth"];

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public routes and API auth routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow all other API routes (they handle their own auth if needed)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Check if route needs protection
  const needsAuth = PROTECTED_ROUTES.some((route) =>
    pathname === route || (route !== "/" && pathname.startsWith(route)),
  );
  if (!needsAuth) {
    return NextResponse.next();
  }

  // Verify session
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = getJwtSecret();

  if (!token || !secret) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    // Check admin-only routes
    const isAdminRoute = ADMIN_ROUTES.some((route) =>
      pathname === route || (route !== "/" && pathname.startsWith(route)),
    );

    if (isAdminRoute && role !== "admin") {
      // Members can only access /charts, redirect others to /charts
      return NextResponse.redirect(new URL("/charts", request.url));
    }

    // Add user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId as string);
    response.headers.set("x-user-role", role);
    return response;
  } catch {
    // Invalid token - redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.webp$|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)",
  ],
};
