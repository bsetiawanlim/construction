import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createItemSchema = z.object({
    productId:   z.number().int().positive("Product id must be greater than 0"),
    description: z.string().optional(),
    unitId:      z.number().int().positive().optional().nullable(),
    unit:        z.number().int().positive().optional().nullable(), // alias for unitId
    unitPrice:   z.number().positive("Unit price must be greater than 0"),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateItemSchema = z.object({
    id:          z.number().int().positive("Item id must be greater than 0"),
    description: z.string().optional(),
    unitId:      z.number().int().positive().optional().nullable(),
    unit:        z.number().int().positive().optional().nullable(), // alias for unitId
    unitPrice:   z.number().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteItemSchema = z.object({
    id: z.number().int().positive("Item id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getItemSchema = z.object({
    id: z.number().int().positive("Item id must be greater than 0"),
});

// ── Get by Product ────────────────────────────────────────────────────
export const getItemsByProductSchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
});

export type CreateItemType        = z.infer<typeof createItemSchema>;
export type UpdateItemType        = z.infer<typeof updateItemSchema>;
export type DeleteItemType        = z.infer<typeof deleteItemSchema>;
export type GetItemType           = z.infer<typeof getItemSchema>;
export type GetItemsByProductType = z.infer<typeof getItemsByProductSchema>;
