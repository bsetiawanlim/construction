import { z } from "zod";

// ── Create ───────────────────────────────────────────────────────────────────
export const createSalesOrderItemSchema = z.object({
    salesOrderId: z.number().int().positive("Sales order id must be greater than 0"),
    productId: z.number().int().positive("Product id must be greater than 0"),
    unitId: z.number().int().positive("Unit id must be greater than 0").optional().nullable(),
    quantity: z.number().positive("Quantity must be greater than 0"),
    unitPrice: z.number().min(0, "Unit price must be 0 or greater").optional(),
    discountPercentage: z.number().min(0).max(100).optional().default(0),
    notes: z.string().optional().nullable(),
});

// ── Update ───────────────────────────────────────────────────────────────────
export const updateSalesOrderItemSchema = z.object({
    id: z.number().int().positive("Sales order item id must be greater than 0"),
    unitId: z.number().int().positive("Unit id must be greater than 0").optional().nullable(),
    quantity: z.number().positive("Quantity must be greater than 0").optional(),
    unitPrice: z.number().min(0, "Unit price must be 0 or greater").optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    notes: z.string().optional().nullable(),
});

// ── Delete ───────────────────────────────────────────────────────────────────
export const deleteSalesOrderItemSchema = z.object({
    id: z.number().int().positive("Sales order item id must be greater than 0"),
});

// ── Get Single ───────────────────────────────────────────────────────────────
export const getSalesOrderItemSchema = z.object({
    id: z.number().int().positive("Sales order item id must be greater than 0"),
});

// ── List by Sales Order ──────────────────────────────────────────────────────
export const listSalesOrderItemsSchema = z.object({
    salesOrderId: z.number().int().positive("Sales order id must be greater than 0"),
});

// ── Types ────────────────────────────────────────────────────────────────────
export type CreateSalesOrderItemType = z.infer<typeof createSalesOrderItemSchema>;
export type UpdateSalesOrderItemType = z.infer<typeof updateSalesOrderItemSchema>;
export type DeleteSalesOrderItemType = z.infer<typeof deleteSalesOrderItemSchema>;
export type GetSalesOrderItemType = z.infer<typeof getSalesOrderItemSchema>;
export type ListSalesOrderItemsType = z.infer<typeof listSalesOrderItemsSchema>;
