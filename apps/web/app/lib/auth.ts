import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/db";
import Resend from "next-auth/providers/resend";

const isDevelopment = process.env.NODE_ENV === "development";

export type UserRole = "admin" | "member";

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
// Prisma adapter with verification token fallback
// ---------------------------------------------------------------------------

const prismaAdapter = PrismaAdapter(prisma);
const baseUseVerificationToken =
  prismaAdapter.useVerificationToken?.bind(prismaAdapter);

const adapter: typeof prismaAdapter = {
  ...prismaAdapter,
  async useVerificationToken(params) {
    if (params.identifier) {
      if (!baseUseVerificationToken) {
        throw new Error("Prisma adapter mangler useVerificationToken");
      }
      return baseUseVerificationToken(params);
    }

    // @auth/core may omit identifier from the callback URL query params.
    // The Prisma adapter requires both fields for the compound unique lookup,
    // so we fall back to finding by token alone when identifier is missing.
    const existing = await prisma.verificationToken.findFirst({
      where: { token: params.token },
    });
    if (!existing) return null;

    return prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: existing.identifier,
          token: existing.token,
        },
      },
    });
  },
};

// ---------------------------------------------------------------------------
// NextAuth config
// ---------------------------------------------------------------------------

const config = {
  adapter,
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
  const { redirect } = await import("next/navigation");
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}
