import { z } from "zod";

export const createVendorProductSchema = z.object({
  vendorId: z.number({ message: "Vendor ID is required" }),
  productId: z.number({ message: "Product ID is required" }),
  vendorSku: z.string().max(100).optional().nullable(),
  vendorPrice: z.number().nonnegative("Vendor price cannot be negative").optional().nullable(),
  currency: z.string().max(3).default("IDR").optional(),
  leadTimeDays: z.number().int().nonnegative("Lead time days must be positive or zero").optional().nullable(),
  minOrderQuantity: z.number().int().positive("Min order quantity must be greater than zero").optional().nullable(),
  isPreferred: z.boolean().default(false).optional(),
  notes: z.string().optional().nullable(),
});

export const updateVendorProductSchema = z.object({
  id: z.number({ message: "Vendor Product ID is required" }),
  vendorSku: z.string().max(100).optional().nullable(),
  vendorPrice: z.number().nonnegative("Vendor price cannot be negative").optional().nullable(),
  currency: z.string().max(3).optional(),
  leadTimeDays: z.number().int().nonnegative("Lead time days must be positive or zero").optional().nullable(),
  minOrderQuantity: z.number().int().positive("Min order quantity must be greater than zero").optional().nullable(),
  isPreferred: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

export const deleteVendorProductSchema = z.object({
  id: z.number({ message: "Vendor Product ID is required" }),
});

export const batchLinkVendorProductsSchema = z.object({
  vendorId: z.number({ message: "Vendor ID is required" }),
  productIds: z.array(z.number()).min(1, "At least one product ID must be provided"),
});

export const batchLinkProductVendorsSchema = z.object({
  productId: z.number({ message: "Product ID is required" }),
  vendorIds: z.array(z.number()).min(1, "At least one vendor ID must be provided"),
});

export const getVendorProductsQuerySchema = z.object({
  vendorId: z.coerce.number().optional(),
  productId: z.coerce.number().optional(),
  search: z.string().optional(),
  isPreferred: z.coerce.boolean().optional(),
  page: z.coerce.number().default(1).optional(),
  limit: z.coerce.number().default(20).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export type CreateVendorProductType = z.infer<typeof createVendorProductSchema>;
export type UpdateVendorProductType = z.infer<typeof updateVendorProductSchema>;
export type DeleteVendorProductType = z.infer<typeof deleteVendorProductSchema>;
export type BatchLinkVendorProductsType = z.infer<typeof batchLinkVendorProductsSchema>;
export type BatchLinkProductVendorsType = z.infer<typeof batchLinkProductVendorsSchema>;
export type GetVendorProductsQueryType = z.infer<typeof getVendorProductsQuerySchema>;
