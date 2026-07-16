"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import type { LickData, LickEvent, LickTechnique } from "@repo/theory";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";

const DURATIONS = ["1", "2", "4", "8", "16", "32"] as const;
type DurationToken = (typeof DURATIONS)[number];
const DURATION_SET = new Set<string>(DURATIONS);

const DURATION_LABELS: Record<DurationToken, string> = {
  "1": "1",
  "2": "½",
  "4": "¼",
  "8": "⅛",
  "16": "1/16",
  "32": "1/32",
};

const TECHNIQUES: { id: LickTechnique; label: string; key: string }[] = [
  { id: "slide", label: "Slide", key: "s" },
  { id: "hammer", label: "Hammer", key: "h" },
  { id: "pull", label: "Pull-off", key: "p" },
  { id: "bend", label: "Bend", key: "b" },
  { id: "vibrato", label: "Vibrato", key: "v" },
  { id: "tie", label: "Bind", key: "t" },
  { id: "ghost", label: "Ghost", key: "g" },
];

const TECHNIQUE_SET = new Set<string>(TECHNIQUES.map((t) => t.id));
const TECHNIQUE_BY_KEY = new Map(TECHNIQUES.map((t) => [t.key, t.id]));
const STRING_LABELS = ["e", "B", "G", "D", "A", "E"];
const STRING_NUMBERS = [1, 2, 3, 4, 5, 6] as const;
const MAX_HISTORY = 100;

type SlotNote = {
  fret: number;
  technique?: LickTechnique;
  toFret?: number;
  ghost?: boolean;
};

type Slot = {
  duration: DurationToken;
  triplet: boolean;
  notes: Partial<Record<number, SlotNote>>;
};

type Bar = { slots: Slot[] };
type SlotsModel = { bars: Bar[] };
type Selection = { barIndex: number; slotIndex: number; string: number };

interface TablatureEditorProps {
  data: LickData;
  onChange: (data: LickData) => void;
}

function isTechnique(value: unknown): value is LickTechnique {
  return typeof value === "string" && TECHNIQUE_SET.has(value);
}

function durationToBeats(duration: DurationToken, triplet: boolean): number {
  const base = 4 / Number(duration);
  return triplet ? base * (2 / 3) : base;
}

export function beatsPerBarFromMeter(meter: string | undefined): number {
  const match = meter?.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return 4;
  const numerator = Number(match[1]);
  const denominator = Number(match[2]);
  if (numerator <= 0 || denominator <= 0) return 4;
  return numerator * (4 / denominator);
}

function barBeats(bar: Bar): number {
  return bar.slots.reduce(
    (sum, slot) => sum + durationToBeats(slot.duration, slot.triplet),
    0,
  );
}

