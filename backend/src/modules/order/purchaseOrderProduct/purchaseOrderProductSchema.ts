import { z } from "zod";

// ── Create ───────────────────────────────────────────────────────────
export const createPurchaseOrderProductSchema = z.object({
    purchaseOrderId: z.number().int().positive("Purchase order id must be greater than 0"),
    productId:       z.number().int().positive("Product id must be greater than 0"),
    unitId:          z.number().int().positive().optional().nullable(),
    quantity:        z.number().positive("Quantity must be greater than 0"),
    price:           z.number().min(0, "Price must be 0 or greater"),
    notes:           z.string().optional().nullable(),
});

// ── Update ───────────────────────────────────────────────────────────
export const updatePurchaseOrderProductSchema = z.object({
    id:       z.number().int().positive("Purchase order product id must be greater than 0"),
    unitId:   z.number().int().positive().optional().nullable(),
    quantity: z.number().positive().optional(),
    price:    z.number().min(0).optional(),
    notes:    z.string().optional().nullable(),
});

// ── Delete ───────────────────────────────────────────────────────────
export const deletePurchaseOrderProductSchema = z.object({
    id: z.number().int().positive("Purchase order product id must be greater than 0"),
});

// ── Get ──────────────────────────────────────────────────────────────
export const getPurchaseOrderProductSchema = z.object({
    purchaseOrderId: z.number().int().positive("Purchase order id must be greater than 0"),
});

export type CreatePurchaseOrderProductType = z.infer<typeof createPurchaseOrderProductSchema>;
export type UpdatePurchaseOrderProductType = z.infer<typeof updatePurchaseOrderProductSchema>;
export type DeletePurchaseOrderProductType = z.infer<typeof deletePurchaseOrderProductSchema>;
export type GetPurchaseOrderProductType    = z.infer<typeof getPurchaseOrderProductSchema>;
