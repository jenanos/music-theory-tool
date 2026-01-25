"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildDiatonicChords,
  DEFAULT_MODE,
  DEFAULT_TONIC,
  getScale,
  prefersFlats,
  SCALES,
  suggestSubstitutions,
  TONIC_OPTIONS,
  type ModeId,
} from "@repo/theory";
import { ChordDetail } from "./components/ChordDetail";
import { DegreeTable } from "./components/DegreeTable";

export default function Page() {
  // Harmony State
  const [tonic, setTonic] = useState(DEFAULT_TONIC);
  const [mode, setMode] = useState<ModeId>(DEFAULT_MODE);
  const [includeSevenths, setIncludeSevenths] = useState(false);

  // Overlay State
  const [overlayTonic, setOverlayTonic] = useState(DEFAULT_TONIC);
  const [syncOverlayTonic, setSyncOverlayTonic] = useState(true);
  const [overlayMode, setOverlayMode] = useState<ModeId>(DEFAULT_MODE);
  const [showOverlayScale, setShowOverlayScale] = useState(true);

  // Effect to sync overlay tonic
  useEffect(() => {
    if (syncOverlayTonic) {
      setOverlayTonic(tonic);
    }
  }, [tonic, syncOverlayTonic]);

  const chords = useMemo(
    () => buildDiatonicChords(tonic, mode, includeSevenths),
    [tonic, mode, includeSevenths],
  );

  // Computed Scale Data
  const harmonyScalePcs = useMemo(() => getScale(tonic, mode).pcs, [tonic, mode]);
  const activeOverlayTonic = syncOverlayTonic ? tonic : overlayTonic;
  const overlayScalePcs = useMemo(
    () => getScale(activeOverlayTonic, overlayMode).pcs,
    [activeOverlayTonic, overlayMode]
  );

  const outsideNotes = useMemo(() => {
    const harmonySet = new Set(harmonyScalePcs);
    return overlayScalePcs.filter(pc => !harmonySet.has(pc));
  }, [harmonyScalePcs, overlayScalePcs]);

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
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold leading-tight text-slate-800">
            Diatoniske akkorder
          </h1>
          <p className="text-xs text-slate-500">
            Akkorder fra: <strong>{tonic} {scaleInfo?.name}</strong>
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Harmony Controls */}
          <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs">
            <span className="font-semibold uppercase tracking-wide text-slate-400">Toneart</span>
            <div className="flex items-center gap-2">
              <select
                className="rounded border border-slate-200 bg-white px-2 py-1 focus:border-indigo-500 focus:outline-none"
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
                className="rounded border border-slate-200 bg-white px-2 py-1 focus:border-indigo-500 focus:outline-none"
                onChange={(event) => {
                  const newMode = event.target.value as ModeId;
                  setMode(newMode);
                  setOverlayMode(newMode);
                }}
                value={mode}
              >
                {SCALES.filter(s => s.isHarmony).map((scale) => (
                  <option key={scale.id} value={scale.id}>
                    {scale.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mt-1">
              <input
                checked={includeSevenths}
                className="accent-indigo-600"
                onChange={(event) => setIncludeSevenths(event.target.checked)}
                type="checkbox"
              />
              <span>7-ere</span>
            </label>
          </div>

          {/* Overlay Controls */}
          <div className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold uppercase tracking-wide text-slate-400">Skalaer</span>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer" title="Vis skala på gripebrett">
                  <input
                    type="checkbox"
                    checked={showOverlayScale}
                    onChange={(e) => setShowOverlayScale(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500">Vis</span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer" title="Bruk samme tonika som harmoni">
                  <input
                    type="checkbox"
                    checked={syncOverlayTonic}
                    onChange={(e) => setSyncOverlayTonic(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500">Sync Tonika</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="rounded border border-slate-200 bg-white px-2 py-1 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
                  onChange={(event) => {
                    setOverlayTonic(event.target.value);
                    setSyncOverlayTonic(false);
                  }}
                  value={syncOverlayTonic ? tonic : overlayTonic}
                  disabled={syncOverlayTonic}
                >
                  {TONIC_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded border border-slate-200 bg-white px-2 py-1 focus:border-indigo-500 focus:outline-none"
                  onChange={(event) => setOverlayMode(event.target.value as ModeId)}
                  value={overlayMode}
                >
                  {SCALES.map((scale) => (
                    <option key={scale.id} value={scale.id}>
                      {scale.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

          </div>
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
                  Prøv å endre <strong>Overlay</strong> til Blues eller Pentaton for å se sammenhenger på gripebrettet.
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

            harmonyNotes={harmonyScalePcs}
            overlayNotes={overlayScalePcs}
            outsideNotes={outsideNotes}
            showHarmony={false}
            showOverlay={showOverlayScale}
          />
        </div>
      </div>
    </main>
  );
}