function formatBeats(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function emptySlot(duration: DurationToken = "8", triplet = false): Slot {
  return { duration, triplet, notes: {} };
}

function emptyModel(): SlotsModel {
  return { bars: [{ slots: [emptySlot()] }] };
}

function normalizeDuration(raw: unknown): {
  duration: DurationToken;
  triplet: boolean;
} {
  const text = String(raw ?? "8").trim();
  const triplet = text.endsWith("t");
  const clean = text.replace(/t$/, "").replace(/\.+$/, "");
  return {
    duration: DURATION_SET.has(clean) ? (clean as DurationToken) : "8",
    triplet,
  };
}

export function lickDataToSlots(data: LickData): SlotsModel {
  type Group = {
    bar: number;
    beat: number;
    duration: DurationToken;
    triplet: boolean;
    notes: Partial<Record<number, SlotNote>>;
  };
  const groups = new Map<string, Group>();
  let maxBar = 1;

  for (const event of data.events) {
    if (event.type === "bar" || event.bar === true) continue;
    const bar = typeof event.bar === "number" ? event.bar : 1;
    const beat = typeof event.beat === "number" ? event.beat : 1;
    maxBar = Math.max(maxBar, bar);
    const key = `${bar}:${beat.toFixed(4)}`;
    const { duration, triplet } = normalizeDuration(event.duration);
    let group = groups.get(key);
    if (!group) {
      group = { bar, beat, duration, triplet, notes: {} };
      groups.set(key, group);
    }
    if (event.type === "rest" || event.rest === true) continue;
    const string = typeof event.string === "number" ? event.string : 1;
    const fret = typeof event.fret === "number" ? event.fret : 0;
    const technique = isTechnique(event.technique)
      ? event.technique
      : Array.isArray(event.techniques)
        ? event.techniques.find(isTechnique)
        : undefined;
    const note: SlotNote = { fret };
    if (technique && technique !== "ghost") note.technique = technique;
    if (typeof event.toFret === "number") note.toFret = event.toFret;
    if (event.ghost || technique === "ghost") note.ghost = true;
    group.notes[string] = note;
  }

  if (groups.size === 0) return emptyModel();

  const sorted = [...groups.values()].sort(
    (a, b) => a.bar - b.bar || a.beat - b.beat,
  );
  const bars: Bar[] = Array.from({ length: maxBar }, () => ({ slots: [] }));
  for (const group of sorted) {
    bars[group.bar - 1]?.slots.push({
      duration: group.duration,
      triplet: group.triplet,
      notes: group.notes,
    });
  }
  for (const bar of bars) {
    if (bar.slots.length === 0) bar.slots.push(emptySlot());
  }
  return { bars };
}

export function slotsToLickData(model: SlotsModel, base: LickData): LickData {
  const events: LickEvent[] = [];
  model.bars.forEach((bar, barIndex) => {
    let beat = 1;
    for (const slot of bar.slots) {
      const stringNumbers = Object.keys(slot.notes)
        .map(Number)
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 6)
        .sort((a, b) => a - b);
      const durationToken = slot.triplet ? `${slot.duration}t` : slot.duration;
      const beatRounded = Math.round(beat * 1000) / 1000;
      if (stringNumbers.length === 0) {
        events.push({
          bar: barIndex + 1,
          beat: beatRounded,
          rest: true,
          duration: durationToken,
        });
      } else {
        for (const string of stringNumbers) {
          const note = slot.notes[string];
          if (!note) continue;
          const event: LickEvent = {
            bar: barIndex + 1,
            beat: beatRounded,
            string,
            fret: note.fret,
            duration: durationToken,
          };
          if (note.technique) event.technique = note.technique;
          if (typeof note.toFret === "number") event.toFret = note.toFret;
          if (note.ghost) event.ghost = true;
          events.push(event);
        }
      }
      beat += durationToBeats(slot.duration, slot.triplet);
    }
  });

  const hasTriplet = model.bars.some((b) => b.slots.some((s) => s.triplet));
  const feel: LickData["feel"] =
    base.feel === "swing" ? "swing" : hasTriplet ? "triplets" : "straight";

  const next: LickData = {
    version: 1,
    meter: base.meter ?? "4/4",
    feel,
    events,
  };
  if (base.tuning) next.tuning = base.tuning;
  if (base.maxFret !== undefined) next.maxFret = base.maxFret;
  if (base.title) next.title = base.title;
  if (base.tempo !== undefined) next.tempo = base.tempo;
  if (base.timeSignature) next.timeSignature = base.timeSignature;
  return next;
}

function cloneSlot(slot: Slot): Slot {
  return {
    ...slot,
    notes: Object.fromEntries(
      Object.entries(slot.notes).map(([k, v]) => [k, { ...v! }]),
    ),
  };
}

function cloneModel(model: SlotsModel): SlotsModel {
  return {
    bars: model.bars.map((bar) => ({
      slots: bar.slots.map(cloneSlot),
    })),
  };
}

function clampSelection(model: SlotsModel, sel: Selection | null): Selection {
  if (!sel) return { barIndex: 0, slotIndex: 0, string: 1 };
  const barIndex = Math.min(Math.max(sel.barIndex, 0), model.bars.length - 1);
  const bar = model.bars[barIndex];
  const slotCount = bar?.slots.length ?? 1;
  const slotIndex = Math.min(Math.max(sel.slotIndex, 0), slotCount - 1);
  const string = Math.min(Math.max(sel.string, 1), 6);
  return { barIndex, slotIndex, string };
}

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: "0–9", action: "Skriv fret-tall (to sifre for 10+)" },
  { keys: "Piltaster", action: "Navigér mellom celler" },
  { keys: "Backspace", action: "Slett note" },
  { keys: "R", action: "Gjør slaget til pause (tøm alle strenger)" },
  { keys: "Enter", action: "Nytt slag etter valgt" },
  { keys: "Shift+Enter", action: "Ny takt etter valgt" },
  { keys: "D", action: "Dupliser slag" },
  { keys: "X", action: "Fjern slag" },
  { keys: "+ / −", action: "Kortere / lengre varighet" },
  { keys: ",", action: "Triolett av/på" },
  { keys: "S H P B V T G", action: "Slide, hammer, pull, bend, vibrato, bind, ghost" },
  { keys: "Ctrl+Z / Ctrl+Y", action: "Angre / gjør om" },
  { keys: "Ctrl+C / Ctrl+V", action: "Kopier / lim inn slag" },
];

