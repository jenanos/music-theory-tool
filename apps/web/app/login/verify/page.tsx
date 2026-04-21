import Link from "next/link";
import { sanitizeCallbackUrl } from "../../lib/auth-urls";
import {
  EMAIL_OTP_LENGTH,
  EMAIL_SIGN_IN_EXPIRES_MINUTES,
} from "../../lib/email-auth";

type SearchParams = Record<string, string | string[] | undefined>;

function getSingleValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function VerifyPage(props: {
  searchParams?: Promise<SearchParams>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const email = getSingleValue(searchParams.email) ?? "";
  const callbackUrl = sanitizeCallbackUrl(getSingleValue(searchParams.callbackUrl));
  const error = getSingleValue(searchParams.error);

  return (
    <main className="flex h-full flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-2xl">
            ✉️
          </div>
          <h1 className="text-2xl font-bold">Sjekk e-posten din</h1>
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/40 bg-destructive/15 p-4 text-center text-sm text-destructive">
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <p className="text-sm text-muted-foreground text-center">
          Vi har sendt deg en innloggingslenke og en engangskode. Klikk på lenken
          i e-posten, eller skriv inn koden under. Begge virker i{" "}
          {EMAIL_SIGN_IN_EXPIRES_MINUTES} minutter.
        </p>

        {email ? (
          <form action="/api/auth/otp" method="post" className="space-y-4">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="callbackUrl" value={callbackUrl} />

            <div className="space-y-2">
              <label htmlFor="otp" className="block text-sm font-medium">
                Engangskode
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern={`\\d{${EMAIL_OTP_LENGTH}}`}
                minLength={EMAIL_OTP_LENGTH}
                maxLength={EMAIL_OTP_LENGTH}
                required
                placeholder={"0".repeat(EMAIL_OTP_LENGTH)}
                className="w-full rounded-md border border-border bg-card px-3 py-2 text-center text-lg tracking-[0.35em] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Logg inn med kode
            </button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Gå tilbake og be om en ny e-post hvis du mangler engangskoden.
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
