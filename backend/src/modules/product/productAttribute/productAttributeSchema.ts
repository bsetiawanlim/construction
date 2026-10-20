import { z } from "zod";

export const createProductAttributeSchema = z.object({
    name: z.string().min(1, "Attribute name is required"),
    description: z.string().optional(),
    type: z.enum(["text", "number", "select", "multi_select"]),
    options: z.string().optional(), // JSON string for select/multi_select
});

export const updateProductAttributeSchema = z.object({
    id: z.number().int().positive("Attribute id must be greater than 0"),
    name: z.string().min(1, "Attribute name is required").optional(),
    description: z.string().optional(),
    type: z.enum(["text", "number", "select", "multi_select"]).optional(),
    options: z.string().optional(),
});

export const deleteProductAttributeSchema = z.object({
    id: z.number().int().positive("Attribute id must be greater than 0"),
});

export type CreateProductAttributeType = z.infer<typeof createProductAttributeSchema>;
export type UpdateProductAttributeType = z.infer<typeof updateProductAttributeSchema>;
export type DeleteProductAttributeType = z.infer<typeof deleteProductAttributeSchema>;
