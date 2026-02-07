
import { useState } from "react";
import type { SubstitutionSuggestion } from "@repo/theory";

type SubstitutionPanelProps = {
  substitutions: SubstitutionSuggestion[];
  onSelect?: (substitution: SubstitutionSuggestion) => void;
};

const CATEGORIES = {
  basic: "Grunnleggende",
  functional: "Funksjonell",
  jazz: "Jazz",
  modal_interchange: "Lånte akkorder",
  chromatic: "Kromatisk",
} as const;

type CategoryKey = keyof typeof CATEGORIES;

export function SubstitutionPanel({ substitutions, onSelect }: SubstitutionPanelProps) {
  const [filters, setFilters] = useState<CategoryKey[]>([
    "basic", "functional", "jazz", "modal_interchange", "chromatic"
  ]);

  const toggleFilter = (key: CategoryKey) => {
    setFilters((prev) =>
      prev.includes(key)
        ? prev.filter((k) => k !== key)
        : [...prev, key]
    );
  };

  const filtered = substitutions.filter((s) => filters.includes(s.category));

  if (substitutions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
        Ingen forslag funnet for denne akkorden/kontekst.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(CATEGORIES) as [CategoryKey, string][]).map(([key, label]) => {
          const isActive = filters.includes(key);
          return (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${isActive
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <p className="col-span-full text-sm text-muted-foreground">Ingen resultater med valgte filtre.</p>
        ) : (
          filtered.map((item, idx) => (
            <button
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 text-sm text-foreground shadow-sm transition-all hover:border-primary/40 hover:bg-muted text-left"
              key={`${item.substituteSymbol}-${idx}`}
              onClick={() => onSelect?.(item)}
            >
              <div className="w-full">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-primary">
                      {item.substituteSymbol}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                      {CATEGORIES[item.category] || item.category}
                    </span>
                  </div>
                  {item.score > 3 && (
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-accent/30 text-accent-foreground">Anbefalt</span>
                  )}
                </div>

                <div className="flex flex-col gap-1 text-muted-foreground mt-2">
                  <p>{item.reason}</p>
                </div>
              </div>

              {item.sharedTones !== undefined && (
                <p className="mt-3 text-xs text-muted-foreground">
                  {item.sharedTones} felles ton{item.sharedTones !== 1 && "er"}
                </p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
