import type { DiatonicChord, SubstitutionSuggestion } from "@repo/theory";

import { Fretboard } from "./Fretboard";
import { SubstitutionPanel } from "./SubstitutionPanel";


type ChordDetailProps = {
  chord: DiatonicChord;
  substitutions: SubstitutionSuggestion[];
  useFlats: boolean;
  harmonyNotes: number[];
  overlayNotes: number[];
  outsideNotes: number[];
  showHarmony: boolean;
  showOverlay: boolean;
};

export function ChordDetail({
  chord,
  substitutions,
  useFlats,
  harmonyNotes,
  overlayNotes,
  outsideNotes,
  showHarmony,
  showOverlay,
}: ChordDetailProps) {


  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground">
              Akkorddetaljer
            </p>
            <h2 className="text-3xl font-semibold text-foreground">
              {chord.symbol}
            </h2>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Toner</p>
              <p className="font-semibold text-foreground">
                {chord.toneNames.join(" – ")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Intervaller</p>
              <p className="font-semibold text-foreground">
                {chord.intervalNames.join(" – ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Gripebrett (0–12 bånd)
            </h3>
            <Fretboard
              chordTones={chord.tones}
              useFlats={useFlats}
              harmonyTones={harmonyNotes}
              overlayTones={overlayNotes}
              outsideTones={outsideNotes}
              showHarmony={showHarmony}
              showOverlay={showOverlay}
            />
          </div>

        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Substitusjoner
          </h3>
          <SubstitutionPanel substitutions={substitutions} />
        </div>
      </div>
    </section>
  );
}
