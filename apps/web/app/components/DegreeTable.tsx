import type { DiatonicChord } from "@repo/theory";

const FUNCTION_LABELS: Record<DiatonicChord["function"], string> = {
  tonic: "Tonic",
  predominant: "Predominant",
  dominant: "Dominant",
  subdominant: "Subdominant",
  variable: "Variable",
};

type DegreeTableProps = {
  chords: DiatonicChord[];
  selectedDegree: number;
  onSelect: (degree: number) => void;
};

export function DegreeTable({
  chords,
  selectedDegree,
  onSelect,
}: DegreeTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Trinn</th>
            <th className="px-4 py-3">Romertall</th>
            <th className="px-4 py-3">Akkord</th>
            <th className="px-4 py-3">Funksjon</th>
          </tr>
        </thead>
        <tbody>
          {chords.map((chord) => {
            const isActive = chord.degree === selectedDegree;
            return (
              <tr
                className={`border-t border-slate-200 transition ${isActive ? "bg-indigo-50" : "hover:bg-slate-50"
                  }`}
                key={`${chord.degree}-${chord.symbol}`}
              >
                <td className="px-4 py-3 font-semibold text-slate-700">
                  <button
                    className="inline-flex w-full items-center justify-start gap-2"
                    onClick={() => onSelect(chord.degree)}
                    type="button"
                  >
                    {chord.degree}
                    <span className="text-xs font-normal text-slate-500">
                      (klikk)
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3 font-mono text-slate-700">
                  {chord.roman}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-900">
                  {chord.symbol}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {FUNCTION_LABELS[chord.function]}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
