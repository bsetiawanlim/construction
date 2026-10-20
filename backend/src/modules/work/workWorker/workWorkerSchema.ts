import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createWorkWorkerSchema = z.object({
    workId:     z.number().int().positive("Work id must be greater than 0"),
    workerId:   z.number().int().positive("Worker id must be greater than 0"),
    unitPrice:  z.number().positive("Unit price must be greater than 0"),
    amount:     z.number().positive("Amount must be greater than 0"),
    totalPrice: z.number().positive("Total price must be greater than 0"),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateWorkWorkerSchema = z.object({
    workId:     z.number().int().positive("Work id must be greater than 0"),
    workerId:   z.number().int().positive("Worker id must be greater than 0"),
    unitPrice:  z.number().positive().optional(),
    amount:     z.number().positive().optional(),
    totalPrice: z.number().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteWorkWorkerSchema = z.object({
    workId:   z.number().int().positive("Work id must be greater than 0"),
    workerId: z.number().int().positive("Worker id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getWorkWorkerSchema = z.object({
    workId:   z.number().int().positive("Work id must be greater than 0"),
    workerId: z.number().int().positive("Worker id must be greater than 0"),
});

// ── Get by Work ───────────────────────────────────────────────────────
export const getWorkWorkersByWorkSchema = z.object({
    workId: z.number().int().positive("Work id must be greater than 0"),
});

export type CreateWorkWorkerType        = z.infer<typeof createWorkWorkerSchema>;
export type UpdateWorkWorkerType        = z.infer<typeof updateWorkWorkerSchema>;
export type DeleteWorkWorkerType        = z.infer<typeof deleteWorkWorkerSchema>;
export type GetWorkWorkerType           = z.infer<typeof getWorkWorkerSchema>;
export type GetWorkWorkersByWorkType    = z.infer<typeof getWorkWorkersByWorkSchema>;
