export function sanitizeCallbackUrl(callbackUrl?: string | null): string {
  if (!callbackUrl || !callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/";
  }

  return callbackUrl;
}

// Returns a browser-reachable origin (scheme + host) for building redirect
// URLs from inside a route handler. Using `request.url` directly is unsafe
// because Next's dev server can surface the bind address (e.g. `0.0.0.0`) as
// the host, which is not routable from a browser.
export function resolveRequestBaseUrl(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const hostHeader = forwardedHost ?? request.headers.get("host");

  let proto = forwardedProto;
  if (!proto) {
    try {
      proto = new URL(request.url).protocol.replace(/:$/, "");
    } catch {
      proto = process.env.NODE_ENV === "development" ? "http" : "https";
    }
  }

  if (hostHeader) {
    const { hostname, port } = splitHostHeader(hostHeader);
    const safeHostname =
      hostname === "0.0.0.0" || hostname === "[::]" || hostname === "::"
        ? "localhost"
        : hostname;
    const host = port ? `${safeHostname}:${port}` : safeHostname;
    return `${proto}://${host}`;
  }

  const configured =
    process.env.AUTH_URL ??
    (process.env.NODE_ENV === "development" ? "http://localhost:3001" : undefined);
  if (configured) return configured;

  return new URL(request.url).origin;
}

// IPv6 literals in a Host header are wrapped in brackets (e.g. `[::1]:3001`),
// so a naive split on `:` corrupts them. Parse the bracketed form explicitly.
function splitHostHeader(host: string): { hostname: string; port: string | null } {
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    if (end === -1) return { hostname: host, port: null };
    const hostname = host.slice(0, end + 1);
    const rest = host.slice(end + 1);
    const port = rest.startsWith(":") ? rest.slice(1) || null : null;
    return { hostname, port };
  }
  const colon = host.indexOf(":");
  if (colon === -1) return { hostname: host, port: null };
  return {
    hostname: host.slice(0, colon),
    port: host.slice(colon + 1) || null,
  };
}
