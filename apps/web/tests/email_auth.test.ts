import { describe, expect, it } from "vitest";
import { resolveRequestBaseUrl, sanitizeCallbackUrl } from "../app/lib/auth-urls";
import {
  buildEmailCallbackUrl,
  EMAIL_OTP_LENGTH,
  generateEmailOtpToken,
  normalizeOtpToken,
} from "../app/lib/email-auth";

function makeRequest(url: string, headers: Record<string, string> = {}): Request {
  return new Request(url, { headers });
}

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

  it("swaps unroutable 0.0.0.0 host for localhost when resolving base URL", () => {
    const baseUrl = resolveRequestBaseUrl(
      makeRequest("http://0.0.0.0:3001/api/auth/otp", { host: "0.0.0.0:3001" }),
    );

    expect(baseUrl).toBe("http://localhost:3001");
  });

  it("prefers x-forwarded headers when resolving base URL", () => {
    const baseUrl = resolveRequestBaseUrl(
      makeRequest("http://internal:3001/api/auth/otp", {
        host: "internal:3001",
        "x-forwarded-host": "app.example.com",
        "x-forwarded-proto": "https",
      }),
    );

    expect(baseUrl).toBe("https://app.example.com");
  });

  it("uses the Host header when no forwarded headers are present", () => {
    const baseUrl = resolveRequestBaseUrl(
      makeRequest("http://localhost:3001/api/auth/otp", {
        host: "localhost:3001",
      }),
    );

    expect(baseUrl).toBe("http://localhost:3001");
  });

  it("preserves IPv6 Host literals with a port", () => {
    const baseUrl = resolveRequestBaseUrl(
      makeRequest("http://[::1]:3001/api/auth/otp", { host: "[::1]:3001" }),
    );

    expect(baseUrl).toBe("http://[::1]:3001");
  });

  it("swaps the IPv6 unspecified address for localhost", () => {
    const baseUrl = resolveRequestBaseUrl(
      makeRequest("http://[::]:3001/api/auth/otp", { host: "[::]:3001" }),
    );

    expect(baseUrl).toBe("http://localhost:3001");
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
