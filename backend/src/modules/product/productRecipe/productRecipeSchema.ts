import { z } from "zod";

export const createProductRecipeSchema = z.object({
  productId: z.number({ message: "Product ID is required" }),
  ingredientProductId: z.number({ message: "Ingredient Product ID is required" }),
  quantity: z.number().positive("Quantity must be greater than zero"),
  unitId: z.number().int().positive().optional().nullable(),
  unitLabel: z.string().max(20).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateProductRecipeSchema = z.object({
  id: z.number({ message: "Recipe item ID is required" }),
  quantity: z.number().positive("Quantity must be greater than zero").optional(),
  unitId: z.number().int().positive().optional().nullable(),
  unitLabel: z.string().max(20).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const deleteProductRecipeSchema = z.object({
  id: z.number({ message: "Recipe item ID is required" }),
});

export const setProductRecipeSchema = z.object({
  productId: z.number({ message: "Product ID is required" }),
  items: z.array(
    z.object({
      ingredientProductId: z.number({ message: "Ingredient Product ID is required" }),
      quantity: z.number().positive("Quantity must be greater than zero"),
      unitId: z.number().int().positive().optional().nullable(),
      unitLabel: z.string().max(20).optional().nullable(),
      notes: z.string().optional().nullable(),
    })
  ),
});

export const getProductRecipeQuerySchema = z.object({
  productId: z.coerce.number().optional(),
  ingredientProductId: z.coerce.number().optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1).optional(),
  limit: z.coerce.number().default(50).optional(),
});

export type CreateProductRecipeType = z.infer<typeof createProductRecipeSchema>;
export type UpdateProductRecipeType = z.infer<typeof updateProductRecipeSchema>;
export type DeleteProductRecipeType = z.infer<typeof deleteProductRecipeSchema>;
export type SetProductRecipeType = z.infer<typeof setProductRecipeSchema>;
export type GetProductRecipeQueryType = z.infer<typeof getProductRecipeQuerySchema>;
