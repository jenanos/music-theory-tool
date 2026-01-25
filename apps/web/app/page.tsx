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

  const substitutions = selectedChord
    ? suggestSubstitutions({
      tonic,
      mode,
      chord: selectedChord,
      allChords: chords,
    })
    : [];
  const useFlats = prefersFlats(tonic);
  const scaleInfo = SCALES.find((scale) => scale.id === mode);

  if (!selectedChord) return null;

  return (
    <main className="flex h-full flex-col bg-slate-50 text-slate-900">
      {/* Top Toolbar */}
      <header className="flex shrink-0 flex-col gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold leading-tight text-slate-800">
            Diatoniske akkorder
          </h1>
          <p className="text-xs text-slate-500">
            {scaleInfo?.name} • {tonic} tonic
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium focus:border-indigo-500 focus:outline-none"
              onChange={(event) => setTonic(event.target.value)}
              value={tonic}
            >
              {TONIC_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium focus:border-indigo-500 focus:outline-none"
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

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm hover:bg-slate-100">
            <input
              checked={includeSevenths}
              className="accent-indigo-600"
              onChange={(event) => setIncludeSevenths(event.target.checked)}
              type="checkbox"
            />
            <span>7-akkorder</span>
          </label>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Table & Tips */}
        <div className="flex w-full max-w-md flex-col overflow-y-auto border-r border-slate-200 bg-white/50 p-6 lg:w-1/3">
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                Oversikt
              </h2>
              <DegreeTable
                chords={chords}
                onSelect={setSelectedDegree}
                selectedDegree={selectedDegree}
              />
            </section>

            <section className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-800">
              <h3 className="mb-2 font-semibold">Tips</h3>
              <ul className="list-disc space-y-1 pl-4 text-blue-700/80">
                <li>Klikk på en rad for detaljer.</li>
                <li>
                  Prøv <strong>E + aeolisk</strong> eller{" "}
                  <strong>A + dorisk</strong>.
                </li>
                <li>Substitusjoner baseres på funksjon.</li>
              </ul>
            </section>
          </div>
        </div>

        {/* Right Panel: Detail View */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <ChordDetail
            chord={selectedChord}
            substitutions={substitutions}
            useFlats={useFlats}
          />
        </div>
      </div>
    </main>
  );
}
