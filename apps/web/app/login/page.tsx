"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setDevLink(null);

    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setMessage(data.message);

      // In development, show the verify link directly
      if (data.verifyUrl) {
        setDevLink(data.verifyUrl);
      }
    } catch {
      setMessage("Noe gikk galt. Prøv igjen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex h-full flex-col items-center justify-center bg-background text-foreground p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">🎸 Logg inn</h1>
          <p className="text-sm text-muted-foreground">
            Skriv inn e-postadressen din for å motta en innloggingslenke.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/15 p-4 text-center text-sm text-destructive">
            {decodeURIComponent(error)}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-center text-sm text-foreground">
            {message}
          </div>
        )}

        {devLink && (
          <div className="rounded-lg border border-accent/40 bg-accent/15 p-4 text-center text-sm">
            <p className="text-muted-foreground mb-2">Utviklingslenke:</p>
            <a
              href={devLink}
              className="text-primary hover:underline break-all text-xs"
            >
              Klikk her for å logge inn
            </a>
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
            {isSubmitting ? "Sender..." : "Send innloggingslenke"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="flex h-full flex-col items-center justify-center bg-background text-foreground p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
