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
};

export function ChordDetail({
  chord,
  substitutions,
  useFlats,
  harmonyNotes,
  overlayNotes,
  outsideNotes,
  showHarmony,
}: ChordDetailProps) {


  return (
    <section className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">
              Akkorddetaljer
            </p>
            <h2 className="text-3xl font-semibold text-slate-900">
              {chord.symbol}
            </h2>
          </div>
          <div className="flex flex-wrap gap-6 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase text-slate-400">Toner</p>
              <p className="font-semibold text-slate-800">
                {chord.toneNames.join(" – ")}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-slate-400">Intervaller</p>
              <p className="font-semibold text-slate-800">
                {chord.intervalNames.join(" – ")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Gripebrett (0–12 bånd)
            </h3>
            <Fretboard
              chordTones={chord.tones}
              useFlats={useFlats}
              harmonyTones={harmonyNotes}
              overlayTones={overlayNotes}
              outsideTones={outsideNotes}
              showHarmony={showHarmony}
            />
          </div>

        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Substitusjoner
          </h3>
          <SubstitutionPanel substitutions={substitutions} />
        </div>
      </div>
    </section>
  );
}
