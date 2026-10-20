import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createEquipmentMaintenanceSchema = z.object({
    equipmentEntityId: z.number().int().positive("Equipment entity ID must be greater than 0"),
    name:              z.string().min(1, "Name is required"),
    value:             z.string().optional(),
    unitId:            z.number().int().positive().optional(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateEquipmentMaintenanceSchema = z.object({
    id:    z.number().int().positive("ID must be greater than 0"),
    name:  z.string().min(1).optional(),
    value: z.string().optional(),
    unitId: z.number().int().positive().optional(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteEquipmentMaintenanceSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getEquipmentMaintenanceSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get by Entity ─────────────────────────────────────────────────────
export const getEquipmentMaintenanceByEntitySchema = z.object({
    equipmentEntityId: z.number().int().positive("Equipment entity ID must be greater than 0"),
});

export type CreateEquipmentMaintenanceType = z.infer<typeof createEquipmentMaintenanceSchema>;
export type UpdateEquipmentMaintenanceType = z.infer<typeof updateEquipmentMaintenanceSchema>;
