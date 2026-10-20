import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createFuelLogSchema = z.object({
    vehicleId:     z.number().int().positive("Vehicle id must be greater than 0"),
    tripId:        z.number().int().positive().optional().nullable(),
    date:          z.string().datetime().optional(),
    odometer:      z.number().min(0).optional().nullable(),
    liters:        z.number().positive("Liters must be positive"),
    pricePerLiter: z.number().positive("Price per liter must be positive"),
    totalCost:     z.number().min(0).optional(),
    gasStation:    z.string().max(100).optional().nullable(),
    receiptNumber: z.string().max(50).optional().nullable(),
    notes:         z.string().optional().nullable(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateFuelLogSchema = z.object({
    id:            z.number().int().positive("Fuel log id must be greater than 0"),
    vehicleId:     z.number().int().positive().optional(),
    tripId:        z.number().int().positive().optional().nullable(),
    date:          z.string().datetime().optional(),
    odometer:      z.number().min(0).optional().nullable(),
    liters:        z.number().positive().optional(),
    pricePerLiter: z.number().positive().optional(),
    totalCost:     z.number().min(0).optional(),
    gasStation:    z.string().max(100).optional().nullable(),
    receiptNumber: z.string().max(50).optional().nullable(),
    notes:         z.string().optional().nullable(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteFuelLogSchema = z.object({
    id: z.number().int().positive("Fuel log id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getFuelLogSchema = z.object({
    id: z.number().int().positive("Fuel log id must be greater than 0"),
});

// ── Query ─────────────────────────────────────────────────────────────
export const getFuelLogsQuerySchema = z.object({
    page:          z.coerce.number().int().min(1).default(1).optional(),
    limit:         z.coerce.number().int().min(1).max(100).default(10).optional(),
    sortBy:        z.string().optional(),
    sortOrder:     z.enum(["asc", "desc"]).default("desc").optional(),
    search:        z.string().trim().optional(),
    vehicleId:     z.coerce.number().int().positive().optional(),
    tripId:        z.coerce.number().int().positive().optional(),
    startDate:     z.string().optional(),
    endDate:       z.string().optional(),
});

export type CreateFuelLogType    = z.infer<typeof createFuelLogSchema>;
export type UpdateFuelLogType    = z.infer<typeof updateFuelLogSchema>;
export type DeleteFuelLogType    = z.infer<typeof deleteFuelLogSchema>;
export type GetFuelLogType       = z.infer<typeof getFuelLogSchema>;
export type GetFuelLogsQueryType = z.infer<typeof getFuelLogsQuerySchema>;
