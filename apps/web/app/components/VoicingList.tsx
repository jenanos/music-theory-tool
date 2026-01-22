import type { Voicing } from "@repo/voicings";

const STRING_LABELS = ["E", "A", "D", "G", "B", "e"];

type VoicingListProps = {
  voicings: Voicing[];
};

export function VoicingList({ voicings }: VoicingListProps) {
  if (voicings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
        Ingen forhåndslagde grep ennå for denne akkorden.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {voicings.map((voicing) => (
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          key={`${voicing.name}-${voicing.frets.join("-")}`}
        >
          <p className="font-semibold text-slate-800">{voicing.name}</p>
          <div className="mt-3 grid grid-cols-6 gap-2 text-center text-xs text-slate-600">
            {STRING_LABELS.map((label) => (
              <div className="font-semibold text-slate-500" key={label}>
                {label}
              </div>
            ))}
            {voicing.frets.map((fret, index) => (
              <div
                className="rounded-md border border-slate-200 bg-slate-50 py-1 font-mono text-slate-700"
                key={`${voicing.name}-${index}`}
              >
                {fret}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
