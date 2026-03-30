import Link from "next/link";

function isSafeDevRedirectUrl(url: string): boolean {
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

export default async function VerifyPage() {
  let devCallbackUrl: string | null = null;

  if (process.env.NODE_ENV === "development") {
    const { getDevCallbackUrl } = await import("../../lib/auth");
    const callbackUrl = getDevCallbackUrl();
    if (callbackUrl && isSafeDevRedirectUrl(callbackUrl)) {
      devCallbackUrl = callbackUrl;
    }
  }

  return (
    <main className="flex h-full flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
            ✉️
          </div>
          <h1 className="text-2xl font-bold">Sjekk e-posten din</h1>
        </div>

        {devCallbackUrl ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Utviklingsmodus er aktiv. Bruk knappen under for å fortsette med
              den lokale magiske lenken.
            </p>
            <a
              href={devCallbackUrl}
              className="block w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 text-center"
            >
              Fortsett til innlogging
            </a>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Vi har sendt deg en innloggingslenke. Klikk på lenken i e-posten for
            å logge inn. Lenken er gyldig i 15 minutter.
          </p>
        )}

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Tilbake til innlogging
          </Link>
        </div>
      </div>
    </main>
  );
}
