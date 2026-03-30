import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@repo/db";

const SESSION_COOKIE = "session_token";
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAGIC_LINK_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const isDevelopment = process.env.NODE_ENV === "development";

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

export type UserRole = "admin" | "member";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

// ---------------------------------------------------------------------------
// Magic Link
// ---------------------------------------------------------------------------

export async function createMagicLink(email: string): Promise<string> {
  // Find or create user
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Only allow known emails - do not auto-create users
    throw new Error("Ingen bruker med denne e-postadressen.");
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + MAGIC_LINK_DURATION_MS);

  await prisma.magicLink.create({
    data: { token, userId: user.id, expiresAt },
  });

  return token;
}

export async function verifyMagicLink(token: string): Promise<SessionUser> {
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!magicLink) {
    throw new Error("Ugyldig lenke.");
  }

  if (magicLink.usedAt) {
    throw new Error("Denne lenken er allerede brukt.");
  }

  if (magicLink.expiresAt < new Date()) {
    throw new Error("Lenken har utløpt.");
  }

  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() },
  });

  // Create session
  const sessionToken = await createSessionToken(magicLink.user);

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });

  return {
    id: magicLink.user.id,
    email: magicLink.user.email,
    name: magicLink.user.name,
    role: magicLink.user.role as UserRole,
  };
}

// ---------------------------------------------------------------------------
// Session (JWT-backed, stored in DB for revocation)
// ---------------------------------------------------------------------------

async function createSessionToken(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
}): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const dbSession = await prisma.session.create({
    data: {
      token: crypto.randomUUID(),
      userId: user.id,
      expiresAt,
    },
  });

  // Sign a JWT embedding the session ID
  const jwt = await new SignJWT({
    sessionId: dbSession.id,
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .setIssuedAt()
    .sign(getJwtSecret());

  return jwt;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getJwtSecret());

    // Verify session still exists in DB
    const dbSession = await prisma.session.findUnique({
      where: { id: payload.sessionId as string },
      include: { user: true },
    });

    if (!dbSession || dbSession.expiresAt < new Date()) {
      return null;
    }

    return {
      id: dbSession.user.id,
      email: dbSession.user.email,
      name: dbSession.user.name,
      role: dbSession.user.role as UserRole,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE)?.value;
    if (!token) return;

    const { payload } = await jwtVerify(token, getJwtSecret());
    await prisma.session.delete({
      where: { id: payload.sessionId as string },
    }).catch(() => { /* Already deleted */ });

    cookieStore.delete(SESSION_COOKIE);
  } catch {
    // Best effort cleanup
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  }
}

// ---------------------------------------------------------------------------
// Dev Callback URL (server-side storage for magic link in development)
// ---------------------------------------------------------------------------

type DevCallbackState = {
  url: string;
  createdAt: number;
};

const g = globalThis as unknown as {
  __devCallbackState?: DevCallbackState | null;
};

function isAllowedDevCallbackUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
    const isLocalHost =
      parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    return isHttp && isLocalHost;
  } catch {
    return false;
  }
}

export function setDevCallbackUrl(url: string): void {
  if (!isDevelopment) return;
  if (!isAllowedDevCallbackUrl(url)) {
    g.__devCallbackState = null;
    return;
  }
  g.__devCallbackState = { url, createdAt: Date.now() };
}

export function getDevCallbackUrl(): string | null {
  if (!isDevelopment) return null;
  const state = g.__devCallbackState;
  if (!state) return null;
  if (Date.now() - state.createdAt > 10 * 60_000) {
    g.__devCallbackState = null;
    return null;
  }
  return state.url;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function hasAccess(user: SessionUser | null, requiredRole?: UserRole): boolean {
  if (!user) return false;
  if (!requiredRole) return true;
  if (requiredRole === "member") return true; // Both admin and member have member access
  return user.role === "admin";
}
