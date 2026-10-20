import { z } from "zod";

export const createProductImageSchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
    imageUrl: z.string().url("Invalid image URL"),
    altText: z.string().optional(),
    isPrimary: z.boolean().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
});

export const updateProductImageSchema = z.object({
    id: z.number().int().positive("Image id must be greater than 0"),
    imageUrl: z.string().url("Invalid image URL").optional(),
    altText: z.string().optional(),
    isPrimary: z.boolean().optional(),
    sortOrder: z.number().int().nonnegative().optional(),
});

export const deleteProductImageSchema = z.object({
    id: z.number().int().positive("Image id must be greater than 0"),
});

export const getProductImageSchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
});

export type CreateProductImageType = z.infer<typeof createProductImageSchema>;
export type UpdateProductImageType = z.infer<typeof updateProductImageSchema>;
export type DeleteProductImageType = z.infer<typeof deleteProductImageSchema>;
export type GetProductImageType = z.infer<typeof getProductImageSchema>;
