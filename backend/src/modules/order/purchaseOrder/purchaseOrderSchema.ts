import { z } from "zod";

export const orderStatusEnum = z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]);

// ── Product Line Item Schema for Purchase Orders ─────────────────────
export const purchaseOrderProductLineSchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
    unitId:    z.number().int().positive().optional().nullable(),
    quantity:  z.number().positive("Quantity must be greater than 0"),
    price:     z.number().min(0, "Price must be 0 or greater").optional(),
    notes:     z.string().optional().nullable(),
});

// ── Create ───────────────────────────────────────────────────────────
export const createPurchaseOrderSchema = z.object({
    rfqId:                 z.number().int().positive("RFQ id must be greater than 0"),
    vendorId:              z.number().int().positive("Vendor id must be greater than 0"),
    destinationFacilityId: z.number().int().positive().optional().nullable(),
    number:                z.string().min(1, "Purchase order number is required"),
    title:                 z.string().min(1, "Title is required"),
    date:                  z.string().datetime().optional(),
    dueDate:               z.string().datetime(),
    status:                orderStatusEnum,
    notes:                 z.string().optional().nullable(),
    totalAmount:           z.number().min(0).optional(),
    products:              z.array(purchaseOrderProductLineSchema).optional(),
});

// ── Update ───────────────────────────────────────────────────────────
export const updatePurchaseOrderSchema = z.object({
    id:                    z.number().int().positive("Purchase order id must be greater than 0"),
    destinationFacilityId: z.number().int().positive().optional().nullable(),
    title:                 z.string().min(1).optional(),
    date:                  z.string().datetime().optional(),
    dueDate:               z.string().datetime().optional(),
    status:                orderStatusEnum.optional(),
    notes:                 z.string().optional().nullable(),
    totalAmount:           z.number().min(0).optional(),
    products:              z.array(purchaseOrderProductLineSchema).optional(),
});

// ── Delete ───────────────────────────────────────────────────────────
export const deletePurchaseOrderSchema = z.object({
    id: z.number().int().positive("Purchase order id must be greater than 0"),
});

// ── Get ──────────────────────────────────────────────────────────────
export const getPurchaseOrderSchema = z.object({
    id: z.number().int().positive("Purchase order id must be greater than 0"),
});

export type PurchaseOrderProductLineType = z.infer<typeof purchaseOrderProductLineSchema>;
export type CreatePurchaseOrderType      = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderType      = z.infer<typeof updatePurchaseOrderSchema>;
export type DeletePurchaseOrderType      = z.infer<typeof deletePurchaseOrderSchema>;
export type GetPurchaseOrderType         = z.infer<typeof getPurchaseOrderSchema>;
