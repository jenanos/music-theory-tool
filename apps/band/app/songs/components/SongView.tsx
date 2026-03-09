"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { Song, Section } from "../data";
import { Timeline } from "./Timeline";
import { SectionList } from "./SectionList";
import {
  suggestSubstitutions,
  buildDiatonicChords,
  getChordDegree,
  parseKey,
  TONIC_OPTIONS,
  SCALES,
  transposeSongSections,
  type SubstitutionSuggestion,
  type DiatonicChord,
  type ModeId,
} from "@repo/theory";
import { SubstitutionPanel } from "../../components/SubstitutionPanel";

interface SongViewProps {
  song: Song;
  onChange: (updatedSong: Song) => void;
  onBackToList?: () => void;
}

interface TimelineItem {
  id: string; // Unique ID for dnd
  sectionId: string;
}

// Simple ID generator that works everywhere
function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

const HARMONY_SCALES = SCALES.filter((s) => s.isHarmony);

export function SongView({ song, onChange, onBackToList }: SongViewProps) {
  // Initialize timeline items directly from song.arrangement.
  // Because "key={song.id}" is used in the parent, this component is
  // freshly mounted for each song, guaranteeing correct initialization.
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>(() =>
    song.arrangement.map((sectionId) => ({
      id: generateId(),
      sectionId,
    })),
  );

  const handleReorder = useCallback(
    (newItems: TimelineItem[]) => {
      setTimelineItems(newItems);
      // Sync back to song model
      onChange({
        ...song,
        arrangement: newItems.map((i) => i.sectionId),
      });
    },
    [song, onChange],
  );

  const updateSection = (id: string, updates: Partial<Section>) => {
    const newSections = song.sections.map((s) =>
      s.id === id ? { ...s, ...updates } : s,
    );
    onChange({ ...song, sections: newSections });
  };

  const addSection = () => {
    const id = `section-${Date.now()}`;
    const newSection: Section = {
      id,
      label: "Vers", // Settes som default for å gi en nyttig start-state
      chordLines: [],
      degreeLines: [],
    };
    const newSections = [...song.sections, newSection];
    // Ensure new sections go into arrangement automatically
    const newItem = { id: generateId(), sectionId: id };
    const newTimelineItems = [...timelineItems, newItem];

    setTimelineItems(newTimelineItems);
    onChange({
      ...song,
      sections: newSections,
      arrangement: [...song.arrangement, id],
    });
  };

  const deleteSection = (id: string) => {
    const newSections = song.sections.filter((s) => s.id !== id);
    // Remove all instances from arrangement
    const newArrangement = song.arrangement.filter((sId) => sId !== id);
    const newTimelineItems = timelineItems.filter(
      (item) => item.sectionId !== id,
    );

    setTimelineItems(newTimelineItems);
    onChange({ ...song, sections: newSections, arrangement: newArrangement });
  };

  const addToArrangement = (sectionId: string) => {
    const newItem = { id: generateId(), sectionId };
    const newItems = [...timelineItems, newItem];
    setTimelineItems(newItems);
    onChange({ ...song, arrangement: newItems.map((i) => i.sectionId) });
  };

  const updateTitle = (newTitle: string) => {
    onChange({ ...song, title: newTitle });
  };

  const updateArtist = (newArtist: string) => {
    onChange({ ...song, artist: newArtist });
  };

  const handleKeyChange = useCallback(
    (newTonic: string, newMode: ModeId) => {
      const newKey = `${newTonic} ${newMode}`;
      if (!song.key) {
        onChange({ ...song, key: newKey });
        return;
      }
      const transposed = transposeSongSections(
        song.sections,
        song.key,
        newTonic,
        newMode,
      );
      onChange({ ...song, key: newKey, sections: transposed });
    },
    [song, onChange],
  );

  const [showUniqueSections, setShowUniqueSections] = useState(true);
  const [sectionLayoutMode, setSectionLayoutMode] = useState<
    "multi" | "single"
  >("multi");
  const [showNotes, setShowNotes] = useState(false);
  const [showMobileTimeline, setShowMobileTimeline] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);

  // Version history state
  const [showOriginal, setShowOriginal] = useState(false);
  const [originalSong, setOriginalSong] = useState<Song | null>(null);
  const [isLoadingOriginal, setIsLoadingOriginal] = useState(false);

  // Fetch original version when toggle is enabled
  useEffect(() => {
    if (showOriginal && !originalSong) {
      setIsLoadingOriginal(true);
      fetch(`/api/songs/${song.id}/original`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch original");
          return res.json();
        })
        .then((data) => setOriginalSong(data))
        .catch((err) => console.error("Error fetching original:", err))
        .finally(() => setIsLoadingOriginal(false));
    }
  }, [showOriginal, originalSong, song.id]);

  // Use original or current song based on toggle
  const displaySong = showOriginal && originalSong ? originalSong : song;
  const isReadonly = showOriginal;

  // Filter unique sections based on label and chord lines content
  const visibleSections = showUniqueSections
    ? displaySong.sections.filter(
        (section, index, self) =>
          // Keep the first section that has this specific label + chord content combination
          index ===
          self.findIndex(
            (s) =>
              s.label === section.label &&
              s.chordLines.join("\n") === section.chordLines.join("\n"),
          ),
      )
    : displaySong.sections;

  // --- SUBSTITUTION LOGIC ---
  type SelectedChordState = {
    symbol: string;
    sectionId: string;
    lineIndex: number;
    chordIndex: number;
    suggestions: SubstitutionSuggestion[];
  };
  const [selectedChord, setSelectedChord] = useState<SelectedChordState | null>(
    null,
  );

  const handleChordClick = useCallback(
    (
      chordSymbol: string,
      sectionId: string,
      lineIndex: number,
      chordIndex: number,
      degree?: string,
    ) => {
      const songKey = song.key;
      if (!songKey) return;

      const keyInfo = parseKey(songKey);
      if (!keyInfo) return;

      const { tonic, mode } = keyInfo;
      const diatonicChords = buildDiatonicChords(tonic, mode, true);

      const normalizeRomanBase = (roman: string) =>
        roman
          .replace(/(maj7|M7|°7|ø7|65|64|43|42|7|6)$/i, "")
          .replace(/[+°ø]/g, "");

      const resolveDiatonicChord = (
        symbol: string,
        romanHint?: string,
      ): DiatonicChord | undefined => {
        if (romanHint) {
          const direct = diatonicChords.find(
            (candidate) => candidate.roman === romanHint,
          );
          if (direct) return direct;

          const base = normalizeRomanBase(romanHint);
          const byBase = diatonicChords.find(
            (candidate) => normalizeRomanBase(candidate.roman) === base,
          );
          if (byBase) return byBase;
        }

        const inferredRoman = getChordDegree(symbol, songKey);
        if (inferredRoman) {
          const inferredDirect = diatonicChords.find(
            (candidate) => candidate.roman === inferredRoman,
          );
          if (inferredDirect) return inferredDirect;

          const inferredBase = normalizeRomanBase(inferredRoman);
          const inferredByBase = diatonicChords.find(
            (candidate) => normalizeRomanBase(candidate.roman) === inferredBase,
          );
          if (inferredByBase) return inferredByBase;
        }

        const upperStructure = symbol.split("/")[0] ?? symbol;
        return diatonicChords.find(
          (candidate) =>
            candidate.symbol === symbol ||
            candidate.symbol === upperStructure ||
            candidate.symbol.startsWith(upperStructure),
        );
      };

      const targetChord = resolveDiatonicChord(chordSymbol, degree);

      const section = song.sections.find((s) => s.id === sectionId);
      const chordLine = section?.chordLines[lineIndex] ?? "";
      const degreeLine = section?.degreeLines?.[lineIndex] ?? "";

      const lineChords = chordLine.split(/[\s|-]+/).filter(Boolean);
      const lineDegrees = degreeLine.split(/[\s|-]+/).filter(Boolean);

      const nextChordSymbol = lineChords[chordIndex + 1];
      const nextChordDegree = lineDegrees[chordIndex + 1];
      const nextChord = nextChordSymbol
        ? resolveDiatonicChord(nextChordSymbol, nextChordDegree)
        : undefined;

      if (targetChord) {
        const suggestions = suggestSubstitutions({
          tonic,
          mode,
          chord: targetChord,
          allChords: diatonicChords,
          nextChord,
          sourceSymbol: chordSymbol,
          preserveBass: true,
          includeApproach: Boolean(nextChord),
          includeSpice: true,
        });
        setSelectedChord({
          symbol: chordSymbol,
          sectionId,
          lineIndex,
          chordIndex,
          suggestions,
        });
      } else {
        console.warn(
          "Kunne ikke finne akkord i kontekst:",
          chordSymbol,
          degree,
        );
        setSelectedChord({
          symbol: chordSymbol,
          sectionId,
          lineIndex,
          chordIndex,
          suggestions: [],
        });
      }
    },
    [song.key, song.sections],
  );

  const handleApplySubstitution = useCallback(
    (substitution: SubstitutionSuggestion) => {
      if (!selectedChord) return;
      const { sectionId, lineIndex, chordIndex, symbol } = selectedChord;

      const section = song.sections.find((s) => s.id === sectionId);
      if (!section) return;

      const lines = [...section.chordLines];
      if (lineIndex >= lines.length) return;

      const line = lines[lineIndex];
      if (line === undefined) return;

      // Find the N-th chord in the line to match current view parsing logic
      // This regex must match what ChordDisplay uses to split: /[\s|-]+/
      // Use a loop to find the N-th match.
      const chordRegex = /[^|\s-]+/g;
      let match;
      let currentIndex = 0;
      let found = false;

      while ((match = chordRegex.exec(line)) !== null) {
        if (currentIndex === chordIndex) {
          // Found it!
          const start = match.index;
          const end = start + match[0].length;
          const newLine =
            line.substring(0, start) +
            substitution.substituteSymbol +
            line.substring(end);

          lines[lineIndex] = newLine;

          // Update section
          updateSection(sectionId, { chordLines: lines });
          setSelectedChord(null); // Close modal
          found = true;
          break;
        }
        currentIndex++;
      }

      if (!found) {
        console.error("Could not find chord to replace at index", chordIndex);
      }
    },
    [selectedChord, song.sections, updateSection],
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background relative">
      {/* Modal / Overlay for Substitutions */}
      {selectedChord && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-xl shadow-xl border border-border w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted">
              <h3 className="font-bold text-lg text-foreground">
                Substitusjoner for{" "}
                <span className="text-primary">{selectedChord.symbol}</span>
              </h3>
              <button
                onClick={() => setSelectedChord(null)}
                className="p-1 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <SubstitutionPanel
                substitutions={selectedChord.suggestions}
                onSelect={handleApplySubstitution}
              />
            </div>
          </div>
          {/* Backdrop click to close */}
          <div
            className="absolute inset-0 -z-10"
            onClick={() => setSelectedChord(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="border-b border-border bg-card px-4 py-3 md:px-6 md:py-4 flex-none relative z-10">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          {/* Back button on mobile */}
          {onBackToList && (
            <button
              onClick={onBackToList}
              className="p-1.5 -ml-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors md:hidden"
              title="Tilbake til låtlisten"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {isReadonly ? (
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              <span className="text-lg md:text-2xl font-bold text-foreground truncate">
                {displaySong.title}
              </span>
              <span className="text-sm font-medium text-muted-foreground">
                {displaySong.artist || ""}
              </span>
              <span className="text-xs text-accent-foreground bg-accent/20 px-2 py-1 rounded-full border border-accent/40">
                Originalversjon (skrivebeskyttet)
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
              <input
                className="text-lg md:text-2xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded px-1 bg-transparent min-w-0 w-full md:w-auto"
                value={song.title}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="Låttittel"
              />
              <input
                className="text-sm font-medium text-muted-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary rounded px-1 bg-transparent min-w-0 w-full md:w-auto"
                value={song.artist || ""}
                onChange={(e) => updateArtist(e.target.value)}
                placeholder="Artist"
              />
            </div>
          )}

          {/* Mobile: compact icon buttons for settings/timeline toggles */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={() => setShowMobileTimeline(!showMobileTimeline)}
              className={`p-1.5 rounded-md transition-colors ${showMobileTimeline ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              title="Vis arrangement"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M2 3.75A.75.75 0 0 1 2.75 3h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 3.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.166a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Zm0 4.167a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => setShowMobileSettings(!showMobileSettings)}
              className={`p-1.5 rounded-md transition-colors ${showMobileSettings ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
              title="Innstillinger"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.294a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.416l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.416.587l-.294 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.416-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.416l-1.473-.294A1 1 0 0 1 1 11.681V10.32a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 3.22l1.25.834a6.957 6.957 0 0 1 1.416-.587l.294-1.473ZM13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clipRule="evenodd" />
              </svg>
            </button>
            {displaySong.notes && (
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`p-1.5 rounded-md transition-colors ${showNotes ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                title={showNotes ? "Skjul låtnotater" : "Vis låtnotater"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* Desktop: full controls row */}
          <div className="hidden md:flex ml-auto items-center gap-3">
            {/* Version Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setShowOriginal(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  !showOriginal
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Nåværende
              </button>
              <button
                onClick={() => setShowOriginal(true)}
                disabled={isLoadingOriginal}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showOriginal
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                } disabled:opacity-50`}
              >
                {isLoadingOriginal ? "Laster..." : "Opprinnelig"}
              </button>
            </div>

            {isReadonly ? (
              <span className="text-xs text-muted-foreground/60">
                {displaySong.key ? `Key: ${displaySong.key}` : "No key"}
              </span>
            ) : (
              (() => {
                const parsed = song.key ? parseKey(song.key) : null;
                const currentTonic = parsed?.tonic ?? "C";
                const currentMode = parsed?.mode ?? "ionian";
                return (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground/60">
                      Key:
                    </span>
                    <select
                      value={currentTonic}
                      onChange={(e) =>
                        handleKeyChange(e.target.value, currentMode)
                      }
                      className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      {TONIC_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    <select
                      value={currentMode}
                      onChange={(e) =>
                        handleKeyChange(currentTonic, e.target.value as ModeId)
                      }
                      className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      {HARMONY_SCALES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()
            )}

            {/* Info / Notes Toggle */}
            {displaySong.notes && (
              <button
                onClick={() => setShowNotes(!showNotes)}
                className={`p-1.5 rounded-full transition-colors ${showNotes ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary hover:bg-muted"}`}
                title={showNotes ? "Skjul låtnotater" : "Vis låtnotater"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0ZM8.94 6.94a.75.75 0 1 1-1.061-1.061 3 3 0 1 1 2.871 5.026v.345a.75.75 0 0 1-1.5 0v-.5c0-.72.57-1.172 1.081-1.287A1.5 1.5 0 1 0 8.94 6.94ZM10 15a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile settings panel */}
        {showMobileSettings && (
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 md:hidden animate-in fade-in slide-in-from-top-1 duration-200">
            {/* Version Toggle */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setShowOriginal(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  !showOriginal
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Nåværende
              </button>
              <button
                onClick={() => setShowOriginal(true)}
                disabled={isLoadingOriginal}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  showOriginal
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                } disabled:opacity-50`}
              >
                {isLoadingOriginal ? "Laster..." : "Opprinnelig"}
              </button>
            </div>

            {isReadonly ? (
              <span className="text-xs text-muted-foreground/60">
                {displaySong.key ? `Key: ${displaySong.key}` : "No key"}
              </span>
            ) : (
              (() => {
                const parsed = song.key ? parseKey(song.key) : null;
                const currentTonic = parsed?.tonic ?? "C";
                const currentMode = parsed?.mode ?? "ionian";
                return (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground/60">Key:</span>
                    <select
                      value={currentTonic}
                      onChange={(e) => handleKeyChange(e.target.value, currentMode)}
                      className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      {TONIC_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <select
                      value={currentMode}
                      onChange={(e) => handleKeyChange(currentTonic, e.target.value as ModeId)}
                      className="rounded border border-border bg-background px-1.5 py-0.5 text-xs text-foreground focus:border-primary focus:outline-none"
                    >
                      {HARMONY_SCALES.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* Expandable Notes Section */}
        {displaySong.notes && showNotes && (
          <div className="mt-4 text-sm text-muted-foreground bg-muted p-3 rounded-md border border-border animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="font-medium text-foreground mb-1">Notater</div>
            {displaySong.notes}
          </div>
        )}
      </div>

      {/* Mobile Timeline Panel */}
      {showMobileTimeline && (
        <div className="border-b border-border bg-card p-4 flex-none md:hidden animate-in fade-in slide-in-from-top-1 duration-200 max-h-[40vh] overflow-y-auto">
          <Timeline
            items={timelineItems}
            sections={song.sections}
            onReorder={handleReorder}
          />
          {!isReadonly && (
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-xs font-medium text-muted-foreground block mb-2 uppercase tracking-wider">
                Legg til i arrangement
              </span>
              <div className="flex flex-wrap gap-2">
                {song.sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addToArrangement(s.id)}
                    className="text-xs px-2 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition border border-border"
                  >
                    + {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content: Sections */}
        <div className="flex-1 overflow-y-auto p-3 md:p-6 bg-background">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showUniqueSections}
                  onChange={(e) => setShowUniqueSections(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Vis unike seksjoner
              </label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Visning</span>
                <select
                  value={sectionLayoutMode}
                  onChange={(e) =>
                    setSectionLayoutMode(e.target.value as "multi" | "single")
                  }
                  className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="multi">
                    Vis flere seksjoner på samme rad
                  </option>
                  <option value="single">Vis én seksjon per rad</option>
                </select>
              </label>
            </div>

            <SectionList
              sections={visibleSections}
              songKey={displaySong.key}
              layoutMode={sectionLayoutMode}
              onUpdate={isReadonly ? undefined : updateSection}
              onAdd={isReadonly ? undefined : addSection}
              onDelete={isReadonly ? undefined : deleteSection}
              onChordClick={handleChordClick}
            />
          </div>
        </div>

        {/* Desktop Sidebar: Timeline */}
        <div className="hidden md:flex w-80 border-l border-border bg-card flex-col">
          <div className="p-4 flex-1 overflow-hidden flex flex-col">
            <Timeline
              items={timelineItems}
              sections={song.sections}
              onReorder={handleReorder}
            />

            {!isReadonly && (
              <div className="mt-4 pt-4 border-t border-border overflow-y-auto flex-none max-h-[40%]">
                <span className="text-xs font-medium text-muted-foreground block mb-2 uppercase tracking-wider">
                  Legg til i arrangement
                </span>
                <div className="flex flex-wrap gap-2">
                  {song.sections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addToArrangement(s.id)}
                      className="text-xs px-2 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground transition border border-border"
                    >
                      + {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
