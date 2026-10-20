import { z } from "zod";

export const createProductSchema = z.object({
    productName: z.string().min(3, "Product name must be at least 3 characters long"),
    description: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    retailPrice: z.number().nonnegative().optional(),
    price: z.number().nonnegative().optional(),
    unitId: z.number().int().positive().optional().nullable(),
    unitLabel: z.string().optional().nullable(),
    productCategoryId: z.number().int().positive("Category id must be greater than 0").optional(),
    parentProductId: z.number().int().positive().nullable().optional(),
    isTradeable: z.boolean().optional(),
    isLowStockAlertEnabled: z.boolean().optional(),
    hasFormula: z.boolean().optional(),
    minStock: z.coerce.number().min(0).optional(),
    imageUrl: z.string().optional().nullable(),
});

export const updateProductSchema = z.object({
    id: z.number().int().positive("Product id must be greater than 0"),
    productName: z.string().min(3, "Product name must be at least 3 characters long").optional(),
    description: z.string().optional(),
    sku: z.string().min(1, "SKU is required").optional(),
    barcode: z.string().optional(),
    retailPrice: z.number().optional(),
    price: z.number().optional(),
    unitId: z.number().int().positive().optional().nullable(),
    unitLabel: z.string().optional().nullable(),
    productCategoryId: z.number().int().positive("Category id must be greater than 0").optional(),
    parentProductId: z.number().int().positive().nullable().optional(),
    isTradeable: z.boolean().optional(),
    isLowStockAlertEnabled: z.boolean().optional(),
    hasFormula: z.boolean().optional(),
    minStock: z.coerce.number().min(0).optional(),
    imageUrl: z.string().optional().nullable(),
});

export const deleteProductSchema = z.object({
    id: z.number().int().positive("Product id must be greater than 0"),
});

export const getProductSchema = z.object({
    id: z.number().int().positive("Product id must be greater than 0"),
});

export const getProductsSchema = z.object({
    page: z.number().int().positive("Page must be greater than 0").optional(),
    limit: z.number().int().positive("Limit must be greater than 0").optional(),
    categoryId: z.number().int().positive().optional(),
    parentProductId: z.coerce.number().int().positive().optional(),
    facilityId: z.coerce.number().int().positive().optional(),
    rootOnly: z.coerce.boolean().optional(),
    isTradeable: z.coerce.boolean().optional(),
    hasFormula: z.coerce.boolean().optional(),
    lowStockOnly: z.coerce.boolean().optional(),
    search: z.string().optional(),
});

export type CreateProductType = z.infer<typeof createProductSchema>;
export type UpdateProductType = z.infer<typeof updateProductSchema>;
export type DeleteProductType = z.infer<typeof deleteProductSchema>;
export type GetProductType = z.infer<typeof getProductSchema>;
export type GetProductsType = z.infer<typeof getProductsSchema>;