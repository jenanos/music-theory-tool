import { createHash, randomInt } from "node:crypto";
import { sanitizeCallbackUrl } from "./auth-urls";

export const EMAIL_SIGN_IN_MAX_AGE_SECONDS = 15 * 60;
export const EMAIL_SIGN_IN_EXPIRES_MINUTES = EMAIL_SIGN_IN_MAX_AGE_SECONDS / 60;
export const EMAIL_OTP_LENGTH = 8;

export function generateEmailOtpToken(): string {
  return randomInt(0, 10 ** EMAIL_OTP_LENGTH)
    .toString()
    .padStart(EMAIL_OTP_LENGTH, "0");
}

export function normalizeOtpToken(token: string): string {
  return token.replace(/\s+/g, "").trim();
}

export function hashVerificationToken(token: string, secret: string): string {
  return createHash("sha256").update(`${token}${secret}`).digest("hex");
}

export function buildEmailCallbackUrl(params: {
  baseUrl: string;
  token: string;
  email: string;
  callbackUrl: string;
}): string {
  const url = new URL("/api/auth/callback/resend", params.baseUrl);
  url.searchParams.set("token", params.token);
  url.searchParams.set("email", params.email);
  url.searchParams.set("callbackUrl", sanitizeCallbackUrl(params.callbackUrl));
  return url.toString();
}

function formatOtpForDisplay(token: string): string {
  return token.replace(/(.{4})/g, "$1 ").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildEmailSignInHtml(params: {
  url: string;
  token: string;
  host: string;
}): string {
  const safeUrl = escapeHtml(params.url);
  const safeHost = escapeHtml(params.host);

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px; margin: 0 auto; padding: 24px;">
      <h1 style="margin: 0 0 16px; font-size: 24px;">Logg inn i ${safeHost}</h1>
      <p style="margin: 0 0 16px;">Klikk på knappen under for å logge inn med magic link.</p>
      <p style="margin: 0 0 24px;">
        <a
          href="${safeUrl}"
          style="display: inline-block; padding: 12px 20px; border-radius: 8px; background: #111827; color: #ffffff; text-decoration: none; font-weight: 600;"
        >
          Logg inn
        </a>
      </p>
      <p style="margin: 0 0 8px;">Eller skriv inn denne engangskoden i appen:</p>
      <p style="margin: 0 0 24px; font-size: 28px; font-weight: 700; letter-spacing: 0.16em;">${escapeHtml(formatOtpForDisplay(params.token))}</p>
      <p style="margin: 0; color: #6b7280;">Lenken og koden virker i ${EMAIL_SIGN_IN_EXPIRES_MINUTES} minutter.</p>
    </div>
  `;
}

export function buildEmailSignInText(params: {
  url: string;
  token: string;
  host: string;
}): string {
  return [
    `Logg inn i ${params.host}`,
    "",
    `Magic link: ${params.url}`,
    "",
    `Engangskode: ${params.token}`,
    "",
    `Lenken og koden virker i ${EMAIL_SIGN_IN_EXPIRES_MINUTES} minutter.`,
  ].join("\n");
}
