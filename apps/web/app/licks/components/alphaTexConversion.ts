import type { LickData, LickEvent, LickTechnique } from "@repo/theory";

interface AlphaTabScoreLike {
  title?: string;
  tempo?: number;
  masterBars?: AlphaTabMasterBarLike[];
  tracks?: AlphaTabTrackLike[];
}

interface AlphaTabMasterBarLike {
  timeSignatureNumerator?: number;
  timeSignatureDenominator?: number;
}

interface AlphaTabTrackLike {
  staves?: AlphaTabStaffLike[];
}

interface AlphaTabStaffLike {
  bars?: AlphaTabBarLike[];
  tuningName?: string;
}

interface AlphaTabBarLike {
  voices?: AlphaTabVoiceLike[];
}

interface AlphaTabVoiceLike {
  beats?: AlphaTabBeatLike[];
}

interface AlphaTabBeatLike {
  duration?: number;
  dots?: number;
  displayStart?: number;
  tupletNumerator?: number;
  tupletDenominator?: number;
  vibrato?: number;
  isRest?: boolean;
  notes?: AlphaTabNoteLike[];
}

interface AlphaTabNoteLike {
  fret?: number;
  string?: number;
  isGhost?: boolean;
  slideOutType?: number;
  slideTarget?: AlphaTabNoteLike | null;
  slideOrigin?: AlphaTabNoteLike | null;
  bendType?: number;
  hasBend?: boolean;
  vibrato?: number;
  isHammerPullOrigin?: boolean;
  hammerPullDestination?: AlphaTabNoteLike | null;
  hammerPullOrigin?: AlphaTabNoteLike | null;
  isTieOrigin?: boolean;
  isTieDestination?: boolean;
  tieOrigin?: AlphaTabNoteLike | null;
}

const TICKS_PER_QUARTER = 960;

export async function alphaTexToLickData(alphaTex: string): Promise<LickData> {
  const alphaTab = await import("@coderline/alphatab");
  const score = alphaTab.importer.ScoreLoader.loadAlphaTex(
    alphaTex,
  ) as AlphaTabScoreLike;
  return scoreToLickData(score);
}

function scoreToLickData(score: AlphaTabScoreLike): LickData {
  const staff = score.tracks?.[0]?.staves?.[0];
  const masterBar = score.masterBars?.[0];
  const meter =
    masterBar?.timeSignatureNumerator && masterBar.timeSignatureDenominator
      ? `${masterBar.timeSignatureNumerator}/${masterBar.timeSignatureDenominator}`
      : "4/4";
  const events: LickEvent[] = [];

  staff?.bars?.forEach((bar, barIndex) => {
    const voice = bar.voices?.[0];

    voice?.beats?.forEach((beat, beatIndex) => {
      if (beat.isRest || !beat.notes || beat.notes.length === 0) return;

      const beatPosition =
        typeof beat.displayStart === "number"
          ? beat.displayStart / TICKS_PER_QUARTER + 1
          : beatIndex + 1;
      const duration = durationToToken(beat);

      for (const note of beat.notes) {
        if (shouldSkipTransitionDestination(note)) continue;
        if (typeof note.fret !== "number" || typeof note.string !== "number") {
          continue;
        }

        const event: LickEvent = {
          bar: barIndex + 1,
          beat: Number(beatPosition.toFixed(3)),
          duration,
          string: alphaTabStringToLickString(note.string),
          fret: note.fret,
        };
        const technique = detectTechnique(note, beat);
        const toFret = detectToFret(note);

        if (technique) event.technique = technique;
        if (typeof toFret === "number") event.toFret = toFret;
        if (note.isGhost) event.ghost = true;

        events.push(event);
      }
    });
  });

  return {
    version: 1,
    meter,
    feel: hasTriplets(events) ? "triplets" : "straight",
    events,
  };
}

function durationToToken(beat: AlphaTabBeatLike): string {
  const value =
    typeof beat.duration === "number" && Number.isFinite(beat.duration)
      ? Math.abs(beat.duration)
      : 4;
  const isTriplet = beat.tupletNumerator === 3 && beat.tupletDenominator === 2;
  const dotted = beat.dots && beat.dots > 0 ? "." : "";
  return `${value}${isTriplet ? "t" : dotted}`;
}

function alphaTabStringToLickString(string: number): number {
  return Math.max(1, Math.min(6, 7 - string));
}

function shouldSkipTransitionDestination(note: AlphaTabNoteLike): boolean {
  return Boolean(note.slideOrigin || note.hammerPullOrigin || note.tieOrigin);
}

function detectTechnique(
  note: AlphaTabNoteLike,
  beat: AlphaTabBeatLike,
): LickTechnique | undefined {
  if (note.slideOutType && note.slideOutType !== 0) return "slide";
  if (note.isHammerPullOrigin && note.hammerPullDestination) {
    const target = note.hammerPullDestination.fret;
    return typeof target === "number" && target < (note.fret ?? 0)
      ? "pull"
      : "hammer";
  }
  if ((note.bendType && note.bendType !== 0) || note.hasBend) return "bend";
  if (
    (note.vibrato && note.vibrato !== 0) ||
    (beat.vibrato && beat.vibrato !== 0)
  ) {
    return "vibrato";
  }
  if (note.isTieOrigin || note.isTieDestination) return "tie";
  if (note.isGhost) return "ghost";

  return undefined;
}

function detectToFret(note: AlphaTabNoteLike): number | undefined {
  if (typeof note.slideTarget?.fret === "number") return note.slideTarget.fret;
  if (typeof note.hammerPullDestination?.fret === "number") {
    return note.hammerPullDestination.fret;
  }
  return undefined;
}

function hasTriplets(events: LickEvent[]): boolean {
  return events.some((event) => String(event.duration ?? "").endsWith("t"));
}
