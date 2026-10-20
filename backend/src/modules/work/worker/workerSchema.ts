import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createWorkerSchema = z.object({
    name:        z.string().min(1, "Name is required"),
    description: z.string().optional(),
    unitId:      z.number().int().positive().optional(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateWorkerSchema = z.object({
    id:          z.number().int().positive("Worker id must be greater than 0"),
    name:        z.string().min(1).optional(),
    description: z.string().optional(),
    unitId:      z.number().int().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteWorkerSchema = z.object({
    id: z.number().int().positive("Worker id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getWorkerSchema = z.object({
    id: z.number().int().positive("Worker id must be greater than 0"),
});

export type CreateWorkerType = z.infer<typeof createWorkerSchema>;
export type UpdateWorkerType = z.infer<typeof updateWorkerSchema>;
export type DeleteWorkerType = z.infer<typeof deleteWorkerSchema>;
export type GetWorkerType    = z.infer<typeof getWorkerSchema>;
