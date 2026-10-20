import { z } from "zod";

export const tripStatusEnum = z.enum([
    "SCHEDULED",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
]);

// ── Create ────────────────────────────────────────────────────────────
export const createTripSchema = z.object({
    tripNumber:       z.string().min(1, "Trip number is required").max(50),
    vehicleId:        z.number().int().positive("Vehicle id must be greater than 0"),
    driverId:         z.number().int().positive("Driver id must be greater than 0"),
    origin:           z.string().min(1, "Origin is required").max(150),
    destination:      z.string().min(1, "Destination is required").max(150),
    departureTime:    z.string().datetime().optional().nullable(),
    arrivalTime:      z.string().datetime().optional().nullable(),
    startOdometer:    z.number().min(0).optional().nullable(),
    endOdometer:      z.number().min(0).optional().nullable(),
    distance:         z.number().min(0).optional().nullable(),
    status:           tripStatusEnum.default("SCHEDULED").optional(),
    cargoDescription: z.string().optional().nullable(),
    notes:            z.string().optional().nullable(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateTripSchema = z.object({
    id:               z.number().int().positive("Trip id must be greater than 0"),
    tripNumber:       z.string().min(1).max(50).optional(),
    vehicleId:        z.number().int().positive().optional(),
    driverId:         z.number().int().positive().optional(),
    origin:           z.string().min(1).max(150).optional(),
    destination:      z.string().min(1).max(150).optional(),
    departureTime:    z.string().datetime().optional().nullable(),
    arrivalTime:      z.string().datetime().optional().nullable(),
    startOdometer:    z.number().min(0).optional().nullable(),
    endOdometer:      z.number().min(0).optional().nullable(),
    distance:         z.number().min(0).optional().nullable(),
    status:           tripStatusEnum.optional(),
    cargoDescription: z.string().optional().nullable(),
    notes:            z.string().optional().nullable(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteTripSchema = z.object({
    id: z.number().int().positive("Trip id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getTripSchema = z.object({
    id: z.number().int().positive("Trip id must be greater than 0"),
});

// ── Query ─────────────────────────────────────────────────────────────
export const getTripsQuerySchema = z.object({
    page:       z.coerce.number().int().min(1).default(1).optional(),
    limit:      z.coerce.number().int().min(1).max(100).default(10).optional(),
    sortBy:     z.string().optional(),
    sortOrder:  z.enum(["asc", "desc"]).default("desc").optional(),
    search:     z.string().trim().optional(),
    vehicleId:  z.coerce.number().int().positive().optional(),
    driverId:   z.coerce.number().int().positive().optional(),
    status:     tripStatusEnum.optional(),
});

export type CreateTripType    = z.infer<typeof createTripSchema>;
export type UpdateTripType    = z.infer<typeof updateTripSchema>;
export type DeleteTripType    = z.infer<typeof deleteTripSchema>;
export type GetTripType       = z.infer<typeof getTripSchema>;
export type GetTripsQueryType = z.infer<typeof getTripsQuerySchema>;
