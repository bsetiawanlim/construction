import { z } from "zod";

export const offerStatusEnum = z.enum([
    "DRAFT",
    "SENT",
    "REVISED",
    "ACCEPTED",
    "REJECTED",
    "EXPIRED",
    "CANCELLED",
]);

// ── Create ────────────────────────────────────────────────────────────
export const createWorkOfferSchema = z.object({
    offerNumber:        z.string().min(1, "Offer number is required"),
    customerId:         z.number().int().positive("Customer id must be greater than 0"),
    currency:           z.string().max(3).optional(),
    notes:              z.string().optional().nullable(),
    dateIssued:         z.string().datetime({ offset: true }),
    validUntil:         z.string().datetime({ offset: true }),
    status:             offerStatusEnum,
    totalPrice:         z.number().positive("Total price must be greater than 0"),
    includeOverhead:    z.boolean().optional(),
    overHeadPercentage: z.number().min(0),
    overHeadAmount:     z.number().min(0),
    includeProfit:      z.boolean().optional(),
    profitPercentage:   z.number().min(0),
    profitAmount:       z.number().min(0),
    includeDiscount:    z.boolean().optional(),
    discountPercentage: z.number().min(0),
    discountAmount:     z.number().min(0),
    includeTax:         z.boolean().optional(),
    taxPercentage:      z.number().min(0),
    taxAmount:          z.number().min(0),
    grandTotal:         z.number().min(0),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateWorkOfferSchema = z.object({
    id:                 z.number().int().positive("WorkOffer id must be greater than 0"),
    offerNumber:        z.string().min(1).optional(),
    customerId:         z.number().int().positive().optional(),
    currency:           z.string().max(3).optional(),
    notes:              z.string().optional().nullable(),
    dateIssued:         z.string().datetime({ offset: true }).optional(),
    validUntil:         z.string().datetime({ offset: true }).optional(),
    status:             offerStatusEnum.optional(),
    totalPrice:         z.number().positive().optional(),
    includeOverhead:    z.boolean().optional(),
    overHeadPercentage: z.number().min(0).optional(),
    overHeadAmount:     z.number().min(0).optional(),
    includeProfit:      z.boolean().optional(),
    profitPercentage:   z.number().min(0).optional(),
    profitAmount:       z.number().min(0).optional(),
    includeDiscount:    z.boolean().optional(),
    discountPercentage: z.number().min(0).optional(),
    discountAmount:     z.number().min(0).optional(),
    includeTax:         z.boolean().optional(),
    taxPercentage:      z.number().min(0).optional(),
    taxAmount:          z.number().min(0).optional(),
    grandTotal:         z.number().min(0).optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteWorkOfferSchema = z.object({
    id: z.number().int().positive("WorkOffer id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getWorkOfferSchema = z.object({
    id: z.number().int().positive("WorkOffer id must be greater than 0"),
});

export type CreateWorkOfferType = z.infer<typeof createWorkOfferSchema>;
export type UpdateWorkOfferType = z.infer<typeof updateWorkOfferSchema>;
export type DeleteWorkOfferType = z.infer<typeof deleteWorkOfferSchema>;
export type GetWorkOfferType    = z.infer<typeof getWorkOfferSchema>;
