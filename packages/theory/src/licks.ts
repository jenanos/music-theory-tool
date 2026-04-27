import { parseKey, parseNoteName } from "./utils";

export const STANDARD_TUNING = ["E4", "B3", "G3", "D3", "A2", "E2"] as const;

export const SUPPORTED_LICK_TECHNIQUES = [
  "slide",
  "hammer",
  "pull",
  "bend",
  "vibrato",
  "tie",
  "ghost",
] as const;

export type LickTechnique = (typeof SUPPORTED_LICK_TECHNIQUES)[number];

export type LickDuration =
  | 1
  | 2
  | 4
  | 8
  | 16
  | 32
  | 64
  | 128
  | 256
  | "1"
  | "2"
  | "4"
  | "8"
  | "16"
  | "32"
  | "64"
  | "128"
  | "256"
  | "1t"
  | "2t"
  | "4t"
  | "8t"
  | "16t"
  | "32t"
  | "64t";

export interface LickEvent {
  type?: "note" | "rest" | "bar";
  bar?: number | boolean;
  beat?: number;
  string?: number;
  fret?: number;
  toFret?: number;
  duration?: LickDuration | string | number;
  technique?: LickTechnique | string;
  techniques?: Array<LickTechnique | string>;
  rest?: boolean;
  tie?: boolean;
  ghost?: boolean;
}

export interface LickData {
  version?: 1;
  meter?: string;
  feel?: "straight" | "swing" | "triplets";
  events: LickEvent[];
  tuning?: readonly string[];
  maxFret?: number;
  title?: string;
  tempo?: number;
  timeSignature?: [number, number];
}

export interface LickTranspositionOptions {
  maxFret?: number;
}

export interface LickTranspositionResult {
  data: LickData;
  warnings: string[];
}

export interface LickAlphaTexMetadata {
  title?: string;
  subtitle?: string;
  artist?: string;
  tempo?: number;
  timeSignature?: [number, number];
  tuning?: readonly string[];
}

const DEFAULT_MAX_FRET = 24;
const VALID_DURATIONS = new Set([
  "1",
  "2",
  "4",
  "8",
  "16",
  "32",
  "64",
  "128",
  "256",
]);
const SUPPORTED_TECHNIQUE_SET = new Set<string>(SUPPORTED_LICK_TECHNIQUES);

export function transposeLickData(
  data: LickData,
  sourceKey: string,
  targetKey: string,
  options: LickTranspositionOptions = {},
): LickTranspositionResult {
  const source = parseKey(sourceKey);
  const target = parseKey(targetKey);

  if (!source || !target) {
    return {
      data: cloneLickData(data),
      warnings: [`Could not parse key: ${!source ? sourceKey : targetKey}`],
    };
  }

  const semitones = compactSemitoneDistance(
    parseNoteName(source.tonic),
    parseNoteName(target.tonic),
  );
  const maxFret = options.maxFret ?? data.maxFret ?? DEFAULT_MAX_FRET;
  const warnings: string[] = [];

  const events = data.events.map((event, index) => {
    if (isBarEvent(event) || isRestEvent(event)) {
      return { ...event };
    }

    const next = { ...event };
    if (typeof next.fret === "number") {
      next.fret += semitones;
      addFretRangeWarning(warnings, index, "fret", next.fret, maxFret);
    }
    if (typeof next.toFret === "number") {
      next.toFret += semitones;
      addFretRangeWarning(warnings, index, "toFret", next.toFret, maxFret);
    }
    return next;
  });

  return {
    data: {
      ...data,
      events,
    },
    warnings,
  };
}

export function validateLickData(data: LickData): string[] {
  const warnings: string[] = [];
  const maxFret = data.maxFret ?? DEFAULT_MAX_FRET;

  data.events.forEach((event, index) => {
    if (isBarEvent(event)) return;

    for (const technique of getTechniques(event)) {
      if (!SUPPORTED_TECHNIQUE_SET.has(technique)) {
        warnings.push(`Event ${index}: unsupported technique "${technique}"`);
      }
    }

    if (!isRestEvent(event)) {
      if (
        !isPositiveInteger(event.string) ||
        event.string < 1 ||
        event.string > 6
      ) {
        warnings.push(`Event ${index}: string must be an integer from 1 to 6`);
      }
      if (typeof event.fret !== "number" || !Number.isFinite(event.fret)) {
        warnings.push(`Event ${index}: fret must be a finite number`);
      } else {
        addFretRangeWarning(warnings, index, "fret", event.fret, maxFret);
      }
      if (event.toFret !== undefined) {
        if (
          typeof event.toFret !== "number" ||
          !Number.isFinite(event.toFret)
        ) {
          warnings.push(`Event ${index}: toFret must be a finite number`);
        } else {
          addFretRangeWarning(warnings, index, "toFret", event.toFret, maxFret);
        }
      }
    }

    if (!isValidDuration(event.duration)) {
      warnings.push(
        `Event ${index}: duration must be one of 1, 2, 4, 8, 16, 32, 64, 128, 256 or a triplet token like 8t`,
      );
    }
  });

  return warnings;
}

export function lickDataToAlphaTex(
  data: LickData,
  metadata: LickAlphaTexMetadata = {},
): string {
  const header = buildAlphaTexHeader(data, metadata);
  const bodyEvents = data.events.flatMap((event, index, events) => {
    const previous = events[index - 1];
    const shouldInsertBar =
      index > 0 &&
      typeof event.bar === "number" &&
      typeof previous?.bar === "number" &&
      event.bar !== previous.bar;

    return [...(shouldInsertBar ? ["|"] : []), ...eventToAlphaTex(event)];
  });
  const body = bodyEvents.join(" ");

  return [...header, body].filter(Boolean).join("\n");
}

