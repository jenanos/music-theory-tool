import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma, prisma } from "@repo/db";
import ResendProvider from "next-auth/providers/resend";
import {
  buildEmailSignInHtml,
  buildEmailSignInText,
  EMAIL_SIGN_IN_MAX_AGE_SECONDS,
  generateEmailOtpToken,
} from "./email-auth";

const isDevelopment = process.env.NODE_ENV === "development";
const devAuthSecret = "music-theory-tool-dev-auth-secret";
const devAuthUrl = "http://localhost:3001";
const authSecret =
  process.env.AUTH_SECRET ?? (isDevelopment ? devAuthSecret : undefined);
const authUrl =
  process.env.AUTH_URL ?? (isDevelopment ? devAuthUrl : undefined);

export type UserRole = "admin" | "member";

// ---------------------------------------------------------------------------
// Prisma adapter with defensive wrappers
// ---------------------------------------------------------------------------

const prismaAdapter = PrismaAdapter(prisma);
const baseUseVerificationToken = prismaAdapter.useVerificationToken?.bind(prismaAdapter);
const baseDeleteSession = prismaAdapter.deleteSession?.bind(prismaAdapter);

function isPrismaErrorWithCode(error: unknown, code: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
  );
}

const adapter: typeof prismaAdapter = {
  ...prismaAdapter,
  async deleteSession(sessionToken) {
    if (!baseDeleteSession) return null;

    try {
      const deletedSession = await baseDeleteSession(sessionToken);
      return deletedSession ?? null;
    } catch (error) {
      // Auth.js may try to clear a stale session cookie during sign-in.
      // Missing session rows should be treated as already signed out.
      if (isPrismaErrorWithCode(error, "P2025")) {
        return null;
      }
      throw error;
    }
  },
  async useVerificationToken(params) {
    // Require identifier (email) for the compound lookup. A token-only
    // fallback would let a caller redeem an OTP without knowing whose
    // code it is.
    if (!params.identifier) return null;
    if (!baseUseVerificationToken) {
      throw new Error("Prisma adapter mangler useVerificationToken");
    }
    return baseUseVerificationToken(params);
  },
};

// ---------------------------------------------------------------------------
// Invite-only access control
// ---------------------------------------------------------------------------

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isAdminEmail(email: string): boolean {
  const adminEmail = process.env.ADMIN_EMAIL;
  return Boolean(
    adminEmail && normalizeEmail(email) === normalizeEmail(adminEmail),
  );
}

// Allow sign-in for the configured admin email (auto-promoted to admin
// below) or any user that has already been invited into the DB.
async function authorizeSignIn(email: string): Promise<boolean> {
  const normalized = normalizeEmail(email);

  if (isAdminEmail(normalized)) {
    // Idempotently guarantee the admin email always has role="admin",
    // even if db:bootstrap-admin hasn't run yet (e.g. local dev flows)
    // or if the admin email was changed after first login.
    await prisma.user.upsert({
      where: { email: normalized },
      update: { role: "admin" },
      create: { email: normalized, role: "admin" },
    });
    return true;
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: normalized },
  });
  return existingUser !== null;
}

// ---------------------------------------------------------------------------
// NextAuth config
// ---------------------------------------------------------------------------

const config = {
  adapter,
  secret: authSecret,
  trustHost: Boolean(authUrl) || isDevelopment,
  providers: [
    ResendProvider({
      apiKey: process.env.RESEND_API_KEY,
      from:
        process.env.EMAIL_FROM ??
        "Music Theory Tool <noreply@resend.dev>",
      maxAge: EMAIL_SIGN_IN_MAX_AGE_SECONDS,
      generateVerificationToken: generateEmailOtpToken,
      async sendVerificationRequest({ identifier, url, token, provider }) {
        if (!provider.apiKey) {
          throw new Error("RESEND_API_KEY mangler for e-postinnlogging.");
        }

        const host = new URL(url).host;
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${provider.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: provider.from,
            to: identifier,
            subject: `Logg inn i ${host}`,
            html: buildEmailSignInHtml({ host, token, url }),
            text: buildEmailSignInText({ host, token, url }),
          }),
        });

        if (!response.ok) {
          throw new Error(`Resend error: ${await response.text()}`);
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      return authorizeSignIn(user.email);
    },
    session({ session, user }) {
      session.user.id = user.id;
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
    redirect("/settings");
  }
  return session;
}

// ---------------------------------------------------------------------------
// Page access (group-based)
// ---------------------------------------------------------------------------

export type PageId = "chords" | "progressions" | "charts" | "practice";

export async function getEffectiveEnabledPages(userId: string, role: UserRole): Promise<PageId[]> {
  if (role === "admin") {
    return ["chords", "progressions", "charts", "practice"];
  }

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: { group: { select: { enabledPages: true } } },
  });

  const union = new Set<string>();
  for (const membership of memberships) {
    for (const page of membership.group.enabledPages) {
      union.add(page);
    }
  }

  return Array.from(union).filter((p): p is PageId =>
    p === "chords" || p === "progressions" || p === "charts" || p === "practice",
  );
}

export async function requirePageAccess(pageId: PageId) {
  const session = await requireAuth();
  const user = session.user as SessionUser;

  if (user.role === "admin") return session;

  const enabledPages = await getEffectiveEnabledPages(user.id, user.role);

  if (!enabledPages.includes(pageId)) {
    const { redirect } = await import("next/navigation");
    redirect("/settings");
  }

  return session;
}
