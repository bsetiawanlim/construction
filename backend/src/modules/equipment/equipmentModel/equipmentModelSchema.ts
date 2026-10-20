import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createEquipmentModelSchema = z.object({
    typeId:      z.number().int().positive("Type ID must be greater than 0"),
    name:        z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateEquipmentModelSchema = z.object({
    id:          z.number().int().positive("ID must be greater than 0"),
    typeId:      z.number().int().positive().optional(),
    name:        z.string().min(1).optional(),
    description: z.string().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteEquipmentModelSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getEquipmentModelSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get by Type ───────────────────────────────────────────────────────
export const getEquipmentModelsByTypeSchema = z.object({
    typeId: z.number().int().positive("Type ID must be greater than 0"),
});

export type CreateEquipmentModelType = z.infer<typeof createEquipmentModelSchema>;
export type UpdateEquipmentModelType = z.infer<typeof updateEquipmentModelSchema>;
