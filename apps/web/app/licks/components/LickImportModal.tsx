"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import {
  lickDataToAlphaTex,
  validateLickData,
  type LickData,
  type LickEvent,
} from "@repo/theory";
import { Button } from "@repo/ui/button";
import { Label } from "@repo/ui/label";
import { Textarea } from "@repo/ui/textarea";
import { Input } from "@repo/ui/input";
import { AlphaTabPreview } from "./AlphaTabPreview";

export type LickVisibility = "private" | "group" | "shared";

export interface GroupOption {
  id: string;
  name: string;
}

export interface LickCreateData {
  title: string;
  key?: string | null;
  description?: string | null;
  tags?: string[];
  tuning?: string | null;
  data: LickData;
  visibility?: LickVisibility;
  groupId?: string | null;
}

export type LickEditableData = LickCreateData & {
  id?: string;
};

interface LickImportModalProps {
  isOpen: boolean;
  groups: GroupOption[];
  initialLick?: LickEditableData | null;
  onClose: () => void;
  onSave: (data: LickCreateData) => Promise<void>;
}

type EditorMode = "tab" | "import";
type TabSubdivision = 1 | 2 | 4;
type NoteTechnique =
  | ""
  | "slide"
  | "hammer"
  | "pull"
  | "bend"
  | "vibrato"
  | "tie"
  | "ghost";

interface TabCell {
  fret: string;
  technique: NoteTechnique;
  toFret: string;
  duration: string;
  ghost: boolean;
}

const DEFAULT_LICK_DATA: LickData = {
  version: 1,
  meter: "4/4",
  feel: "straight",
  events: [],
};

const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];
const SUBDIVISION_OPTIONS: Array<{
  value: TabSubdivision;
  label: string;
  duration: string;
}> = [
  { value: 1, label: "4-deler", duration: "4" },
  { value: 2, label: "8-deler", duration: "8" },
  { value: 4, label: "16-deler", duration: "16" },
];
const TECHNIQUE_OPTIONS: Array<{ value: NoteTechnique; label: string }> = [
  { value: "", label: "Ingen" },
  { value: "slide", label: "Slide" },
  { value: "hammer", label: "Hammer-on" },
  { value: "pull", label: "Pull-off" },
  { value: "bend", label: "Bend" },
  { value: "vibrato", label: "Vibrato" },
  { value: "tie", label: "Tie" },
  { value: "ghost", label: "Ghost" },
];

const LLM_PROMPT = `Du er en presis transkribent for gitar-licks. Se på vedlagt bilde, PDF eller tekst med gitartabulatur og returner ett JSON-objekt som matcher denne strukturen:

{
  "title": "Kort navn",
  "key": "A minor",
  "description": "Valgfri kommentar",
  "tags": ["blues", "pentatonic"],
  "tuning": "EADGBE",
  "data": {
    "version": 1,
    "meter": "4/4",
    "feel": "straight",
    "events": [
      {
        "bar": 1,
        "beat": 1,
        "duration": "8",
        "string": 1,
        "fret": 3,
        "technique": "slide",
        "toFret": 5,
        "ghost": false
      }
    ]
  }
}

Regler:
- Returner kun gyldig JSON, uten markdown.
- string er 1-6 der 1 er lys E-streng og 6 er mørk E-streng.
- data.feel må være "straight", "swing" eller "triplets"; bruk "triplets" for triol-feel.
- duration bruker "1", "2", "4", "8", "16" osv. Bruk "8t" for åttedels-trioler.
- Ikke bruk punktede rytmer som "4." eller "8.". Bruk nærmeste grunnverdi ("4" eller "8") og beskriv punktéringen i description hvis den er viktig.
- technique kan være "slide", "hammer", "pull", "bend", "vibrato", "tie" eller "ghost".
- Hvis noe er usikkert, legg en kort forklaring i description, men gjett beste tab-data.`;