export function TablatureEditor({ data, onChange }: TablatureEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fretBuffer = useRef<{ digits: string; timer: number | null }>({
    digits: "",
    timer: null,
  });
  const undoStack = useRef<LickData[]>([]);
  const redoStack = useRef<LickData[]>([]);
  const slotClipboard = useRef<Slot | null>(null);
  const internalChange = useRef(false);
  const lastData = useRef(data);

  const model = useMemo(() => lickDataToSlots(data), [data]);
  const [rawSelection, setRawSelection] = useState<Selection>({
    barIndex: 0,
    slotIndex: 0,
    string: 1,
  });
  const selected = clampSelection(model, rawSelection);

  useEffect(() => {
    setRawSelection((current) => clampSelection(model, current));
  }, [model]);

  const pushUndo = (snapshot: LickData) => {
    undoStack.current.push(snapshot);
    if (undoStack.current.length > MAX_HISTORY) undoStack.current.shift();
  };

  // External data replacements (e.g. LLM-import) bypass update(); make them
  // undoable instead of leaving a stale history behind.
  useEffect(() => {
    if (data === lastData.current) return;
    if (!internalChange.current) {
      pushUndo(lastData.current);
      redoStack.current = [];
    }
    internalChange.current = false;
    lastData.current = data;
  });

  const update = (next: SlotsModel, options?: { coalesce?: boolean }) => {
    if (!options?.coalesce) {
      pushUndo(data);
    }
    redoStack.current = [];
    internalChange.current = true;
    onChange(slotsToLickData(next, data));
  };

  const undo = () => {
    const previous = undoStack.current.pop();
    if (!previous) return;
    redoStack.current.push(data);
    internalChange.current = true;
    onChange(previous);
  };

  const redo = () => {
    const next = redoStack.current.pop();
    if (!next) return;
    undoStack.current.push(data);
    internalChange.current = true;
    onChange(next);
  };

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  const beatsPerBar = beatsPerBarFromMeter(data.meter);

  const selectedBar = model.bars[selected.barIndex];
  const selectedSlot = selectedBar?.slots[selected.slotIndex] ?? null;
  const selectedNote = selectedSlot?.notes[selected.string] ?? null;

  const flushFretBuffer = () => {
    if (fretBuffer.current.timer !== null) {
      window.clearTimeout(fretBuffer.current.timer);
    }
    fretBuffer.current = { digits: "", timer: null };
  };

  const setFret = (fret: number, options?: { coalesce?: boolean }) => {
    const next = cloneModel(model);
    const slot = next.bars[selected.barIndex]?.slots[selected.slotIndex];
    if (!slot) return;
    const existing = slot.notes[selected.string];
    slot.notes[selected.string] = { ...(existing ?? {}), fret };
    update(next, options);
  };

  const clearNote = () => {
    const next = cloneModel(model);
    const slot = next.bars[selected.barIndex]?.slots[selected.slotIndex];
    if (!slot) return;
    delete slot.notes[selected.string];
    update(next);
  };

  const clearSlot = () => {
    const next = cloneModel(model);
    const slot = next.bars[selected.barIndex]?.slots[selected.slotIndex];
    if (!slot) return;
    slot.notes = {};
    update(next);
  };

  const setDuration = (duration: DurationToken) => {
    const next = cloneModel(model);
    const slot = next.bars[selected.barIndex]?.slots[selected.slotIndex];
    if (!slot) return;
    slot.duration = duration;
    update(next);
  };

  const stepDuration = (direction: 1 | -1) => {
    if (!selectedSlot) return;
    const index = DURATIONS.indexOf(selectedSlot.duration);
    const nextIndex = Math.min(
      Math.max(index + direction, 0),
      DURATIONS.length - 1,
    );
    if (nextIndex === index) return;
    setDuration(DURATIONS[nextIndex]!);
  };

  const toggleTriplet = () => {
    const next = cloneModel(model);
    const slot = next.bars[selected.barIndex]?.slots[selected.slotIndex];
    if (!slot) return;
    slot.triplet = !slot.triplet;
    update(next);
  };

  const toggleTechnique = (technique: LickTechnique) => {
    const next = cloneModel(model);
    const slot = next.bars[selected.barIndex]?.slots[selected.slotIndex];
    if (!slot) return;
    const existing = slot.notes[selected.string];
    if (!existing) return;
    if (technique === "ghost") {
      existing.ghost = !existing.ghost;
    } else if (existing.technique === technique) {
      delete existing.technique;
      delete existing.toFret;
    } else {
      existing.technique = technique;
      if (
        technique !== "slide" &&
        technique !== "hammer" &&
        technique !== "pull"
      ) {
        delete existing.toFret;
      }
    }
    slot.notes[selected.string] = { ...existing };
    update(next);
  };

  const setToFret = (toFret: number | undefined) => {
    const next = cloneModel(model);
    const slot = next.bars[selected.barIndex]?.slots[selected.slotIndex];
    if (!slot) return;
    const existing = slot.notes[selected.string];
    if (!existing) return;
    if (toFret === undefined || Number.isNaN(toFret)) {
      delete existing.toFret;
    } else {
      existing.toFret = toFret;
    }
    slot.notes[selected.string] = { ...existing };
    update(next);
  };

  const insertSlotAfter = (source?: Slot) => {
    const next = cloneModel(model);
    const bar = next.bars[selected.barIndex];
    if (!bar) return;
    const current = bar.slots[selected.slotIndex];
    const insertAt = selected.slotIndex + 1;
    bar.slots.splice(
      insertAt,
      0,
      source
        ? cloneSlot(source)
        : emptySlot(current?.duration ?? "8", current?.triplet ?? false),
    );
    update(next);
    setRawSelection({ ...selected, slotIndex: insertAt });
  };

  const duplicateSlot = () => {
    if (!selectedSlot) return;
    insertSlotAfter(selectedSlot);
  };

  const copySlot = () => {
    if (!selectedSlot) return;
    slotClipboard.current = cloneSlot(selectedSlot);
  };

  const pasteSlot = () => {
    const clip = slotClipboard.current;
    if (!clip) return;
    const next = cloneModel(model);
    const bar = next.bars[selected.barIndex];
    if (!bar || !bar.slots[selected.slotIndex]) return;
    bar.slots[selected.slotIndex] = cloneSlot(clip);
    update(next);
  };

  const removeSlot = () => {
    const next = cloneModel(model);
    const bar = next.bars[selected.barIndex];
    if (!bar) return;
    if (bar.slots.length <= 1) {
      bar.slots[0] = emptySlot();
    } else {
      bar.slots.splice(selected.slotIndex, 1);
    }
    update(next);
    setRawSelection({
      ...selected,
      slotIndex: Math.min(selected.slotIndex, bar.slots.length - 1),
    });
  };

  const insertBarAfter = (source?: Bar) => {
    const next = cloneModel(model);
    const insertAt = selected.barIndex + 1;
    next.bars.splice(
      insertAt,
      0,
      source
        ? { slots: source.slots.map(cloneSlot) }
        : { slots: [emptySlot()] },
    );
    update(next);
    setRawSelection({
      barIndex: insertAt,
      slotIndex: 0,
      string: selected.string,
    });
  };

  const duplicateBar = () => {
    if (!selectedBar) return;
    insertBarAfter(selectedBar);
  };

  const removeBar = () => {
    if (model.bars.length <= 1) return;
    const next = cloneModel(model);
    next.bars.splice(selected.barIndex, 1);
    update(next);
    setRawSelection({
      barIndex: Math.max(0, selected.barIndex - 1),
      slotIndex: 0,
      string: selected.string,
    });
  };

  const moveSelection = (direction: "left" | "right" | "up" | "down") => {
    if (direction === "up" || direction === "down") {
      const delta = direction === "up" ? -1 : 1;
      setRawSelection({
        ...selected,
        string: Math.max(1, Math.min(6, selected.string + delta)),
      });
      return;
    }
    const delta = direction === "right" ? 1 : -1;
    let { barIndex, slotIndex } = selected;
    slotIndex += delta;
    while (slotIndex < 0) {
      if (barIndex === 0) {
        slotIndex = 0;
        break;
      }
      barIndex -= 1;
      slotIndex = (model.bars[barIndex]?.slots.length ?? 1) - 1;
    }
    while (slotIndex >= (model.bars[barIndex]?.slots.length ?? 0)) {
      if (barIndex >= model.bars.length - 1) {
        slotIndex = (model.bars[barIndex]?.slots.length ?? 1) - 1;
        break;
      }
      barIndex += 1;
      slotIndex = 0;
    }
    setRawSelection({ ...selected, barIndex, slotIndex });
  };

  const handleDigit = (digit: string) => {
    const buf = fretBuffer.current;
    const hadDigits = buf.digits.length > 0;
    buf.digits = (buf.digits + digit).slice(-2);
    const fret = Number(buf.digits);
    if (Number.isFinite(fret)) setFret(fret, { coalesce: hadDigits });
    if (buf.timer !== null) window.clearTimeout(buf.timer);
    buf.timer = window.setTimeout(() => {
      fretBuffer.current = { digits: "", timer: null };
    }, 800);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const { key } = event;
    const lower = key.toLowerCase();

    if (event.metaKey || event.ctrlKey) {
      if (lower === "z") {
        event.preventDefault();
        flushFretBuffer();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (lower === "y") {
        event.preventDefault();
        flushFretBuffer();
        redo();
      } else if (lower === "c") {
        event.preventDefault();
        copySlot();
      } else if (lower === "v") {
        event.preventDefault();
        flushFretBuffer();
        pasteSlot();
      }
      return;
    }
    if (event.altKey) return;

    if (key === "ArrowUp") {
      event.preventDefault();
      flushFretBuffer();
      moveSelection("up");
    } else if (key === "ArrowDown") {
      event.preventDefault();
      flushFretBuffer();
      moveSelection("down");
    } else if (key === "ArrowLeft") {
      event.preventDefault();
      flushFretBuffer();
      moveSelection("left");
    } else if (key === "ArrowRight") {
      event.preventDefault();
      flushFretBuffer();
      moveSelection("right");
    } else if (key === "Delete" || key === "Backspace") {
      event.preventDefault();
      flushFretBuffer();
      clearNote();
    } else if (key === "Enter") {
      event.preventDefault();
      flushFretBuffer();
      if (event.shiftKey) {
        insertBarAfter();
      } else {
        insertSlotAfter();
      }
    } else if (key === "Escape") {
      event.preventDefault();
      flushFretBuffer();
    } else if (/^\d$/.test(key)) {
      event.preventDefault();
      handleDigit(key);
    } else if (event.repeat) {
      return;
    } else if (key === "+" || key === "=") {
      event.preventDefault();
      flushFretBuffer();
      stepDuration(1);
    } else if (key === "-") {
      event.preventDefault();
      flushFretBuffer();
      stepDuration(-1);
    } else if (key === ",") {
      event.preventDefault();
      flushFretBuffer();
      toggleTriplet();
    } else if (lower === "r") {
      event.preventDefault();
      flushFretBuffer();
      clearSlot();
    } else if (lower === "d") {
      event.preventDefault();
      flushFretBuffer();
      duplicateSlot();
    } else if (lower === "x") {
      event.preventDefault();
      flushFretBuffer();
      removeSlot();
    } else if (TECHNIQUE_BY_KEY.has(lower)) {
      event.preventDefault();
      flushFretBuffer();
      toggleTechnique(TECHNIQUE_BY_KEY.get(lower)!);
    }
  };

  const supportsToFret =
    selectedNote?.technique === "slide" ||
    selectedNote?.technique === "hammer" ||
    selectedNote?.technique === "pull";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-card/50 p-3">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={undo}
            disabled={!canUndo}
            title="Angre (Ctrl+Z)"
          >
            ↺ Angre
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={redo}
            disabled={!canRedo}
            title="Gjør om (Ctrl+Y)"
          >
            ↻ Gjør om
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs text-muted-foreground">Varighet</span>
          {DURATIONS.map((d) => (
            <Button
              key={d}
              type="button"
              size="sm"
              variant={selectedSlot?.duration === d ? "default" : "outline"}
              onClick={() => setDuration(d)}
            >
              {DURATION_LABELS[d]}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={selectedSlot?.triplet ? "default" : "outline"}
            onClick={toggleTriplet}
          >
            Triolett
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <span className="mr-1 text-xs text-muted-foreground">Teknikk</span>
          {TECHNIQUES.map((t) => {
            const active =
              t.id === "ghost"
                ? Boolean(selectedNote?.ghost)
                : selectedNote?.technique === t.id;
            return (
              <Button
                key={t.id}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => toggleTechnique(t.id)}
                disabled={!selectedNote}
                title={`${t.label} (${t.key.toUpperCase()})`}
              >
                {t.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => insertSlotAfter()}
            title="Nytt slag (Enter)"
          >
            + Slag
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={duplicateSlot}
            title="Dupliser slag (D)"
          >
            ⧉ Slag
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={removeSlot}
            title="Fjern slag (X)"
          >
            − Slag
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => insertBarAfter()}
            title="Ny takt (Shift+Enter)"
          >
            + Takt
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={duplicateBar}
            title="Dupliser takt"
          >
            ⧉ Takt
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={removeBar}
            disabled={model.bars.length <= 1}
            title="Fjern takt"
          >
            − Takt
          </Button>
        </div>
      </div>

      {supportsToFret && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-card/30 p-2">
          <Label className="text-xs text-muted-foreground">Til fret</Label>
          <Input
            type="number"
            value={selectedNote?.toFret ?? ""}
            onChange={(event) =>
              setToFret(
                event.target.value === "" ? undefined : Number(event.target.value),
              )
            }
            className="h-8 w-24"
          />
          <span className="text-xs text-muted-foreground">
            Brukes for slide / hammer-on / pull-off.
          </span>
        </div>
      )}

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="overflow-x-auto rounded-md border border-border bg-background p-3 outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <div className="flex items-start gap-3">
          <div className="mt-6 flex flex-col text-xs text-muted-foreground">
            {STRING_LABELS.map((label, i) => (
              <div
                key={i}
                className="flex h-9 items-center justify-end pr-1 font-mono"
              >
                {label}
              </div>
            ))}
            <div className="h-5" />
          </div>

          {model.bars.map((bar, barIndex) => {
            const used = barBeats(bar);
            const usedRounded = Math.round(used * 1000) / 1000;
            const overfull = usedRounded > beatsPerBar;
            const underfull = usedRounded < beatsPerBar;
            return (
              <div key={barIndex} className="flex flex-col">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>Takt {barIndex + 1}</span>
                  <span
                    className={
                      overfull
                        ? "font-medium text-destructive"
                        : underfull
                          ? "text-amber-600 dark:text-amber-500"
                          : ""
                    }
                    title={
                      overfull
                        ? "Takten har flere slag enn taktarten tillater"
                        : underfull
                          ? "Takten er ikke full ennå"
                          : "Takten er full"
                    }
                  >
                    {formatBeats(used)}/{formatBeats(beatsPerBar)}
                  </span>
                </div>
                <div className="flex border-l-2 border-border bg-card/30">
                  {bar.slots.map((slot, slotIndex) => {
                    const isSlotSelected =
                      selected.barIndex === barIndex &&
                      selected.slotIndex === slotIndex;
                    return (
                      <div
                        key={slotIndex}
                        className={`flex flex-col border-r border-border/60 ${
                          isSlotSelected ? "bg-primary/5" : ""
                        }`}
                      >
                        {STRING_NUMBERS.map((stringNumber) => {
                          const note = slot.notes[stringNumber];
                          const isCellSelected =
                            isSlotSelected && selected.string === stringNumber;
                          return (
                            <button
                              key={stringNumber}
                              type="button"
                              onClick={() => {
                                flushFretBuffer();
                                setRawSelection({
                                  barIndex,
                                  slotIndex,
                                  string: stringNumber,
                                });
                                containerRef.current?.focus();
                              }}
                              className={`relative flex h-9 w-12 items-center justify-center border-b border-border/40 font-mono text-sm transition-colors ${
                                isCellSelected
                                  ? "bg-primary/25 text-foreground ring-2 ring-inset ring-primary/70"
                                  : note
                                    ? "text-foreground hover:bg-muted/40"
                                    : "text-muted-foreground/40 hover:bg-muted/30"
                              }`}
                            >
                              {note ? (
                                <span
                                  className={
                                    note.ghost ? "italic opacity-70" : undefined
                                  }
                                >
                                  {note.fret}
                                  {typeof note.toFret === "number"
                                    ? `→${note.toFret}`
                                    : ""}
                                </span>
                              ) : (
                                "·"
                              )}
                              {note?.technique && (
                                <span className="absolute right-0.5 top-0 text-[8px] font-semibold uppercase text-primary">
                                  {note.technique[0]}
                                </span>
                              )}
                            </button>
                          );
                        })}
                        <div
                          className={`border-t border-border/60 px-1 py-0.5 text-center text-[10px] ${
                            isSlotSelected
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        >
                          {DURATION_LABELS[slot.duration]}
                          {slot.triplet ? "ᵗ" : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer select-none font-medium">
          Hurtigtaster
        </summary>
        <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
          {SHORTCUTS.map((shortcut) => (
            <li key={shortcut.keys} className="flex gap-2">
              <span className="min-w-28 font-mono text-foreground/80">
                {shortcut.keys}
              </span>
              <span>{shortcut.action}</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
