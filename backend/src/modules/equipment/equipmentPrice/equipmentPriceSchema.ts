import { z } from "zod";

export const equipmentPriceTypeEnum = z.enum([
    "SALE",
    "LEASE_DAILY",
    "LEASE_MONTHLY",
    "LEASE_YEARLY",
]);

export const createEquipmentPriceSchema = z.object({
    equipmentEntityId: z.number().int().positive("Equipment ID must be greater than 0"),
    priceType:         z.string().min(1, "Price type is required"),
    amount:            z.number().positive("Amount must be greater than 0"),
    currency:          z.string().default("IDR").optional(),
    startDate:         z.string().optional(),
    endDate:           z.string().optional().nullable(),
    notes:             z.string().optional().nullable(),
});

export const updateEquipmentPriceSchema = z.object({
    id:        z.number().int().positive("ID must be greater than 0"),
    priceType: z.string().min(1).optional(),
    amount:    z.number().positive().optional(),
    currency:  z.string().optional(),
    startDate: z.string().optional(),
    endDate:   z.string().optional().nullable(),
    notes:     z.string().optional().nullable(),
});

export const deleteEquipmentPriceSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

export const getEquipmentPriceSchema = z.object({
    id: z.number().int().positive("ID must be greater than 0"),
});

export const getEquipmentPricesByEntitySchema = z.object({
    equipmentEntityId: z.number().int().positive("Equipment entity ID must be greater than 0"),
});

export type CreateEquipmentPriceType = z.infer<typeof createEquipmentPriceSchema>;
export type UpdateEquipmentPriceType = z.infer<typeof updateEquipmentPriceSchema>;
export type DeleteEquipmentPriceType = z.infer<typeof deleteEquipmentPriceSchema>;
export type GetEquipmentPriceType = z.infer<typeof getEquipmentPriceSchema>;
export type GetEquipmentPricesByEntityType = z.infer<typeof getEquipmentPricesByEntitySchema>;
