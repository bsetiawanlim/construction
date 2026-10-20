import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createEquipmentPartSchema = z.object({
    equipmentModelId: z.number().int().positive("Equipment model ID must be greater than 0"),
    partNumber:       z.string().optional(),
    name:             z.string().min(1, "Name is required"),
    otherName:        z.string().optional(),
    description:      z.string().optional(),
    unit:             z.number().int().positive().optional(),
    lifeSpan:         z.number().int().positive().optional(),
    lifeSpanUnitId:   z.number().int().positive().optional(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateEquipmentPartSchema = z.object({
    id:             z.number().int().positive("ID must be greater than 0"),
    partNumber:     z.string().optional(),
    name:           z.string().min(1).optional(),
    otherName:      z.string().optional(),
    description:    z.string().optional(),
    unit:           z.number().int().positive().optional(),
    lifeSpan:       z.number().int().positive().optional(),
    lifeSpanUnitId: z.number().int().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteEquipmentPartSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getEquipmentPartSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get by Model ──────────────────────────────────────────────────────
export const getEquipmentPartsByModelSchema = z.object({
    equipmentModelId: z.number().int().positive("Equipment model ID must be greater than 0"),
});

export type CreateEquipmentPartType = z.infer<typeof createEquipmentPartSchema>;
export type UpdateEquipmentPartType = z.infer<typeof updateEquipmentPartSchema>;
