import { z } from "zod";

// ── Create ────────────────────────────────────────────────────────────
export const createEquipmentEntitySchema = z.object({
    equipmentTypeId:    z.number().int().positive().optional(),
    brandId:            z.number().int().positive().optional(),
    modelId:            z.number().int().positive().optional(),
    code:               z.string().optional(),
    name:               z.string().min(1, "Name is required"),
    description:        z.string().optional(),
    unitId:             z.number().int().positive().optional(),
    unitPrice:          z.number().positive("Unit price must be greater than 0"),
    salvageValue:       z.number().min(0, "Salvage value must be non-negative").optional().nullable(),
    usefulLifeYears:    z.number().int().positive("Useful life must be at least 1 year").optional().nullable(),
    depreciationMethod: z.enum(["STRAIGHT_LINE", "DOUBLE_DECLINING"]).optional().nullable(),
    acquisitionDate:    z.string().or(z.date()).optional().nullable(),
});

// ── Update ────────────────────────────────────────────────────────────
export const updateEquipmentEntitySchema = z.object({
    id:                 z.number().int().positive("ID must be greater than 0"),
    equipmentTypeId:    z.number().int().positive().optional(),
    brandId:            z.number().int().positive().optional(),
    modelId:            z.number().int().positive().optional(),
    code:               z.string().optional(),
    name:               z.string().min(1).optional(),
    description:        z.string().optional(),
    unitId:             z.number().int().positive().optional(),
    unitPrice:          z.number().positive().optional(),
    salvageValue:       z.number().min(0).optional().nullable(),
    usefulLifeYears:    z.number().int().positive().optional().nullable(),
    depreciationMethod: z.enum(["STRAIGHT_LINE", "DOUBLE_DECLINING"]).optional().nullable(),
    acquisitionDate:    z.string().or(z.date()).optional().nullable(),
});

// ── Delete ────────────────────────────────────────────────────────────
export const deleteEquipmentEntitySchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Get ───────────────────────────────────────────────────────────────
export const getEquipmentEntitySchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

// ── Depreciation ──────────────────────────────────────────────────────
export const getEquipmentDepreciationSchema = z.object({
    id:       z.number().int().positive("ID must be greater than 0"),
    asOfDate: z.string().optional(),
});

export type CreateEquipmentEntityType = z.infer<typeof createEquipmentEntitySchema>;
export type UpdateEquipmentEntityType = z.infer<typeof updateEquipmentEntitySchema>;
export type GetEquipmentDepreciationType = z.infer<typeof getEquipmentDepreciationSchema>;

