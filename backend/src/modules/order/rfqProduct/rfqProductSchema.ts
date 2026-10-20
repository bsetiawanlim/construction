import { z } from "zod";

// ── Create ───────────────────────────────────────────────────────────
export const createRfqProductSchema = z.object({
    rfqId:      z.number().int().positive("RFQ id must be greater than 0"),
    productId:  z.number().int().positive("Product id must be greater than 0"),
    unitId:     z.number().int().positive().optional().nullable(),
    quantity:   z.number().positive("Quantity must be greater than 0"),
    replyPrice: z.number().min(0, "Reply price must be 0 or greater").optional(),
    notes:      z.string().optional().nullable(),
});

// ── Update ───────────────────────────────────────────────────────────
export const updateRfqProductSchema = z.object({
    id:         z.number().int().positive("RFQ product id must be greater than 0"),
    unitId:     z.number().int().positive().optional().nullable(),
    quantity:   z.number().positive().optional(),
    replyPrice: z.number().min(0).optional(),
    notes:      z.string().optional().nullable(),
});

// ── Delete ───────────────────────────────────────────────────────────
export const deleteRfqProductSchema = z.object({
    id: z.number().int().positive("RFQ product id must be greater than 0"),
});

// ── Get ──────────────────────────────────────────────────────────────
export const getRfqProductSchema = z.object({
    rfqId: z.number().int().positive("RFQ id must be greater than 0"),
});

export type CreateRfqProductType = z.infer<typeof createRfqProductSchema>;
export type UpdateRfqProductType = z.infer<typeof updateRfqProductSchema>;
export type DeleteRfqProductType = z.infer<typeof deleteRfqProductSchema>;
export type GetRfqProductType    = z.infer<typeof getRfqProductSchema>;
