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
    sequence: z.array(z.string()).min(1, "Sequence must contain at least one chord"),
});

export const PAGE_IDS = ["chords", "progressions", "charts", "practice"] as const;
export const pageIdSchema = z.enum(PAGE_IDS);

export const groupCreateSchema = z.object({
    name: z.string().trim().min(1, "Group name is required"),
    enabledPages: z.array(pageIdSchema).optional().default(["charts", "progressions"]),
});

export const groupUpdateSchema = z.object({
    name: z.string().trim().min(1).optional(),
    enabledPages: z.array(pageIdSchema).optional(),
});

export const groupMemberAddSchema = z.object({
    email: z.string().trim().toLowerCase().email("Valid email is required"),
    role: z.enum(["admin", "member"]).optional().default("member"),
});
