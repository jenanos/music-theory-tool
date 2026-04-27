"use client";

import { useEffect, useRef, useState } from "react";

interface AlphaTabPreviewProps {
  alphaTex: string;
}

export function AlphaTabPreview({ alphaTex }: AlphaTabPreviewProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let api: { tex: (value: string) => void; destroy: () => void } | null =
      null;

    async function renderAlphaTex() {
      if (!hostRef.current) return;

      try {
        setError(null);
        const alphaTab = await import("@coderline/alphatab");
        if (disposed || !hostRef.current) return;

        hostRef.current.innerHTML = "";
        api = new alphaTab.AlphaTabApi(hostRef.current, {
          core: {
            enableLazyLoading: false,
            engine: "svg",
            fontDirectory: "/alphatab/font/",
            useWorkers: false,
          },
          display: {
            layoutMode: "Parchment",
            scale: 0.95,
            staveProfile: "Tab",
            stretchForce: 0.65,
            systemsLayoutMode: "Automatic",
          },
        });
        api.tex(alphaTex);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Kunne ikke rendere tab.",
        );
      }
    }

    renderAlphaTex();

    return () => {
      disposed = true;
      api?.destroy();
    };
  }, [alphaTex]);

  return (
    <div className="space-y-3">
      <div
        ref={hostRef}
        className="min-h-40 w-full overflow-x-hidden rounded-md border border-border bg-white p-3 text-black [&_svg]:max-w-full"
      />
      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <details className="rounded-md border border-border bg-card/50 p-3">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
          Vis AlphaTex
        </summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">
          {alphaTex}
        </pre>
      </details>
    </div>
  );
}
