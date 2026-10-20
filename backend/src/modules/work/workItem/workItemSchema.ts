import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createWorkItemSchema = z.object({
    workId:     z.number().int().positive("Work id must be greater than 0"),
    itemId:     z.number().int().positive("Item id must be greater than 0"),
    unitPrice:  z.number().positive("Unit price must be greater than 0"),
    amount:     z.number().positive("Amount must be greater than 0"),
    totalPrice: z.number().positive("Total price must be greater than 0"),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateWorkItemSchema = z.object({
    id:         z.number().int().positive("WorkItem id must be greater than 0"),
    unitPrice:  z.number().positive().optional(),
    amount:     z.number().positive().optional(),
    totalPrice: z.number().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteWorkItemSchema = z.object({
    id: z.number().int().positive("WorkItem id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getWorkItemSchema = z.object({
    id: z.number().int().positive("WorkItem id must be greater than 0"),
});

// ── Get by Work ───────────────────────────────────────────────────────
export const getWorkItemsByWorkSchema = z.object({
    workId: z.number().int().positive("Work id must be greater than 0"),
});

export type CreateWorkItemType        = z.infer<typeof createWorkItemSchema>;
export type UpdateWorkItemType        = z.infer<typeof updateWorkItemSchema>;
export type DeleteWorkItemType        = z.infer<typeof deleteWorkItemSchema>;
export type GetWorkItemType           = z.infer<typeof getWorkItemSchema>;
export type GetWorkItemsByWorkType    = z.infer<typeof getWorkItemsByWorkSchema>;
