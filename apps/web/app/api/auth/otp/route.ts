import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@repo/db";
import { sanitizeCallbackUrl } from "../../../lib/auth-urls";
import {
  buildEmailCallbackUrl,
  EMAIL_OTP_LENGTH,
  hashVerificationToken,
  normalizeOtpToken,
} from "../../../lib/email-auth";

function buildVerifyRedirectUrl(params: {
  request: NextRequest;
  email: string;
  callbackUrl: string;
  error: string;
}): string {
  const url = new URL("/login/verify", params.request.url);
  if (params.email) {
    url.searchParams.set("email", params.email);
  }
  url.searchParams.set("callbackUrl", sanitizeCallbackUrl(params.callbackUrl));
  url.searchParams.set("error", params.error);
  return url.toString();
}

function redirectTo(url: string) {
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const callbackUrl = sanitizeCallbackUrl(String(formData.get("callbackUrl") ?? "/"));
  const otp = normalizeOtpToken(String(formData.get("otp") ?? ""));

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return redirectTo(
      buildVerifyRedirectUrl({
        request,
        email,
        callbackUrl,
        error: "Ugyldig e-postadresse.",
      }),
    );
  }

  if (!new RegExp(`^\\d{${EMAIL_OTP_LENGTH}}$`).test(otp)) {
    return redirectTo(
      buildVerifyRedirectUrl({
        request,
        email,
        callbackUrl,
        error: `Koden må være ${EMAIL_OTP_LENGTH} sifre.`,
      }),
    );
  }

  const authSecret =
    process.env.AUTH_SECRET ??
    (process.env.NODE_ENV === "development"
      ? "music-theory-tool-dev-auth-secret"
      : undefined);

  if (!authSecret) {
    return redirectTo(
      buildVerifyRedirectUrl({
        request,
        email,
        callbackUrl,
        error: "Innlogging er ikke konfigurert riktig.",
      }),
    );
  }

  const verificationToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      token: hashVerificationToken(otp, authSecret),
    },
  });

  if (!verificationToken || verificationToken.expires.valueOf() < Date.now()) {
    return redirectTo(
      buildVerifyRedirectUrl({
        request,
        email,
        callbackUrl,
        error: "Ugyldig eller utløpt engangskode.",
      }),
    );
  }

  return redirectTo(
    buildEmailCallbackUrl({
      baseUrl: request.url,
      token: otp,
      email,
      callbackUrl,
    }),
  );
}
