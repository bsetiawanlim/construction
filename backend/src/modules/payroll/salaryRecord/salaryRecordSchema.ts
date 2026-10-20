import { z } from "zod";

export const salaryRecordStatusEnum = z.enum([
    "PENDING",
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

const salaryComponentEntrySchema = z.object({
    componentId: z.number().int().positive("Component id must be greater than 0"),
    amount:      z.number().min(0, "Amount must be non-negative"),
});

// ── Generate / Create ────────────────────────────────────────────────
export const generateSalaryRecordSchema = z.object({
    periodId:          z.number().int().positive("Period id must be greater than 0"),
    employeeId:        z.number().int().positive("Employee id must be greater than 0"),
    salaryBasis:       payrollFrequencyEnum.optional(),
    payFrequency:      payrollFrequencyEnum.optional(),
    attendedDays:      z.number().min(0).optional(),
    loggedHours:       z.number().min(0).optional(),
    autoCalculateBase: z.boolean().optional(),
    components:        z.array(salaryComponentEntrySchema).default([]),
    notes:             z.string().optional().nullable(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateSalaryRecordSchema = z.object({
    id:     z.number().int().positive("Salary record id must be greater than 0"),
    status: salaryRecordStatusEnum.optional(),
    notes:  z.string().optional().nullable(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteSalaryRecordSchema = z.object({
    id: z.number().int().positive("Salary record id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getSalaryRecordSchema = z.object({
    id: z.number().int().positive("Salary record id must be greater than 0"),
});

// ── Get by Period ─────────────────────────────────────────────────────
export const getSalaryRecordsByPeriodSchema = z.object({
    periodId: z.number().int().positive("Period id must be greater than 0"),
});

export type GenerateSalaryRecordType        = z.infer<typeof generateSalaryRecordSchema>;
export type UpdateSalaryRecordType        = z.infer<typeof updateSalaryRecordSchema>;
export type DeleteSalaryRecordType        = z.infer<typeof deleteSalaryRecordSchema>;
export type GetSalaryRecordType           = z.infer<typeof getSalaryRecordSchema>;
export type GetSalaryRecordsByPeriodType   = z.infer<typeof getSalaryRecordsByPeriodSchema>;
