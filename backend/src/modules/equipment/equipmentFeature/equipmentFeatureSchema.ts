import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createEquipmentFeatureSchema = z.object({
    equipmentEntityId: z.number().int().positive("Equipment entity ID must be greater than 0"),
    name:              z.string().min(1, "Name is required"),
    value:             z.string().optional(),
    unitId:            z.number().int().positive().optional(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateEquipmentFeatureSchema = z.object({
    id:    z.number().int().positive("ID must be greater than 0"),
    name:  z.string().min(1).optional(),
    value: z.string().optional(),
    unitId: z.number().int().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteEquipmentFeatureSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getEquipmentFeatureSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get by Entity ─────────────────────────────────────────────────────
export const getEquipmentFeaturesByEntitySchema = z.object({
    equipmentEntityId: z.number().int().positive("Equipment entity ID must be greater than 0"),
});

export type CreateEquipmentFeatureType = z.infer<typeof createEquipmentFeatureSchema>;
export type UpdateEquipmentFeatureType = z.infer<typeof updateEquipmentFeatureSchema>;
