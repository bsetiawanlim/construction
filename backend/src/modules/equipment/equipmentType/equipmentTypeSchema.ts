import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createEquipmentTypeSchema = z.object({
    name:        z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateEquipmentTypeSchema = z.object({
    id:          z.number().int().positive("ID must be greater than 0"),
    name:        z.string().min(1).optional(),
    description: z.string().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteEquipmentTypeSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getEquipmentTypeSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

export type CreateEquipmentTypeType = z.infer<typeof createEquipmentTypeSchema>;
export type UpdateEquipmentTypeType = z.infer<typeof updateEquipmentTypeSchema>;
