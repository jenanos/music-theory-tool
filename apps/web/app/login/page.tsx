"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { sanitizeCallbackUrl } from "../lib/auth-urls";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlError = searchParams.get("error");
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const result = await signIn("resend", {
        email: normalizedEmail,
        redirectTo: callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Noe gikk galt. Prøv igjen.");
        setIsSubmitting(false);
        return;
      }

      const params = new URLSearchParams({
        email: normalizedEmail,
        callbackUrl,
      });
      router.push(`/login/verify?${params.toString()}`);
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex h-full flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">🎸 Logg inn</h1>
          <p className="text-sm text-muted-foreground">
            Skriv inn e-postadressen din for å motta både magic link og engangskode.
          </p>
        </div>

        {(urlError || error) && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/15 p-4 text-center text-sm text-destructive">
            {urlError ? decodeURIComponent(urlError) : error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              E-post
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="din@epost.no"
              className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "Sender..." : "Send magic link og kode"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex h-full flex-col items-center justify-center bg-background text-foreground p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
