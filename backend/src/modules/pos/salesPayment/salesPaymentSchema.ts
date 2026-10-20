import { z } from "zod";

export const paymentMethodEnum = z.enum(["CASH", "CARD", "BANK_TRANSFER", "EWALLET"]);
export const paymentStatusEnum = z.enum(["PENDING", "SETTLED", "FAILED", "REFUNDED"]);

// ── Create ───────────────────────────────────────────────────────────────────
export const createSalesPaymentSchema = z.object({
    salesOrderId: z.number().int().positive("Sales order id must be greater than 0"),
    method: paymentMethodEnum,
    amount: z.number().positive("Amount must be greater than 0"),
    referenceNumber: z.string().max(100).optional().nullable(),
    monetaryAccountId: z.number().int().positive("Monetary account id must be greater than 0").optional().nullable(),
    status: paymentStatusEnum.optional().default("SETTLED"),
    notes: z.string().optional().nullable(),
});

// ── Update ───────────────────────────────────────────────────────────────────
export const updateSalesPaymentSchema = z.object({
    id: z.number().int().positive("Sales payment id must be greater than 0"),
    method: paymentMethodEnum.optional(),
    amount: z.number().positive("Amount must be greater than 0").optional(),
    referenceNumber: z.string().max(100).optional().nullable(),
    monetaryAccountId: z.number().int().positive("Monetary account id must be greater than 0").optional().nullable(),
    status: paymentStatusEnum.optional(),
    notes: z.string().optional().nullable(),
});

// ── Delete ───────────────────────────────────────────────────────────────────
export const deleteSalesPaymentSchema = z.object({
    id: z.number().int().positive("Sales payment id must be greater than 0"),
});

// ── Get Single ───────────────────────────────────────────────────────────────
export const getSalesPaymentSchema = z.object({
    id: z.number().int().positive("Sales payment id must be greater than 0"),
});

// ── List by Sales Order ──────────────────────────────────────────────────────
export const listSalesPaymentsSchema = z.object({
    salesOrderId: z.number().int().positive("Sales order id must be greater than 0"),
});

// ── Types ────────────────────────────────────────────────────────────────────
export type CreateSalesPaymentType = z.infer<typeof createSalesPaymentSchema>;
export type UpdateSalesPaymentType = z.infer<typeof updateSalesPaymentSchema>;
export type DeleteSalesPaymentType = z.infer<typeof deleteSalesPaymentSchema>;
export type GetSalesPaymentType = z.infer<typeof getSalesPaymentSchema>;
export type ListSalesPaymentsType = z.infer<typeof listSalesPaymentsSchema>;
