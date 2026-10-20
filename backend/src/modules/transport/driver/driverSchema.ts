import { z } from "zod";

export const driverStatusEnum = z.enum([
    "AVAILABLE",
    "ON_TRIP",
    "ON_LEAVE",
    "INACTIVE",
]);

// ── Create ────────────────────────────────────────────────────────────
export const createDriverSchema = z.object({
    profileId:      z.number().int().positive().optional().nullable(),
    employeeId:     z.number().int().positive().optional().nullable(),
    name:           z.string().min(1, "Name is required").max(100),
    licenseNumber:  z.string().min(1, "License number is required").max(50),
    licenseType:    z.string().min(1, "License type is required").max(20),
    licenseExpired: z.string().datetime().optional().nullable(),
    phoneNumber:    z.string().max(30).optional().nullable(),
    status:         driverStatusEnum.default("AVAILABLE").optional(),
    notes:          z.string().optional().nullable(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateDriverSchema = z.object({
    id:             z.number().int().positive("Driver id must be greater than 0"),
    profileId:      z.number().int().positive().optional().nullable(),
    employeeId:     z.number().int().positive().optional().nullable(),
    name:           z.string().min(1).max(100).optional(),
    licenseNumber:  z.string().min(1).max(50).optional(),
    licenseType:    z.string().min(1).max(20).optional(),
    licenseExpired: z.string().datetime().optional().nullable(),
    phoneNumber:    z.string().max(30).optional().nullable(),
    status:         driverStatusEnum.optional(),
    notes:          z.string().optional().nullable(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteDriverSchema = z.object({
    id: z.number().int().positive("Driver id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getDriverSchema = z.object({
    id: z.number().int().positive("Driver id must be greater than 0"),
});

export type CreateDriverType = z.infer<typeof createDriverSchema>;
export type UpdateDriverType = z.infer<typeof updateDriverSchema>;
export type DeleteDriverType = z.infer<typeof deleteDriverSchema>;
export type GetDriverType    = z.infer<typeof getDriverSchema>;
