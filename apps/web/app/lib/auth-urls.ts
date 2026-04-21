export function sanitizeCallbackUrl(callbackUrl?: string | null): string {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/";
  }

  return callbackUrl;
}
