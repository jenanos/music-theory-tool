import { z } from "zod";

const optionalNullableString = z.string().trim().optional().nullable();

export const sectionInputSchema = z.object({
  id: z.string().trim().min(1, "Section id is required"),
  label: z.string().trim().min(1, "Section label is required"),
  description: optionalNullableString,
  chordLines: z.array(z.string()).optional().default([]),
  degreeLines: z.array(z.string()).optional().default([]),
  notes: optionalNullableString,
});

export const visibilitySchema = z.enum(["private", "group", "shared"]);

export const lickTechniqueSchema = z.enum([
  "slide",
  "hammer",
  "pull",
  "bend",
  "vibrato",
  "tie",
  "ghost",
  "string",
]);

export const lickFeelSchema = z.enum(["straight", "swing", "triplets"]);

export const lickEventSchema = z.object({
  bar: z.number().int().min(1),
  beat: z.number().min(1),
  duration: z.string().trim().min(1, "Duration is required"),
  string: z.number().int().min(1).max(6),
  fret: z.number().int().min(0),
  technique: lickTechniqueSchema.optional(),
  toFret: z.number().int().min(0).optional(),
  ghost: z.boolean().optional().default(false),
});

export const lickDataSchema = z.object({
  version: z.literal(1),
  meter: z.string().trim().min(1).optional().default("4/4"),
  feel: lickFeelSchema.optional().default("straight"),
  events: z.array(lickEventSchema).default([]),
});

export const lickCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  key: optionalNullableString,
  description: optionalNullableString,
  tags: z.array(z.string().trim().min(1)).optional().default([]),
  tuning: optionalNullableString,
  data: lickDataSchema,
  visibility: visibilitySchema.optional().default("private"),
  groupId: z.string().trim().min(1).optional().nullable(),
});

export const lickUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  key: optionalNullableString,
  description: optionalNullableString,
  tags: z.array(z.string().trim().min(1)).optional(),
  tuning: optionalNullableString,
  data: lickDataSchema.optional(),
  visibility: visibilitySchema.optional(),
  groupId: z.string().trim().min(1).optional().nullable(),
});

export const lickImportSchema = z.object({
  licks: z.array(lickCreateSchema).min(1, "At least one lick is required"),
});

export const songCreateSchema = z.object({
  id: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1, "Title is required"),
  artist: optionalNullableString,
  key: optionalNullableString,
  notes: optionalNullableString,
  arrangement: z.array(z.string()).optional().default([]),
  sections: z.array(sectionInputSchema).optional().default([]),
  visibility: visibilitySchema.optional().default("private"),
  groupId: z.string().trim().min(1).optional().nullable(),
});

export const songUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  artist: optionalNullableString,
  key: optionalNullableString,
  notes: optionalNullableString,
  arrangement: z.array(z.string()).optional(),
  sections: z.array(sectionInputSchema).optional(),
  visibility: visibilitySchema.optional(),
  groupId: z.string().trim().min(1).optional().nullable(),
});

export const progressionCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  tonic: z.string().trim().min(1, "Tonic is required"),
  mode: z.string().trim().min(1, "Mode is required"),
  sequence: z
    .array(z.string())
    .min(1, "Sequence must contain at least one chord"),
});

export const PAGE_IDS = [
  "chords",
  "progressions",
  "charts",
  "practice",
  "licks",
] as const;
export const pageIdSchema = z.enum(PAGE_IDS);

export const groupCreateSchema = z.object({
  name: z.string().trim().min(1, "Group name is required"),
  enabledPages: z
    .array(pageIdSchema)
    .optional()
    .default(["charts", "progressions"]),
});

export const groupUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  enabledPages: z.array(pageIdSchema).optional(),
});

export const groupMemberAddSchema = z.object({
  email: z.string().trim().toLowerCase().email("Valid email is required"),
  role: z.enum(["admin", "member"]).optional().default("member"),
});
