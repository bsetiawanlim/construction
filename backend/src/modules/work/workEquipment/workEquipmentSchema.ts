import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createWorkEquipmentSchema = z.object({
    workId:      z.number().int().positive("Work id must be greater than 0"),
    equipmentId: z.number().int().positive("Equipment id must be greater than 0"),
    unitPrice:   z.number().positive("Unit price must be greater than 0"),
    amount:      z.number().positive("Amount must be greater than 0"),
    totalPrice:  z.number().positive("Total price must be greater than 0"),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateWorkEquipmentSchema = z.object({
    workId:      z.number().int().positive("Work id must be greater than 0"),
    equipmentId: z.number().int().positive("Equipment id must be greater than 0"),
    unitPrice:   z.number().positive().optional(),
    amount:      z.number().positive().optional(),
    totalPrice:  z.number().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteWorkEquipmentSchema = z.object({
    workId:      z.number().int().positive("Work id must be greater than 0"),
    equipmentId: z.number().int().positive("Equipment id must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getWorkEquipmentSchema = z.object({
    workId:      z.number().int().positive("Work id must be greater than 0"),
    equipmentId: z.number().int().positive("Equipment id must be greater than 0"),
});

// ── Get by Work ───────────────────────────────────────────────────────
export const getWorkEquipmentsByWorkSchema = z.object({
    workId: z.number().int().positive("Work id must be greater than 0"),
});

export type CreateWorkEquipmentType        = z.infer<typeof createWorkEquipmentSchema>;
export type UpdateWorkEquipmentType        = z.infer<typeof updateWorkEquipmentSchema>;
export type DeleteWorkEquipmentType        = z.infer<typeof deleteWorkEquipmentSchema>;
export type GetWorkEquipmentType           = z.infer<typeof getWorkEquipmentSchema>;
export type GetWorkEquipmentsByWorkType    = z.infer<typeof getWorkEquipmentsByWorkSchema>;
