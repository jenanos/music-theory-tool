import type { SubstitutionSuggestion } from "@repo/theory";

type SubstitutionPanelProps = {
  substitutions: SubstitutionSuggestion[];
};

export function SubstitutionPanel({ substitutions }: SubstitutionPanelProps) {
  if (substitutions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
        Ingen forslag ennå for dette trinnet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {substitutions.map((item) => (
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 shadow-sm"
          key={`${item.targetSymbol}-${item.substituteSymbol}`}
        >
          <p className="font-semibold text-slate-900">
            {item.targetSymbol} → kan ofte erstattes med {item.substituteSymbol}
          </p>
          <p className="mt-1 text-slate-600">{item.reason}</p>
        </div>
      ))}
    </div>
  );
}
