import { z } from "zod";

export const payrollStructureTypeEnum = z.enum(["basic", "allowance", "deduction"]);
export const payrollCalculationTypeEnum = z.enum(["percentage", "fixedAmount", "perDay", "perHour"]);

// ── Create ────────────────────────────────────────────────────────────
export const createPayrollComponentSchema = z.object({
    name:            z.string().min(1, "Name is required").max(100),
    type:            payrollStructureTypeEnum,
    calculationType: payrollCalculationTypeEnum,
    defaultAmount:   z.number().min(0, "Default amount must be non-negative").default(0),
    isTaxable:       z.boolean().default(true).optional(),
    description:     z.string().max(255).optional().nullable(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updatePayrollComponentSchema = z.object({
    id:              z.number().int().positive("Component id must be greater than 0"),
    name:            z.string().min(1).max(100).optional(),
    type:            payrollStructureTypeEnum.optional(),
    calculationType: payrollCalculationTypeEnum.optional(),
    defaultAmount:   z.number().min(0).optional(),
    isTaxable:       z.boolean().optional(),
    description:     z.string().max(255).optional().nullable(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deletePayrollComponentSchema = z.object({
    id: z.number().int().positive("Component id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getPayrollComponentSchema = z.object({
    id: z.number().int().positive("Component id must be greater than 0"),
});

export type CreatePayrollComponentType = z.infer<typeof createPayrollComponentSchema>;
export type UpdatePayrollComponentType = z.infer<typeof updatePayrollComponentSchema>;
export type DeletePayrollComponentType = z.infer<typeof deletePayrollComponentSchema>;
export type GetPayrollComponentType    = z.infer<typeof getPayrollComponentSchema>;
