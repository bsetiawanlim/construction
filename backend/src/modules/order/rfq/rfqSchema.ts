import { z } from "zod";

export const orderStatusEnum = z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]);

// ── Create ───────────────────────────────────────────────────────────
export const createRfqSchema = z.object({
    vendorId:         z.number().int().positive("Vendor id must be greater than 0"),
    number:           z.string().min(1, "RFQ number is required"),
    title:            z.string().min(1, "RFQ title is required"),
    date:             z.string().datetime().optional(),
    dueDate:          z.string().datetime(),
    status:           orderStatusEnum,
    notes:            z.string().optional().nullable(),
    replyNumber:      z.string().nullish(),
    replyDate:        z.string().datetime().nullish(),
    replyExpiredDate: z.string().datetime().nullish(),
    replyNotes:       z.string().optional().nullable(),
});

// ── Create with Products (atomic) ────────────────────────────────────
const rfqProductLineSchema = z.object({
    productId:  z.number().int().positive("Product id must be greater than 0"),
    unitId:     z.number().int().positive().optional().nullable(),
    quantity:   z.number().positive("Quantity must be greater than 0"),
    replyPrice: z.number().min(0).optional(),
    notes:      z.string().optional().nullable(),
});

export const createRfqWithProductsSchema = createRfqSchema.extend({
    products: z.array(rfqProductLineSchema).min(1, "At least one product is required"),
});

// ── Update ───────────────────────────────────────────────────────────
export const updateRfqSchema = z.object({
    id:               z.number().int().positive("RFQ id must be greater than 0"),
    title:            z.string().min(1).optional(),
    date:             z.string().datetime().optional(),
    dueDate:          z.string().datetime().optional(),
    status:           orderStatusEnum.optional(),
    notes:            z.string().optional().nullable(),
    replyNumber:      z.string().min(1).optional(),
    replyDate:        z.string().datetime().optional(),
    replyExpiredDate: z.string().datetime().optional(),
    replyNotes:       z.string().optional().nullable(),
});

// ── Delete ───────────────────────────────────────────────────────────
export const deleteRfqSchema = z.object({
    id: z.number().int().positive("RFQ id must be greater than 0"),
});

// ── Get ──────────────────────────────────────────────────────────────
export const getRfqSchema = z.object({
    id: z.number().int().positive("RFQ id must be greater than 0"),
});

export type CreateRfqType             = z.infer<typeof createRfqSchema>;
export type CreateRfqWithProductsType = z.infer<typeof createRfqWithProductsSchema>;
export type UpdateRfqType             = z.infer<typeof updateRfqSchema>;
export type DeleteRfqType             = z.infer<typeof deleteRfqSchema>;
export type GetRfqType                = z.infer<typeof getRfqSchema>;
