import { z } from "zod";

const optionalNullableString = z.string().trim().optional().nullable();

export const sectionInputSchema = z.object({
    id: z.string().trim().min(1, "Section id is required"),
    label: z.string().trim().min(1, "Section label is required"),
    chordLines: z.array(z.string()).optional().default([]),
    degreeLines: z.array(z.string()).optional().default([]),
    notes: optionalNullableString,
});

export const songCreateSchema = z.object({
    id: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1, "Title is required"),
    artist: optionalNullableString,
    key: optionalNullableString,
    notes: optionalNullableString,
    arrangement: z.array(z.string()).optional().default([]),
    sections: z.array(sectionInputSchema).optional().default([]),
});

export const songUpdateSchema = z.object({
    title: z.string().trim().min(1).optional(),
    artist: optionalNullableString,
    key: optionalNullableString,
    notes: optionalNullableString,
    arrangement: z.array(z.string()).optional(),
    sections: z.array(sectionInputSchema).optional(),
});

export const progressionCreateSchema = z.object({
    name: z.string().trim().min(1, "Name is required"),
    tonic: z.string().trim().min(1, "Tonic is required"),
    mode: z.string().trim().min(1, "Mode is required"),
    sequence: z.array(z.string()).min(1, "Sequence must contain at least one chord"),
});
