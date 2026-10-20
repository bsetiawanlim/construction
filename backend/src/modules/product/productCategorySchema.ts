import { z } from "zod";

export const createProductCategorySchema = z.object({
    categoryName: z.string().min(1, "Category name is required"),
    parentCategoryId: z.number().int().positive().nullish(),
    description: z.string().nullish(),
});

export const updateProductCategorySchema = z.object({
    id: z.number().int().positive("Category id must be greater than 0"),
    categoryName: z.string().min(1, "Category name is required").optional(),
    parentCategoryId: z.number().int().positive().nullish(),
    description: z.string().nullish(),
});

export const deleteProductCategorySchema = z.object({
    id: z.number().int().positive("Category id must be greater than 0"),
});

export const getProductCategorySchema = z.object({
    id: z.number().int().positive("Category id must be greater than 0"),
});

export type CreateProductCategoryType = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryType = z.infer<typeof updateProductCategorySchema>;
export type DeleteProductCategoryType = z.infer<typeof deleteProductCategorySchema>;
export type GetProductCategoryType = z.infer<typeof getProductCategorySchema>;