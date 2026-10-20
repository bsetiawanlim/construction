import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createWorkOfferItemSchema = z.object({
    workOfferId: z.number().int().positive("WorkOffer id must be greater than 0"),
    workId:      z.number().int().positive("Work id must be greater than 0"),
    unitPrice:   z.number().positive("Unit price must be greater than 0"),
    amount:      z.number().positive("Amount must be greater than 0"),
    totalPrice:  z.number().positive("Total price must be greater than 0"),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateWorkOfferItemSchema = z.object({
    id:          z.number().int().positive("WorkOfferItem id must be greater than 0"),
    unitPrice:   z.number().positive().optional(),
    amount:      z.number().positive().optional(),
    totalPrice:  z.number().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteWorkOfferItemSchema = z.object({
    id: z.number().int().positive("WorkOfferItem id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getWorkOfferItemSchema = z.object({
    id: z.number().int().positive("WorkOfferItem id must be greater than 0"),
});

// ── Get by WorkOffer ──────────────────────────────────────────────────
export const getWorkOfferItemsByOfferSchema = z.object({
    workOfferId: z.number().int().positive("WorkOffer id must be greater than 0"),
});

export type CreateWorkOfferItemType        = z.infer<typeof createWorkOfferItemSchema>;
export type UpdateWorkOfferItemType        = z.infer<typeof updateWorkOfferItemSchema>;
export type DeleteWorkOfferItemType        = z.infer<typeof deleteWorkOfferItemSchema>;
export type GetWorkOfferItemType           = z.infer<typeof getWorkOfferItemSchema>;
export type GetWorkOfferItemsByOfferType   = z.infer<typeof getWorkOfferItemsByOfferSchema>;