function cloneLickData(data: LickData): LickData {
  return {
    ...data,
    events: data.events.map((event) => ({ ...event })),
  };
}

function buildAlphaTexHeader(
  data: LickData,
  metadata: LickAlphaTexMetadata,
): string[] {
  const title = metadata.title ?? data.title;
  const tempo = metadata.tempo ?? data.tempo;
  const timeSignature =
    metadata.timeSignature ?? data.timeSignature ?? parseMeter(data.meter);
  const tuning = metadata.tuning ?? data.tuning ?? STANDARD_TUNING;
  const header: string[] = [];

  if (title) header.push(`\\title ${quoteAlphaTexString(title)}`);
  if (metadata.subtitle)
    header.push(`\\subtitle ${quoteAlphaTexString(metadata.subtitle)}`);
  if (metadata.artist)
    header.push(`\\artist ${quoteAlphaTexString(metadata.artist)}`);
  if (tempo !== undefined) header.push(`\\tempo ${tempo}`);
  if (timeSignature)
    header.push(`\\ts ${timeSignature[0]} ${timeSignature[1]}`);
  header.push(`\\tuning (${tuning.join(" ")})`);

  return header;
}

function eventToAlphaTex(event: LickEvent): string[] {
  if (isBarEvent(event)) return ["|"];

  const duration = durationToAlphaTex(event.duration);
  const durationSuffix = duration.triplet
    ? `.${duration.value} { tu 3 }`
    : `.${duration.value}`;

  if (isRestEvent(event)) {
    return [`r${durationSuffix}`];
  }

  const stringNumber = event.string ?? 1;
  const effects = effectsToAlphaTex(event);
  const fret = event.tie ? "-" : event.fret;
  const note = `${fret}.${stringNumber}${durationSuffix}${effects}`;

  // Transition techniques need a following target note for alphaTab to draw the line.
  if (event.toFret !== undefined && hasTransitionTechnique(event)) {
    return [note, `${event.toFret}.${stringNumber}${durationSuffix}`];
  }

  return [note];
}

function durationToAlphaTex(duration: LickEvent["duration"]): {
  value: string;
  triplet: boolean;
} {
  const raw = duration === undefined ? "4" : String(duration).trim();
  const triplet = raw.endsWith("t");
  const value = triplet ? raw.slice(0, -1) : raw;

  return {
    value: VALID_DURATIONS.has(value) ? value : "4",
    triplet,
  };
}

function effectsToAlphaTex(event: LickEvent): string {
  const effects: string[] = [];
  const techniques = getTechniques(event);

  // alphaTab shares {h} for hammer-ons and pull-offs; direction comes from fret movement.
  if (techniques.includes("slide")) effects.push("sl");
  if (techniques.includes("hammer") || techniques.includes("pull"))
    effects.push("h");
  if (techniques.includes("bend")) effects.push("b (0 4)");
  if (techniques.includes("vibrato")) effects.push("v");
  if (techniques.includes("tie") || event.tie) effects.push("t");
  if (techniques.includes("ghost") || event.ghost) effects.push("g");

  return effects.length > 0 ? `{${effects.join(" ")}}` : "";
}

function getTechniques(event: LickEvent): string[] {
  return [
    event.technique,
    ...(event.techniques ?? []),
    event.tie ? "tie" : undefined,
    event.ghost ? "ghost" : undefined,
  ].filter(
    (technique): technique is string =>
      typeof technique === "string" && technique.length > 0,
  );
}

function hasTransitionTechnique(event: LickEvent): boolean {
  const techniques = getTechniques(event);
  return (
    techniques.includes("slide") ||
    techniques.includes("hammer") ||
    techniques.includes("pull")
  );
}

function isBarEvent(event: LickEvent): boolean {
  return event.type === "bar" || event.bar === true;
}

function isRestEvent(event: LickEvent): boolean {
  return event.type === "rest" || event.rest === true;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidDuration(duration: LickEvent["duration"]): boolean {
  if (duration === undefined) return true;

  const raw = String(duration).trim();
  const value = raw.endsWith("t") ? raw.slice(0, -1) : raw;
  return VALID_DURATIONS.has(value);
}

function addFretRangeWarning(
  warnings: string[],
  eventIndex: number,
  field: "fret" | "toFret",
  fret: number,
  maxFret: number,
): void {
  if (fret < 0) {
    warnings.push(`Event ${eventIndex}: ${field} ${fret} is below 0`);
  } else if (fret > maxFret) {
    warnings.push(
      `Event ${eventIndex}: ${field} ${fret} is above max fret ${maxFret}`,
    );
  }
}

function compactSemitoneDistance(sourcePc: number, targetPc: number): number {
  const upward = (((targetPc - sourcePc) % 12) + 12) % 12;
  return upward > 6 ? upward - 12 : upward;
}

function quoteAlphaTexString(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function parseMeter(meter: string | undefined): [number, number] | undefined {
  if (!meter) return undefined;

  const match = meter.trim().match(/^(\d+)\s*\/\s*(\d+)$/);
  if (!match) return undefined;

  return [Number(match[1]), Number(match[2])];
}
