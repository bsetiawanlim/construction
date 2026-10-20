import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createEquipmentBrandSchema = z.object({
    name:        z.string().min(1, "Name is required"),
    description: z.string().optional(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateEquipmentBrandSchema = z.object({
    id:          z.number().int().positive("ID must be greater than 0"),
    name:        z.string().min(1).optional(),
    description: z.string().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteEquipmentBrandSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getEquipmentBrandSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

export type CreateEquipmentBrandType = z.infer<typeof createEquipmentBrandSchema>;
export type UpdateEquipmentBrandType = z.infer<typeof updateEquipmentBrandSchema>;
