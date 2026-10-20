import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createEquipmentModelFeatureSchema = z.object({
    equipmentModelId: z.number().int().positive("Equipment model ID must be greater than 0"),
    name:             z.string().min(1, "Name is required"),
    value:            z.string().optional(),
    unitId:           z.number().int().positive().optional(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateEquipmentModelFeatureSchema = z.object({
    id:    z.number().int().positive("ID must be greater than 0"),
    name:  z.string().min(1).optional(),
    value: z.string().optional(),
    unitId: z.number().int().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteEquipmentModelFeatureSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getEquipmentModelFeatureSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get by Model ──────────────────────────────────────────────────────
export const getEquipmentModelFeaturesByModelSchema = z.object({
    equipmentModelId: z.number().int().positive("Equipment model ID must be greater than 0"),
});

export type CreateEquipmentModelFeatureType = z.infer<typeof createEquipmentModelFeatureSchema>;
export type UpdateEquipmentModelFeatureType = z.infer<typeof updateEquipmentModelFeatureSchema>;
