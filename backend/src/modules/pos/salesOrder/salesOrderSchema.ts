import { z } from "zod";
import { paginationQuerySchema } from "../../../utils/pagination";

// ── Create Sales Order Item Input (Optional nested during order create) ──────
export const nestedSalesOrderItemSchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
    unitId: z.number().int().positive("Unit id must be greater than 0").optional().nullable(),
    quantity: z.number().positive("Quantity must be greater than 0"),
    unitPrice: z.number().min(0, "Unit price must be 0 or greater").optional(),
    discountPercentage: z.number().min(0).max(100).optional().default(0),
    notes: z.string().optional().nullable(),
});

// ── Create ───────────────────────────────────────────────────────────────────
export const createSalesOrderSchema = z.object({
    customerId: z.number().int().positive("Customer id must be greater than 0").optional().nullable(),
    facilityId: z.number().int().positive("Facility id must be greater than 0").optional().nullable(),
    tableNumber: z.string().max(50).optional().nullable(),
    orderDate: z.string().datetime().optional().nullable(),
    currency: z.string().length(3, "Currency must be a 3-letter code").optional().default("IDR"),
    includeDiscount: z.boolean().optional().default(false),
    discountPercentage: z.number().min(0).max(100).optional().default(0),
    includeTax: z.boolean().optional().default(false),
    taxPercentage: z.number().min(0).max(100).optional().default(0),
    notes: z.string().optional().nullable(),
    items: z.array(nestedSalesOrderItemSchema).optional().default([]),
});

// ── Update ───────────────────────────────────────────────────────────────────
export const updateSalesOrderSchema = z.object({
    id: z.number().int().positive("Sales order id must be greater than 0"),
    customerId: z.number().int().positive("Customer id must be greater than 0").optional().nullable(),
    facilityId: z.number().int().positive("Facility id must be greater than 0").optional().nullable(),
    tableNumber: z.string().max(50).optional().nullable(),
    orderDate: z.string().datetime().optional().nullable(),
    currency: z.string().length(3, "Currency must be a 3-letter code").optional(),
    includeDiscount: z.boolean().optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    includeTax: z.boolean().optional(),
    taxPercentage: z.number().min(0).max(100).optional(),
    notes: z.string().optional().nullable(),
});

// ── Delete ───────────────────────────────────────────────────────────────────
export const deleteSalesOrderSchema = z.object({
    id: z.number().int().positive("Sales order id must be greater than 0"),
});

// ── Get Single ───────────────────────────────────────────────────────────────
export const getSalesOrderSchema = z.object({
    id: z.number().int().positive("Sales order id must be greater than 0"),
});

// ── Complete ─────────────────────────────────────────────────────────────────
export const completeSalesOrderSchema = z.object({
    id: z.number().int().positive("Sales order id must be greater than 0"),
});

// ── Void ─────────────────────────────────────────────────────────────────────
export const voidSalesOrderSchema = z.object({
    id: z.number().int().positive("Sales order id must be greater than 0"),
    notes: z.string().optional().nullable(),
});

// ── Refund ───────────────────────────────────────────────────────────────────
export const refundSalesOrderSchema = z.object({
    id: z.number().int().positive("Sales order id must be greater than 0"),
    notes: z.string().optional().nullable(),
});

// ── Table Order (Barcode / QR Code Table Self-Ordering) ──────────────────────
export const createTableOrderSchema = z.object({
    facilityId: z.number().int().positive("Facility id must be greater than 0"),
    tableNumber: z.string().min(1, "Table number is required").max(50),
    customerName: z.string().max(100).optional().nullable(),
    customerPhone: z.string().max(30).optional().nullable(),
    customerEmail: z.string().max(100).optional().nullable(),
    notes: z.string().optional().nullable(),
    items: z.array(nestedSalesOrderItemSchema).min(1, "At least one item is required in the order"),
    paymentMethod: z.enum(["EWALLET", "BANK_TRANSFER", "CARD", "CASH"]).optional().nullable(),
    paymentProvider: z.string().max(50).optional().nullable(),
    referenceNumber: z.string().max(100).optional().nullable(),
    isPaid: z.boolean().optional().default(false),
});

export const payTableOrderSchema = z.object({
    salesOrderId: z.number().int().positive("Sales order id must be greater than 0"),
    paymentMethod: z.enum(["EWALLET", "BANK_TRANSFER", "CARD", "CASH"]),
    paymentProvider: z.string().max(50).optional().nullable(),
    referenceNumber: z.string().max(100).optional().nullable(),
});

export const getTableOrderStatusSchema = z.object({
    salesOrderId: z.coerce.number().int().positive("Sales order id must be greater than 0"),
});

export const getTableMenuSchema = z.object({
    facilityId: z.coerce.number().int().positive().optional().nullable(),
});

export const checkTableDinerSchema = z.object({
    email: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    name: z.string().optional().nullable(),
});

// ── Query (All) ──────────────────────────────────────────────────────────────
export const salesOrderQuerySchema = paginationQuerySchema.extend({
    status: z.enum(["DRAFT", "COMPLETED", "VOID", "REFUNDED"]).optional(),
    customerId: z.coerce.number().int().positive().optional(),
    facilityId: z.coerce.number().int().positive().optional().nullable(),
    tableNumber: z.string().optional().nullable(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

// ── Daily / Range Summary Query ──────────────────────────────────────────────
export const dailySalesSummarySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    facilityId: z.coerce.number().int().positive().optional().nullable(),
});

// ── Product Sales Report Query ───────────────────────────────────────────────
export const productSalesReportSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    facilityId: z.coerce.number().int().positive().optional().nullable(),
    limit: z.coerce.number().int().min(1).max(100).default(10).optional(),
});

// ── Types ────────────────────────────────────────────────────────────────────
export type CreateSalesOrderType = z.infer<typeof createSalesOrderSchema>;
export type UpdateSalesOrderType = z.infer<typeof updateSalesOrderSchema>;
export type DeleteSalesOrderType = z.infer<typeof deleteSalesOrderSchema>;
export type GetSalesOrderType = z.infer<typeof getSalesOrderSchema>;
export type CompleteSalesOrderType = z.infer<typeof completeSalesOrderSchema>;
export type VoidSalesOrderType = z.infer<typeof voidSalesOrderSchema>;
export const sendTableReceiptSchema = z.object({
    salesOrderId: z.number().int().positive("salesOrderId must be positive"),
    channel: z.enum(["WHATSAPP", "EMAIL"]),
    destination: z.string().min(1, "destination is required"),
    customerName: z.string().optional().nullable(),
});

export type RefundSalesOrderType = z.infer<typeof refundSalesOrderSchema>;
export type CreateTableOrderType = z.infer<typeof createTableOrderSchema>;
export type PayTableOrderType = z.infer<typeof payTableOrderSchema>;
export type GetTableOrderStatusType = z.infer<typeof getTableOrderStatusSchema>;
export type GetTableMenuType = z.infer<typeof getTableMenuSchema>;
export type CheckTableDinerType = z.infer<typeof checkTableDinerSchema>;
export type SendTableReceiptType = z.infer<typeof sendTableReceiptSchema>;
export type SalesOrderQueryType = z.infer<typeof salesOrderQuerySchema>;
export type DailySalesSummaryType = z.infer<typeof dailySalesSummarySchema>;
export type ProductSalesReportType = z.infer<typeof productSalesReportSchema>;


