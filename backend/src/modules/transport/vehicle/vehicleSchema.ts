import { z } from "zod";

export const vehicleTypeEnum = z.enum([
    "truck",
    "pickup",
    "van",
    "motorcycle",
    "car",
    "heavyVehicle",
]);

export const vehicleStatusEnum = z.enum([
    "AVAILABLE",
    "ON_TRIP",
    "MAINTENANCE",
    "DECOMMISSIONED",
]);

// ── Create ────────────────────────────────────────────────────────────
export const createVehicleSchema = z.object({
    plateNumber:     z.string().min(1, "Plate number is required").max(20),
    model:           z.string().min(1, "Model is required").max(100),
    brand:           z.string().min(1, "Brand is required").max(50),
    type:            vehicleTypeEnum.default("truck").optional(),
    year:            z.number().int().min(1900).max(2100).optional().nullable(),
    capacity:        z.number().min(0).optional().nullable(),
    status:          vehicleStatusEnum.default("AVAILABLE").optional(),
    fuelType:        z.string().max(30).optional().nullable(),
    currentOdometer: z.number().min(0).default(0).optional(),
    notes:           z.string().optional().nullable(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateVehicleSchema = z.object({
    id:              z.number().int().positive("Vehicle id must be greater than 0"),
    plateNumber:     z.string().min(1).max(20).optional(),
    model:           z.string().min(1).max(100).optional(),
    brand:           z.string().min(1).max(50).optional(),
    type:            vehicleTypeEnum.optional(),
    year:            z.number().int().min(1900).max(2100).optional().nullable(),
    capacity:        z.number().min(0).optional().nullable(),
    status:          vehicleStatusEnum.optional(),
    fuelType:        z.string().max(30).optional().nullable(),
    currentOdometer: z.number().min(0).optional(),
    notes:           z.string().optional().nullable(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteVehicleSchema = z.object({
    id: z.number().int().positive("Vehicle id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getVehicleSchema = z.object({
    id: z.number().int().positive("Vehicle id must be greater than 0"),
});

export type CreateVehicleType = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleType = z.infer<typeof updateVehicleSchema>;
export type DeleteVehicleType = z.infer<typeof deleteVehicleSchema>;
export type GetVehicleType    = z.infer<typeof getVehicleSchema>;
