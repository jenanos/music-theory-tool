import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/db";
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
// NextAuth config
// ---------------------------------------------------------------------------

const config = {
  adapter: PrismaAdapter(prisma),
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

export type PageId = "chords" | "progressions" | "charts" | "practice";

const DEFAULT_ENABLED_PAGES: PageId[] = ["charts", "progressions"];

export async function requirePageAccess(pageId: PageId) {
  const session = await requireAuth();
  const user = session.user as SessionUser;

  // Admins always have access to all pages
  if (user.role === "admin") return session;

  const preference = await prisma.userPreference.findUnique({
    where: { userId: user.id },
  });

  const enabledPages = (preference?.enabledPages ?? DEFAULT_ENABLED_PAGES) as PageId[];

  if (!enabledPages.includes(pageId)) {
    const { redirect } = await import("next/navigation");
    redirect("/charts");
  }

  return session;
}
