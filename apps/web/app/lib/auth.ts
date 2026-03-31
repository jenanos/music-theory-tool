import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/db";
import Resend from "next-auth/providers/resend";

const isDevelopment = process.env.NODE_ENV === "development";
const devAuthSecret = "music-theory-tool-dev-auth-secret";
const devAuthUrl = "http://localhost:3001";
const authSecret =
  process.env.AUTH_SECRET ?? (isDevelopment ? devAuthSecret : undefined);
const authUrl =
  process.env.AUTH_URL ?? (isDevelopment ? devAuthUrl : undefined);

export type UserRole = "admin" | "member";

// ---------------------------------------------------------------------------
// Dev Callback URL (server-side storage for magic link in development)
// ---------------------------------------------------------------------------

type DevCallbackState = {
  url: string;
  createdAt: number;
};

type RecentVerificationToken = {
  identifier: string;
  token: string;
  expires: Date;
  usedAt: number;
};

const g = globalThis as unknown as {
  __devCallbackState?: DevCallbackState | null;
  __recentVerificationTokens?: Map<string, RecentVerificationToken>;
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

export function consumeDevCallbackUrl(): string | null {
  if (!isDevelopment) return null;
  const state = g.__devCallbackState;
  if (!state) return null;
  g.__devCallbackState = null;
  if (Date.now() - state.createdAt > 10 * 60_000) {
    return null;
  }
  return state.url;
}

function isRecordNotFoundError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2025"
  );
}

function getRecentVerificationTokens(): Map<string, RecentVerificationToken> {
  if (!g.__recentVerificationTokens) {
    g.__recentVerificationTokens = new Map();
  }
  return g.__recentVerificationTokens;
}

function rememberVerificationToken(token: RecentVerificationToken): void {
  if (!isDevelopment) return;
  const recentTokens = getRecentVerificationTokens();
  recentTokens.set(token.token, token);

  const cutoff = Date.now() - 60_000;
  for (const [key, value] of recentTokens.entries()) {
    if (value.usedAt < cutoff) {
      recentTokens.delete(key);
    }
  }
}

function getRememberedVerificationToken(params: {
  identifier?: string;
  token: string;
}): RecentVerificationToken | null {
  if (!isDevelopment) return null;
  const remembered = getRecentVerificationTokens().get(params.token);
  if (!remembered) return null;
  if (Date.now() - remembered.usedAt > 60_000) {
    getRecentVerificationTokens().delete(params.token);
    return null;
  }
  if (params.identifier && params.identifier !== remembered.identifier) {
    return null;
  }
  return remembered;
}

// ---------------------------------------------------------------------------
// Prisma adapter with verification token fallback
// ---------------------------------------------------------------------------

const prismaAdapter = PrismaAdapter(prisma);

const adapter: typeof prismaAdapter = {
  ...prismaAdapter,
  async useVerificationToken(params) {
    const existing = await prisma.verificationToken.findFirst({
      where: {
        token: params.token,
        ...(params.identifier ? { identifier: params.identifier } : {}),
      },
    });
    if (!existing) {
      return getRememberedVerificationToken(params);
    }

    try {
      const deleted = await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: existing.identifier,
            token: existing.token,
          },
        },
      });
      rememberVerificationToken({
        identifier: deleted.identifier,
        token: deleted.token,
        expires: deleted.expires,
        usedAt: Date.now(),
      });
      return deleted;
    } catch (error) {
      if (isRecordNotFoundError(error)) {
        const remembered = {
          identifier: existing.identifier,
          token: existing.token,
          expires: existing.expires,
          usedAt: Date.now(),
        };
        rememberVerificationToken(remembered);
        return remembered;
      }
      throw error;
    }
  },
};

// ---------------------------------------------------------------------------
// NextAuth config
// ---------------------------------------------------------------------------

const config = {
  adapter,
  secret: authSecret,
  trustHost: Boolean(authUrl) || isDevelopment,
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from:
        process.env.EMAIL_FROM ??
        "Music Theory Tool <noreply@resend.dev>",
      ...(isDevelopment && {
        sendVerificationRequest({ url }: { url: string }) {
          setDevCallbackUrl(url);
          console.log("\n════════════════════════════════════════");
          console.log("  🔗 Magic link klar på /login/verify");
          console.log("════════════════════════════════════════\n");
        },
      }),
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    session({ session, user }) {
      session.user.id = user.id;
      // Attach role from the database user
      const dbUser = user as unknown as { role?: string };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth types don't include custom fields
      (session.user as any).role = dbUser.role ?? "member";
      return session;
    },
  },
} satisfies NextAuthConfig;

const nextAuth = NextAuth(config);

export const handlers: typeof nextAuth.handlers = nextAuth.handlers;
export const auth: typeof nextAuth.auth = nextAuth.auth;
export const signIn: typeof nextAuth.signIn = nextAuth.signIn;
export const signOut: typeof nextAuth.signOut = nextAuth.signOut;

// ---------------------------------------------------------------------------
// Session types & helpers
// ---------------------------------------------------------------------------

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
}

export function hasAccess(
  user: SessionUser | null,
  requiredRole?: UserRole,
): boolean {
  if (!user) return false;
  if (!requiredRole) return true;
  if (requiredRole === "member") return true;
  return user.role === "admin";
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    throw new Error("unreachable"); // redirect() throws, but TS needs this
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  const role = (session.user as SessionUser).role;
  if (role !== "admin") {
    const { redirect } = await import("next/navigation");
    redirect("/charts");
  }
  return session;
}