function createBlankDraft(): LickCreateData {
  return {
    title: "",
    key: "",
    description: "",
    tags: [],
    tuning: "EADGBE",
    data: { ...DEFAULT_LICK_DATA, events: [] },
    visibility: "private",
    groupId: null,
  };
}

function createEmptyCell(): TabCell {
  return {
    fret: "",
    technique: "",
    toFret: "",
    duration: "",
    ghost: false,
  };
}

function normalizeLickFeel(feel: unknown): LickData["feel"] {
  if (feel === "triplet") return "triplets";
  if (feel === "straight" || feel === "swing" || feel === "triplets") {
    return feel;
  }
  return "straight";
}

function normalizeEditableLick(lick?: LickEditableData | null): LickCreateData {
  if (!lick) return createBlankDraft();

  return {
    title: lick.title,
    key: lick.key ?? "",
    description: lick.description ?? "",
    tags: lick.tags ?? [],
    tuning: lick.tuning ?? "EADGBE",
    visibility: lick.visibility ?? "private",
    groupId: lick.groupId ?? null,
    data: {
      version: 1,
      meter: lick.data.meter || "4/4",
      feel: normalizeLickFeel(lick.data.feel),
      events: lick.data.events ?? [],
    },
  };
}

function getBeatsPerBar(meter: string | undefined): number {
  const beats = Number.parseInt((meter ?? "4/4").split("/")[0] ?? "4", 10);
  return Number.isFinite(beats) && beats > 0 ? beats : 4;
}

function getDefaultDuration(subdivision: TabSubdivision): string {
  return (
    SUBDIVISION_OPTIONS.find((option) => option.value === subdivision)
      ?.duration ?? "8"
  );
}

function getEventBar(event: LickEvent): number {
  return typeof event.bar === "number" && event.bar > 0 ? event.bar : 1;
}

function durationToSubdivision(
  duration: LickEvent["duration"],
): TabSubdivision {
  const raw = String(duration ?? "8").replace("t", "");
  if (raw === "16" || raw === "32" || raw === "64") return 4;
  if (raw === "8") return 2;
  return 1;
}

function inferBarCount(data: LickData): number {
  const maxBar = data.events.reduce(
    (current, event) => Math.max(current, getEventBar(event)),
    1,
  );
  return Math.min(Math.max(maxBar, 1), 12);
}

function inferSubdivision(data: LickData): TabSubdivision {
  return data.events.reduce<TabSubdivision>((current, event) => {
    const next = durationToSubdivision(event.duration);
    return next > current ? next : current;
  }, 2);
}

function createGrid(columnCount: number): TabCell[][] {
  return Array.from({ length: 6 }, () =>
    Array.from({ length: columnCount }, createEmptyCell),
  );
}

function isSupportedTechnique(value: unknown): value is NoteTechnique {
  return TECHNIQUE_OPTIONS.some((option) => option.value === value);
}

function gridFromLickData(
  data: LickData,
  barCount: number,
  subdivision: TabSubdivision,
): TabCell[][] {
  const beatsPerBar = getBeatsPerBar(data.meter);
  const columnsPerBar = beatsPerBar * subdivision;
  const grid = createGrid(barCount * columnsPerBar);

  for (const event of data.events) {
    if (event.type === "rest" || event.type === "bar" || event.rest) continue;
    if (typeof event.string !== "number" || typeof event.fret !== "number") {
      continue;
    }

    const row = event.string - 1;
    if (row < 0 || row >= grid.length) continue;

    const bar = getEventBar(event);
    const beat = typeof event.beat === "number" ? event.beat : 1;
    const column =
      (bar - 1) * columnsPerBar + Math.round((beat - 1) * subdivision);

    if (column < 0 || column >= grid[row]!.length) continue;

    const technique = isSupportedTechnique(event.technique)
      ? event.technique
      : "";
    grid[row]![column] = {
      fret: String(event.fret),
      technique,
      toFret:
        typeof event.toFret === "number" && Number.isFinite(event.toFret)
          ? String(event.toFret)
          : "",
      duration: event.duration ? String(event.duration) : "",
      ghost: Boolean(event.ghost || technique === "ghost"),
    };
  }

  return grid;
}

