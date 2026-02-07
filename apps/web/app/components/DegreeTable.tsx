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
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
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
                className={`border-t border-border transition ${isActive ? "bg-primary/20" : "hover:bg-muted"
                  }`}
                key={`${chord.degree}-${chord.symbol}`}
              >
                <td className="px-4 py-3 font-semibold text-foreground">
                  <button
                    className="inline-flex w-full items-center justify-start gap-2"
                    onClick={() => onSelect(chord.degree)}
                    type="button"
                  >
                    {chord.degree}
                    <span className="text-xs font-normal text-muted-foreground">
                      (klikk)
                    </span>
                  </button>
                </td>
                <td className="px-4 py-3 font-mono text-foreground">
                  {chord.roman}
                </td>
                <td className="px-4 py-3 font-semibold text-foreground">
                  {chord.symbol}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
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
