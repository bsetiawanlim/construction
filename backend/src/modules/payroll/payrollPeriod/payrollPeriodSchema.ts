import { z } from "zod";

export const payrollPeriodStatusEnum = z.enum([
    "DRAFT",
    "PROCESSING",
    "APPROVED",
    "PAID",
    "CANCELLED",
]);

export const payrollFrequencyEnum = z.enum([
    "hourly",
    "daily",
    "weekly",
    "biWeekly",
    "monthly",
]);
export type PayrollFrequency = z.infer<typeof payrollFrequencyEnum>;

// ── Create ────────────────────────────────────────────────────────────
export const createPayrollPeriodSchema = z.object({
    name:        z.string().min(1, "Name is required").max(100),
    frequency:   payrollFrequencyEnum.default("monthly").optional(),
    startDate:   z.string().datetime(),
    endDate:     z.string().datetime(),
    paymentDate: z.string().datetime().optional().nullable(),
    status:      payrollPeriodStatusEnum.default("DRAFT").optional(),
    notes:       z.string().optional().nullable(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updatePayrollPeriodSchema = z.object({
    id:          z.number().int().positive("Period id must be greater than 0"),
    name:        z.string().min(1).max(100).optional(),
    frequency:   payrollFrequencyEnum.optional(),
    startDate:   z.string().datetime().optional(),
    endDate:     z.string().datetime().optional(),
    paymentDate: z.string().datetime().optional().nullable(),
    status:      payrollPeriodStatusEnum.optional(),
    notes:       z.string().optional().nullable(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deletePayrollPeriodSchema = z.object({
    id: z.number().int().positive("Period id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getPayrollPeriodSchema = z.object({
    id: z.number().int().positive("Period id must be greater than 0"),
});

export type CreatePayrollPeriodType = z.infer<typeof createPayrollPeriodSchema>;
export type UpdatePayrollPeriodType = z.infer<typeof updatePayrollPeriodSchema>;
export type DeletePayrollPeriodType = z.infer<typeof deletePayrollPeriodSchema>;
export type GetPayrollPeriodType    = z.infer<typeof getPayrollPeriodSchema>;
