import { noteName } from "@repo/theory";

const STRINGS = [
  { name: "e", pc: 4 },
  { name: "B", pc: 11 },
  { name: "G", pc: 7 },
  { name: "D", pc: 2 },
  { name: "A", pc: 9 },
  { name: "E", pc: 4 },
];

const FRETS = Array.from({ length: 13 }, (_, index) => index);

type FretboardProps = {
  chordTones: number[];
  useFlats: boolean;
};

export function Fretboard({ chordTones, useFlats }: FretboardProps) {
  const toneSet = new Set(chordTones.map((tone) => tone % 12));
  const rootTone = chordTones[0] ?? 0;

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-[40px_repeat(13,minmax(32px,1fr))] gap-1 text-xs text-slate-500">
        <div />
        {FRETS.map((fret) => (
          <div className="text-center" key={`fret-${fret}`}>
            {fret}
          </div>
        ))}
        {STRINGS.map((string) => (
          <div
            className="contents"
            key={`string-${string.name}-${string.pc}`}
          >
            <div className="flex items-center justify-center font-semibold text-slate-600">
              {string.name}
            </div>
            {FRETS.map((fret) => {
              const pitchClass = (string.pc + fret) % 12;
              const isChordTone = toneSet.has(pitchClass);
              const isRoot = pitchClass === rootTone;
              return (
                <div
                  className="flex h-8 items-center justify-center rounded-md border border-slate-200"
                  key={`cell-${string.name}-${fret}`}
                >
                  {isChordTone ? (
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ${
                        isRoot ? "bg-indigo-500" : "bg-emerald-500"
                      }`}
                    >
                      {noteName(pitchClass, useFlats)}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
