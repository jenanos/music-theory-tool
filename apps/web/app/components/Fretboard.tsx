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
  harmonyTones?: number[];
  overlayTones?: number[];
  outsideTones?: number[];
  showHarmony?: boolean;
  showOverlay?: boolean;
};

export function Fretboard({
  chordTones,
  useFlats,
  harmonyTones = [],
  overlayTones = [],
  outsideTones = [],
  showHarmony = true,
  showOverlay = true,
}: FretboardProps) {
  const chordSet = new Set(chordTones.map((tone) => tone % 12));
  const harmonySet = new Set(harmonyTones.map((tone) => tone % 12));
  const overlaySet = new Set(overlayTones.map((tone) => tone % 12));
  const outsideSet = new Set(outsideTones.map((tone) => tone % 12));
  const rootTone = chordTones[0] !== undefined ? chordTones[0] % 12 : undefined;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="grid grid-cols-[40px_repeat(13,minmax(32px,1fr))] gap-1 text-xs text-muted-foreground">
        <div />
        {FRETS.map((fret) => (
          <div className="text-center select-none" key={`fret-${fret}`}>
            {fret}
          </div>
        ))}
        {STRINGS.map((string) => (
          <div
            className="contents"
            key={`string-${string.name}-${string.pc}`}
          >
            <div className="flex items-center justify-center font-semibold text-foreground select-none">
              {string.name}
            </div>
            {FRETS.map((fret) => {
              const pitchClass = (string.pc + fret) % 12;

              const isChordTone = chordSet.has(pitchClass);
              const isRoot = pitchClass === rootTone;
              const isOutside = outsideSet.has(pitchClass);
              const isOverlay = showOverlay && overlaySet.has(pitchClass);
              const isHarmony = harmonySet.has(pitchClass);

              let content = null;

              if (isChordTone) {
                // Layer 1: Chord Tones (Strongest)
                content = (
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground shadow-sm transition-transform hover:scale-110 ${isRoot ? "bg-primary ring-2 ring-primary/40" : "bg-accent"
                      }`}
                  >
                    {noteName(pitchClass, useFlats)}
                  </span>
                );
              } else if (isOutside) {
                // Layer 2: Outside (Overlay but NOT in harmony scale) - "Blue note" etc
                content = (
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2 border-destructive/60 bg-destructive/20 text-[10px] font-bold text-white">
                    {noteName(pitchClass, useFlats)}
                  </span>
                );
              } else if (isOverlay) {
                // Layer 3: Overlay Scale (e.g. Blues scale notes that are also in harmony or generic overlay)
                // If it's overlay BUT NOT outside, it's inside the harmony too (usually), or just valid overlay.
                // We show these significantly.
                content = (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary ring-1 ring-white/40 text-[10px] font-bold text-white">
                    {noteName(pitchClass, useFlats)}
                  </span>
                );
              } else if (showHarmony && isHarmony) {
                // Layer 4: Harmony Scale (Background context)
                content = (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                );
              }

              return (
                <div
                  className="relative flex h-8 items-center justify-center rounded-md border border-border bg-muted/40"
                  key={`cell-${string.name}-${fret}`}
                >
                  {content}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
