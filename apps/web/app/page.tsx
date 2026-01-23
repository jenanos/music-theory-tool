"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildDiatonicChords,
  DEFAULT_MODE,
  DEFAULT_TONIC,
  prefersFlats,
  SCALES,
  suggestSubstitutions,
  TONIC_OPTIONS,
  type ModeId,
} from "@repo/theory";
import { ChordDetail } from "./components/ChordDetail";
import { DegreeTable } from "./components/DegreeTable";

export default function Page() {
  const [tonic, setTonic] = useState(DEFAULT_TONIC);
  const [mode, setMode] = useState<ModeId>(DEFAULT_MODE);
  const [includeSevenths, setIncludeSevenths] = useState(false);

  const chords = useMemo(
    () => buildDiatonicChords(tonic, mode, includeSevenths),
    [tonic, mode, includeSevenths],
  );

  const [selectedDegree, setSelectedDegree] = useState(1);

  useEffect(() => {
    setSelectedDegree(1);
  }, [tonic, mode, includeSevenths]);

  const selectedChord =
    chords.find((chord) => chord.degree === selectedDegree) ?? chords[0];

  if (!selectedChord) {
    return null;
  }

  const substitutions = suggestSubstitutions(chords, selectedChord);
  const useFlats = prefersFlats(tonic);
  const scaleInfo = SCALES.find((scale) => scale.id === mode);

  return (
    <main className="min-h-screen bg-slate-50 pb-16 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 pb-10 pt-12">
        <header className="mb-10 space-y-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
            Gitarist-støtteapp
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            Diatoniske akkorder, grep og substitusjoner
          </h1>
          <p className="max-w-3xl text-base text-slate-600">
            Velg tonic og modus for å se trinnene i tonearten, klikk deg inn på
            en akkord og få detaljer, grep og forslag til erstatninger.
          </p>
        </header>

        <section className="mb-8 grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[2fr,1fr,1fr]">
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Tonic
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(event) => setTonic(event.target.value)}
              value={tonic}
            >
              {TONIC_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Modus / skala
            </label>
            <select
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              onChange={(event) => setMode(event.target.value as ModeId)}
              value={mode}
            >
              {SCALES.map((scale) => (
                <option key={scale.id} value={scale.id}>
                  {scale.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-slate-500">
              Akkordtype
            </label>
            <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <input
                checked={includeSevenths}
                id="sevenths"
                onChange={(event) => setIncludeSevenths(event.target.checked)}
                type="checkbox"
              />
              <label htmlFor="sevenths">Vis 7-akkorder</label>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {scaleInfo?.name} • {tonic} tonic
            </p>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr,1fr]">
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Trinn-oversikt
            </h2>
            <DegreeTable
              chords={chords}
              onSelect={setSelectedDegree}
              selectedDegree={selectedDegree}
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Tips
            </h2>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
              <ul className="list-disc space-y-2 pl-4">
                <li>
                  Prøv eksemplene: velg <strong>E + aeolisk</strong> eller
                  <strong> A + dorisk</strong> og klikk på et trinn.
                </li>
                <li>
                  Substitusjoner prioriterer samme funksjon og delte toner.
                </li>
                <li>
                  Fretboardet markerer akkordtonene i grønt og grunntonen i
                  lilla.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <ChordDetail
            chord={selectedChord}
            substitutions={substitutions}
            useFlats={useFlats}
          />
        </section>
      </div>
    </main>
  );
}
