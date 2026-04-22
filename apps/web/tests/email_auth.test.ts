import { describe, expect, it } from "vitest";
import { sanitizeCallbackUrl } from "../app/lib/auth-urls";
import {
  buildEmailCallbackUrl,
  EMAIL_OTP_LENGTH,
  generateEmailOtpToken,
  normalizeOtpToken,
} from "../app/lib/email-auth";

describe("email auth helpers", () => {
  it("generates numeric OTP tokens with expected length", () => {
    const token = generateEmailOtpToken();

    expect(token).toHaveLength(EMAIL_OTP_LENGTH);
    expect(token).toMatch(/^\d+$/);
  });

  it("normalizes OTP input", () => {
    expect(normalizeOtpToken("12 34 56 78")).toBe("12345678");
  });

  it("sanitizes unsafe callback URLs", () => {
    expect(sanitizeCallbackUrl("/charts?mode=ionian")).toBe("/charts?mode=ionian");
    expect(sanitizeCallbackUrl("https://evil.example")).toBe("/");
    expect(sanitizeCallbackUrl("//evil.example")).toBe("/");
  });

  it("builds resend callback URLs with sanitized callback targets", () => {
    const url = buildEmailCallbackUrl({
      baseUrl: "http://localhost:3001/login/verify",
      token: "12345678",
      email: "test@example.com",
      callbackUrl: "https://evil.example",
    });

    expect(url).toBe(
      "http://localhost:3001/api/auth/callback/resend?token=12345678&email=test%40example.com&callbackUrl=%2F",
    );
  });
});