function parseFret(value: string): number | null {
  if (!value.trim()) return null;
  const fret = Number.parseInt(value, 10);
  return Number.isFinite(fret) && fret >= 0 ? fret : null;
}

function gridToEvents(
  grid: TabCell[][],
  meter: string | undefined,
  subdivision: TabSubdivision,
): LickEvent[] {
  const beatsPerBar = getBeatsPerBar(meter);
  const columnsPerBar = beatsPerBar * subdivision;
  const defaultDuration = getDefaultDuration(subdivision);
  const events: LickEvent[] = [];

  for (let column = 0; column < grid[0]!.length; column += 1) {
    for (let row = 0; row < grid.length; row += 1) {
      const cell = grid[row]![column]!;
      const fret = parseFret(cell.fret);
      if (fret === null) continue;

      const bar = Math.floor(column / columnsPerBar) + 1;
      const beat = (column % columnsPerBar) / subdivision + 1;
      const event: LickEvent = {
        bar,
        beat: Number(beat.toFixed(2)),
        duration: cell.duration || defaultDuration,
        string: row + 1,
        fret,
      };
      const toFret = parseFret(cell.toFret);

      if (cell.technique) event.technique = cell.technique;
      if (toFret !== null) event.toFret = toFret;
      if (cell.ghost || cell.technique === "ghost") event.ghost = true;

      events.push(event);
    }
  }

  return events;
}

function updateGridCell(
  grid: TabCell[][],
  row: number,
  column: number,
  nextCell: TabCell,
): TabCell[][] {
  return grid.map((stringRow, rowIndex) =>
    stringRow.map((cell, columnIndex) =>
      rowIndex === row && columnIndex === column ? nextCell : cell,
    ),
  );
}

