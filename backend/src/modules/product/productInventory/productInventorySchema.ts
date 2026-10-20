import { z } from "zod";

export const createProductInventorySchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
    facilityId: z.number().int().positive().optional().nullable(),
    sectionId: z.number().int().positive().optional().nullable(),
    transactionType: z.enum(["IN", "OUT", "ADJUSTMENT"]),
    quantity: z.number().positive("Quantity must be greater than 0"),
    reference: z.string().optional(),
    notes: z.string().optional(),
    transactionDate: z.string().datetime().optional(),
});

export const getProductInventorySchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
    facilityId: z.coerce.number().int().positive().optional().nullable(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
});

export type CreateProductInventoryType = z.infer<typeof createProductInventorySchema>;
export type GetProductInventoryType = z.infer<typeof getProductInventorySchema>;
