import { z } from "zod";

export const createProductPriceSchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
    customerGroup: z.number().int().positive().nullable().optional(),
    amount: z.number().positive("Amount must be greater than 0"),
    priceType: z.enum(["retail", "wholesale", "special"]),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    currency: z.string().length(3, "Currency must be a 3-letter code").optional(),
});

export const updateProductPriceSchema = z.object({
    id: z.number().int().positive("Price id must be greater than 0"),
    customerGroup: z.number().int().positive().nullable().optional(),
    amount: z.number().positive("Amount must be greater than 0").optional(),
    priceType: z.enum(["retail", "wholesale", "special"]).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    currency: z.string().length(3, "Currency must be a 3-letter code").optional(),
});

export const deleteProductPriceSchema = z.object({
    id: z.number().int().positive("Price id must be greater than 0"),
});

export const getProductPriceSchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
});

export type CreateProductPriceType = z.infer<typeof createProductPriceSchema>;
export type UpdateProductPriceType = z.infer<typeof updateProductPriceSchema>;
export type DeleteProductPriceType = z.infer<typeof deleteProductPriceSchema>;
export type GetProductPriceType = z.infer<typeof getProductPriceSchema>;
