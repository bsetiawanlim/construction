import { z } from "zod";

export const createProductAttributeValueSchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
    attributeId: z.number().int().positive("Attribute id must be greater than 0"),
    value: z.string().min(1, "Value is required"),
});

export const updateProductAttributeValueSchema = z.object({
    id: z.number().int().positive("Attribute value id must be greater than 0"),
    value: z.string().min(1, "Value is required"),
});

export const deleteProductAttributeValueSchema = z.object({
    id: z.number().int().positive("Attribute value id must be greater than 0"),
});

export const getProductAttributeValueSchema = z.object({
    productId: z.number().int().positive("Product id must be greater than 0"),
});

export type CreateProductAttributeValueType = z.infer<typeof createProductAttributeValueSchema>;
export type UpdateProductAttributeValueType = z.infer<typeof updateProductAttributeValueSchema>;
export type DeleteProductAttributeValueType = z.infer<typeof deleteProductAttributeValueSchema>;
export type GetProductAttributeValueType = z.infer<typeof getProductAttributeValueSchema>;
