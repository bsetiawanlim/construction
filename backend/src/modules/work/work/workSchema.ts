import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createWorkSchema = z.object({
    name:        z.string().min(1, "Name is required").max(100),
    description: z.string().optional(),
    unitId:      z.number().int().positive().optional(),
    unitPrice:   z.number().positive("Unit price must be greater than 0"),
    amount:      z.number().positive("Amount must be greater than 0"),
    totalPrice:  z.number().positive("Total price must be greater than 0"),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateWorkSchema = z.object({
    id:          z.number().int().positive("Work id must be greater than 0"),
    name:        z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    unitId:      z.number().int().positive().optional(),
    unitPrice:   z.number().positive().optional(),
    amount:      z.number().positive().optional(),
    totalPrice:  z.number().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteWorkSchema = z.object({
    id: z.number().int().positive("Work id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getWorkSchema = z.object({
    id: z.number().int().positive("Work id must be greater than 0"),
});

export type CreateWorkType = z.infer<typeof createWorkSchema>;
export type UpdateWorkType = z.infer<typeof updateWorkSchema>;
export type DeleteWorkType = z.infer<typeof deleteWorkSchema>;
export type GetWorkType    = z.infer<typeof getWorkSchema>;