function normalizeTags(value: string): string[] {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

interface LickTabEditorProps {
  draft: LickCreateData;
  onChange: (draft: LickCreateData) => void;
}

function LickTabEditor({ draft, onChange }: LickTabEditorProps) {
  const [barCount, setBarCount] = useState(() => inferBarCount(draft.data));
  const [subdivision, setSubdivision] = useState<TabSubdivision>(() =>
    inferSubdivision(draft.data),
  );
  const [selected, setSelected] = useState({ row: 0, column: 0 });
  const beatsPerBar = getBeatsPerBar(draft.data.meter);
  const columnsPerBar = beatsPerBar * subdivision;
  const columnCount = barCount * columnsPerBar;
  const grid = useMemo(
    () => gridFromLickData(draft.data, barCount, subdivision),
    [barCount, draft.data, subdivision],
  );
  const selectedCell =
    grid[selected.row]?.[selected.column] ?? createEmptyCell();

  const updateDraftData = (nextGrid: TabCell[][]) => {
    onChange({
      ...draft,
      data: {
        ...draft.data,
        version: 1,
        events: gridToEvents(nextGrid, draft.data.meter, subdivision),
      },
    });
  };

  const updateCell = (row: number, column: number, nextCell: TabCell) => {
    updateDraftData(updateGridCell(grid, row, column, nextCell));
  };

  const updateSelectedCell = (nextCell: TabCell) => {
    updateCell(selected.row, selected.column, nextCell);
  };

  const updateMeter = (meter: string) => {
    onChange({
      ...draft,
      data: {
        ...draft.data,
        version: 1,
        meter,
      },
    });
  };

  const updateFeel = (feel: LickData["feel"]) => {
    onChange({
      ...draft,
      data: {
        ...draft.data,
        version: 1,
        feel,
      },
    });
  };

  const changeBarCount = (value: string) => {
    const nextBarCount = Math.max(1, Math.min(12, Number(value) || 1));
    const nextColumnCount = nextBarCount * columnsPerBar;
    const nextGrid = createGrid(nextColumnCount);

    for (let row = 0; row < nextGrid.length; row += 1) {
      for (
        let column = 0;
        column < Math.min(nextGrid[row]!.length, grid[row]!.length);
        column += 1
      ) {
        nextGrid[row]![column] = grid[row]![column]!;
      }
    }

    setBarCount(nextBarCount);
    updateDraftData(nextGrid);
    setSelected((current) => ({
      row: current.row,
      column: Math.min(current.column, nextColumnCount - 1),
    }));
  };

  const changeSubdivision = (value: string) => {
    const nextSubdivision = Number(value) as TabSubdivision;
    if (![1, 2, 4].includes(nextSubdivision)) return;
    setSubdivision(nextSubdivision);
    setSelected({ row: 0, column: 0 });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Tittel</span>
          <Input
            value={draft.title}
            onChange={(event) =>
              onChange({ ...draft, title: event.target.value })
            }
            placeholder="A minor blues lick"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Toneart</span>
          <Input
            value={draft.key ?? ""}
            onChange={(event) =>
              onChange({ ...draft, key: event.target.value })
            }
            placeholder="A aeolian"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Tags</span>
          <Input
            value={(draft.tags ?? []).join(", ")}
            onChange={(event) =>
              onChange({ ...draft, tags: normalizeTags(event.target.value) })
            }
            placeholder="blues, pentatonic"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Tuning</span>
          <Input
            value={draft.tuning ?? ""}
            onChange={(event) =>
              onChange({ ...draft, tuning: event.target.value })
            }
            placeholder="EADGBE"
          />
        </label>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="text-muted-foreground">Beskrivelse</span>
        <Textarea
          value={draft.description ?? ""}
          onChange={(event) =>
            onChange({ ...draft, description: event.target.value })
          }
          className="min-h-20"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Takter</span>
          <Input
            type="number"
            min={1}
            max={12}
            value={barCount}
            onChange={(event) => changeBarCount(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Meter</span>
          <Input
            value={draft.data.meter ?? "4/4"}
            onChange={(event) => updateMeter(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Rutenett</span>
          <select
            value={subdivision}
            onChange={(event) => changeSubdivision(event.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {SUBDIVISION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Feel</span>
          <select
            value={draft.data.feel ?? "straight"}
            onChange={(event) =>
              updateFeel(event.target.value as LickData["feel"])
            }
            className="h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            <option value="straight">Straight</option>
            <option value="swing">Swing</option>
            <option value="triplets">Triplets</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-md border border-border bg-background/60 p-3">
        <div
          className="grid min-w-max gap-x-1 gap-y-1"
          style={{ gridTemplateColumns: `2rem repeat(${columnCount}, 2.5rem)` }}
        >
          <div />
          {Array.from({ length: columnCount }, (_, column) => {
            const beat = (column % columnsPerBar) / subdivision + 1;
            const isBeatStart = column % subdivision === 0;
            const isBarStart = column % columnsPerBar === 0;
            return (
              <div
                key={`label-${column}`}
                className={`h-6 text-center text-[10px] text-muted-foreground ${
                  isBarStart ? "border-l border-primary/40" : ""
                }`}
              >
                {isBeatStart ? beat : ""}
              </div>
            );
          })}

          {STRING_LABELS.map((label, row) => (
            <Fragment key={`row-${label}`}>
              <div
                key={`string-${label}`}
                className="flex h-9 items-center text-sm font-medium text-muted-foreground"
              >
                {label}
              </div>
              {Array.from({ length: columnCount }, (_, column) => {
                const cell = grid[row]![column]!;
                const isSelected =
                  selected.row === row && selected.column === column;
                const isBeatStart = column % subdivision === 0;
                const isBarStart = column % columnsPerBar === 0;
                return (
                  <Input
                    key={`${row}-${column}`}
                    aria-label={`${label}-streng takt ${Math.floor(column / columnsPerBar) + 1}`}
                    value={cell.fret}
                    onFocus={() => setSelected({ row, column })}
                    onChange={(event) =>
                      updateCell(row, column, {
                        ...cell,
                        fret: event.target.value.replace(/[^\d]/g, ""),
                      })
                    }
                    maxLength={2}
                    className={`h-9 px-1 text-center font-mono text-sm ${
                      isSelected ? "ring-2 ring-primary/70" : ""
                    } ${cell.fret ? "bg-primary/10 text-foreground" : ""} ${
                      isBeatStart ? "border-l-primary/50" : ""
                    } ${isBarStart ? "border-l-primary" : ""}`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="grid gap-3 rounded-md border border-border bg-background/60 p-3 sm:grid-cols-4">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Valgt bånd</span>
          <Input
            value={selectedCell.fret}
            onChange={(event) =>
              updateSelectedCell({
                ...selectedCell,
                fret: event.target.value.replace(/[^\d]/g, ""),
              })
            }
            placeholder="-"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Teknikk</span>
          <select
            value={selectedCell.technique}
            onChange={(event) =>
              updateSelectedCell({
                ...selectedCell,
                technique: event.target.value as NoteTechnique,
                ghost:
                  event.target.value === "ghost" ? true : selectedCell.ghost,
              })
            }
            className="h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {TECHNIQUE_OPTIONS.map((option) => (
              <option key={option.value || "none"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Til bånd</span>
          <Input
            value={selectedCell.toFret}
            onChange={(event) =>
              updateSelectedCell({
                ...selectedCell,
                toFret: event.target.value.replace(/[^\d]/g, ""),
              })
            }
            placeholder="for slide/hammer"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Varighet</span>
          <Input
            value={selectedCell.duration}
            onChange={(event) =>
              updateSelectedCell({
                ...selectedCell,
                duration: event.target.value,
              })
            }
            placeholder={getDefaultDuration(subdivision)}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-4">
          <input
            type="checkbox"
            checked={selectedCell.ghost}
            onChange={(event) =>
              updateSelectedCell({
                ...selectedCell,
                ghost: event.target.checked,
              })
            }
            className="h-4 w-4 rounded border-border"
          />
          Ghost note
        </label>
      </div>
    </div>
  );
}

export function LickImportModal({
  isOpen,
  groups,
  initialLick,
  onClose,
  onSave,
}: LickImportModalProps) {
  const [mode, setMode] = useState<EditorMode>("tab");
  const [jsonText, setJsonText] = useState("");
  const [draft, setDraft] = useState<LickCreateData>(() =>
    normalizeEditableLick(initialLick),
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [visibility, setVisibility] = useState<LickVisibility>("private");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const nextDraft = normalizeEditableLick(initialLick);
    setDraft(nextDraft);
    setMode("tab");
    setJsonText("");
    setError("");
    setPromptCopied(false);
    setVisibility(nextDraft.visibility ?? "private");
    setSelectedGroupId(nextDraft.groupId ?? "");
  }, [initialLick, isOpen]);

  const warnings = useMemo(() => validateLickData(draft.data), [draft]);

  const alphaTex = useMemo(
    () =>
      lickDataToAlphaTex(draft.data, {
        title: draft.title || "Preview",
      }),
    [draft],
  );

  if (!isOpen) return null;

  const resetAndClose = () => {
    onClose();
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(LLM_PROMPT);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      setError("Kunne ikke kopiere prompt automatisk.");
    }
  };

  const parseDraft = () => {
    setError("");
    try {
      const parsed = JSON.parse(jsonText) as Partial<LickCreateData>;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("JSON må være et objekt.");
      }
      if (!parsed.title || typeof parsed.title !== "string") {
        throw new Error("JSON mangler title.");
      }
      if (!parsed.data || !Array.isArray(parsed.data.events)) {
        throw new Error("JSON mangler data.events.");
      }

      const nextDraft: LickCreateData = {
        title: parsed.title,
        key: typeof parsed.key === "string" ? parsed.key : "",
        description:
          typeof parsed.description === "string" ? parsed.description : "",
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.filter((tag): tag is string => typeof tag === "string")
          : [],
        tuning: typeof parsed.tuning === "string" ? parsed.tuning : "EADGBE",
        data: {
          version: 1,
          meter: parsed.data.meter || "4/4",
          feel: normalizeLickFeel(parsed.data.feel),
          events: parsed.data.events,
        },
      };

      setDraft(nextDraft);
      setVisibility(parsed.visibility ?? visibility);
      setSelectedGroupId(parsed.groupId ?? selectedGroupId);
      setMode("tab");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke tolke JSON.");
    }
  };

  const saveDraft = async () => {
    if (!draft.title.trim()) {
      setError("Gi licket en tittel før du lagrer.");
      return;
    }
    if (visibility === "group" && !selectedGroupId) {
      setError("Velg en gruppe for gruppesynlighet.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await onSave({
        ...draft,
        title: draft.title.trim(),
        key: draft.key?.trim() || null,
        description: draft.description?.trim() || null,
        tuning: draft.tuning?.trim() || null,
        visibility,
        groupId: visibility === "group" ? selectedGroupId : null,
      });
      resetAndClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke lagre lick.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={resetAndClose}
      />
      <div className="relative z-10 flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-lg border border-border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 p-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {initialLick ? "Rediger lick" : "Legg til lick"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Skriv tab direkte, importer fra LLM, reviewer og lagre.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={resetAndClose}>
            Lukk
          </Button>
        </div>

        <div className="border-b border-border px-4 pt-3">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "tab" ? "default" : "outline"}
              onClick={() => setMode("tab")}
            >
              Skriv tab
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "import" ? "default" : "outline"}
              onClick={() => setMode("import")}
            >
              LLM-import
            </Button>
          </div>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto p-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
          <div className="space-y-4">
            {mode === "tab" ? (
              <LickTabEditor draft={draft} onChange={setDraft} />
            ) : (
              <>
                <div className="space-y-2">
                  <Label>1. Prompt</Label>
                  <Textarea
                    value={LLM_PROMPT}
                    readOnly
                    className="min-h-36 font-mono text-xs"
                  />
                  <Button type="button" variant="outline" onClick={copyPrompt}>
                    {promptCopied ? "Kopiert!" : "Kopier prompt"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lick-json">2. JSON fra LLM</Label>
                  <Textarea
                    id="lick-json"
                    value={jsonText}
                    onChange={(event) => setJsonText(event.target.value)}
                    className="min-h-52 font-mono text-xs"
                    placeholder='{ "title": "...", "key": "A minor", "data": { "version": 1, "events": [] } }'
                  />
                  <Button
                    type="button"
                    onClick={parseDraft}
                    disabled={!jsonText.trim()}
                  >
                    Tolk som utkast
                  </Button>
                </div>
              </>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Review-preview
              </h3>
              <p className="text-xs text-muted-foreground">
                Utkastet lagres først når du godkjenner det.
              </p>
            </div>
            {warnings.length > 0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                {warnings.map((warning) => (
                  <div key={warning}>{warning}</div>
                ))}
              </div>
            )}
            <AlphaTabPreview alphaTex={alphaTex} />

            <div className="grid gap-3 rounded-md border border-border bg-background/60 p-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-muted-foreground">Synlighet</span>
                <select
                  value={visibility}
                  onChange={(event) =>
                    setVisibility(event.target.value as LickVisibility)
                  }
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="private">Privat</option>
                  <option value="group">Gruppe</option>
                  <option value="shared">Delt</option>
                </select>
              </label>
              {visibility === "group" && (
                <label className="space-y-1 text-sm">
                  <span className="text-muted-foreground">Gruppe</span>
                  <select
                    value={selectedGroupId}
                    onChange={(event) => setSelectedGroupId(event.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="">Velg gruppe</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mx-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-border bg-muted/40 p-4">
          <Button type="button" variant="ghost" onClick={resetAndClose}>
            Avbryt
          </Button>
          <Button type="button" onClick={saveDraft} disabled={isSaving}>
            {isSaving
              ? "Lagrer..."
              : initialLick
                ? "Lagre endringer"
                : "Lagre lick"}
          </Button>
        </div>
      </div>
    </div>
  );
}
